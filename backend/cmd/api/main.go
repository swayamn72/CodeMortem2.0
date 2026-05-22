package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"codemortem/internal/ai"
	"codemortem/internal/auth"
	"codemortem/internal/codeforces"
	"codemortem/internal/config"
	"codemortem/internal/database"
	"codemortem/internal/game"
	"codemortem/internal/judge"
	"codemortem/internal/matchmaking"
	"codemortem/internal/models"
	"codemortem/internal/question"
	"codemortem/internal/user"

	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/limiter"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/gofiber/storage/redis/v3"
	_ "github.com/joho/godotenv/autoload"
)

func main() {
	// Load config
	cfg := config.Load()

	log.Println("🔥 CodeMortem API starting...")
	log.Printf("   Environment: %s", cfg.Server.Environment)
	log.Printf("   Port: %s", cfg.Server.Port)

	// Connect to PostgreSQL
	db, err := database.NewPostgres(&cfg.Database)
	if err != nil {
		log.Fatalf("❌ Failed to connect to PostgreSQL: %v", err)
	}
	log.Println("✅ PostgreSQL connected")

	// Connect to Redis
	rdb, err := database.NewRedis(&cfg.Redis)
	if err != nil {
		log.Fatalf("❌ Failed to connect to Redis: %v", err)
	}
	log.Println("✅ Redis connected")

	// Initialize services
	jwtMgr := auth.NewJWTManager(&cfg.JWT)
	authSvc := auth.NewService(db, jwtMgr)
	authHandler := auth.NewHandler(authSvc)
	authMw := auth.Middleware(jwtMgr)

	userRepo := user.NewRepository(db)
	userHandler := user.NewHandler(userRepo)

	judgeClient := judge.NewClient(&cfg.Judge0)

	hub := game.NewHub()
	go hub.Run()

	// Initialize Codeforces client
	cfClient := codeforces.NewClient()
	if err := cfClient.Init(); err != nil {
		log.Printf("⚠️  Codeforces API init failed (will retry): %v", err)
	} else {
		log.Println("✅ Codeforces problem cache loaded")
	}

	sessionMgr := game.NewSessionManager(db, hub, cfClient)
	mmQueue := matchmaking.NewQueue(rdb, &cfg.Match)

	// Submission rate limiter - max 20 submissions per minute per user (3 second cooldown)
	submissionLimiter := game.NewSubmissionRateLimiter(20)

	// AI + Question services
	aiClient := ai.NewClient(&cfg.AI)
	qGen := ai.NewQuestionGenerator(aiClient)
	hintGen := ai.NewHintGenerator(aiClient)
	explainer := ai.NewSolutionExplainer(aiClient)
	analyzer := ai.NewPerformanceAnalyzer(aiClient)
	qRepo := question.NewRepository(db)
	qSeeder := question.NewBankSeeder(qRepo, qGen, &cfg.AI)
	qHandler := question.NewHandler(qRepo, qGen, qSeeder, &cfg.AI)

	// Start matchmaker in background
	matchCtx, matchCancel := context.WithCancel(context.Background())
	defer matchCancel()
	go mmQueue.StartMatcher(matchCtx)

	// Start question bank seeder if AI key is configured
	if cfg.AI.APIKey != "" {
		go qSeeder.Start(matchCtx)
		log.Println("✅ AI question generation enabled")
	} else {
		log.Println("⚠️  AI_API_KEY not set — question generation disabled")
	}

	// Create Fiber app
	app := fiber.New(fiber.Config{
		ReadTimeout:  cfg.Server.ReadTimeout,
		WriteTimeout: cfg.Server.WriteTimeout,
		BodyLimit:    1 * 1024 * 1024, // 1MB
		AppName:      "CodeMortem API",
	})

	// Middleware
	app.Use(recover.New())
	app.Use(logger.New(logger.Config{
		Format: "[${time}] ${status} ${method} ${path} ${latency}\n",
	}))
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PUT, DELETE, OPTIONS",
	}))

	// Initialize rate limiter with Redis store
	redisStore := redis.New(redis.Config{
		URL: "redis://" + cfg.Redis.Host + ":" + fmt.Sprint(cfg.Redis.Port) + "/1",
	})

	// Auth rate limiter - strict (5 requests per minute per IP)
	authLimiter := limiter.New(limiter.Config{
		Max:        5,
		Expiration: 1 * time.Minute,
		KeyGenerator: func(c *fiber.Ctx) string {
			return c.IP() // Rate limit by IP
		},
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"error": "too many requests, please try again later",
			})
		},
		Storage: redisStore,
	})

	// General API rate limiter - moderate (100 requests per minute per IP/user)
	apiLimiter := limiter.New(limiter.Config{
		Max:        100,
		Expiration: 1 * time.Minute,
		KeyGenerator: func(c *fiber.Ctx) string {
			if userID, ok := c.Locals("userId").(string); ok {
				return "user:" + userID // Rate limit by user if authenticated
			}
			return c.IP() // Otherwise by IP
		},
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"error": "rate limit exceeded",
			})
		},
		Storage: redisStore,
	})

	// Health check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "ok",
			"service": "codemortem-api",
			"time":    time.Now().Format(time.RFC3339),
		})
	})

	// API routes
	api := app.Group("/api/v1", apiLimiter)

	// Auth routes - with stricter rate limiting
	authApi := api.Group("/auth", authLimiter)
	authHandler.RegisterRoutesWithGroup(authApi)

	// Auth routes
	authHandler.RegisterRoutes(api)

	// User routes
	userHandler.RegisterRoutes(api, authMw)

	// Question routes
	qHandler.RegisterRoutes(api, authMw)

	// Custom judge routes for learning path (authenticated)
	lp := api.Group("/learning-path", authMw)

	lp.Post("/run", func(c *fiber.Ctx) error {
		var req struct {
			Code        string `json:"code"`
			Language    string `json:"language"`
			CustomInput string `json:"input"`
		}
		if err := c.BodyParser(&req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
		}

		langID, ok := judge.GetLanguageID(req.Language)
		if !ok {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "unsupported language"})
		}

		resp, err := judgeClient.Run(c.Context(), langID, req.Code, req.CustomInput)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "judge service unavailable"})
		}

		result := fiber.Map{
			"status": resp.Status.Description,
		}
		if resp.Stdout != nil {
			result["output"] = *resp.Stdout
		}
		if resp.Stderr != nil {
			result["stderr"] = *resp.Stderr
		}
		if resp.CompileOutput != nil {
			result["compileOutput"] = *resp.CompileOutput
		}
		if resp.Time != nil {
			result["executionTime"] = *resp.Time
		}
		if resp.Memory != nil {
			result["memory"] = *resp.Memory
		}

		return c.JSON(result)
	})

	lp.Post("/submit", func(c *fiber.Ctx) error {
		var req struct {
			Code        string `json:"code"`
			Language    string `json:"language"`
			ChallengeID string `json:"challengeId"`
		}
		if err := c.BodyParser(&req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
		}

		langID, ok := judge.GetLanguageID(req.Language)
		if !ok {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "unsupported language"})
		}

		var testCases []LPTestCase
		if req.ChallengeID == "sum_segment_tree" {
			testCases = sumSegmentTreeTestCases
		} else if req.ChallengeID == "max_segment_tree" {
			testCases = maxSegmentTreeTestCases
		} else {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "unknown challenge ID"})
		}

		inputs := make([]string, len(testCases))
		expectedOutputs := make([]string, len(testCases))
		for i, tc := range testCases {
			inputs[i] = tc.Input
			expectedOutputs[i] = tc.Expected
		}

		results, err := judgeClient.BatchJudge(c.Context(), langID, req.Code, inputs, expectedOutputs)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "judge service error"})
		}

		passed := 0
		overallVerdict := "accepted"

		type TestResultResponse struct {
			TestIndex     int      `json:"testIndex"`
			Verdict       string   `json:"verdict"`
			ExecutionTime *string  `json:"executionTime,omitempty"`
			Memory        *float64 `json:"memory,omitempty"`
			Output        *string  `json:"output,omitempty"`
			Expected      string   `json:"expected"`
			Stderr        *string  `json:"stderr,omitempty"`
			CompileOutput *string  `json:"compileOutput,omitempty"`
		}

		trResps := make([]TestResultResponse, len(results))
		for i, r := range results {
			if r == nil {
				overallVerdict = "runtime_error"
				trResps[i] = TestResultResponse{
					TestIndex: i,
					Verdict:   "runtime_error",
					Expected:  expectedOutputs[i],
				}
				continue
			}

			v := judge.MapVerdict(r.Status.ID)
			if v == "accepted" {
				passed++
			} else if overallVerdict == "accepted" {
				overallVerdict = v
			}

			trResps[i] = TestResultResponse{
				TestIndex:     i,
				Verdict:       v,
				ExecutionTime: r.Time,
				Memory:        r.Memory,
				Output:        r.Stdout,
				Expected:      expectedOutputs[i],
				Stderr:        r.Stderr,
				CompileOutput: r.CompileOutput,
			}
		}

		return c.JSON(fiber.Map{
			"verdict":     overallVerdict,
			"testsPassed": passed,
			"testsTotal":  len(testCases),
			"results":     trResps,
		})
	})


	// WebSocket endpoint for matchmaking + game
	app.Use("/ws", func(c *fiber.Ctx) error {
		if websocket.IsWebSocketUpgrade(c) {
			return c.Next()
		}
		return fiber.ErrUpgradeRequired
	})

	app.Get("/ws/game", authMw, websocket.New(func(conn *websocket.Conn) {
		userID := conn.Locals("userId").(string)
		username := conn.Locals("username").(string)

		client := &game.Client{
			ID:       userID,
			Username: username,
			Conn:     conn,
			Hub:      hub,
			Send:     make(chan []byte, 256),
		}

		hub.Register(client)
		go client.WritePump()

		client.ReadPump(func(c *game.Client, msg *game.ClientMessage) {
			handleGameMessage(c, msg, mmQueue, sessionMgr, userRepo, judgeClient, hub, db, qRepo, qSeeder, submissionLimiter, hintGen, explainer, analyzer, &cfg.AI, cfClient)
		})
	}))

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		<-quit
		log.Println("🛑 Shutting down...")
		matchCancel()
		app.Shutdown()
	}()

	// Start server
	addr := fmt.Sprintf("%s:%s", cfg.Server.Host, cfg.Server.Port)
	log.Printf("🚀 CodeMortem API listening on %s", addr)
	if err := app.Listen(addr); err != nil {
		log.Fatalf("❌ Server error: %v", err)
	}
}

