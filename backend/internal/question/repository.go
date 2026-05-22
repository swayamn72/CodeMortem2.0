package question

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"time"

	"codemortem/internal/ai"
	"codemortem/internal/models"

	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
)

// Repository manages question storage and retrieval.
type Repository struct {
	db *sqlx.DB
}

// NewRepository creates a new question repository.
func NewRepository(db *sqlx.DB) *Repository {
	return &Repository{db: db}
}

// ────── Question CRUD ──────

// Create inserts a new question into the database.
func (r *Repository) Create(ctx context.Context, q *models.Question) error {
	query := `
		INSERT INTO questions (title, slug, statement, input_format, output_format, constraints,
			examples, difficulty, tags, generated_by, generation_prompt)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING id, created_at
	`
	return r.db.QueryRowxContext(ctx, query,
		q.Title, q.Slug, q.Statement, q.InputFormat, q.OutputFormat, q.Constraints,
		q.Examples, q.Difficulty, pq.Array(q.Tags), q.GeneratedBy, q.GenerationPrompt,
	).Scan(&q.ID, &q.CreatedAt)
}

// GetByID returns a question by its ID.
func (r *Repository) GetByID(ctx context.Context, id string) (*models.Question, error) {
	var q models.Question
	err := r.db.GetContext(ctx, &q, "SELECT * FROM questions WHERE id = $1", id)
	return &q, err
}

// GetByDifficulty returns questions within a difficulty range.
func (r *Repository) GetByDifficulty(ctx context.Context, minDiff, maxDiff int, limit int) ([]*models.Question, error) {
	var questions []*models.Question
	err := r.db.SelectContext(ctx, &questions,
		"SELECT * FROM questions WHERE difficulty BETWEEN $1 AND $2 ORDER BY created_at DESC LIMIT $3",
		minDiff, maxDiff, limit,
	)
	return questions, err
}

// GetCount returns the total number of questions.
func (r *Repository) GetCount(ctx context.Context) (int, error) {
	var count int
	err := r.db.GetContext(ctx, &count, "SELECT COUNT(*) FROM questions")
	return count, err
}

// ────── Test Cases ──────

// CreateTestCase inserts a test case for a question.
func (r *Repository) CreateTestCase(ctx context.Context, tc *models.TestCase) error {
	query := `
		INSERT INTO test_cases (question_id, input, expected_output, is_sample, is_edge_case, ordinal)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at
	`
	return r.db.QueryRowxContext(ctx, query,
		tc.QuestionID, tc.Input, tc.ExpectedOutput, tc.IsSample, tc.IsEdgeCase, tc.Ordinal,
	).Scan(&tc.ID, &tc.CreatedAt)
}

// GetTestCases returns all test cases for a question.
func (r *Repository) GetTestCases(ctx context.Context, questionID string) ([]*models.TestCase, error) {
	var tcs []*models.TestCase
	err := r.db.SelectContext(ctx, &tcs,
		"SELECT * FROM test_cases WHERE question_id = $1 ORDER BY ordinal",
		questionID,
	)
	return tcs, err
}

// ────── Question Sets ──────

// CreateQuestionSet creates a new question set.
func (r *Repository) CreateQuestionSet(ctx context.Context, qs *models.QuestionSet) error {
	query := `
		INSERT INTO question_sets (rating_min, rating_max, q1_id, q2_id, q3_id, q4_id, q5_id, q6_id, q7_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id, generated_at
	`
	return r.db.QueryRowxContext(ctx, query,
		qs.RatingMin, qs.RatingMax,
		qs.Q1ID, qs.Q2ID, qs.Q3ID, qs.Q4ID, qs.Q5ID, qs.Q6ID, qs.Q7ID,
	).Scan(&qs.ID, &qs.GeneratedAt)
}

// FindAvailableSet finds a question set available for the given rating bracket.
// It returns the least-used active set within the rating range.
func (r *Repository) FindAvailableSet(ctx context.Context, avgRating int) (*models.QuestionSet, error) {
	var qs models.QuestionSet
	err := r.db.GetContext(ctx, &qs, `
		SELECT * FROM question_sets 
		WHERE is_active = true 
			AND rating_min <= $1 AND rating_max >= $1
		ORDER BY times_used ASC, generated_at DESC
		LIMIT 1
	`, avgRating)
	if err != nil {
		return nil, err
	}
	return &qs, nil
}

// GetSetCount returns the number of active question sets for a rating bracket.
func (r *Repository) GetSetCount(ctx context.Context, ratingMin, ratingMax int) (int, error) {
	var count int
	err := r.db.GetContext(ctx, &count,
		"SELECT COUNT(*) FROM question_sets WHERE is_active = true AND rating_min = $1 AND rating_max = $2",
		ratingMin, ratingMax,
	)
	return count, err
}

// ────── AI-Generated Question Persistence ──────

