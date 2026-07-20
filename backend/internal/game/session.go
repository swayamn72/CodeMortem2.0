package game

import (
	"context"
	"fmt"
	"log"
	"sync"
	"time"

	"codemortem/internal/codeforces"
	"codemortem/internal/models"
	"codemortem/internal/rating"

	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
)

// Session represents an active match in memory.
type Session struct {
	Match      *models.Match
	CFProblems []*models.MatchCFProblem // ordered by problem_index (1-based)
	Player1    *SessionPlayer
	Player2    *SessionPlayer // nil for solo matches

	Timer     *time.Timer
	StartedAt time.Time
	EndAt     time.Time
	Done      chan struct{}
	IsCF      bool

	mu sync.RWMutex
}

// SessionPlayer holds per-player state during a match.
type SessionPlayer struct {
	UserID   string
	Username string
	Rating   float64
	RD       float64
	Vol      float64
	Score    int
	Solved   map[int]bool // problemIndex → solved
	CFHandle string
}

// SessionManager manages all active game sessions.
type SessionManager struct {
	db       *sqlx.DB
	hub      *Hub
	cfClient *codeforces.Client
	sessions map[string]*Session // matchID → session
	mu       sync.RWMutex
}

// NewSessionManager creates a new session manager.
func NewSessionManager(db *sqlx.DB, hub *Hub, cfClient *codeforces.Client) *SessionManager {
	return &SessionManager{
		db:       db,
		hub:      hub,
		cfClient: cfClient,
		sessions: make(map[string]*Session),
	}
}

// CreateCFSession creates a new CF match session (1v1 or solo).
// For solo: pass p2ID="" and p2User="".
func (sm *SessionManager) CreateCFSession(ctx context.Context,
	p1ID, p1User, p1CFHandle string, p1Rating, p1RD, p1Vol float64,
	p2ID, p2User, p2CFHandle string, p2Rating, p2RD, p2Vol float64,
	cfProblems []*codeforces.SelectedProblem,
) (*Session, error) {
	if len(cfProblems) == 0 {
		return nil, fmt.Errorf("no CF problems provided")
	}

	now := time.Now()
	duration := 30 * time.Minute
	endAt := now.Add(duration)

	var p2IDPtr *string
	var p2RatingPtr *float64
	mode := "solo_cf"
	if p2ID != "" {
		p2IDPtr = &p2ID
		p2RatingPtr = &p2Rating
		mode = "codeforces"
	}

	// Create match in DB (question_set_id = NULL for CF-native matches)
	var match models.Match
	err := sm.db.QueryRowxContext(ctx, `
		INSERT INTO matches (player1_id, player2_id, question_set_id, status, mode, started_at, duration_secs,
			player1_rating_before, player2_rating_before)
		VALUES ($1, $2, NULL, 'in_progress', $3, $4, $5, $6, $7)
		RETURNING *
	`, p1ID, p2IDPtr, mode, now, int(duration.Seconds()), p1Rating, p2RatingPtr).StructScan(&match)
	if err != nil {
		return nil, fmt.Errorf("create match: %w", err)
	}

	// Insert match_cf_problems rows (no upfront statement fetching needed)
	matchProblems := make([]*models.MatchCFProblem, len(cfProblems))
	for i, cfp := range cfProblems {
		var mcp models.MatchCFProblem
		err = sm.db.QueryRowxContext(ctx, `
			INSERT INTO match_cf_problems
				(match_id, problem_index, cf_contest_id, cf_problem_index, cf_name, cf_rating, cf_url, cf_tags, points_value)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
			RETURNING *
		`, match.ID, i+1, cfp.ContestID, cfp.Index, cfp.Name, cfp.Rating, cfp.URL,
			pq.Array(cfp.Tags), (i+1)*100).StructScan(&mcp)
		if err != nil {
			return nil, fmt.Errorf("insert cf problem %d: %w", i+1, err)
		}
		matchProblems[i] = &mcp
	}

	session := &Session{
		Match:      &match,
		CFProblems: matchProblems,
		Player1: &SessionPlayer{
			UserID:   p1ID,
			Username: p1User,
			Rating:   p1Rating,
			RD:       p1RD,
			Vol:      p1Vol,
			Score:    0,
			Solved:   make(map[int]bool),
			CFHandle: p1CFHandle,
		},
		IsCF:      true,
		StartedAt: now,
		EndAt:     endAt,
		Done:      make(chan struct{}),
	}

	if p2ID != "" {
		session.Player2 = &SessionPlayer{
			UserID:   p2ID,
			Username: p2User,
			Rating:   p2Rating,
			RD:       p2RD,
			Vol:      p2Vol,
			Score:    0,
			Solved:   make(map[int]bool),
			CFHandle: p2CFHandle,
		}
	}

	// Start match timer
	session.Timer = time.AfterFunc(duration, func() {
		sm.EndMatch(context.Background(), match.ID, "timeout")
	})

	sm.mu.Lock()
	sm.sessions[match.ID] = session
	sm.mu.Unlock()

	// Start CF submission poller
	go sm.startCFVerificationPoller(match.ID)

	if p2ID != "" {
		log.Printf("[session] ✓ CF match %s: %s(%s) vs %s(%s) | %d problems",
			match.ID, p1User, p1CFHandle, p2User, p2CFHandle, len(cfProblems))
	} else {
		log.Printf("[session] ✓ CF solo match %s: %s(%s) | %d problems",
			match.ID, p1User, p1CFHandle, len(cfProblems))
	}

	return session, nil
}

