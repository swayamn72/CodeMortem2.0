package question

import (
	"context"
	"fmt"
	"log"

	"codemortem/internal/ai"
	"codemortem/internal/config"

	"github.com/gofiber/fiber/v2"
)

// Handler provides HTTP endpoints for question management.
type Handler struct {
	repo      *Repository
	generator *ai.QuestionGenerator
	seeder    *BankSeeder
	cfg       *config.AIConfig
}

// NewHandler creates a new question handler.
func NewHandler(repo *Repository, generator *ai.QuestionGenerator, seeder *BankSeeder, cfg *config.AIConfig) *Handler {
	return &Handler{
		repo:      repo,
		generator: generator,
		seeder:    seeder,
		cfg:       cfg,
	}
}

// RegisterRoutes registers question management routes.
func (h *Handler) RegisterRoutes(router fiber.Router, authMw fiber.Handler) {
	g := router.Group("/questions", authMw)

	g.Get("/count", h.GetCount)
	g.Get("/:id", h.GetQuestion)
	g.Get("/:id/tests", h.GetTestCases)

	// Admin-only routes (TODO: add admin middleware)
	admin := router.Group("/admin/questions", authMw)
	admin.Post("/generate", h.GenerateSingle)
	admin.Post("/generate-set", h.GenerateSet)
	admin.Get("/sets/status", h.GetBankStatus)
}

// GetCount returns the total number of questions in the bank.
func (h *Handler) GetCount(c *fiber.Ctx) error {
	count, err := h.repo.GetCount(c.Context())
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to get count"})
	}
	return c.JSON(fiber.Map{"count": count})
}

// GetQuestion returns a question by ID.
func (h *Handler) GetQuestion(c *fiber.Ctx) error {
	id := c.Params("id")
	q, err := h.repo.GetByID(c.Context(), id)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "question not found"})
	}
	return c.JSON(q)
}

// GetTestCases returns test cases for a question.
func (h *Handler) GetTestCases(c *fiber.Ctx) error {
	id := c.Params("id")
	tcs, err := h.repo.GetTestCases(c.Context(), id)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to get test cases"})
	}
	return c.JSON(fiber.Map{"testCases": tcs, "count": len(tcs)})
}

// GenerateSingle generates a single question via AI.
func (h *Handler) GenerateSingle(c *fiber.Ctx) error {
	var body struct {
		Difficulty int    `json:"difficulty"`
		TierIndex  int    `json:"tierIndex"` // 1-7
		AvgRating  int    `json:"avgRating"` // optional, defaults to 1500
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request body"})
	}

	if body.AvgRating == 0 {
		body.AvgRating = 1500
	}
	if body.TierIndex < 1 || body.TierIndex > 7 {
		body.TierIndex = 1
	}

	tiers := ai.GetTiersForRating(body.AvgRating)
	tier := tiers[body.TierIndex-1]

	ctx := c.Context()
	gen, err := h.generator.GenerateQuestion(ctx, tier, nil)
	if err != nil {
		log.Printf("[handler] generation failed: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": fmt.Sprintf("generation failed: %v", err)})
	}

	providerModel := h.cfg.Provider + "/" + h.cfg.Model
	q, err := h.repo.SaveGeneratedQuestion(ctx, gen, providerModel)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": fmt.Sprintf("save failed: %v", err)})
	}

	return c.Status(201).JSON(fiber.Map{
		"question":  q,
		"testCases": len(gen.TestCases),
		"solution":  gen.Solution,
	})
}

// GenerateSet generates a full 7-question match set.
func (h *Handler) GenerateSet(c *fiber.Ctx) error {
	var body struct {
		AvgRating int `json:"avgRating"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request body"})
	}

	if body.AvgRating == 0 {
		body.AvgRating = 1500
	}

	// Generate asynchronously and return immediately
	go func() {
		ctx := context.Background()
		setID, err := h.seeder.GenerateOnDemand(ctx, body.AvgRating)
		if err != nil {
			log.Printf("[handler] async set generation failed: %v", err)
		} else {
			log.Printf("[handler] ✅ set generated: %s", setID)
		}
	}()

	return c.Status(202).JSON(fiber.Map{
		"message": "generation started in background",
		"status":  "pending",
	})
}

// GetBankStatus returns the question bank status for each rating bracket.
func (h *Handler) GetBankStatus(c *fiber.Ctx) error {
	brackets := GetBrackets()
	status := make([]map[string]interface{}, len(brackets))

	for i, bracket := range brackets {
		count, err := h.repo.GetSetCount(c.Context(), bracket.Min, bracket.Max)
		if err != nil {
			count = 0
		}

		totalQuestions, _ := h.repo.GetCount(c.Context())

		status[i] = map[string]interface{}{
			"ratingMin":  bracket.Min,
			"ratingMax":  bracket.Max,
			"avgRating":  bracket.AvgRating,
			"setsAvailable": count,
			"target":     3,
			"healthy":    count >= 3,
		}

		_ = totalQuestions
	}

	totalQuestions, _ := h.repo.GetCount(c.Context())

	return c.JSON(fiber.Map{
		"brackets":       status,
		"totalQuestions": totalQuestions,
	})
}