// handleGameMessage routes WebSocket messages to the appropriate handler.
func handleGameMessage(
	c *game.Client,
	msg *game.ClientMessage,
	mmQueue *matchmaking.Queue,
	sessionMgr *game.SessionManager,
	userRepo *user.Repository,
	judgeClient *judge.Client,
	hub *game.Hub,
	db interface{},
	qRepo *question.Repository,
	qSeeder *question.BankSeeder,
	submissionLimiter *game.SubmissionRateLimiter,
	hintGen *ai.HintGenerator,
	explainer *ai.SolutionExplainer,
	analyzer *ai.PerformanceAnalyzer,
	aiCfg *config.AIConfig,
	cfClient *codeforces.Client,
) {
	ctx := context.Background()
	// analyzer and aiCfg are used for request_analysis (future expansion)
	_ = analyzer
	_ = aiCfg

	switch msg.Type {
	case "join_queue":
		// Get user's current rating
		u, err := userRepo.GetByID(ctx, c.ID)
		if err != nil {
			hub.SendToUser(c.ID, &game.ServerMessage{
				Type: "error",
				Data: map[string]string{"message": "failed to get user info"},
			})
			return
		}

		// Enforce verified CF handle
		if u.CFHandle == nil || !u.CFVerified {
			hub.SendToUser(c.ID, &game.ServerMessage{
				Type: "error",
				Data: map[string]string{"message": "You must link and verify your Codeforces handle before entering matchmaking. Go to Settings → Link Codeforces."},
			})
			return
		}

		// Subscribe for match notification
		matchCh := mmQueue.Subscribe(c.ID)

		// Join queue
		err = mmQueue.Join(ctx, &matchmaking.QueueEntry{
			UserID:   c.ID,
			Username: c.Username,
			Rating:   u.Rating,
			JoinedAt: time.Now(),
		})
		if err != nil {
			hub.SendToUser(c.ID, &game.ServerMessage{
				Type: "error",
				Data: map[string]string{"message": "failed to join queue"},
			})
			return
		}

		hub.SendToUser(c.ID, &game.ServerMessage{
			Type: "queue_joined",
			Data: map[string]interface{}{"rating": u.Rating},
		})

		// Wait for match in goroutine
		go func() {
			select {
			case result, ok := <-matchCh:
				if !ok || result == nil {
					return
				}

				// Only Player1 creates the session (avoid duplicate)
				if result.Player1.UserID == c.ID {
					go func() {
						ctx2 := context.Background()
						avgRating := int((result.Player1.Rating + result.Player2.Rating) / 2)

						// Get full user info for RD, volatility, and CF handles
						u1, _ := userRepo.GetByID(ctx2, result.Player1.UserID)
						u2, _ := userRepo.GetByID(ctx2, result.Player2.UserID)
						if u1 == nil || u2 == nil {
							log.Println("[match] failed to load user data for session")
							return
						}

						// Fetch solved problems for both players to avoid repeats
						var solved1, solved2 map[codeforces.ProblemKey]bool
						if u1.CFHandle != nil {
							solved1, _ = cfClient.GetUserSolvedProblems(*u1.CFHandle)
						}
						if u2.CFHandle != nil {
							solved2, _ = cfClient.GetUserSolvedProblems(*u2.CFHandle)
						}

						// Select 5 CF problems
						cfProblems, err := cfClient.SelectProblemsForRating(avgRating, solved1, solved2)
						if err != nil {
							log.Printf("[match] ❌ CF problem selection failed: %v", err)
							hub.SendToUser(result.Player1.UserID, &game.ServerMessage{
								Type: "error",
								Data: map[string]string{"message": "failed to select Codeforces problems"},
							})
							hub.SendToUser(result.Player2.UserID, &game.ServerMessage{
								Type: "error",
								Data: map[string]string{"message": "failed to select Codeforces problems"},
							})
							return
						}

						// Upsert questions into DB and collect IDs
						questionIDs := make([]string, len(cfProblems))
						for i, cfp := range cfProblems {
							// Fetch problem statement from CF
							stmt, inFmt, outFmt, constr, examples, fetchErr := cfClient.FetchProblemStatement(cfp.ContestID, cfp.Index)
							if fetchErr != nil {
								log.Printf("[match] warning: could not fetch statement for CF %d%s: %v", cfp.ContestID, cfp.Index, fetchErr)
								stmt = "Problem statement could not be loaded. Please view on Codeforces."
								inFmt = "See Codeforces"
								outFmt = "See Codeforces"
							}

							examplesJSON, _ := json.Marshal(examples)

							q, err := qRepo.UpsertCFQuestion(ctx2,
								cfp.ContestID, cfp.Index, cfp.Name,
								stmt, inFmt, outFmt, constr,
								examplesJSON, cfp.Rating, cfp.Tags, cfp.URL,
							)
							if err != nil {
								log.Printf("[match] ❌ failed to upsert CF question %d%s: %v", cfp.ContestID, cfp.Index, err)
								hub.SendToUser(result.Player1.UserID, &game.ServerMessage{
									Type: "error",
									Data: map[string]string{"message": "failed to prepare match questions"},
								})
								hub.SendToUser(result.Player2.UserID, &game.ServerMessage{
									Type: "error",
									Data: map[string]string{"message": "failed to prepare match questions"},
								})
								return
							}
							questionIDs[i] = q.ID

							// Rate limit CF scraping
							time.Sleep(500 * time.Millisecond)
						}

						cfHandle1 := ""
						if u1.CFHandle != nil {
							cfHandle1 = *u1.CFHandle
						}
						cfHandle2 := ""
						if u2.CFHandle != nil {
							cfHandle2 = *u2.CFHandle
						}

						// Create CF game session
						session, err := sessionMgr.CreateCFSession(ctx2,
							u1.ID, u1.Username, cfHandle1, u1.Rating, u1.RatingDeviation, u1.Volatility,
							u2.ID, u2.Username, cfHandle2, u2.Rating, u2.RatingDeviation, u2.Volatility,
							questionIDs, cfProblems,
						)
						if err != nil {
							log.Printf("[match] ❌ CF session creation failed: %v", err)
							return
						}

						matchID := session.Match.ID

						// Notify both players with matchId
						hub.SendToUser(u1.ID, &game.ServerMessage{
							Type: "match_found",
							Data: map[string]interface{}{
								"matchId":   matchID,
								"opponent":  map[string]interface{}{"username": u2.Username, "rating": u2.Rating},
								"countdown": 10,
								"isCF":      true,
							},
						})
						hub.SendToUser(u2.ID, &game.ServerMessage{
							Type: "match_found",
							Data: map[string]interface{}{
								"matchId":   matchID,
								"opponent":  map[string]interface{}{"username": u1.Username, "rating": u1.Rating},
								"countdown": 10,
								"isCF":      true,
							},
						})

						log.Printf("[match] ✅ CF session created: %s (%s vs %s)", matchID, u1.Username, u2.Username)
					}()
				} else {
					// Player2 just got the notification; P1 handles session creation
					// The match_found message will be sent by P1's goroutine above
				}

			case <-time.After(3 * time.Minute):
				mmQueue.Leave(ctx, c.ID)
				mmQueue.Unsubscribe(c.ID)
				hub.SendToUser(c.ID, &game.ServerMessage{
					Type: "queue_timeout",
					Data: map[string]string{"message": "no opponents found, please try again"},
				})
			}
		}()

	case "start_solo":
		u, err := userRepo.GetByID(ctx, c.ID)
		if err != nil {
			hub.SendToUser(c.ID, &game.ServerMessage{
				Type: "error",
				Data: map[string]string{"message": "failed to get user info"},
			})
			return
		}

		// Enforce verified CF handle
		if u.CFHandle == nil || !u.CFVerified {
			hub.SendToUser(c.ID, &game.ServerMessage{
				Type: "error",
				Data: map[string]string{"message": "You must link and verify your Codeforces handle before playing. Go to Settings → Link Codeforces."},
			})
			return
		}

		go func() {
			ctx2 := context.Background()
			avgRating := int(u.Rating)

			// Fetch solved problems to avoid repeats
			var solved1 map[codeforces.ProblemKey]bool
			if u.CFHandle != nil {
				solved1, _ = cfClient.GetUserSolvedProblems(*u.CFHandle)
			}

			// Select 5 CF problems
			cfProblems, err := cfClient.SelectProblemsForRating(avgRating, solved1, nil)
			if err != nil {
				log.Printf("[solo] ❌ CF problem selection failed: %v", err)
				hub.SendToUser(c.ID, &game.ServerMessage{
					Type: "error",
					Data: map[string]string{"message": "failed to select Codeforces problems"},
				})
				return
			}

			// Upsert questions into DB
			questionIDs := make([]string, len(cfProblems))
			for i, cfp := range cfProblems {
				stmt, inFmt, outFmt, constr, examples, fetchErr := cfClient.FetchProblemStatement(cfp.ContestID, cfp.Index)
				if fetchErr != nil {
					log.Printf("[solo] warning: could not fetch statement for CF %d%s: %v", cfp.ContestID, cfp.Index, fetchErr)
					stmt = "Problem statement could not be loaded. Please view on Codeforces."
					inFmt = "See Codeforces"
					outFmt = "See Codeforces"
				}

				examplesJSON, _ := json.Marshal(examples)

				q, err := qRepo.UpsertCFQuestion(ctx2,
					cfp.ContestID, cfp.Index, cfp.Name,
					stmt, inFmt, outFmt, constr,
					examplesJSON, cfp.Rating, cfp.Tags, cfp.URL,
				)
				if err != nil {
					log.Printf("[solo] ❌ failed to upsert CF question: %v", err)
					hub.SendToUser(c.ID, &game.ServerMessage{
						Type: "error",
						Data: map[string]string{"message": "failed to prepare solo questions"},
					})
					return
				}
				questionIDs[i] = q.ID
				time.Sleep(500 * time.Millisecond)
			}

			cfHandle := ""
			if u.CFHandle != nil {
				cfHandle = *u.CFHandle
			}

			session, err := sessionMgr.CreateCFSession(ctx2,
				u.ID, u.Username, cfHandle, u.Rating, u.RatingDeviation, u.Volatility,
				"", "", "", 0, 0, 0,
				questionIDs, cfProblems,
			)
			if err != nil {
				hub.SendToUser(c.ID, &game.ServerMessage{
					Type: "error",
					Data: map[string]string{"message": "failed to create solo session"},
				})
				return
			}

			hub.SendToUser(c.ID, &game.ServerMessage{
				Type: "match_found",
				Data: map[string]interface{}{
					"matchId":   session.Match.ID,
					"isSolo":    true,
					"isCF":      true,
					"countdown": 3,
				},
			})
		}()

	case "leave_queue":
		mmQueue.Leave(ctx, c.ID)
		mmQueue.Unsubscribe(c.ID)
		hub.SendToUser(c.ID, &game.ServerMessage{Type: "queue_left"})

	case "join_match":
		if msg.MatchID == "" {
			hub.SendToUser(c.ID, &game.ServerMessage{
				Type: "error",
				Data: map[string]string{"message": "missing matchId"},
			})
			return
		}

		// Join the room
		hub.JoinRoom(msg.MatchID, c)

		// Get and send match state
		state, err := sessionMgr.GetMatchState(msg.MatchID, c.ID)
		if err != nil {
			hub.SendToUser(c.ID, &game.ServerMessage{
				Type: "error",
				Data: map[string]string{"message": "match not found or already ended"},
			})
			return
		}

		hub.SendToUser(c.ID, &game.ServerMessage{
			Type: "match_state",
			Data: state,
		})

	case "submit_code":
		if c.MatchID == "" {
			hub.SendToUser(c.ID, &game.ServerMessage{
				Type: "error",
				Data: map[string]string{"message": "not in a match"},
			})
			return
		}

		// Check submission rate limit (max 1 every 3 seconds)
		if !submissionLimiter.IsAllowed(c.ID) {
			hub.SendToUser(c.ID, &game.ServerMessage{
				Type: "error",
				Data: map[string]string{"message": "you are submitting too fast, please wait a moment"},
			})
			return
		}

		handleSubmission(ctx, c, msg, sessionMgr, judgeClient, hub, qRepo)

	case "run_code":
		// Check run rate limit (more lenient than submit - max 1 every 1 second)
		if !submissionLimiter.IsAllowed(c.ID) {
			hub.SendToUser(c.ID, &game.ServerMessage{
				Type: "error",
				Data: map[string]string{"message": "running code too frequently, please wait"},
			})
			return
		}
		handleRunCode(ctx, c, msg, judgeClient, hub)

	case "heartbeat":
		hub.SendToUser(c.ID, &game.ServerMessage{Type: "heartbeat_ack"})

	case "request_hint":
		handleHintRequest(ctx, c, msg, sessionMgr, hub, qRepo, hintGen)

	case "request_explanation":
		handleExplanationRequest(ctx, c, msg, sessionMgr, hub, qRepo, explainer)
	}
}