// GetSession returns an active session by match ID.
func (sm *SessionManager) GetSession(matchID string) (*Session, bool) {
	sm.mu.RLock()
	defer sm.mu.RUnlock()
	s, ok := sm.sessions[matchID]
	return s, ok
}

// RecordCFSolve records that a player solved a CF problem, updates scores + DB.
// Returns points awarded (0 if already solved by someone).
func (sm *SessionManager) RecordCFSolve(ctx context.Context, matchID, userID string, problemIndex int) (int, error) {
	session, ok := sm.GetSession(matchID)
	if !ok {
		return 0, fmt.Errorf("session not found: %s", matchID)
	}

	session.mu.Lock()
	defer session.mu.Unlock()

	if problemIndex < 1 || problemIndex > len(session.CFProblems) {
		return 0, fmt.Errorf("invalid problem index: %d", problemIndex)
	}

	mcp := session.CFProblems[problemIndex-1]
	if mcp.SolvedBy != nil {
		return 0, nil // already solved
	}

	now := time.Now()
	mcp.SolvedBy = &userID
	mcp.SolvedAt = &now
	points := mcp.PointsValue

	// Persist solve to DB
	if _, err := sm.db.ExecContext(ctx, `
		UPDATE match_cf_problems SET solved_by = $1, solved_at = $2 WHERE id = $3
	`, userID, now, mcp.ID); err != nil {
		log.Printf("[session] warning: failed to update match_cf_problems: %v", err)
	}

	// Update in-memory score
	player := session.getPlayerLocked(userID)
	if player != nil {
		player.Score += points
		player.Solved[problemIndex] = true
	}

	// Sync match scores to DB + notify opponent
	if session.Player2 != nil {
		if _, err := sm.db.ExecContext(ctx, `
			UPDATE matches SET player1_score = $1, player2_score = $2 WHERE id = $3
		`, session.Player1.Score, session.Player2.Score, matchID); err != nil {
			log.Printf("[session] warning: failed to update match scores: %v", err)
		}
		sm.hub.SendToOpponent(matchID, userID, &ServerMessage{
			Type: "opponent_solved",
			Data: map[string]interface{}{
				"questionIndex": problemIndex,
				"opponentScore": func() int {
					if player != nil {
						return player.Score
					}
					return 0
				}(),
			},
		})
	} else {
		if _, err := sm.db.ExecContext(ctx, `
			UPDATE matches SET player1_score = $1 WHERE id = $2
		`, session.Player1.Score, matchID); err != nil {
			log.Printf("[session] warning: failed to update solo match score: %v", err)
		}
	}

	if player != nil {
		log.Printf("[session] %s solved problem %d in match %s (+%d pts)", player.Username, problemIndex, matchID, points)
	}

	// End match if all problems solved
	allSolved := true
	for _, p := range session.CFProblems {
		if p.SolvedBy == nil {
			allSolved = false
			break
		}
	}
	if allSolved {
		go sm.EndMatch(ctx, matchID, "all_solved")
	}

	return points, nil
}

