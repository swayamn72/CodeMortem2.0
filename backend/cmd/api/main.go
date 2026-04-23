package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"codemortem/internal/ai"
	"codemortem/internal/auth"
	"codemortem/internal/config"
	"codemortem/internal/database"
	"codemortem/internal/game"
	"codemortem/internal/judge"
	"codemortem/internal/matchmaking"
	"codemortem/internal/question"
	"codemortem/internal/user"

	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
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

	sessionMgr := game.NewSessionManager(db, hub)
	mmQueue := matchmaking.NewQueue(rdb, &cfg.Match)

	// AI + Question services
	aiClient := ai.NewClient(&cfg.AI)
	qGen := ai.NewQuestionGenerator(aiClient)
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

	// Health check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "ok",
			"service": "codemortem-api",
			"time":    time.Now().Format(time.RFC3339),
		})
	})

	// API routes
	api := app.Group("/api/v1")

	// Auth routes
	authHandler.RegisterRoutes(api)

	// User routes
	userHandler.RegisterRoutes(api, authMw)

	// Question routes
	qHandler.RegisterRoutes(api, authMw)

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
			handleGameMessage(c, msg, mmQueue, sessionMgr, userRepo, judgeClient, hub, db, qRepo, qSeeder)
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
) {
	ctx := context.Background()

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

						// Find or generate a question set
						qs, err := qRepo.FindAvailableSet(ctx2, avgRating)
						var setID string
						if err != nil {
							// No pre-generated set — generate on demand
							log.Printf("[match] no pre-generated set for rating %d, generating on-demand...", avgRating)
							setID, err = qSeeder.GenerateOnDemand(ctx2, avgRating)
							if err != nil {
								log.Printf("[match] ❌ on-demand generation failed: %v", err)
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
						} else {
							setID = qs.ID
						}

						// Get full user info for RD and volatility
						u1, _ := userRepo.GetByID(ctx2, result.Player1.UserID)
						u2, _ := userRepo.GetByID(ctx2, result.Player2.UserID)
						if u1 == nil || u2 == nil {
							log.Println("[match] failed to load user data for session")
							return
						}

						// Create game session
						session, err := sessionMgr.CreateSession(ctx2,
							"", // auto-generated by DB
							u1.ID, u1.Username, u1.Rating, u1.RatingDeviation, u1.Volatility,
							u2.ID, u2.Username, u2.Rating, u2.RatingDeviation, u2.Volatility,
							setID,
						)
						if err != nil {
							log.Printf("[match] ❌ session creation failed: %v", err)
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
							},
						})
						hub.SendToUser(u2.ID, &game.ServerMessage{
							Type: "match_found",
							Data: map[string]interface{}{
								"matchId":   matchID,
								"opponent":  map[string]interface{}{"username": u1.Username, "rating": u1.Rating},
								"countdown": 10,
							},
						})

						log.Printf("[match] ✅ session created: %s (%s vs %s)", matchID, u1.Username, u2.Username)
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
		handleSubmission(ctx, c, msg, sessionMgr, judgeClient, hub, qRepo)

	case "run_code":
		handleRunCode(ctx, c, msg, judgeClient, hub)

	case "heartbeat":
		hub.SendToUser(c.ID, &game.ServerMessage{Type: "heartbeat_ack"})
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

	if msg.QuestionIndex < 1 || msg.QuestionIndex > 7 {
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
