package game

import (
	"context"
	"encoding/json"
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

	// Codeforces mode
	IsCF       bool
	CFProblems map[int]*codeforces.SelectedProblem // questionIndex → CF problem info

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
	CFHandle string       // Codeforces handle
	HintsUsed          map[int]int    // questionIndex → max hint level used
	HintTexts          map[int][]string // questionIndex → hint texts received
	SubmissionAttempts map[int]int    // questionIndex → number of submissions
	LastVerdicts       map[int]string // questionIndex → last verdict
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
			HintsUsed:          make(map[int]int),
			HintTexts:          make(map[int][]string),
			SubmissionAttempts: make(map[int]int),
			LastVerdicts:       make(map[int]string),
		},
		Player2: &SessionPlayer{
			UserID:   p2ID,
			Username: p2User,
			Rating:   p2Rating,
			RD:       p2RD,
			Vol:      p2Vol,
			Score:    0,
			Solved:   make(map[int]bool),
			HintsUsed:          make(map[int]int),
			HintTexts:          make(map[int][]string),
			SubmissionAttempts: make(map[int]int),
			LastVerdicts:       make(map[int]string),
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

// CreateSoloSession creates a new solo match session.
func (sm *SessionManager) CreateSoloSession(ctx context.Context, p1ID, p1User string, p1Rating, p1RD, p1Vol float64, questionSetID string) (*Session, error) {
	now := time.Now()
	duration := 30 * time.Minute
	endAt := now.Add(duration)

	// Create match in DB
	var match models.Match
	err := sm.db.QueryRowxContext(ctx, `
		INSERT INTO matches (player1_id, player2_id, question_set_id, status, mode, started_at, duration_secs,
			player1_rating_before)
		VALUES ($1, NULL, $2, 'in_progress', 'solo', $3, $4, $5)
		RETURNING *
	`, p1ID, questionSetID, now, int(duration.Seconds()), p1Rating).StructScan(&match)
	if err != nil {
		return nil, fmt.Errorf("create solo match: %w", err)
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
			HintsUsed:          make(map[int]int),
			HintTexts:          make(map[int][]string),
			SubmissionAttempts: make(map[int]int),
			LastVerdicts:       make(map[int]string),
		},
		Player2:   nil, // No opponent
		StartedAt: now,
		EndAt:     endAt,
		Done:      make(chan struct{}),
	}

	// Start timer
	session.Timer = time.AfterFunc(duration, func() {
		sm.EndMatch(context.Background(), match.ID, "timeout")
	})

	sm.mu.Lock()
	sm.sessions[match.ID] = session
	sm.mu.Unlock()

	log.Printf("[session] created solo match %s for %s", match.ID, p1User)

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

	if questionIndex < 1 || questionIndex > len(session.Questions) {
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
	if session.Player2 != nil {
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
	} else {
		sm.db.ExecContext(ctx, `
			UPDATE matches SET player1_score = $1 WHERE id = $2
		`, session.Player1.Score, matchID)
	}

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

	if p2 == nil {
		// Solo match logic
		sm.db.ExecContext(ctx, `
			UPDATE matches SET 
				status = 'completed', ended_at = $1, player1_score = $2
			WHERE id = $3
		`, now, p1.Score, matchID)

		sm.db.ExecContext(ctx, `
			UPDATE users SET 
				solo_matches_played = solo_matches_played + 1,
				solo_problems_solved = solo_problems_solved + $1
			WHERE id = $2
		`, len(p1.Solved), p1.UserID)

		resultData := map[string]interface{}{
			"matchId": matchID,
			"reason":  reason,
			"player1": map[string]interface{}{"userId": p1.UserID, "username": p1.Username, "score": p1.Score},
		}

		sm.hub.BroadcastToRoom(matchID, &ServerMessage{
			Type: "match_end",
			Data: resultData,
		})

		sm.mu.Lock()
		delete(sm.sessions, matchID)
		sm.mu.Unlock()

		log.Printf("[session] solo match %s ended (%s): %s(%d)", matchID, reason, p1.Username, p1.Score)
		return
	}

	// Determine winner (1v1 logic)
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

	// Determine opponent if 1v1
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

	// Build questions payload with details
	ctx := context.Background()
	questions := make([]map[string]interface{}, len(session.Questions))
	for i, mq := range session.Questions {
		var q struct {
			Title        string         `db:"title"`
			Statement    string         `db:"statement"`
			InputFormat  string         `db:"input_format"`
			OutputFormat string         `db:"output_format"`
			Constraints  string         `db:"constraints"`
			Examples     []byte         `db:"examples"`
			Difficulty   int            `db:"difficulty"`
			Tags         pq.StringArray `db:"tags"`
			Source       string         `db:"source"`
			CFContestID  *int           `db:"cf_contest_id"`
			CFIndex      *string        `db:"cf_index"`
			CFURL        *string        `db:"cf_url"`
			CFRating     *int           `db:"cf_rating"`
		}
		sm.db.GetContext(ctx, &q, "SELECT title, statement, input_format, output_format, constraints, examples, difficulty, tags, source, cf_contest_id, cf_index, cf_url, cf_rating FROM questions WHERE id = $1", mq.QuestionID)

		solvedBy := ""
		if mq.SolvedBy != nil {
			if *mq.SolvedBy == userID {
				solvedBy = "you"
			} else {
				solvedBy = "opponent"
			}
		}

		// Unmarshal examples to avoid returning as string
		var examples interface{}
		if len(q.Examples) > 0 {
			json.Unmarshal(q.Examples, &examples)
		} else {
			examples = []interface{}{}
		}

		qData := map[string]interface{}{
			"id":           mq.QuestionID,
			"title":        q.Title,
			"statement":    q.Statement,
			"inputFormat":  q.InputFormat,
			"outputFormat": q.OutputFormat,
			"constraints":  q.Constraints,
			"examples":     examples,
			"difficulty":   q.Difficulty,
			"tags":         []string(q.Tags),
			"source":       q.Source,
		}

		// Add CF-specific fields
		if q.CFURL != nil {
			qData["cfUrl"] = *q.CFURL
		}
		if q.CFRating != nil {
			qData["cfRating"] = *q.CFRating
		}
		if q.CFContestID != nil {
			qData["cfContestId"] = *q.CFContestID
		}
		if q.CFIndex != nil {
			qData["cfIndex"] = *q.CFIndex
		}

		questions[i] = map[string]interface{}{
			"questionIndex": mq.QuestionIndex,
			"pointsValue":   mq.PointsValue,
			"solvedBy":      solvedBy,
			"question":      qData,
		}
	}

	remaining := int(session.RemainingTime().Seconds())

	me := session.GetPlayer(userID)
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

// CreateCFSession creates a new match session using Codeforces problems.
func (sm *SessionManager) CreateCFSession(ctx context.Context,
	p1ID, p1User, p1CFHandle string, p1Rating, p1RD, p1Vol float64,
	p2ID, p2User, p2CFHandle string, p2Rating, p2RD, p2Vol float64,
	questionIDs []string, cfProblems []*codeforces.SelectedProblem,
) (*Session, error) {
	now := time.Now()
	duration := 30 * time.Minute
	endAt := now.Add(duration)

	// We need a question_set_id. Create a dummy one for CF matches.
	// Use q1-q5 from questionIDs, pad q6/q7 with q5 for schema compat
	q6 := questionIDs[len(questionIDs)-1]
	q7 := questionIDs[len(questionIDs)-1]
	var qsID string
	err := sm.db.QueryRowxContext(ctx, `
		INSERT INTO question_sets (rating_min, rating_max, q1_id, q2_id, q3_id, q4_id, q5_id, q6_id, q7_id, is_active)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false)
		RETURNING id
	`, cfProblems[0].Rating, cfProblems[len(cfProblems)-1].Rating,
		questionIDs[0], questionIDs[1], questionIDs[2], questionIDs[3], questionIDs[4],
		q6, q7).Scan(&qsID)
	if err != nil {
		return nil, fmt.Errorf("create cf question set: %w", err)
	}

	var p2IDPtr *string
	if p2ID != "" {
		p2IDPtr = &p2ID
	}

	// Create match in DB
	var match models.Match
	err = sm.db.QueryRowxContext(ctx, `
		INSERT INTO matches (player1_id, player2_id, question_set_id, status, mode, started_at, duration_secs,
			player1_rating_before, player2_rating_before)
		VALUES ($1, $2, $3, 'in_progress', 'codeforces', $4, $5, $6, $7)
		RETURNING *
	`, p1ID, p2IDPtr, qsID, now, int(duration.Seconds()), p1Rating, p2Rating).StructScan(&match)
	if err != nil {
		return nil, fmt.Errorf("create cf match: %w", err)
	}

	matchQuestions := make([]*models.MatchQuestion, len(questionIDs))
	for i, qID := range questionIDs {
		var mq models.MatchQuestion
		err = sm.db.QueryRowxContext(ctx, `
			INSERT INTO match_questions (match_id, question_id, question_index, points_value, unlocked_at)
			VALUES ($1, $2, $3, $4, $5)
			RETURNING *
		`, match.ID, qID, i+1, (i+1)*100, now).StructScan(&mq)
		if err != nil {
			return nil, fmt.Errorf("create cf match question %d: %w", i+1, err)
		}
		matchQuestions[i] = &mq
	}

	cfProblemMap := make(map[int]*codeforces.SelectedProblem)
	for i, p := range cfProblems {
		cfProblemMap[i+1] = p
	}

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
			CFHandle: p1CFHandle,
			HintsUsed:          make(map[int]int),
			HintTexts:          make(map[int][]string),
			SubmissionAttempts: make(map[int]int),
			LastVerdicts:       make(map[int]string),
		},
		IsCF:       true,
		CFProblems: cfProblemMap,
		StartedAt:  now,
		EndAt:      endAt,
		Done:       make(chan struct{}),
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
			HintsUsed:          make(map[int]int),
			HintTexts:          make(map[int][]string),
			SubmissionAttempts: make(map[int]int),
			LastVerdicts:       make(map[int]string),
		}
	}

	// Start timer
	session.Timer = time.AfterFunc(duration, func() {
		sm.EndMatch(context.Background(), match.ID, "timeout")
	})

	sm.mu.Lock()
	sm.sessions[match.ID] = session
	sm.mu.Unlock()

	// Start CF verification poller
	go sm.startCFVerificationPoller(match.ID)

	if p2ID != "" {
		log.Printf("[session] created CF match %s: %s(%s) vs %s(%s)", match.ID, p1User, p1CFHandle, p2User, p2CFHandle)
	} else {
		log.Printf("[session] created CF solo match %s: %s(%s)", match.ID, p1User, p1CFHandle)
	}

	return session, nil
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
			questions := session.Questions
			cfProblems := session.CFProblems
			session.mu.RUnlock()

			for _, player := range players {
				if player.CFHandle == "" {
					continue
				}

				for _, mq := range questions {
					if mq.SolvedBy != nil {
						// Already solved by someone
						continue
					}

					cfProb, ok := cfProblems[mq.QuestionIndex]
					if !ok {
						continue
					}

					// Check if this player submitted an AC for this problem on CF
					subID, err := sm.cfClient.CheckRecentSubmission(
						player.CFHandle,
						cfProb.ContestID,
						cfProb.Index,
						matchStartTimestamp,
					)
					if err != nil {
						log.Printf("[cf-poller] error checking %s for Q%d: %v", player.CFHandle, mq.QuestionIndex, err)
						continue
					}

					if subID > 0 {
						// Player solved it on CF!
						log.Printf("[cf-poller] %s solved Q%d (CF sub %d) in match %s",
							player.Username, mq.QuestionIndex, subID, matchID)

						// Update DB
						sm.db.ExecContext(context.Background(), `
							UPDATE match_questions SET cf_verified = true, cf_submission_id = $1 WHERE id = $2
						`, subID, mq.ID)

						// Record solve
						points, err := sm.RecordSolve(context.Background(), matchID, player.UserID, mq.QuestionIndex)
						if err != nil {
							log.Printf("[cf-poller] record solve error: %v", err)
							continue
						}

						// Notify the solver
						sm.hub.SendToUser(player.UserID, &ServerMessage{
							Type: "cf_solved",
							Data: map[string]interface{}{
								"questionIndex":  mq.QuestionIndex,
								"solvedBy":       "you",
								"points":         points,
								"cfSubmissionId": subID,
							},
						})

						// Notify opponent if 1v1
						if session.Player2 != nil {
							sm.hub.SendToOpponent(matchID, player.UserID, &ServerMessage{
								Type: "cf_solved",
								Data: map[string]interface{}{
									"questionIndex":  mq.QuestionIndex,
									"solvedBy":       "opponent",
									"points":         0,
									"opponentScore":  player.Score,
								},
							})
						}
					}
				}

				// Rate limit: wait 1 second between players to respect CF API limits
				time.Sleep(1 * time.Second)
			}
		}
	}
}