// RecordSolve aliases RecordCFSolve for backward compatibility.
func (sm *SessionManager) RecordSolve(ctx context.Context, matchID, userID string, questionIndex int) (int, error) {
	return sm.RecordCFSolve(ctx, matchID, userID, questionIndex)
}

// EndMatch ends a match and calculates rating changes.
func (sm *SessionManager) EndMatch(ctx context.Context, matchID, reason string) {
	session, ok := sm.GetSession(matchID)
	if !ok {
		return
	}

	session.mu.Lock()
	defer session.mu.Unlock()

	// Prevent double-ending
	select {
	case <-session.Done:
		return // already ended
	default:
		close(session.Done)
	}

	if session.Timer != nil {
		session.Timer.Stop()
	}

	now := time.Now()
	p1 := session.Player1
	p2 := session.Player2

	if p2 == nil {
		// Solo match
		if _, err := sm.db.ExecContext(ctx, `
			UPDATE matches SET status = 'completed', ended_at = $1, player1_score = $2 WHERE id = $3
		`, now, p1.Score, matchID); err != nil {
			log.Printf("[session] warning: failed to finalize solo match: %v", err)
		}
		if _, err := sm.db.ExecContext(ctx, `
			UPDATE users SET
				solo_matches_played = solo_matches_played + 1,
				solo_problems_solved = solo_problems_solved + $1
			WHERE id = $2
		`, len(p1.Solved), p1.UserID); err != nil {
			log.Printf("[session] warning: failed to update solo user stats: %v", err)
		}

		sm.hub.BroadcastToRoom(matchID, &ServerMessage{
			Type: "match_end",
			Data: map[string]interface{}{
				"matchId": matchID,
				"reason":  reason,
				"player1": map[string]interface{}{"userId": p1.UserID, "username": p1.Username, "score": p1.Score},
			},
		})

		sm.mu.Lock()
		delete(sm.sessions, matchID)
		sm.mu.Unlock()

		log.Printf("[session] solo match %s ended (%s): %s(%d)", matchID, reason, p1.Username, p1.Score)
		return
	}

	// 1v1 match — determine winner
	var status models.MatchStatus
	var winnerID *string
	var p1Score float64

	switch {
	case p1.Score > p2.Score:
		status = models.MatchStatusCompleted
		winnerID = &p1.UserID
		p1Score = 1.0
	case p2.Score > p1.Score:
		status = models.MatchStatusCompleted
		winnerID = &p2.UserID
		p1Score = 0.0
	default:
		status = models.MatchStatusDraw
		p1Score = 0.5
	}

	// Calculate Glicko-2 rating changes
	rp1 := &rating.Player{Rating: p1.Rating, Deviation: p1.RD, Volatility: p1.Vol}
	rp2 := &rating.Player{Rating: p2.Rating, Deviation: p2.RD, Volatility: p2.Vol}
	delta1, delta2 := rating.CalculateMatch(rp1, rp2, p1Score)

	// Update match record
	if _, err := sm.db.ExecContext(ctx, `
		UPDATE matches SET
			status = $1, ended_at = $2, winner_id = $3,
			player1_score = $4, player2_score = $5,
			player1_rating_after = $6, player1_delta = $7,
			player2_rating_after = $8, player2_delta = $9
		WHERE id = $10
	`, status, now, winnerID,
		p1.Score, p2.Score,
		delta1.NewRating, delta1.Delta,
		delta2.NewRating, delta2.Delta,
		matchID); err != nil {
		log.Printf("[session] ERROR: failed to update match result: %v", err)
	}

	// Update player ratings
	if _, err := sm.db.ExecContext(ctx, `
		UPDATE users SET rating = $1, rating_deviation = $2, volatility = $3,
			matches_played = matches_played + 1,
			matches_won = matches_won + $4,
			matches_drawn = matches_drawn + $5,
			total_problems_solved = total_problems_solved + $6
		WHERE id = $7
	`, delta1.NewRating, delta1.NewDeviation, delta1.NewVolatility,
		boolToInt(p1Score == 1.0), boolToInt(p1Score == 0.5), len(p1.Solved), p1.UserID); err != nil {
		log.Printf("[session] ERROR: failed to update p1 rating: %v", err)
	}

	if _, err := sm.db.ExecContext(ctx, `
		UPDATE users SET rating = $1, rating_deviation = $2, volatility = $3,
			matches_played = matches_played + 1,
			matches_won = matches_won + $4,
			matches_drawn = matches_drawn + $5,
			total_problems_solved = total_problems_solved + $6
		WHERE id = $7
	`, delta2.NewRating, delta2.NewDeviation, delta2.NewVolatility,
		boolToInt(p1Score == 0.0), boolToInt(p1Score == 0.5), len(p2.Solved), p2.UserID); err != nil {
		log.Printf("[session] ERROR: failed to update p2 rating: %v", err)
	}

	// Rating history
	for _, args := range [][]interface{}{
		{p1.UserID, matchID, p1.Rating, delta1.NewRating, p1.RD, delta1.NewDeviation, delta1.Delta},
		{p2.UserID, matchID, p2.Rating, delta2.NewRating, p2.RD, delta2.NewDeviation, delta2.Delta},
	} {
		if _, err := sm.db.ExecContext(ctx, `
			INSERT INTO rating_history (user_id, match_id, rating_before, rating_after, rd_before, rd_after, delta)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
		`, args...); err != nil {
			log.Printf("[session] warning: failed to insert rating history: %v", err)
		}
	}

	sm.hub.BroadcastToRoom(matchID, &ServerMessage{
		Type: "match_end",
		Data: map[string]interface{}{
			"matchId":  matchID,
			"reason":   reason,
			"winnerId": winnerID,
			"player1":  map[string]interface{}{"userId": p1.UserID, "username": p1.Username, "score": p1.Score, "ratingBefore": p1.Rating, "ratingAfter": delta1.NewRating, "delta": delta1.Delta},
			"player2":  map[string]interface{}{"userId": p2.UserID, "username": p2.Username, "score": p2.Score, "ratingBefore": p2.Rating, "ratingAfter": delta2.NewRating, "delta": delta2.Delta},
		},
	})

	sm.mu.Lock()
	delete(sm.sessions, matchID)
	sm.mu.Unlock()

	log.Printf("[session] match %s ended (%s): %s(%d) vs %s(%d) | winner: %v",
		matchID, reason, p1.Username, p1.Score, p2.Username, p2.Score, winnerID)
}

