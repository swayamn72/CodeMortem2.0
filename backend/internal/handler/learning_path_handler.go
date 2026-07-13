package handler

import (
	"context"
	"log"

	"codemortem/internal/auth"
	"codemortem/internal/challenges"
	"codemortem/internal/judge"
	"codemortem/internal/models"

	"github.com/gofiber/fiber/v2"
	"github.com/jmoiron/sqlx"
)

// RegisterLearningPathRoutes registers the /learning-path/* routes.
// db is required to persist submissions for authenticated users and to serve submission history.
func RegisterLearningPathRoutes(lp fiber.Router, judgeClient *judge.Client, db *sqlx.DB) {

	// ── POST /run ─────────────────────────────────────────────────────────────
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

	// ── POST /submit ──────────────────────────────────────────────────────────
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

		challenge, ok := challenges.Get(req.ChallengeID)
		if !ok {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "unknown challenge ID"})
		}

		// Load pre-generated test cases from DB
		testCases, err := challenges.GetStoredTestCases(c.Context(), db, req.ChallengeID, challenge.NumTests)
		if err != nil {
			log.Printf("[lp] test cases not ready for %q: %v", req.ChallengeID, err)
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{"error": "test cases are still being generated, please try again in a moment"})
		}

		results, err := judgeClient.StaticJudge(c.Context(), langID, req.Code, testCases, challenge)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "judge service error: " + err.Error()})
		}

		passed := 0
		overallVerdict := "accepted"
		var execTimeMs int64
		var memoryKB int64

		for _, r := range results {
			if r.Verdict == "accepted" {
				passed++
			} else if overallVerdict == "accepted" {
				overallVerdict = r.Verdict
			}
			if r.ExecutionMs > execTimeMs {
				execTimeMs = r.ExecutionMs
			}
			if r.Memory > memoryKB {
				memoryKB = r.Memory
			}
		}

		// ── Persist submission for authenticated users (fire-and-forget) ──────
		userID := auth.GetUserID(c)
		if userID != "" && db != nil {
			sub := &models.LearningPathSubmission{
				UserID:      userID,
				ChallengeID: req.ChallengeID,
				Language:    req.Language,
				SourceCode:  req.Code,
				Verdict:     overallVerdict,
				TestsPassed: passed,
				TestsTotal:  challenge.NumTests,
			}
			if execTimeMs > 0 {
				secs := float64(execTimeMs) / 1000.0
				sub.ExecutionTime = &secs
			}
			if memoryKB > 0 {
				mem := float64(memoryKB)
				sub.MemoryUsed = &mem
			}
			go func(s *models.LearningPathSubmission) {
				if err := insertLPSubmission(context.Background(), db, s); err != nil {
					log.Printf("[lp] failed to persist submission for user %s: %v", s.UserID, err)
				}
			}(sub)
		}

		response := fiber.Map{
			"verdict":     overallVerdict,
			"testsPassed": passed,
			"testsTotal":  challenge.NumTests,
			"results":     results,
		}
		if execTimeMs > 0 {
			response["executionTime"] = float64(execTimeMs) / 1000.0
		}
		if memoryKB > 0 {
			response["memoryUsed"] = memoryKB
		}

		return c.JSON(response)
	})

	// ── GET /submissions ──────────────────────────────────────────────────────
	// Returns the last 10 submissions for the authenticated user for a given challenge.
	// Query param: challengeId (required)
	lp.Get("/submissions", func(c *fiber.Ctx) error {
		userID := auth.GetUserID(c)
		if userID == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "authentication required"})
		}

		challengeID := c.Query("challengeId")
		if challengeID == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "challengeId query param required"})
		}

		subs, err := getLPSubmissions(c.Context(), db, userID, challengeID, 10)
		if err != nil {
			log.Printf("[lp] failed to fetch submissions for user %s challenge %s: %v", userID, challengeID, err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to fetch submissions"})
		}

		// Return empty array (not null) when no history yet
		if subs == nil {
			subs = []*models.LearningPathSubmission{}
		}

		return c.JSON(fiber.Map{"submissions": subs})
	})
}

// ── DB helpers ────────────────────────────────────────────────────────────────

func insertLPSubmission(ctx context.Context, db *sqlx.DB, s *models.LearningPathSubmission) error {
	return db.QueryRowContext(
		ctx,
		`INSERT INTO learning_path_submissions
			(user_id, challenge_id, language, source_code, verdict, tests_passed, tests_total, execution_time, memory_used)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		 RETURNING id`,
		s.UserID, s.ChallengeID, s.Language, s.SourceCode,
		s.Verdict, s.TestsPassed, s.TestsTotal, s.ExecutionTime, s.MemoryUsed,
	).Scan(&s.ID)
}

func getLPSubmissions(ctx context.Context, db *sqlx.DB, userID, challengeID string, limit int) ([]*models.LearningPathSubmission, error) {
	var subs []*models.LearningPathSubmission
	err := db.SelectContext(
		ctx,
		&subs,
		`SELECT id, user_id, challenge_id, language, source_code, verdict,
		        tests_passed, tests_total, execution_time, memory_used, submitted_at
		 FROM learning_path_submissions
		 WHERE user_id = $1 AND challenge_id = $2
		 ORDER BY submitted_at DESC
		 LIMIT $3`,
		userID, challengeID, limit,
	)
	return subs, err
}
