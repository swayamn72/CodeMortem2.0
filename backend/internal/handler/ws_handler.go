package handler

import (
	"context"
	"log"
	"sync"
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
				Data: map[string]string{"message": "submitting too fast, please wait a moment"},
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

// ── Queue ────────────────────────────────────────────────────────────────────

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
			Data: map[string]string{"message": "link and verify your Codeforces handle before matchmaking (Settings → Link Codeforces)"},
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

	ctr.Hub.SendToUser(c.ID, &game.ServerMessage{Type: "queue_joined"})
	log.Printf("[queue] %s (%.0f) joined matchmaking", u.Username, u.Rating)

	go waitForMatch(ctx, c, matchCh, ctr, u)
}

// waitForMatch blocks until the matchmaker finds an opponent or the user leaves.
func waitForMatch(ctx context.Context, c *game.Client, matchCh <-chan *matchmaking.MatchResult, ctr *app.Container, u *models.User) {
	select {
	case result, ok := <-matchCh:
		if !ok {
			return
		}
		// Only Player 1 creates the session to avoid duplication
		if result.Player1.UserID == c.ID {
			go createMatchSession(ctx, c, result, ctr)
		}
	case <-time.After(3 * time.Minute):
		ctr.MMQueue.Leave(ctx, c.ID)
		ctr.Hub.SendToUser(c.ID, &game.ServerMessage{Type: "queue_timeout"})
		log.Printf("[queue] %s timed out", u.Username)
	}
}

// createMatchSession runs after a match is found (executed by Player 1's goroutine).
func createMatchSession(ctx context.Context, c *game.Client, result *matchmaking.MatchResult, ctr *app.Container) {
	ctx2 := context.Background()
	avgRating := int((result.Player1.Rating + result.Player2.Rating) / 2)

	u1, _ := ctr.UserRepo.GetByID(ctx2, result.Player1.UserID)
	u2, _ := ctr.UserRepo.GetByID(ctx2, result.Player2.UserID)
	if u1 == nil || u2 == nil {
		log.Println("[match] failed to load user data for session")
		return
	}

	// Immediately notify both players so they don't wait silently
	ctr.Hub.SendToUser(u1.ID, &game.ServerMessage{
		Type: "match_preparing",
		Data: map[string]interface{}{
			"opponent": map[string]interface{}{"username": u2.Username, "rating": u2.Rating},
		},
	})
	ctr.Hub.SendToUser(u2.ID, &game.ServerMessage{
		Type: "match_preparing",
		Data: map[string]interface{}{
			"opponent": map[string]interface{}{"username": u1.Username, "rating": u1.Rating},
		},
	})

	// Fetch both users' solved problems in parallel (so we can avoid assigning them)
	var solved1, solved2 map[codeforces.ProblemKey]bool
	var wg sync.WaitGroup
	wg.Add(2)
	go func() {
		defer wg.Done()
		if u1.CFHandle != nil {
			solved1, _ = ctr.CFClient.GetUserSolvedProblems(*u1.CFHandle)
		}
	}()
	go func() {
		defer wg.Done()
		if u2.CFHandle != nil {
			solved2, _ = ctr.CFClient.GetUserSolvedProblems(*u2.CFHandle)
		}
	}()
	wg.Wait()

	// Select CF problems appropriate for both players' rating
	cfProblems, err := ctr.CFClient.SelectProblemsForRating(avgRating, solved1, solved2)
	if err != nil {
		log.Printf("[match] ❌ CF problem selection failed: %v", err)
		sendErrorToBoth(ctr, result, "failed to select Codeforces problems for your rating range")
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
		cfProblems,
	)
	if err != nil {
		log.Printf("[match] ❌ session creation failed: %v", err)
		sendErrorToBoth(ctr, result, "match setup failed, please try again")
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

	log.Printf("[match] ✓ created: %s (%s vs %s)", matchID, u1.Username, u2.Username)
}

// ── Solo ─────────────────────────────────────────────────────────────────────

// handleStartSolo handles the "start_solo" WebSocket message.
func handleStartSolo(ctx context.Context, c *game.Client, msg *game.ClientMessage, ctr *app.Container) {
	u, err := ctr.UserRepo.GetByID(ctx, c.ID)
	if err != nil || u == nil {
		ctr.Hub.SendToUser(c.ID, &game.ServerMessage{
			Type: "error",
			Data: map[string]string{"message": "failed to get user info"},
		})
		return
	}

	if u.CFHandle == nil || !u.CFVerified {
		ctr.Hub.SendToUser(c.ID, &game.ServerMessage{
			Type: "error",
			Data: map[string]string{"message": "link and verify your Codeforces handle before starting solo practice"},
		})
		return
	}

	// Notify immediately so the user sees the "preparing" screen
	ctr.Hub.SendToUser(c.ID, &game.ServerMessage{
		Type: "match_preparing",
		Data: map[string]interface{}{"message": "Selecting problems from Codeforces..."},
	})

	go func() {
		ctx2 := context.Background()
		avgRating := int(u.Rating)

		// Fetch user's solved problems to avoid repeats
		var solved map[codeforces.ProblemKey]bool
		if u.CFHandle != nil {
			solved, _ = ctr.CFClient.GetUserSolvedProblems(*u.CFHandle)
		}

		// Parse config from message
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
		duration := msg.DurationSecs
		if duration == 0 {
			duration = 30 * 60
		}

		cfProblems, err := ctr.CFClient.SelectProblemsForRange(rMin, rMax, limit, solved)
		if err != nil {
			log.Printf("[solo] ❌ CF problem selection failed: %v", err)
			ctr.Hub.SendToUser(c.ID, &game.ServerMessage{
				Type: "error",
				Data: map[string]string{"message": "failed to find Codeforces problems — try adjusting your rating range"},
			})
			return
		}

		cfHandle := ""
		if u.CFHandle != nil {
			cfHandle = *u.CFHandle
		}

		session, err := ctr.SessionMgr.CreateCFSession(ctx2,
			u.ID, u.Username, cfHandle, u.Rating, u.RatingDeviation, u.Volatility,
			"", "", "", 0, 0, 0,
			cfProblems,
		)
		if err != nil {
			log.Printf("[solo] ❌ session creation failed: %v", err)
			ctr.Hub.SendToUser(c.ID, &game.ServerMessage{
				Type: "error",
				Data: map[string]string{"message": "failed to create solo session"},
			})
			return
		}

		// Record practice session metadata
		practiceSession := &models.PracticeSession{
			UserID:       u.ID,
			MatchID:      &session.Match.ID,
			DurationSecs: duration,
			RatingMin:    rMin,
			RatingMax:    rMax,
			NumProblems:  limit,
		}
		if err := ctr.UserRepo.CreatePracticeSession(ctx2, practiceSession); err != nil {
			log.Printf("[solo] warning: failed to record practice session: %v", err)
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

		log.Printf("[solo] ✓ session %s for %s (%d problems, %d-%d rating)", session.Match.ID, u.Username, limit, rMin, rMax)
	}()
}

// ── Match Arena ───────────────────────────────────────────────────────────────

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

// ── Helpers ───────────────────────────────────────────────────────────────────

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
