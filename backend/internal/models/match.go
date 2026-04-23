package models

import (
	"time"
)

// MatchStatus represents the state of a match.
type MatchStatus string

const (
	MatchStatusInProgress MatchStatus = "in_progress"
	MatchStatusCompleted  MatchStatus = "completed"
	MatchStatusAbandoned  MatchStatus = "abandoned"
	MatchStatusDraw       MatchStatus = "draw"
)

// Match represents a 1v1 competitive programming match.
type Match struct {
	ID            string `json:"id" db:"id"`
	Player1ID     string `json:"player1Id" db:"player1_id"`
	Player2ID     string `json:"player2Id" db:"player2_id"`
	QuestionSetID string `json:"questionSetId" db:"question_set_id"`

	Status       MatchStatus `json:"status" db:"status"`
	StartedAt    time.Time   `json:"startedAt" db:"started_at"`
	EndedAt      *time.Time  `json:"endedAt" db:"ended_at"`
	DurationSecs int         `json:"durationSecs" db:"duration_secs"`

	// Results
	WinnerID     *string `json:"winnerId" db:"winner_id"`
	Player1Score int     `json:"player1Score" db:"player1_score"`
	Player2Score int     `json:"player2Score" db:"player2_score"`

	// Rating deltas
	Player1RatingBefore *float64 `json:"player1RatingBefore" db:"player1_rating_before"`
	Player1RatingAfter  *float64 `json:"player1RatingAfter" db:"player1_rating_after"`
	Player1Delta        *float64 `json:"player1Delta" db:"player1_delta"`
	Player2RatingBefore *float64 `json:"player2RatingBefore" db:"player2_rating_before"`
	Player2RatingAfter  *float64 `json:"player2RatingAfter" db:"player2_rating_after"`
	Player2Delta        *float64 `json:"player2Delta" db:"player2_delta"`

	CreatedAt time.Time `json:"createdAt" db:"created_at"`
}

// MatchQuestion tracks per-question state within a match.
type MatchQuestion struct {
	ID            string    `json:"id" db:"id"`
	MatchID       string    `json:"matchId" db:"match_id"`
	QuestionID    string    `json:"questionId" db:"question_id"`
	QuestionIndex int       `json:"questionIndex" db:"question_index"` // 1-7
	PointsValue   int       `json:"pointsValue" db:"points_value"`     // 100-700
	SolvedBy      *string   `json:"solvedBy" db:"solved_by"`
	SolvedAt      *time.Time `json:"solvedAt" db:"solved_at"`
	UnlockedAt    time.Time `json:"unlockedAt" db:"unlocked_at"`
}

// Verdict represents the result of a code submission.
type Verdict string

const (
	VerdictPending          Verdict = "pending"
	VerdictAccepted         Verdict = "accepted"
	VerdictWrongAnswer      Verdict = "wrong_answer"
	VerdictTimeLimitExceed  Verdict = "time_limit"
	VerdictMemoryLimit      Verdict = "memory_limit"
	VerdictRuntimeError     Verdict = "runtime_error"
	VerdictCompilationError Verdict = "compilation_error"
)

// Submission represents a code submission during a match.
type Submission struct {
	ID         string `json:"id" db:"id"`
	MatchID    string `json:"matchId" db:"match_id"`
	QuestionID string `json:"questionId" db:"question_id"`
	UserID     string `json:"userId" db:"user_id"`

	Language   string `json:"language" db:"language"`
	SourceCode string `json:"sourceCode" db:"source_code"`

	Verdict       Verdict  `json:"verdict" db:"verdict"`
	ExecutionTime *float64 `json:"executionTime" db:"execution_time"` // ms
	MemoryUsed    *int     `json:"memoryUsed" db:"memory_used"`       // KB

	TestResults []byte `json:"testResults" db:"test_results"` // JSONB
	TestsPassed int    `json:"testsPassed" db:"tests_passed"`
	TestsTotal  int    `json:"testsTotal" db:"tests_total"`

	PointsAwarded int  `json:"pointsAwarded" db:"points_awarded"`
	IsFirstSolve  bool `json:"isFirstSolve" db:"is_first_solve"`

	SubmittedAt time.Time `json:"submittedAt" db:"submitted_at"`
}

// RatingHistory records rating changes after each match.
type RatingHistory struct {
	ID           string    `json:"id" db:"id"`
	UserID       string    `json:"userId" db:"user_id"`
	MatchID      string    `json:"matchId" db:"match_id"`
	RatingBefore float64   `json:"ratingBefore" db:"rating_before"`
	RatingAfter  float64   `json:"ratingAfter" db:"rating_after"`
	RDBefore     float64   `json:"rdBefore" db:"rd_before"`
	RDAfter      float64   `json:"rdAfter" db:"rd_after"`
	Delta        float64   `json:"delta" db:"delta"`
	RecordedAt   time.Time `json:"recordedAt" db:"recorded_at"`
}

// PointsForQuestion returns the points value for a question by index (1-7).
func PointsForQuestion(index int) int {
	return index * 100
}