// GetMatchState returns the full match state for a client joining the arena.
// Problem statements are NOT included here — they are fetched lazily by the frontend.
func (sm *SessionManager) GetMatchState(matchID, userID string) (map[string]interface{}, error) {
	session, ok := sm.GetSession(matchID)
	if !ok {
		return nil, fmt.Errorf("session not found: %s", matchID)
	}

	session.mu.RLock()
	defer session.mu.RUnlock()

	var oppUsername *string
	var oppRating *float64
	var oppScore *int

	if session.Player2 != nil {
		opponent := session.Player2
		if session.Player2.UserID == userID {
			opponent = session.Player1
		}
		oppUsername = &opponent.Username
		oppRating = &opponent.Rating
		oppScore = &opponent.Score
	}

	// Build question list from in-memory CFProblems (zero DB queries needed!)
	questions := make([]map[string]interface{}, len(session.CFProblems))
	for i, mcp := range session.CFProblems {
		solvedBy := ""
		if mcp.SolvedBy != nil {
			if *mcp.SolvedBy == userID {
				solvedBy = "you"
			} else {
				solvedBy = "opponent"
			}
		}

		questions[i] = map[string]interface{}{
			"questionIndex": mcp.ProblemIndex,
			"pointsValue":   mcp.PointsValue,
			"solvedBy":      solvedBy,
			"question": map[string]interface{}{
				"id":          mcp.ID,
				"title":       mcp.CFName,
				"cfContestId": mcp.CFContestID,
				"cfIndex":     mcp.CFProblemIndex,
				"cfUrl":       mcp.CFURL,
				"cfRating":    mcp.CFRating,
				"tags":        []string(mcp.CFTags),
				"source":      "codeforces",
				// "statement" is intentionally omitted — fetched lazily via GET /api/v1/cf/statement/:contestId/:index
			},
		}
	}

	remaining := int(session.RemainingTime().Seconds())
	me := session.getPlayerLocked(userID)
	myScore := 0
	if me != nil {
		myScore = me.Score
	}

	state := map[string]interface{}{
		"matchId":          matchID,
		"questions":        questions,
		"remainingSeconds": remaining,
		"myScore":          myScore,
		"isSolo":           session.Player2 == nil,
		"isCF":             session.IsCF,
	}

	if oppUsername != nil {
		state["opponent"] = *oppUsername
		state["opponentRating"] = *oppRating
		state["opponentScore"] = *oppScore
	}

	return state, nil
}

