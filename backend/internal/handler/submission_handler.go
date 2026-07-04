package handler

import (
	"context"
	"log"

	"codemortem/internal/app"
	"codemortem/internal/game"
	"codemortem/internal/judge"
	"codemortem/internal/models"
)

// HandleSubmission processes a code submission — judges against all test cases.
func HandleSubmission(ctx context.Context, c *game.Client, msg *game.ClientMessage, ctr *app.Container) {
	langID, ok := judge.GetLanguageID(msg.Language)
	if !ok {
		ctr.Hub.SendToUser(c.ID, &game.ServerMessage{
			Type: "error",
			Data: map[string]string{"message": "unsupported language"},
		})
		return
	}

	session, ok := ctr.SessionMgr.GetSession(c.MatchID)
	if !ok {
		return
	}

	if msg.QuestionIndex < 1 || msg.QuestionIndex > models.MatchQuestionCount {
		return
	}

	mq := session.Questions[msg.QuestionIndex-1]

	// Already solved by this player? (read under lock)
	session.RLock()
	player := session.GetPlayer(c.ID)
	alreadySolved := player != nil && player.Solved[msg.QuestionIndex]
	session.RUnlock()

	if alreadySolved {
		ctr.Hub.SendToUser(c.ID, &game.ServerMessage{
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
	ctr.Hub.SendToUser(c.ID, &game.ServerMessage{
		Type: "submission_result",
		Data: map[string]interface{}{
			"questionIndex": msg.QuestionIndex,
			"verdict":       "judging",
		},
	})

	// Run against all test cases asynchronously
	go func() {
		testCases, err := ctr.QRepo.GetTestCases(ctx, mq.QuestionID)
		if err != nil || len(testCases) == 0 {
			resp, err := ctr.JudgeClient.Submit(ctx, &judge.SubmissionRequest{
				SourceCode: msg.Code,
				LanguageID: langID,
			})
			if err != nil {
				ctr.Hub.SendToUser(c.ID, &game.ServerMessage{
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
			ctr.Hub.SendToUser(c.ID, &game.ServerMessage{
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

		inputs := make([]string, len(testCases))
		outputs := make([]string, len(testCases))
		for i, tc := range testCases {
			inputs[i] = tc.Input
			outputs[i] = tc.ExpectedOutput
		}

		results, err := ctr.JudgeClient.BatchJudge(ctx, langID, msg.Code, inputs, outputs)
		if err != nil {
			ctr.Hub.SendToUser(c.ID, &game.ServerMessage{
				Type: "submission_result",
				Data: map[string]interface{}{
					"questionIndex": msg.QuestionIndex,
					"verdict":       "internal_error",
					"message":       "judge service error",
				},
			})
			return
		}

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

		points := 0
		if passed == total {
			overallVerdict = "accepted"
			points, err = ctr.SessionMgr.RecordSolve(ctx, c.MatchID, c.ID, msg.QuestionIndex)
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

		ctr.Hub.SendToUser(c.ID, &game.ServerMessage{
			Type: "submission_result",
			Data: result,
		})
	}()
}

// HandleRunCode processes a "Run" request (custom input, no judging).
func HandleRunCode(ctx context.Context, c *game.Client, msg *game.ClientMessage, ctr *app.Container) {
	langID, ok := judge.GetLanguageID(msg.Language)
	if !ok {
		ctr.Hub.SendToUser(c.ID, &game.ServerMessage{
			Type: "error",
			Data: map[string]string{"message": "unsupported language"},
		})
		return
	}

	go func() {
		resp, err := ctr.JudgeClient.Run(ctx, langID, msg.Code, msg.CustomInput)
		if err != nil {
			ctr.Hub.SendToUser(c.ID, &game.ServerMessage{
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

		ctr.Hub.SendToUser(c.ID, &game.ServerMessage{
			Type: "run_result",
			Data: result,
		})
	}()
}
