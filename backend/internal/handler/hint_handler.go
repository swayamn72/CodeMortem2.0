package handler

import (
	"context"
	"fmt"
	"log"

	"codemortem/internal/ai"
	"codemortem/internal/app"
	"codemortem/internal/game"
)

// HandleHintRequest processes a hint request during a CF match.
func HandleHintRequest(ctx context.Context, c *game.Client, msg *game.ClientMessage, ctr *app.Container) {
	if c.MatchID == "" {
		ctr.Hub.SendToUser(c.ID, &game.ServerMessage{
			Type: "error",
			Data: map[string]string{"message": "not in a match"},
		})
		return
	}

	if msg.QuestionIndex < 1 {
		ctr.Hub.SendToUser(c.ID, &game.ServerMessage{
			Type: "error",
			Data: map[string]string{"message": "invalid question index"},
		})
		return
	}

	if msg.HintLevel < 1 || msg.HintLevel > 3 {
		ctr.Hub.SendToUser(c.ID, &game.ServerMessage{
			Type: "error",
			Data: map[string]string{"message": "hint level must be 1, 2, or 3"},
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

	if msg.QuestionIndex > numProblems {
		ctr.Hub.SendToUser(c.ID, &game.ServerMessage{
			Type: "error",
			Data: map[string]string{"message": "invalid question index"},
		})
		return
	}

	// Read player state under lock
	session.RLock()
	player := session.GetPlayer(c.ID)
	if player == nil {
		session.RUnlock()
		return
	}
	currentLevel := player.HintsUsed[msg.QuestionIndex]
	alreadySolved := player.Solved[msg.QuestionIndex]
	previousHints := player.HintTexts[msg.QuestionIndex]
	mcp := session.CFProblems[msg.QuestionIndex-1]
	isSolo := session.Player2 == nil
	session.RUnlock()

	if msg.HintLevel <= currentLevel {
		ctr.Hub.SendToUser(c.ID, &game.ServerMessage{
			Type: "error",
			Data: map[string]string{"message": "you already have this hint level"},
		})
		return
	}

	if alreadySolved {
		ctr.Hub.SendToUser(c.ID, &game.ServerMessage{
			Type: "error",
			Data: map[string]string{"message": "question already solved, no hint needed"},
		})
		return
	}

	if msg.HintLevel > currentLevel+1 {
		ctr.Hub.SendToUser(c.ID, &game.ServerMessage{
			Type: "error",
			Data: map[string]string{"message": fmt.Sprintf("request level %d first", currentLevel+1)},
		})
		return
	}

	cost := ai.HintCost(ai.HintLevel(msg.HintLevel), isSolo)

	ctr.Hub.SendToUser(c.ID, &game.ServerMessage{
		Type: "hint_loading",
		Data: map[string]interface{}{
			"questionIndex": msg.QuestionIndex,
			"hintLevel":     msg.HintLevel,
		},
	})

	go func() {
		// Build a concise problem summary for the AI from CF metadata
		// Full statement is not stored server-side (fetched lazily by frontend)
		problemDesc := fmt.Sprintf(
			"Codeforces problem: %s (Contest %d, Problem %s, Rating %d, Tags: %v)",
			mcp.CFName, mcp.CFContestID, mcp.CFProblemIndex, mcp.CFRating, []string(mcp.CFTags),
		)

		hintReq := &ai.HintRequest{
			ProblemTitle:     mcp.CFName,
			ProblemStatement: problemDesc, // AI uses metadata since full statement is on CF
			Constraints:      fmt.Sprintf("CF rating: %d", mcp.CFRating),
			Tags:             []string(mcp.CFTags),
			Difficulty:       mcp.CFRating / 200, // rough 1-17 scale
			HintLevel:        ai.HintLevel(msg.HintLevel),
			PlayerCode:       msg.Code,
			PreviousHints:    previousHints,
		}

		hintResp, err := ctr.HintGen.GenerateHint(ctx, hintReq)
		if err != nil {
			log.Printf("[hint] ❌ generation failed: %v", err)
			ctr.Hub.SendToUser(c.ID, &game.ServerMessage{
				Type: "error",
				Data: map[string]string{"message": "hint generation failed, please try again"},
			})
			return
		}

		// Deduct points and track hint usage
		if cost > 0 {
			player.Score -= cost
			if player.Score < 0 {
				player.Score = 0
			}
		}

		player.HintsUsed[msg.QuestionIndex] = msg.HintLevel
		if player.HintTexts[msg.QuestionIndex] == nil {
			player.HintTexts[msg.QuestionIndex] = []string{}
		}
		player.HintTexts[msg.QuestionIndex] = append(player.HintTexts[msg.QuestionIndex], hintResp.HintText)

		ctr.Hub.SendToUser(c.ID, &game.ServerMessage{
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

// HandleExplanationRequest processes a solution explanation request after a CF match.
func HandleExplanationRequest(ctx context.Context, c *game.Client, msg *game.ClientMessage, ctr *app.Container) {
	if c.MatchID == "" {
		ctr.Hub.SendToUser(c.ID, &game.ServerMessage{
			Type: "error",
			Data: map[string]string{"message": "not in a match"},
		})
		return
	}

	if msg.QuestionIndex < 1 {
		return
	}

	session, ok := ctr.SessionMgr.GetSession(c.MatchID)
	if !ok {
		return
	}

	session.RLock()
	numProblems := len(session.CFProblems)
	session.RUnlock()

	if msg.QuestionIndex > numProblems {
		return
	}

	// Read state under lock
	session.RLock()
	player := session.GetPlayer(c.ID)
	lastVerdict := ""
	if player != nil {
		lastVerdict = player.LastVerdicts[msg.QuestionIndex]
	}
	mcp := session.CFProblems[msg.QuestionIndex-1]
	session.RUnlock()

	ctr.Hub.SendToUser(c.ID, &game.ServerMessage{
		Type: "explanation_loading",
		Data: map[string]interface{}{"questionIndex": msg.QuestionIndex},
	})

	go func() {
		problemDesc := fmt.Sprintf(
			"Codeforces problem: %s (Contest %d, Problem %s, Rating %d, Tags: %v)",
			mcp.CFName, mcp.CFContestID, mcp.CFProblemIndex, mcp.CFRating, []string(mcp.CFTags),
		)

		req := &ai.ExplainRequest{
			ProblemTitle:     mcp.CFName,
			ProblemStatement: problemDesc,
			Constraints:      fmt.Sprintf("CF rating: %d", mcp.CFRating),
			Tags:             []string(mcp.CFTags),
			Difficulty:       mcp.CFRating / 200,
			PlayerCode:       msg.Code,
			PlayerVerdict:    lastVerdict,
		}

		explanation, err := ctr.Explainer.Explain(ctx, req)
		if err != nil {
			log.Printf("[explain] ❌ generation failed: %v", err)
			ctr.Hub.SendToUser(c.ID, &game.ServerMessage{
				Type: "error",
				Data: map[string]string{"message": "explanation generation failed"},
			})
			return
		}

		ctr.Hub.SendToUser(c.ID, &game.ServerMessage{
			Type: "explanation_response",
			Data: map[string]interface{}{
				"questionIndex": msg.QuestionIndex,
				"explanation":   explanation,
			},
		})
	}()
}
