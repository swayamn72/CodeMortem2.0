package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strconv"
	"time"

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

// stmtCache is the shape stored in Redis under cf:stmt:<contestId>:<index>.
type stmtCache struct {
	Examples []map[string]string `json:"examples"`
}

// HandleRunSamples processes a "run_samples" request: runs the user's code against
// each CF sample test case server-side and returns per-case PASS/FAIL results.
// The sample examples are sourced from the Redis cf:stmt cache (spoof-proof — the
// client cannot supply or alter the expected inputs/outputs).
func HandleRunSamples(ctx context.Context, c *game.Client, msg *game.ClientMessage, ctr *app.Container) {
	langID, ok := judge.GetLanguageID(msg.Language)
	if !ok {
		ctr.Hub.SendToUser(c.ID, &game.ServerMessage{
			Type: "run_samples_result",
			Data: map[string]interface{}{"error": "unsupported language"},
		})
		return
	}

	session, ok := ctr.SessionMgr.GetSession(c.MatchID)
	if !ok {
		return
	}

	session.RLock()
	numProblems := len(session.CFProblems)
	session.RUnlock()

	if msg.QuestionIndex < 1 || msg.QuestionIndex > numProblems {
		ctr.Hub.SendToUser(c.ID, &game.ServerMessage{
			Type: "run_samples_result",
			Data: map[string]interface{}{"error": "invalid question index"},
		})
		return
	}

	session.RLock()
	mcp := session.CFProblems[msg.QuestionIndex-1]
	session.RUnlock()

	contestID := mcp.CFContestID
	index := mcp.CFProblemIndex

	go func() {
		// --- Fetch examples server-side (spoof-proof) ---
		var examples []map[string]string

		cacheKey := "cf:stmt:" + strconv.Itoa(contestID) + ":" + index
		if cached, err := ctr.Redis.Get(ctx, cacheKey).Bytes(); err == nil {
			var sc stmtCache
			if json.Unmarshal(cached, &sc) == nil {
				examples = sc.Examples
			}
		}

		if len(examples) == 0 {
			// Cache miss — fetch from Codeforces and re-cache
			_, _, _, _, fetched, err := ctr.CFClient.FetchProblemStatement(contestID, index)
			if err != nil {
				log.Printf("[run_samples] fetch error for %d%s: %v", contestID, index, err)
				ctr.Hub.SendToUser(c.ID, &game.ServerMessage{
					Type: "run_samples_result",
					Data: map[string]interface{}{"error": "could not fetch problem statement"},
				})
				return
			}
			examples = fetched
			// Re-cache the full payload with the examples we just fetched
			if b, err := json.Marshal(map[string]interface{}{"examples": examples}); err == nil {
				ctr.Redis.Set(ctx, cacheKey, b, 24*time.Hour)
			}
		}

		if len(examples) == 0 {
			ctr.Hub.SendToUser(c.ID, &game.ServerMessage{
				Type: "run_samples_result",
				Data: map[string]interface{}{
					"questionIndex": msg.QuestionIndex,
					"passed":        0,
					"total":         0,
					"cases":         []interface{}{},
					"message":       "no sample tests available",
				},
			})
			return
		}

		// Build inputs/expectedOutputs slices
		inputs := make([]string, len(examples))
		expectedOutputs := make([]string, len(examples))
		for i, ex := range examples {
			inputs[i] = ex["input"]
			expectedOutputs[i] = ex["output"]
		}

		// Run against all sample test cases
		results, err := ctr.JudgeClient.BatchJudge(ctx, langID, msg.Code, inputs, expectedOutputs)
		if err != nil {
			ctr.Hub.SendToUser(c.ID, &game.ServerMessage{
				Type: "run_samples_result",
				Data: map[string]interface{}{"error": fmt.Sprintf("judge error: %v", err)},
			})
			return
		}

		// Assemble per-case payload
		type SampleCase struct {
			Index          int    `json:"index"`
			Input          string `json:"input"`
			ExpectedOutput string `json:"expectedOutput"`
			ActualOutput   string `json:"actualOutput"`
			Passed         bool   `json:"passed"`
			Status         string `json:"status"`
			Time           string `json:"time,omitempty"`
		}

		cases := make([]SampleCase, len(examples))
		passedCount := 0
		for i, res := range results {
			sc := SampleCase{
				Index:          i + 1,
				Input:          inputs[i],
				ExpectedOutput: expectedOutputs[i],
			}
			if res != nil {
				if res.Stdout != nil {
					sc.ActualOutput = *res.Stdout
				}
				sc.Passed = judge.MapVerdict(res.Status.ID) == "accepted"
				sc.Status = res.Status.Description
				if res.Time != nil {
					sc.Time = *res.Time
				}
			} else {
				sc.Status = "Internal Error"
			}
			if sc.Passed {
				passedCount++
			}
			cases[i] = sc
		}

		ctr.Hub.SendToUser(c.ID, &game.ServerMessage{
			Type: "run_samples_result",
			Data: map[string]interface{}{
				"questionIndex": msg.QuestionIndex,
				"passed":        passedCount,
				"total":         len(examples),
				"cases":         cases,
			},
		})
	}()
}