// handleSubmission processes a code submission — judges against all test cases.
func handleSubmission(
	ctx context.Context,
	c *game.Client,
	msg *game.ClientMessage,
	sessionMgr *game.SessionManager,
	judgeClient *judge.Client,
	hub *game.Hub,
	qRepo *question.Repository,
) {
	langID, ok := judge.GetLanguageID(msg.Language)
	if !ok {
		hub.SendToUser(c.ID, &game.ServerMessage{
			Type: "error",
			Data: map[string]string{"message": "unsupported language"},
		})
		return
	}

	session, ok := sessionMgr.GetSession(c.MatchID)
	if !ok {
		return
	}

	if msg.QuestionIndex < 1 || msg.QuestionIndex > models.MatchQuestionCount {
		return
	}

	mq := session.Questions[msg.QuestionIndex-1]

	// Already solved by this player?
	player := session.GetPlayer(c.ID)
	if player != nil && player.Solved[msg.QuestionIndex] {
		hub.SendToUser(c.ID, &game.ServerMessage{
			Type: "submission_result",
			Data: map[string]interface{}{
				"questionIndex": msg.QuestionIndex,
				"verdict":       "already_solved",
				"message":       "You already solved this question",
			},
		})
		return
	}

	// Send "judging" status
	hub.SendToUser(c.ID, &game.ServerMessage{
		Type: "submission_result",
		Data: map[string]interface{}{
			"questionIndex": msg.QuestionIndex,
			"verdict":       "judging",
		},
	})

	// Run against all test cases asynchronously
	go func() {
		// Load test cases from database
		testCases, err := qRepo.GetTestCases(ctx, mq.QuestionID)
		if err != nil || len(testCases) == 0 {
			// Fallback: run without test cases (just compile check)
			resp, err := judgeClient.Submit(ctx, &judge.SubmissionRequest{
				SourceCode: msg.Code,
				LanguageID: langID,
			})
			if err != nil {
				hub.SendToUser(c.ID, &game.ServerMessage{
					Type: "submission_result",
					Data: map[string]interface{}{
						"questionIndex": msg.QuestionIndex,
						"verdict":       "internal_error",
						"message":       "judge service unavailable",
					},
				})
				return
			}
			verdict := judge.MapVerdict(resp.Status.ID)
			hub.SendToUser(c.ID, &game.ServerMessage{
				Type: "submission_result",
				Data: map[string]interface{}{
					"questionIndex": msg.QuestionIndex,
					"verdict":       verdict,
					"points":        0,
					"isFirstSolve":  false,
					"testsPassed":   0,
					"testsTotal":    0,
				},
			})
			return
		}

		// Build inputs and expected outputs for batch judging
		inputs := make([]string, len(testCases))
		outputs := make([]string, len(testCases))
		for i, tc := range testCases {
			inputs[i] = tc.Input
			outputs[i] = tc.ExpectedOutput
		}

		// Batch judge
		results, err := judgeClient.BatchJudge(ctx, langID, msg.Code, inputs, outputs)
		if err != nil {
			hub.SendToUser(c.ID, &game.ServerMessage{
				Type: "submission_result",
				Data: map[string]interface{}{
					"questionIndex": msg.QuestionIndex,
					"verdict":       "internal_error",
					"message":       "judge service error",
				},
			})
			return
		}

		// Aggregate results
		passed := 0
		total := len(results)
		overallVerdict := "accepted"
		var firstFailStderr, firstFailCompile *string
		var lastTime *string
		var lastMemory *float64

		for _, r := range results {
			if r == nil {
				overallVerdict = "internal_error"
				continue
			}

			v := judge.MapVerdict(r.Status.ID)
			if r.Time != nil {
				lastTime = r.Time
			}
			if r.Memory != nil {
				lastMemory = r.Memory
			}

			if v == "accepted" {
				passed++
			} else {
				if overallVerdict == "accepted" {
					overallVerdict = v
					firstFailStderr = r.Stderr
					firstFailCompile = r.CompileOutput
				}
			}
		}

		// All tests passed → accepted
		points := 0
		if passed == total {
			overallVerdict = "accepted"
			points, err = sessionMgr.RecordSolve(ctx, c.MatchID, c.ID, msg.QuestionIndex)
			if err != nil {
				log.Printf("[judge] record solve error: %v", err)
			}
		}

		result := map[string]interface{}{
			"questionIndex": msg.QuestionIndex,
			"verdict":       overallVerdict,
			"points":        points,
			"isFirstSolve":  points > 0,
			"testsPassed":   passed,
			"testsTotal":    total,
		}
		if lastTime != nil {
			result["executionTime"] = *lastTime
		}
		if lastMemory != nil {
			result["memory"] = *lastMemory
		}
		if firstFailCompile != nil {
			result["compileOutput"] = *firstFailCompile
		}
		if firstFailStderr != nil {
			result["stderr"] = *firstFailStderr
		}

		hub.SendToUser(c.ID, &game.ServerMessage{
			Type: "submission_result",
			Data: result,
		})
	}()
}