// SaveGeneratedQuestion persists an AI-generated question and its test cases.
func (r *Repository) SaveGeneratedQuestion(ctx context.Context, gen *ai.GeneratedQuestion, providerModel string) (*models.Question, error) {
	// Serialize examples
	examplesJSON, err := json.Marshal(gen.Examples)
	if err != nil {
		return nil, fmt.Errorf("marshal examples: %w", err)
	}

	// Create slug from title
	slug := slugify(gen.Title)

	q := &models.Question{
		Title:        gen.Title,
		Slug:         slug,
		Statement:    gen.Statement,
		InputFormat:  gen.InputFormat,
		OutputFormat: gen.OutputFormat,
		Constraints:  gen.Constraints,
		Examples:     examplesJSON,
		Difficulty:   gen.Difficulty,
		Tags:         gen.Tags,
		GeneratedBy:  providerModel,
	}

	// Insert question
	if err := r.Create(ctx, q); err != nil {
		return nil, fmt.Errorf("insert question: %w", err)
	}

	// Insert test cases
	for i, tc := range gen.TestCases {
		testCase := &models.TestCase{
			QuestionID:     q.ID,
			Input:          tc.Input,
			ExpectedOutput: tc.ExpectedOutput,
			IsSample:       tc.IsSample,
			IsEdgeCase:     tc.IsEdgeCase,
			Ordinal:        i + 1,
		}
		if err := r.CreateTestCase(ctx, testCase); err != nil {
			log.Printf("[question-repo] warning: failed to save test case %d for %s: %v", i+1, q.ID, err)
		}
	}

	log.Printf("[question-repo] saved question: %s (%s) with %d test cases", q.Title, q.ID, len(gen.TestCases))
	return q, nil
}

// SaveGeneratedMatchSet persists a full 7-question match set.
func (r *Repository) SaveGeneratedMatchSet(ctx context.Context, questions [7]*ai.GeneratedQuestion, avgRating int, providerModel string) (*models.QuestionSet, error) {
	var qIDs [7]string

	for i, gen := range questions {
		if gen == nil {
			return nil, fmt.Errorf("question %d is nil", i+1)
		}

		q, err := r.SaveGeneratedQuestion(ctx, gen, providerModel)
		if err != nil {
			return nil, fmt.Errorf("save question %d (%s): %w", i+1, gen.Title, err)
		}
		qIDs[i] = q.ID
	}

	// Create question set with rating bracket
	ratingMin := avgRating - 200
	ratingMax := avgRating + 200
	if ratingMin < 800 {
		ratingMin = 800
	}

	qs := &models.QuestionSet{
		RatingMin: ratingMin,
		RatingMax: ratingMax,
		Q1ID:      qIDs[0],
		Q2ID:      qIDs[1],
		Q3ID:      qIDs[2],
		Q4ID:      qIDs[3],
		Q5ID:      qIDs[4],
		Q6ID:      qIDs[5],
		Q7ID:      qIDs[6],
		IsActive:  true,
	}

	if err := r.CreateQuestionSet(ctx, qs); err != nil {
		return nil, fmt.Errorf("create question set: %w", err)
	}

	log.Printf("[question-repo] ✅ saved question set %s (rating %d-%d)", qs.ID, ratingMin, ratingMax)
	return qs, nil
}

// ────── Codeforces Questions ──────

// UpsertCFQuestion creates a new CF question or returns the existing one if already stored.
func (r *Repository) UpsertCFQuestion(ctx context.Context, contestID int, index, name, statement, inputFormat, outputFormat, constraints string, examples []byte, rating int, tags []string, cfURL string) (*models.Question, error) {
	// Check if already exists
	var existing models.Question
	err := r.db.GetContext(ctx, &existing, `
		SELECT * FROM questions WHERE cf_contest_id = $1 AND cf_index = $2
	`, contestID, index)
	if err == nil {
		// Already exists — update statement if empty (might have been a stub)
		if existing.Statement == "" || existing.Statement == "Problem statement could not be parsed. Please view on Codeforces." {
			r.db.ExecContext(ctx, `
				UPDATE questions SET statement = $1, input_format = $2, output_format = $3, constraints = $4, examples = $5 WHERE id = $6
			`, statement, inputFormat, outputFormat, constraints, examples, existing.ID)
			existing.Statement = statement
			existing.InputFormat = inputFormat
			existing.OutputFormat = outputFormat
		}
		return &existing, nil
	}

	// Create new
	slug := fmt.Sprintf("cf-%d-%s-%d", contestID, strings.ToLower(index), time.Now().UnixMilli()%10000)

	q := &models.Question{
		Title:        name,
		Slug:         slug,
		Statement:    statement,
		InputFormat:  inputFormat,
		OutputFormat: outputFormat,
		Constraints:  constraints,
		Examples:     examples,
		Difficulty:   rating,
		Tags:         tags,
		Source:       "codeforces",
		CFContestID:  &contestID,
		CFIndex:      &index,
		CFURL:        &cfURL,
		CFRating:     &rating,
		GeneratedBy:  "codeforces",
	}

	err = r.db.QueryRowxContext(ctx, `
		INSERT INTO questions (title, slug, statement, input_format, output_format, constraints,
			examples, difficulty, tags, generated_by, source, cf_contest_id, cf_index, cf_url, cf_rating)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
		ON CONFLICT (cf_contest_id, cf_index) WHERE cf_contest_id IS NOT NULL
		DO UPDATE SET times_used = questions.times_used
		RETURNING id, created_at
	`, q.Title, q.Slug, q.Statement, q.InputFormat, q.OutputFormat, q.Constraints,
		q.Examples, q.Difficulty, pq.Array(q.Tags), q.GeneratedBy, q.Source,
		q.CFContestID, q.CFIndex, q.CFURL, q.CFRating,
	).Scan(&q.ID, &q.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("upsert cf question: %w", err)
	}

	log.Printf("[question-repo] upserted CF question: %s (CF %d%s)", q.Title, contestID, index)
	return q, nil
}

// ────── Helpers ──────

func slugify(s string) string {
	s = strings.ToLower(s)
	s = strings.Map(func(r rune) rune {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '-' || r == ' ' {
			return r
		}
		return -1
	}, s)
	s = strings.ReplaceAll(s, " ", "-")
	// Add timestamp suffix for uniqueness
	return fmt.Sprintf("%s-%d", s, time.Now().UnixMilli()%10000)
}
