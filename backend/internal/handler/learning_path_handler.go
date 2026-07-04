package handler

import (
	"codemortem/internal/challenges"
	"codemortem/internal/judge"

	"github.com/gofiber/fiber/v2"
)

// RegisterLearningPathRoutes registers the /learning-path/run and /learning-path/submit routes.
func RegisterLearningPathRoutes(lp fiber.Router, judgeClient *judge.Client) {
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

		challenge, ok := challenges.Get(req.ChallengeID)
		if !ok {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "unknown challenge ID"})
		}

		results, err := judgeClient.DynamicJudge(c.Context(), langID, req.Code, challenge)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "judge service error: " + err.Error()})
		}

		passed := 0
		overallVerdict := "accepted"
		for _, r := range results {
			if r.Verdict == "accepted" {
				passed++
			} else if overallVerdict == "accepted" {
				overallVerdict = r.Verdict
			}
		}

		return c.JSON(fiber.Map{
			"verdict":     overallVerdict,
			"testsPassed": passed,
			"testsTotal":  challenge.NumTests,
			"results":     results,
		})
	})
}
