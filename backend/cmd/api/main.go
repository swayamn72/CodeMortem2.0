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
	"codemortem/internal/app"
	"codemortem/internal/auth"
	"codemortem/internal/challenges"
	_ "codemortem/internal/challenges/segment_tree"              // registers all segment tree challenges
	_ "codemortem/internal/challenges/segment_tree_intermediate" // registers intermediate segment tree challenges
	_ "codemortem/internal/challenges/hld"                       // registers all HLD challenges
	_ "codemortem/internal/challenges/bit_manipulation"          // registers all bit manipulation challenges
	_ "codemortem/internal/challenges/combinatorics"             // registers all combinatorics challenges
	"codemortem/internal/codeforces"
	"codemortem/internal/config"
	"codemortem/internal/database"
	"codemortem/internal/email"
	"codemortem/internal/game"
	"codemortem/internal/handler"
	"codemortem/internal/judge"
	"codemortem/internal/matchmaking"
	"codemortem/internal/question"
	"codemortem/internal/subscription"
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
	log.Println("✓ PostgreSQL connected")

	// Connect to Redis
	rdb, err := database.NewRedis(&cfg.Redis)
	if err != nil {
		log.Fatalf("❌ Failed to connect to Redis: %v", err)
	}
	log.Println("✓ Redis connected")

	// Initialize services
	jwtMgr := auth.NewJWTManager(&cfg.JWT)
	emailSender := email.NewSender(cfg.Email.ResendAPIKey, cfg.Email.FromAddress)
	authSvc := auth.NewService(db, rdb, jwtMgr, cfg.OAuth.GoogleClientID, emailSender)
	authHandler := auth.NewHandler(authSvc)
	authMw := auth.Middleware(jwtMgr)

	userRepo := user.NewRepository(db)
	userHandler := user.NewHandler(userRepo)

	judgeClient := judge.NewClient(&cfg.Judge0)

	// Seed challenge test cases in background (idempotent — skips if already seeded)
	go func() {
		seedCtx, seedCancel := context.WithCancel(context.Background())
		defer seedCancel()
		challenges.SeedAll(seedCtx, db)
	}()

	hub := game.NewHub()
	go hub.Run()

	// Initialize Codeforces client
	cfClient := codeforces.NewClient()
	if err := cfClient.Init(); err != nil {
		log.Printf("⚠️  Codeforces API init failed (will retry): %v", err)
	} else {
		log.Println("✓ Codeforces problem cache loaded")
	}

	sessionMgr := game.NewSessionManager(db, hub, cfClient)
	mmQueue := matchmaking.NewQueue(rdb, &cfg.Match)
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

	// NOTE: Auto-seeding is disabled — uncomment below when a valid AI key is available.
	_ = qSeeder // keep reference to avoid unused-variable error
	log.Println("ℹ️  AI question bank seeder disabled (not needed yet)")

	// Start matchmaker in background
	matchCtx, matchCancel := context.WithCancel(context.Background())
	defer matchCancel()
	go mmQueue.StartMatcher(matchCtx)

	// Build dependency container for WebSocket handlers
	ctr := &app.Container{
		SessionMgr:        sessionMgr,
		Hub:               hub,
		JudgeClient:       judgeClient,
		QRepo:             qRepo,
		QSeeder:           qSeeder,
		UserRepo:          userRepo,
		MMQueue:           mmQueue,
		SubmissionLimiter: submissionLimiter,
		HintGen:           hintGen,
		Explainer:         explainer,
		Analyzer:          analyzer,
		AICfg:             &cfg.AI,
		CFClient:          cfClient,
	}

	// Create Fiber app
	fiberApp := fiber.New(fiber.Config{
		ReadTimeout:  cfg.Server.ReadTimeout,
		WriteTimeout: cfg.Server.WriteTimeout,
		BodyLimit:    1 * 1024 * 1024, // 1MB
		AppName:      "CodeMortem API",
	})

	// Middleware
	fiberApp.Use(recover.New())
	fiberApp.Use(logger.New(logger.Config{
		Format: "[${time}] ${status} ${method} ${path} ${latency}\n",
	}))
	fiberApp.Use(cors.New(cors.Config{
		AllowOrigins:     "http://localhost:3000, https://code-mortem2-0.vercel.app, https://codemortem.dev, https://www.codemortem.dev",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowMethods:     "GET, POST, PUT, DELETE, OPTIONS",
		AllowCredentials: true,
	}))

	// Initialize rate limiter with Redis store
	redisStore := redis.New(redis.Config{
		URL: "redis://" + cfg.Redis.Host + ":" + fmt.Sprint(cfg.Redis.Port) + "/1",
	})

	authLimiter := limiter.New(limiter.Config{
		Max:        100,
		Expiration: 1 * time.Minute,
		KeyGenerator: func(c *fiber.Ctx) string {
			return c.IP()
		},
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"error": "too many requests, please try again later",
			})
		},
		Storage: redisStore,
	})

	apiLimiter := limiter.New(limiter.Config{
		Max:        500,
		Expiration: 1 * time.Minute,
		KeyGenerator: func(c *fiber.Ctx) string {
			if userID, ok := c.Locals("userId").(string); ok {
				return "user:" + userID
			}
			return c.IP()
		},
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"error": "rate limit exceeded",
			})
		},
		Storage: redisStore,
	})

	// Health check
	fiberApp.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "ok",
			"service": "codemortem-api",
			"time":    time.Now().Format(time.RFC3339),
		})
	})

	// API routes
	api := fiberApp.Group("/api/v1", apiLimiter)

	// Auth routes
	authApi := api.Group("/auth", authLimiter)
	authHandler.RegisterRoutesWithGroup(authApi)
	authHandler.RegisterRoutes(api)

	// User routes
	userHandler.RegisterRoutes(api, authMw)

	// Question routes
	qHandler.RegisterRoutes(api, authMw)

	// Subscription routes
	subRepo := subscription.NewRepository(db)
	subHandler := subscription.NewHandler(subRepo, &cfg.Razorpay)
	subHandler.RegisterRoutes(api, authMw)

	// Learning path routes (authenticated)
	lp := api.Group("/learning-path", authMw)
	handler.RegisterLearningPathRoutes(lp, judgeClient, db)

	// WebSocket endpoint for matchmaking + game
	fiberApp.Use("/ws", func(c *fiber.Ctx) error {
		if websocket.IsWebSocketUpgrade(c) {
			return c.Next()
		}
		return fiber.ErrUpgradeRequired
	})

	fiberApp.Get("/ws/game", authMw, websocket.New(func(conn *websocket.Conn) {
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
			handler.HandleGameMessage(c, msg, ctr)
		})
	}))

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		<-quit
		log.Println("🛑 Shutting down...")
		matchCancel()
		fiberApp.Shutdown()
	}()

	// Start server
	addr := fmt.Sprintf("%s:%s", cfg.Server.Host, cfg.Server.Port)
	log.Printf("🚀 CodeMortem API listening on %s", addr)
	if err := fiberApp.Listen(addr); err != nil {
		log.Fatalf("❌ Server error: %v", err)
	}
}