// handleRunCode processes a "Run" request (custom input, no judging).
func handleRunCode(
	ctx context.Context,
	c *game.Client,
	msg *game.ClientMessage,
	judgeClient *judge.Client,
	hub *game.Hub,
) {
	langID, ok := judge.GetLanguageID(msg.Language)
	if !ok {
		hub.SendToUser(c.ID, &game.ServerMessage{
			Type: "error",
			Data: map[string]string{"message": "unsupported language"},
		})
		return
	}

	go func() {
		resp, err := judgeClient.Run(ctx, langID, msg.Code, msg.CustomInput)
		if err != nil {
			hub.SendToUser(c.ID, &game.ServerMessage{
				Type: "run_result",
				Data: map[string]interface{}{
					"error": "judge service unavailable",
				},
			})
			return
		}

		result := map[string]interface{}{
			"status": resp.Status.Description,
		}
		if resp.Stdout != nil {
			result["output"] = *resp.Stdout
		}
		if resp.Stderr != nil {
			result["stderr"] = *resp.Stderr
		}
		if resp.CompileOutput != nil {
			result["compileOutput"] = *resp.CompileOutput
		}
		if resp.Time != nil {
			result["executionTime"] = *resp.Time
		}
		if resp.Memory != nil {
			result["memory"] = *resp.Memory
		}

		hub.SendToUser(c.ID, &game.ServerMessage{
			Type: "run_result",
			Data: result,
		})
	}()
}

