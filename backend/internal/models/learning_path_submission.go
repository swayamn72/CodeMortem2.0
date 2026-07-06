package models

import "time"

// LearningPathSubmission records a single submission made on a learning-path challenge.
type LearningPathSubmission struct {
	ID            string    `json:"id"            db:"id"`
	UserID        string    `json:"userId"        db:"user_id"`
	ChallengeID   string    `json:"challengeId"   db:"challenge_id"`
	Language      string    `json:"language"      db:"language"`
	SourceCode    string    `json:"sourceCode"    db:"source_code"`
	Verdict       string    `json:"verdict"       db:"verdict"`
	TestsPassed   int       `json:"testsPassed"   db:"tests_passed"`
	TestsTotal    int       `json:"testsTotal"    db:"tests_total"`
	ExecutionTime *float64  `json:"executionTime" db:"execution_time"`
	MemoryUsed    *float64  `json:"memoryUsed"    db:"memory_used"`
	SubmittedAt   time.Time `json:"submittedAt"   db:"submitted_at"`
}
