package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"codemortem/internal/app"
	"codemortem/internal/codeforces"
	"codemortem/internal/game"
	"codemortem/internal/matchmaking"
	"codemortem/internal/models"
)

// HandleGameMessage routes WebSocket messages to the appropriate handler.
func HandleGameMessage(c *game.Client, msg *game.ClientMessage, ctr *app.Container) {
	ctx := context.Background()

	switch msg.Type {
	case "join_queue":
		handleJoinQueue(ctx, c, ctr)

	case "start_solo":
		handleStartSolo(ctx, c, msg, ctr)

	case "leave_queue":
		ctr.MMQueue.Leave(ctx, c.ID)
		ctr.MMQueue.Unsubscribe(c.ID)
		ctr.Hub.SendToUser(c.ID, &game.ServerMessage{Type: "queue_left"})

	case "join_match":
		handleJoinMatch(ctx, c, msg, ctr)

	case "submit_code":
		if c.MatchID == "" {
			ctr.Hub.SendToUser(c.ID, &game.ServerMessage{
				Type: "error",
				Data: map[string]string{"message": "not in a match"},
			})
			return
		}
		if !ctr.SubmissionLimiter.IsAllowed(c.ID) {
			ctr.Hub.SendToUser(c.ID, &game.ServerMessage{
				Type: "error",
				Data: map[string]string{"message": "you are submitting too fast, please wait a moment"},
			})
			return
		}
		HandleSubmission(ctx, c, msg, ctr)

	case "run_code":
		if !ctr.SubmissionLimiter.IsAllowed(c.ID) {
			ctr.Hub.SendToUser(c.ID, &game.ServerMessage{
				Type: "error",
				Data: map[string]string{"message": "running code too frequently, please wait"},
			})
			return
		}
		HandleRunCode(ctx, c, msg, ctr)

	case "heartbeat":
		ctr.Hub.SendToUser(c.ID, &game.ServerMessage{Type: "heartbeat_ack"})

	case "request_hint":
		HandleHintRequest(ctx, c, msg, ctr)

	case "request_explanation":
		HandleExplanationRequest(ctx, c, msg, ctr)
	}
}

// handleJoinQueue handles the "join_queue" WebSocket message.
func handleJoinQueue(ctx context.Context, c *game.Client, ctr *app.Container) {
	u, err := ctr.UserRepo.GetByID(ctx, c.ID)
	if err != nil {
		ctr.Hub.SendToUser(c.ID, &game.ServerMessage{
			Type: "error",
			Data: map[string]string{"message": "failed to get user info"},
		})
		return
	}

	if u.CFHandle == nil || !u.CFVerified {
		ctr.Hub.SendToUser(c.ID, &game.ServerMessage{
			Type: "error",
			Data: map[string]string{"message": "You must link and verify your Codeforces handle before entering matchmaking. Go to Settings → Link Codeforces."},
		})
		return
	}

	matchCh := ctr.MMQueue.Subscribe(c.ID)

	err = ctr.MMQueue.Join(ctx, &matchmaking.QueueEntry{
		UserID:   c.ID,
		Username: c.Username,
		Rating:   u.Rating,
		JoinedAt: time.Now(),
	})
	if err != nil {
		ctr.Hub.SendToUser(c.ID, &game.ServerMessage{
			Type: "error",
			Data: map[string]string{"message": "failed to join queue"},
		})
		return
	}

	ctr.Hub.SendToUser(c.ID, &game.ServerMessage{
		Type: "queue_joined",
		Data: map[string]interface{}{"rating": u.Rating},
	})

	go waitForMatch(ctx, c, matchCh, ctr)
}

// waitForMatch waits for a match result or timeout.
func waitForMatch(ctx context.Context, c *game.Client, matchCh chan *matchmaking.MatchResult, ctr *app.Container) {
	select {
	case result, ok := <-matchCh:
		if !ok || result == nil {
			return
		}

		if result.Player1.UserID == c.ID {
			go createMatchSession(ctx, c, result, ctr)
		}

	case <-time.After(3 * time.Minute):
		ctr.MMQueue.Leave(ctx, c.ID)
		ctr.MMQueue.Unsubscribe(c.ID)
		ctr.Hub.SendToUser(c.ID, &game.ServerMessage{
			Type: "queue_timeout",
			Data: map[string]string{"message": "no opponents found, please try again"},
		})
	}
}

