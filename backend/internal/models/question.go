package models

import (
	"time"
)

// Question represents a competitive programming problem.
type Question struct {
	ID        string `json:"id" db:"id"`
	Title     string `json:"title" db:"title"`
	Slug      string `json:"slug" db:"slug"`

	// Problem content
	Statement    string `json:"statement" db:"statement"`
	InputFormat  string `json:"inputFormat" db:"input_format"`
	OutputFormat string `json:"outputFormat" db:"output_format"`
	Constraints  string `json:"constraints" db:"constraints"`
	Examples     []byte `json:"examples" db:"examples"` // JSONB

	// Difficulty
	Difficulty int      `json:"difficulty" db:"difficulty"` // 800-3500
	Tags       []string `json:"tags" db:"tags"`

	// Source: "ai" or "codeforces"
	Source      string  `json:"source" db:"source"`
	CFContestID *int    `json:"cfContestId,omitempty" db:"cf_contest_id"`
	CFIndex     *string `json:"cfIndex,omitempty" db:"cf_index"`
	CFURL       *string `json:"cfUrl,omitempty" db:"cf_url"`
	CFRating    *int    `json:"cfRating,omitempty" db:"cf_rating"`

	// AI generation metadata
	GeneratedBy       string  `json:"generatedBy" db:"generated_by"`
	GenerationPrompt  *string `json:"-" db:"generation_prompt"`
	HumanVerified     bool    `json:"humanVerified" db:"human_verified"`
	VerificationNotes *string `json:"-" db:"verification_notes"`

	// Usage tracking
	TimesUsed    int      `json:"timesUsed" db:"times_used"`
	AvgSolveTime *float64 `json:"avgSolveTime" db:"avg_solve_time"`
	SolveRate    *float64 `json:"solveRate" db:"solve_rate"`

	CreatedAt time.Time `json:"createdAt" db:"created_at"`
}

// QuestionExample represents an input/output example for a problem.
type QuestionExample struct {
	Input       string `json:"input"`
	Output      string `json:"output"`
	Explanation string `json:"explanation,omitempty"`
}

// TestCase represents a test case for a question.
type TestCase struct {
	ID             string  `json:"id" db:"id"`
	QuestionID     string  `json:"questionId" db:"question_id"`
	Input          string  `json:"input" db:"input"`
	ExpectedOutput string  `json:"expectedOutput" db:"expected_output"`
	IsSample       bool    `json:"isSample" db:"is_sample"`
	IsEdgeCase     bool    `json:"isEdgeCase" db:"is_edge_case"`
	GeneratorCode  *string `json:"-" db:"generator_code"`
	CheckerCode    *string `json:"-" db:"checker_code"`
	Ordinal        int     `json:"ordinal" db:"ordinal"`
	CreatedAt      time.Time `json:"createdAt" db:"created_at"`
}

// MatchQuestionCount is the number of questions per match (Codeforces mode).
const MatchQuestionCount = 5

// QuestionSet represents a pre-bundled set of 7 questions for a rating range.
// Kept for backwards compatibility with AI-generated sets.
type QuestionSet struct {
	ID        string `json:"id" db:"id"`
	RatingMin int    `json:"ratingMin" db:"rating_min"`
	RatingMax int    `json:"ratingMax" db:"rating_max"`

	Q1ID string `json:"q1Id" db:"q1_id"`
	Q2ID string `json:"q2Id" db:"q2_id"`
	Q3ID string `json:"q3Id" db:"q3_id"`
	Q4ID string `json:"q4Id" db:"q4_id"`
	Q5ID string `json:"q5Id" db:"q5_id"`
	Q6ID string `json:"q6Id" db:"q6_id"`
	Q7ID string `json:"q7Id" db:"q7_id"`

	TimesUsed   int       `json:"timesUsed" db:"times_used"`
	IsActive    bool      `json:"isActive" db:"is_active"`
	GeneratedAt time.Time `json:"generatedAt" db:"generated_at"`
}

// QuestionSetWithQuestions is a QuestionSet with all questions loaded.
type QuestionSetWithQuestions struct {
	QuestionSet
	Questions [7]*Question `json:"questions"`
}

// PointsForCFQuestion returns points for a CF match question index (1-5).
func PointsForCFQuestion(index int) int {
	// 100, 200, 300, 400, 500
	return index * 100
}