// handleHintRequest processes a hint request during a match.
func handleHintRequest(
	ctx context.Context,
	c *game.Client,
	msg *game.ClientMessage,
	sessionMgr *game.SessionManager,
	hub *game.Hub,
	qRepo *question.Repository,
	hintGen *ai.HintGenerator,
) {
	if c.MatchID == "" {
		hub.SendToUser(c.ID, &game.ServerMessage{
			Type: "error",
			Data: map[string]string{"message": "not in a match"},
		})
		return
	}

	if msg.QuestionIndex < 1 || msg.QuestionIndex > models.MatchQuestionCount {
		hub.SendToUser(c.ID, &game.ServerMessage{
			Type: "error",
			Data: map[string]string{"message": "invalid question index"},
		})
		return
	}

	if msg.HintLevel < 1 || msg.HintLevel > 3 {
		hub.SendToUser(c.ID, &game.ServerMessage{
			Type: "error",
			Data: map[string]string{"message": "hint level must be 1, 2, or 3"},
		})
		return
	}

	session, ok := sessionMgr.GetSession(c.MatchID)
	if !ok {
		return
	}

	player := session.GetPlayer(c.ID)
	if player == nil {
		return
	}

	// Check if player already used this hint level for this question
	currentLevel := player.HintsUsed[msg.QuestionIndex]
	if msg.HintLevel <= currentLevel {
		hub.SendToUser(c.ID, &game.ServerMessage{
			Type: "error",
			Data: map[string]string{"message": "you already have this hint level"},
		})
		return
	}

	// Check if already solved
	if player.Solved[msg.QuestionIndex] {
		hub.SendToUser(c.ID, &game.ServerMessage{
			Type: "error",
			Data: map[string]string{"message": "question already solved, no hint needed"},
		})
		return
	}

	// Must request hints in order (1 → 2 → 3)
	if msg.HintLevel > currentLevel+1 {
		hub.SendToUser(c.ID, &game.ServerMessage{
			Type: "error",
			Data: map[string]string{"message": fmt.Sprintf("request level %d first", currentLevel+1)},
		})
		return
	}

	// Load question details
	mq := session.Questions[msg.QuestionIndex-1]

	qDetail, err := qRepo.GetByID(ctx, mq.QuestionID)
	if err != nil {
		hub.SendToUser(c.ID, &game.ServerMessage{
			Type: "error",
			Data: map[string]string{"message": "failed to load question details"},
		})
		return
	}

	isSolo := session.Player2 == nil
	cost := ai.HintCost(ai.HintLevel(msg.HintLevel), isSolo)

	// Send loading state
	hub.SendToUser(c.ID, &game.ServerMessage{
		Type: "hint_loading",
		Data: map[string]interface{}{
			"questionIndex": msg.QuestionIndex,
			"hintLevel":     msg.HintLevel,
		},
	})

	// Generate hint async
	go func() {
		hintReq := &ai.HintRequest{
			ProblemTitle:     qDetail.Title,
			ProblemStatement: qDetail.Statement,
			Constraints:      qDetail.Constraints,
			Tags:             qDetail.Tags,
			Difficulty:       qDetail.Difficulty,
			HintLevel:        ai.HintLevel(msg.HintLevel),
			PlayerCode:       msg.Code,
			PreviousHints:    player.HintTexts[msg.QuestionIndex],
		}

		hintResp, err := hintGen.GenerateHint(ctx, hintReq)
		if err != nil {
			log.Printf("[hint] ❌ generation failed: %v", err)
			hub.SendToUser(c.ID, &game.ServerMessage{
				Type: "error",
				Data: map[string]string{"message": "hint generation failed, please try again"},
			})
			return
		}

		// Deduct points
		if cost > 0 {
			player.Score -= cost
			if player.Score < 0 {
				player.Score = 0
			}
		}

		// Track hint usage
		player.HintsUsed[msg.QuestionIndex] = msg.HintLevel
		if player.HintTexts[msg.QuestionIndex] == nil {
			player.HintTexts[msg.QuestionIndex] = []string{}
		}
		player.HintTexts[msg.QuestionIndex] = append(player.HintTexts[msg.QuestionIndex], hintResp.HintText)

		hub.SendToUser(c.ID, &game.ServerMessage{
			Type: "hint_response",
			Data: map[string]interface{}{
				"questionIndex":  msg.QuestionIndex,
				"hintLevel":      msg.HintLevel,
				"hintText":       hintResp.HintText,
				"pointsDeducted": cost,
				"newScore":       player.Score,
			},
		})
	}()
}

