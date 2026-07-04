package handler

import (
	"context"
	"fmt"
	"log"

	"codemortem/internal/ai"
	"codemortem/internal/app"
	"codemortem/internal/game"
	"codemortem/internal/models"
)

// HandleHintRequest processes a hint request during a match.
func HandleHintRequest(ctx context.Context, c *game.Client, msg *game.ClientMessage, ctr *app.Container) {
	if c.MatchID == "" {
		ctr.Hub.SendToUser(c.ID, &game.ServerMessage{
			Type: "error",
			Data: map[string]string{"message": "not in a match"},
		})
		return
	}

	if msg.QuestionIndex < 1 || msg.QuestionIndex > models.MatchQuestionCount {
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

	mq := session.Questions[msg.QuestionIndex-1]

	qDetail, err := ctr.QRepo.GetByID(ctx, mq.QuestionID)
	if err != nil {
		ctr.Hub.SendToUser(c.ID, &game.ServerMessage{
			Type: "error",
			Data: map[string]string{"message": "failed to load question details"},
		})
		return
	}

	isSolo := session.Player2 == nil
	cost := ai.HintCost(ai.HintLevel(msg.HintLevel), isSolo)

	ctr.Hub.SendToUser(c.ID, &game.ServerMessage{
		Type: "hint_loading",
		Data: map[string]interface{}{
			"questionIndex": msg.QuestionIndex,
			"hintLevel":     msg.HintLevel,
		},
	})

	go func() {
		hintReq := &ai.HintRequest{
			ProblemTitle:     qDetail.Title,
			ProblemStatement: qDetail.Statement,
			Constraints:      qDetail.Constraints,
			Tags:             qDetail.Tags,
			Difficulty:       qDetail.Difficulty,
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

		// Deduct points and track hint usage (needs write access to player state)
		// Note: this accesses player directly; the player pointer is stable for the session's lifetime.
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

// HandleExplanationRequest processes a solution explanation request.
func HandleExplanationRequest(ctx context.Context, c *game.Client, msg *game.ClientMessage, ctr *app.Container) {
	if c.MatchID == "" {
		ctr.Hub.SendToUser(c.ID, &game.ServerMessage{
			Type: "error",
			Data: map[string]string{"message": "not in a match"},
		})
		return
	}

	if msg.QuestionIndex < 1 || msg.QuestionIndex > models.MatchQuestionCount {
		return
	}

	session, ok := ctr.SessionMgr.GetSession(c.MatchID)
	if !ok {
		return
	}

	mq := session.Questions[msg.QuestionIndex-1]

	// Read last verdict under lock
	session.RLock()
	player := session.GetPlayer(c.ID)
	lastVerdict := ""
	if player != nil {
		lastVerdict = player.LastVerdicts[msg.QuestionIndex]
	}
	session.RUnlock()

	qDetail, err := ctr.QRepo.GetByID(ctx, mq.QuestionID)
	if err != nil {
		ctr.Hub.SendToUser(c.ID, &game.ServerMessage{
			Type: "error",
			Data: map[string]string{"message": "failed to load question"},
		})
		return
	}

	ctr.Hub.SendToUser(c.ID, &game.ServerMessage{
		Type: "explanation_loading",
		Data: map[string]interface{}{"questionIndex": msg.QuestionIndex},
	})

	go func() {
		req := &ai.ExplainRequest{
			ProblemTitle:     qDetail.Title,
			ProblemStatement: qDetail.Statement,
			Constraints:      qDetail.Constraints,
			Tags:             qDetail.Tags,
			Difficulty:       qDetail.Difficulty,
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