// GetPlayer returns the SessionPlayer for a given user ID.
func (s *Session) GetPlayer(userID string) *SessionPlayer {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.getPlayerLocked(userID)
}

func (s *Session) getPlayerLocked(userID string) *SessionPlayer {
	if s.Player1 != nil && s.Player1.UserID == userID {
		return s.Player1
	}
	if s.Player2 != nil && s.Player2.UserID == userID {
		return s.Player2
	}
	return nil
}

// RemainingTime returns the remaining match duration.
func (s *Session) RemainingTime() time.Duration {
	remaining := s.EndAt.Sub(time.Now())
	if remaining < 0 {
		return 0
	}
	return remaining
}

// RLock / RUnlock for external callers that need to read session state safely.
func (s *Session) RLock()   { s.mu.RLock() }
func (s *Session) RUnlock() { s.mu.RUnlock() }

func boolToInt(b bool) int {
	if b {
		return 1
	}
	return 0
}

// startCFVerificationPoller polls Codeforces for accepted submissions during a match.
func (sm *SessionManager) startCFVerificationPoller(matchID string) {
	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()

	session, ok := sm.GetSession(matchID)
	if !ok {
		return
	}

	matchStartTimestamp := session.StartedAt.Unix()
	log.Printf("[cf-poller] started for match %s", matchID)

	for {
		select {
		case <-session.Done:
			log.Printf("[cf-poller] match %s ended, stopping poller", matchID)
			return
		case <-ticker.C:
			session, ok = sm.GetSession(matchID)
			if !ok {
				return
			}

			session.mu.RLock()
			players := []*SessionPlayer{session.Player1}
			if session.Player2 != nil {
				players = append(players, session.Player2)
			}
			problems := session.CFProblems
			session.mu.RUnlock()

			for _, player := range players {
				if player.CFHandle == "" {
					continue
				}

				for _, mcp := range problems {
					if mcp.SolvedBy != nil {
						continue // already solved
					}

					subID, err := sm.cfClient.CheckRecentSubmission(
						player.CFHandle,
						mcp.CFContestID,
						mcp.CFProblemIndex,
						matchStartTimestamp,
					)
					if err != nil {
						log.Printf("[cf-poller] error checking %s for problem %d: %v", player.CFHandle, mcp.ProblemIndex, err)
						continue
					}

					if subID > 0 {
						log.Printf("[cf-poller] %s solved problem %d (CF sub %d) in match %s",
							player.Username, mcp.ProblemIndex, subID, matchID)

						// Mark CF-verified in DB
						if _, err := sm.db.ExecContext(context.Background(), `
							UPDATE match_cf_problems SET cf_verified = true, cf_submission_id = $1 WHERE id = $2
						`, subID, mcp.ID); err != nil {
							log.Printf("[cf-poller] warning: failed to update cf_verified: %v", err)
						}

						// Record the solve
						points, err := sm.RecordCFSolve(context.Background(), matchID, player.UserID, mcp.ProblemIndex)
						if err != nil {
							log.Printf("[cf-poller] record solve error: %v", err)
							continue
						}

						// Notify the solver
						sm.hub.SendToUser(player.UserID, &ServerMessage{
							Type: "cf_solved",
							Data: map[string]interface{}{
								"questionIndex":   mcp.ProblemIndex,
								"solvedBy":        "you",
								"points":          points,
								"cfSubmissionId":  subID,
							},
						})

						// Opponent is already notified via opponent_solved event inside RecordCFSolve
					}
				}

				// Respect CF API rate limits
				time.Sleep(1 * time.Second)
			}
		}
	}
}