// createMatchSession creates a CF game session after a match is found (Player 1 only).
func createMatchSession(ctx context.Context, c *game.Client, result *matchmaking.MatchResult, ctr *app.Container) {
	ctx2 := context.Background()
	avgRating := int((result.Player1.Rating + result.Player2.Rating) / 2)

	u1, _ := ctr.UserRepo.GetByID(ctx2, result.Player1.UserID)
	u2, _ := ctr.UserRepo.GetByID(ctx2, result.Player2.UserID)
	if u1 == nil || u2 == nil {
		log.Println("[match] failed to load user data for session")
		return
	}

	var solved1, solved2 map[codeforces.ProblemKey]bool
	if u1.CFHandle != nil {
		solved1, _ = ctr.CFClient.GetUserSolvedProblems(*u1.CFHandle)
	}
	if u2.CFHandle != nil {
		solved2, _ = ctr.CFClient.GetUserSolvedProblems(*u2.CFHandle)
	}

	cfProblems, err := ctr.CFClient.SelectProblemsForRating(avgRating, solved1, solved2)
	if err != nil {
		log.Printf("[match] ❌ CF problem selection failed: %v", err)
		sendErrorToBoth(ctr, result, "failed to select Codeforces problems")
		return
	}

	questionIDs, err := upsertCFQuestions(ctx2, ctr, cfProblems, result, "match")
	if err != nil {
		return
	}

	cfHandle1 := ""
	if u1.CFHandle != nil {
		cfHandle1 = *u1.CFHandle
	}
	cfHandle2 := ""
	if u2.CFHandle != nil {
		cfHandle2 = *u2.CFHandle
	}

	session, err := ctr.SessionMgr.CreateCFSession(ctx2,
		u1.ID, u1.Username, cfHandle1, u1.Rating, u1.RatingDeviation, u1.Volatility,
		u2.ID, u2.Username, cfHandle2, u2.Rating, u2.RatingDeviation, u2.Volatility,
		questionIDs, cfProblems,
	)
	if err != nil {
		log.Printf("[match] ❌ CF session creation failed: %v", err)
		return
	}

	matchID := session.Match.ID

	ctr.Hub.SendToUser(u1.ID, &game.ServerMessage{
		Type: "match_found",
		Data: map[string]interface{}{
			"matchId":   matchID,
			"opponent":  map[string]interface{}{"username": u2.Username, "rating": u2.Rating},
			"countdown": 10,
			"isCF":      true,
		},
	})
	ctr.Hub.SendToUser(u2.ID, &game.ServerMessage{
		Type: "match_found",
		Data: map[string]interface{}{
			"matchId":   matchID,
			"opponent":  map[string]interface{}{"username": u1.Username, "rating": u1.Rating},
			"countdown": 10,
			"isCF":      true,
		},
	})

	log.Printf("[match] ✓ CF session created: %s (%s vs %s)", matchID, u1.Username, u2.Username)
}

// handleStartSolo handles the "start_solo" WebSocket message.
func handleStartSolo(ctx context.Context, c *game.Client, msg *game.ClientMessage, ctr *app.Container) {
	u, err := ctr.UserRepo.GetByID(ctx, c.ID)
	if err != nil {
		ctr.Hub.SendToUser(c.ID, &game.ServerMessage{
			Type: "error",
			Data: map[string]string{"message": "failed to get user info"},
		})
		return
	}

	if u.CFHandle == nil || !u.CFVerified {
		ctr.Hub.SendToUser(c.ID, &game.ServerMessage{
			Type: "error",
			Data: map[string]string{"message": "You must link and verify your Codeforces handle before playing. Go to Settings → Link Codeforces."},
		})
		return
	}

	go func() {
		ctx2 := context.Background()
		avgRating := int(u.Rating)

		var solved1 map[codeforces.ProblemKey]bool
		if u.CFHandle != nil {
			solved1, _ = ctr.CFClient.GetUserSolvedProblems(*u.CFHandle)
		}

		duration := msg.DurationSecs
		if duration == 0 {
			duration = 30 * 60
		}
		rMin := msg.RatingMin
		if rMin == 0 {
			rMin = avgRating - 200
		}
		rMax := msg.RatingMax
		if rMax == 0 {
			rMax = avgRating + 200
		}
		limit := msg.NumProblems
		if limit == 0 {
			limit = 5
		}

		cfProblems, err := ctr.CFClient.SelectProblemsForRange(rMin, rMax, limit, solved1)
		if err != nil {
			log.Printf("[solo] ❌ CF problem selection failed: %v", err)
			ctr.Hub.SendToUser(c.ID, &game.ServerMessage{
				Type: "error",
				Data: map[string]string{"message": "failed to select Codeforces problems"},
			})
			return
		}

		questionIDs := make([]string, len(cfProblems))
		for i, cfp := range cfProblems {
			stmt, inFmt, outFmt, constr, examples, fetchErr := ctr.CFClient.FetchProblemStatement(cfp.ContestID, cfp.Index)
			if fetchErr != nil {
				log.Printf("[solo] warning: could not fetch statement for CF %d%s: %v", cfp.ContestID, cfp.Index, fetchErr)
				stmt = "Problem statement could not be loaded. Please view on Codeforces."
				inFmt = "See Codeforces"
				outFmt = "See Codeforces"
			}

			examplesJSON, _ := json.Marshal(examples)

			q, err := ctr.QRepo.UpsertCFQuestion(ctx2,
				cfp.ContestID, cfp.Index, cfp.Name,
				stmt, inFmt, outFmt, constr,
				examplesJSON, cfp.Rating, cfp.Tags, cfp.URL,
			)
			if err != nil {
				log.Printf("[solo] ❌ failed to upsert CF question: %v", err)
				ctr.Hub.SendToUser(c.ID, &game.ServerMessage{
					Type: "error",
					Data: map[string]string{"message": "failed to prepare solo questions"},
				})
				return
			}
			questionIDs[i] = q.ID
			time.Sleep(500 * time.Millisecond)
		}

		cfHandle := ""
		if u.CFHandle != nil {
			cfHandle = *u.CFHandle
		}

		session, err := ctr.SessionMgr.CreateCFSession(ctx2,
			u.ID, u.Username, cfHandle, u.Rating, u.RatingDeviation, u.Volatility,
			"", "", "", 0, 0, 0,
			questionIDs, cfProblems,
		)
		if err != nil {
			ctr.Hub.SendToUser(c.ID, &game.ServerMessage{
				Type: "error",
				Data: map[string]string{"message": "failed to create solo session"},
			})
			return
		}

		practiceSession := &models.PracticeSession{
			UserID:       u.ID,
			MatchID:      &session.Match.ID,
			DurationSecs: duration,
			RatingMin:    rMin,
			RatingMax:    rMax,
			NumProblems:  limit,
		}
		if err := ctr.UserRepo.CreatePracticeSession(ctx2, practiceSession); err != nil {
			log.Printf("[solo] warning: failed to create practice session record: %v", err)
		}

		ctr.Hub.SendToUser(c.ID, &game.ServerMessage{
			Type: "match_found",
			Data: map[string]interface{}{
				"matchId":   session.Match.ID,
				"isSolo":    true,
				"isCF":      true,
				"countdown": 3,
			},
		})
	}()
}

