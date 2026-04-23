package game

import (
	"context"
	"fmt"
	"log"
	"sync"
	"time"

	"codemortem/internal/models"
	"codemortem/internal/rating"

	"github.com/jmoiron/sqlx"
)

// Session represents an active 1v1 match in memory.
type Session struct {
	Match     *models.Match
	Questions []*models.MatchQuestion
	Player1   *SessionPlayer
	Player2   *SessionPlayer

	Timer     *time.Timer
	StartedAt time.Time
	EndAt     time.Time
	Done      chan struct{}

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
	Solved   map[int]bool // questionIndex → solved
}

// SessionManager manages all active game sessions.
type SessionManager struct {
	db       *sqlx.DB
	hub      *Hub
	sessions map[string]*Session // matchID → session
	mu       sync.RWMutex
}

// NewSessionManager creates a new session manager.
func NewSessionManager(db *sqlx.DB, hub *Hub) *SessionManager {
	return &SessionManager{
		db:       db,
		hub:      hub,
		sessions: make(map[string]*Session),
	}
}

// CreateSession creates a new match session from matched players.
func (sm *SessionManager) CreateSession(ctx context.Context, matchID, p1ID, p1User string, p1Rating, p1RD, p1Vol float64, p2ID, p2User string, p2Rating, p2RD, p2Vol float64, questionSetID string) (*Session, error) {
	now := time.Now()
	duration := 30 * time.Minute
	endAt := now.Add(duration)

	// Create match in DB
	var match models.Match
	err := sm.db.QueryRowxContext(ctx, `
		INSERT INTO matches (player1_id, player2_id, question_set_id, status, started_at, duration_secs,
			player1_rating_before, player2_rating_before)
		VALUES ($1, $2, $3, 'in_progress', $4, $5, $6, $7)
		RETURNING *
	`, p1ID, p2ID, questionSetID, now, int(duration.Seconds()), p1Rating, p2Rating).StructScan(&match)
	if err != nil {
		return nil, fmt.Errorf("create match: %w", err)
	}

	// Load question set and create match_questions entries
	var qs models.QuestionSet
	err = sm.db.GetContext(ctx, &qs, "SELECT * FROM question_sets WHERE id = $1", questionSetID)
	if err != nil {
		return nil, fmt.Errorf("load question set: %w", err)
	}

	qIDs := []string{qs.Q1ID, qs.Q2ID, qs.Q3ID, qs.Q4ID, qs.Q5ID, qs.Q6ID, qs.Q7ID}
	matchQuestions := make([]*models.MatchQuestion, 7)

	for i, qID := range qIDs {
		var mq models.MatchQuestion
		err = sm.db.QueryRowxContext(ctx, `
			INSERT INTO match_questions (match_id, question_id, question_index, points_value, unlocked_at)
			VALUES ($1, $2, $3, $4, $5)
			RETURNING *
		`, match.ID, qID, i+1, (i+1)*100, now).StructScan(&mq)
		if err != nil {
			return nil, fmt.Errorf("create match question %d: %w", i+1, err)
		}
		matchQuestions[i] = &mq
	}

	// Increment usage counter
	sm.db.ExecContext(ctx, "UPDATE question_sets SET times_used = times_used + 1 WHERE id = $1", questionSetID)

	session := &Session{
		Match:     &match,
		Questions: matchQuestions,
		Player1: &SessionPlayer{
			UserID:   p1ID,
			Username: p1User,
			Rating:   p1Rating,
			RD:       p1RD,
			Vol:      p1Vol,
			Score:    0,
			Solved:   make(map[int]bool),
		},
		Player2: &SessionPlayer{
			UserID:   p2ID,
			Username: p2User,
			Rating:   p2Rating,
			RD:       p2RD,
			Vol:      p2Vol,
			Score:    0,
			Solved:   make(map[int]bool),
		},
		StartedAt: now,
		EndAt:     endAt,
		Done:      make(chan struct{}),
	}

	// Start timer
	session.Timer = time.AfterFunc(duration, func() {
		sm.EndMatch(context.Background(), matchID, "timeout")
	})

	sm.mu.Lock()
	sm.sessions[matchID] = session
	sm.mu.Unlock()

	log.Printf("[session] created match %s: %s vs %s", matchID, p1User, p2User)

	return session, nil
}