// handleExplanationRequest processes a solution explanation request.
func handleExplanationRequest(
	ctx context.Context,
	c *game.Client,
	msg *game.ClientMessage,
	sessionMgr *game.SessionManager,
	hub *game.Hub,
	qRepo *question.Repository,
	explainer *ai.SolutionExplainer,
) {
	if c.MatchID == "" {
		hub.SendToUser(c.ID, &game.ServerMessage{
			Type: "error",
			Data: map[string]string{"message": "not in a match"},
		})
		return
	}

	if msg.QuestionIndex < 1 || msg.QuestionIndex > models.MatchQuestionCount {
		return
	}

	session, ok := sessionMgr.GetSession(c.MatchID)
	if !ok {
		return
	}

	mq := session.Questions[msg.QuestionIndex-1]
	player := session.GetPlayer(c.ID)

	qDetail, err := qRepo.GetByID(ctx, mq.QuestionID)
	if err != nil {
		hub.SendToUser(c.ID, &game.ServerMessage{
			Type: "error",
			Data: map[string]string{"message": "failed to load question"},
		})
		return
	}

	// Send loading state
	hub.SendToUser(c.ID, &game.ServerMessage{
		Type: "explanation_loading",
		Data: map[string]interface{}{"questionIndex": msg.QuestionIndex},
	})

	go func() {
		lastVerdict := ""
		if player != nil {
			lastVerdict = player.LastVerdicts[msg.QuestionIndex]
		}

		req := &ai.ExplainRequest{
			ProblemTitle:     qDetail.Title,
			ProblemStatement: qDetail.Statement,
			Constraints:      qDetail.Constraints,
			Tags:             qDetail.Tags,
			Difficulty:       qDetail.Difficulty,
			PlayerCode:       msg.Code,
			PlayerVerdict:    lastVerdict,
		}

		explanation, err := explainer.Explain(ctx, req)
		if err != nil {
			log.Printf("[explain] ❌ generation failed: %v", err)
			hub.SendToUser(c.ID, &game.ServerMessage{
				Type: "error",
				Data: map[string]string{"message": "explanation generation failed"},
			})
			return
		}

		hub.SendToUser(c.ID, &game.ServerMessage{
			Type: "explanation_response",
			Data: map[string]interface{}{
				"questionIndex": msg.QuestionIndex,
				"explanation":   explanation,
			},
		})
	}()
}