// handleJoinMatch handles the "join_match" WebSocket message.
func handleJoinMatch(ctx context.Context, c *game.Client, msg *game.ClientMessage, ctr *app.Container) {
	if msg.MatchID == "" {
		ctr.Hub.SendToUser(c.ID, &game.ServerMessage{
			Type: "error",
			Data: map[string]string{"message": "missing matchId"},
		})
		return
	}

	ctr.Hub.JoinRoom(msg.MatchID, c)

	state, err := ctr.SessionMgr.GetMatchState(msg.MatchID, c.ID)
	if err != nil {
		ctr.Hub.SendToUser(c.ID, &game.ServerMessage{
			Type: "error",
			Data: map[string]string{"message": "match not found or already ended"},
		})
		return
	}

	ctr.Hub.SendToUser(c.ID, &game.ServerMessage{
		Type: "match_state",
		Data: state,
	})
}

// ── Helpers ─────────────────────────────────────────────────────────────────────

// sendErrorToBoth sends an error message to both players in a match result.
func sendErrorToBoth(ctr *app.Container, result *matchmaking.MatchResult, message string) {
	ctr.Hub.SendToUser(result.Player1.UserID, &game.ServerMessage{
		Type: "error",
		Data: map[string]string{"message": message},
	})
	ctr.Hub.SendToUser(result.Player2.UserID, &game.ServerMessage{
		Type: "error",
		Data: map[string]string{"message": message},
	})
}

// upsertCFQuestions upserts CF questions into the DB, returning their IDs.
func upsertCFQuestions(ctx context.Context, ctr *app.Container, cfProblems []*codeforces.SelectedProblem, result *matchmaking.MatchResult, logPrefix string) ([]string, error) {
	questionIDs := make([]string, len(cfProblems))
	for i, cfp := range cfProblems {
		stmt, inFmt, outFmt, constr, examples, fetchErr := ctr.CFClient.FetchProblemStatement(cfp.ContestID, cfp.Index)
		if fetchErr != nil {
			log.Printf("[%s] warning: could not fetch statement for CF %d%s: %v", logPrefix, cfp.ContestID, cfp.Index, fetchErr)
			stmt = "Problem statement could not be loaded. Please view on Codeforces."
			inFmt = "See Codeforces"
			outFmt = "See Codeforces"
		}

		examplesJSON, _ := json.Marshal(examples)

		q, err := ctr.QRepo.UpsertCFQuestion(ctx,
			cfp.ContestID, cfp.Index, cfp.Name,
			stmt, inFmt, outFmt, constr,
			examplesJSON, cfp.Rating, cfp.Tags, cfp.URL,
		)
		if err != nil {
			log.Printf("[%s] ❌ failed to upsert CF question %d%s: %v", logPrefix, cfp.ContestID, cfp.Index, err)
			if result != nil {
				sendErrorToBoth(ctr, result, "failed to prepare match questions")
			}
			return nil, fmt.Errorf("upsert CF question: %w", err)
		}
		questionIDs[i] = q.ID
		time.Sleep(500 * time.Millisecond)
	}
	return questionIDs, nil
}
