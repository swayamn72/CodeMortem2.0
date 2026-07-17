package handler

import (
	"context"

	"codemortem/internal/app"
	"codemortem/internal/game"
	"codemortem/internal/judge"
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

	// Validate problem index against actual problem count
	session.RLock()
	numProblems := len(session.CFProblems)
	session.RUnlock()

	if msg.QuestionIndex < 1 || msg.QuestionIndex > numProblems {
		return
	}

	// Already solved by this player?
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

	// CF problems have no local test cases — Judge0 is used for a single-pass
	// compile/run smoke check only. Actual solve detection is via the CF poller.
	go func() {
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