type LPTestCase struct {
	Input    string
	Expected string
}

var sumSegmentTreeTestCases = []LPTestCase{
	{
		Input: "5 5\n1 2 3 4 5\n2 0 2\n1 1 10\n2 0 2\n2 1 4\n2 0 4\n",
		Expected: "6\n14\n22\n23\n",
	},
	{
		Input: "8 4\n3 1 2 5 8 7 6 4\n2 0 7\n1 3 0\n2 2 5\n2 0 3\n",
		Expected: "36\n17\n6\n",
	},
	{
		Input: "3 3\n10 20 30\n2 1 2\n1 2 5\n2 0 2\n",
		Expected: "50\n35\n",
	},
}

var maxSegmentTreeTestCases = []LPTestCase{
	{
		Input: "5 5\n1 2 3 4 5\n2 0 2\n1 1 10\n2 0 2\n2 1 4\n2 0 4\n",
		Expected: "3\n10\n10\n10\n",
	},
	{
		Input: "8 5\n3 9 2 5 8 7 6 4\n2 0 7\n1 1 0\n2 0 3\n1 4 15\n2 2 5\n",
		Expected: "9\n5\n15\n",
	},
	{
		Input: "4 4\n-5 -2 -8 -1\n2 0 3\n1 2 0\n2 1 3\n2 0 1\n",
		Expected: "-1\n0\n-2\n",
	},
}