// GetSession returns an active session by match ID.
func (sm *SessionManager) GetSession(matchID string) (*Session, bool) {
	sm.mu.RLock()
	defer sm.mu.RUnlock()
	s, ok := sm.sessions[matchID]
	return s, ok
}

// RecordSolve records that a player solved a question.
// Returns the points awarded (0 if someone already solved it).
func (sm *SessionManager) RecordSolve(ctx context.Context, matchID, userID string, questionIndex int) (int, error) {
	session, ok := sm.GetSession(matchID)
	if !ok {
		return 0, fmt.Errorf("session not found: %s", matchID)
	}

	session.mu.Lock()
	defer session.mu.Unlock()

	if questionIndex < 1 || questionIndex > 7 {
		return 0, fmt.Errorf("invalid question index: %d", questionIndex)
	}

	mq := session.Questions[questionIndex-1]

	// Already solved by someone?
	if mq.SolvedBy != nil {
		return 0, nil
	}

	// Record the solve
	now := time.Now()
	mq.SolvedBy = &userID
	mq.SolvedAt = &now
	points := mq.PointsValue

	// Update DB
	sm.db.ExecContext(ctx, `
		UPDATE match_questions SET solved_by = $1, solved_at = $2 WHERE id = $3
	`, userID, now, mq.ID)

	// Update player score
	player := session.GetPlayer(userID)
	if player != nil {
		player.Score += points
		player.Solved[questionIndex] = true
	}

	// Update match scores in DB
	sm.db.ExecContext(ctx, `
		UPDATE matches SET player1_score = $1, player2_score = $2 WHERE id = $3
	`, session.Player1.Score, session.Player2.Score, matchID)

	// Notify opponent
	sm.hub.SendToOpponent(matchID, userID, &ServerMessage{
		Type: "opponent_solved",
		Data: map[string]interface{}{
			"questionIndex": questionIndex,
			"opponentScore": player.Score,
		},
	})

	log.Printf("[session] %s solved Q%d in match %s (+%d pts)", player.Username, questionIndex, matchID, points)

	// Check if all questions solved by both players
	allSolved := true
	for _, q := range session.Questions {
		if q.SolvedBy == nil {
			allSolved = false
			break
		}
	}
	if allSolved {
		go sm.EndMatch(ctx, matchID, "all_solved")
	}

	return points, nil
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

	// Determine winner
	var status models.MatchStatus
	var winnerID *string
	var p1Score float64

	if p1.Score > p2.Score {
		status = models.MatchStatusCompleted
		winnerID = &p1.UserID
		p1Score = 1.0
	} else if p2.Score > p1.Score {
		status = models.MatchStatusCompleted
		winnerID = &p2.UserID
		p1Score = 0.0
	} else {
		status = models.MatchStatusDraw
		p1Score = 0.5
	}

	// Calculate rating changes
	rp1 := &rating.Player{Rating: p1.Rating, Deviation: p1.RD, Volatility: p1.Vol}
	rp2 := &rating.Player{Rating: p2.Rating, Deviation: p2.RD, Volatility: p2.Vol}
	delta1, delta2 := rating.CalculateMatch(rp1, rp2, p1Score)

	// Update match in DB
	sm.db.ExecContext(ctx, `
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
		matchID)

	// Update user ratings
	sm.db.ExecContext(ctx, `
		UPDATE users SET rating = $1, rating_deviation = $2, volatility = $3,
			matches_played = matches_played + 1,
			matches_won = matches_won + $4,
			matches_drawn = matches_drawn + $5,
			total_problems_solved = total_problems_solved + $6
		WHERE id = $7
	`, delta1.NewRating, delta1.NewDeviation, delta1.NewVolatility,
		boolToInt(p1Score == 1.0), boolToInt(p1Score == 0.5), len(p1.Solved), p1.UserID)

	sm.db.ExecContext(ctx, `
		UPDATE users SET rating = $1, rating_deviation = $2, volatility = $3,
			matches_played = matches_played + 1,
			matches_won = $4,
			matches_drawn = $5,
			total_problems_solved = total_problems_solved + $6
		WHERE id = $7
	`, delta2.NewRating, delta2.NewDeviation, delta2.NewVolatility,
		boolToInt(p1Score == 0.0), boolToInt(p1Score == 0.5), len(p2.Solved), p2.UserID)

	// Insert rating history
	sm.db.ExecContext(ctx, `
		INSERT INTO rating_history (user_id, match_id, rating_before, rating_after, rd_before, rd_after, delta)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`, p1.UserID, matchID, p1.Rating, delta1.NewRating, p1.RD, delta1.NewDeviation, delta1.Delta)

	sm.db.ExecContext(ctx, `
		INSERT INTO rating_history (user_id, match_id, rating_before, rating_after, rd_before, rd_after, delta)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`, p2.UserID, matchID, p2.Rating, delta2.NewRating, p2.RD, delta2.NewDeviation, delta2.Delta)

	// Broadcast match end
	resultData := map[string]interface{}{
		"matchId":   matchID,
		"reason":    reason,
		"winnerId":  winnerID,
		"player1":   map[string]interface{}{"userId": p1.UserID, "username": p1.Username, "score": p1.Score, "ratingBefore": p1.Rating, "ratingAfter": delta1.NewRating, "delta": delta1.Delta},
		"player2":   map[string]interface{}{"userId": p2.UserID, "username": p2.Username, "score": p2.Score, "ratingBefore": p2.Rating, "ratingAfter": delta2.NewRating, "delta": delta2.Delta},
	}

	sm.hub.BroadcastToRoom(matchID, &ServerMessage{
		Type: "match_end",
		Data: resultData,
	})

	// Clean up session
	sm.mu.Lock()
	delete(sm.sessions, matchID)
	sm.mu.Unlock()

	log.Printf("[session] match %s ended (%s): %s(%d) vs %s(%d) | winner: %v",
		matchID, reason, p1.Username, p1.Score, p2.Username, p2.Score, winnerID)
}

// GetPlayer returns the SessionPlayer for a given user ID.
func (s *Session) GetPlayer(userID string) *SessionPlayer {
	if s.Player1.UserID == userID {
		return s.Player1
	}
	if s.Player2.UserID == userID {
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

func boolToInt(b bool) int {
	if b {
		return 1
	}
	return 0
}

// GetMatchState returns the full match state for a client joining the arena.
func (sm *SessionManager) GetMatchState(matchID, userID string) (map[string]interface{}, error) {
	session, ok := sm.GetSession(matchID)
	if !ok {
		return nil, fmt.Errorf("session not found: %s", matchID)
	}

	session.mu.RLock()
	defer session.mu.RUnlock()

	// Determine opponent
	opponent := session.Player2
	if session.Player2.UserID == userID {
		opponent = session.Player1
	}

	// Build questions payload with details
	ctx := context.Background()
	questions := make([]map[string]interface{}, len(session.Questions))
	for i, mq := range session.Questions {
		var q struct {
			Title        string `db:"title"`
			Statement    string `db:"statement"`
			InputFormat  string `db:"input_format"`
			OutputFormat string `db:"output_format"`
			Constraints  string `db:"constraints"`
			Examples     []byte `db:"examples"`
			Difficulty   int    `db:"difficulty"`
			Tags         []byte `db:"tags"`
		}
		sm.db.GetContext(ctx, &q, "SELECT title, statement, input_format, output_format, constraints, examples, difficulty, tags FROM questions WHERE id = $1", mq.QuestionID)

		solvedBy := ""
		if mq.SolvedBy != nil {
			if *mq.SolvedBy == userID {
				solvedBy = "you"
			} else {
				solvedBy = "opponent"
			}
		}

		questions[i] = map[string]interface{}{
			"questionIndex": mq.QuestionIndex,
			"pointsValue":   mq.PointsValue,
			"solvedBy":      solvedBy,
			"question": map[string]interface{}{
				"id":           mq.QuestionID,
				"title":        q.Title,
				"statement":    q.Statement,
				"inputFormat":  q.InputFormat,
				"outputFormat": q.OutputFormat,
				"constraints":  q.Constraints,
				"examples":     string(q.Examples),
				"difficulty":   q.Difficulty,
				"tags":         string(q.Tags),
			},
		}
	}

	remaining := int(session.RemainingTime().Seconds())

	me := session.GetPlayer(userID)
	myScore := 0
	oppScore := 0
	if me != nil {
		myScore = me.Score
		oppScore = opponent.Score
	}

	return map[string]interface{}{
		"matchId":          matchID,
		"questions":        questions,
		"opponent":         opponent.Username,
		"opponentRating":   opponent.Rating,
		"remainingSeconds": remaining,
		"myScore":          myScore,
		"opponentScore":    oppScore,
	}, nil
}

