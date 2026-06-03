package user

import (
	"context"
	"encoding/json"
	"fmt"

	"codemortem/internal/models"

	"github.com/jmoiron/sqlx"
)

// Repository handles user database operations.
type Repository struct {
	db *sqlx.DB
}

// NewRepository creates a new user repository.
func NewRepository(db *sqlx.DB) *Repository {
	return &Repository{db: db}
}

// GetByID fetches a user by ID.
func (r *Repository) GetByID(ctx context.Context, id string) (*models.User, error) {
	var u models.User
	err := r.db.GetContext(ctx, &u, "SELECT * FROM users WHERE id = $1", id)
	if err != nil {
		return nil, fmt.Errorf("get user by id: %w", err)
	}
	return &u, nil
}

// GetByUsername fetches a user by username.
func (r *Repository) GetByUsername(ctx context.Context, username string) (*models.User, error) {
	var u models.User
	err := r.db.GetContext(ctx, &u, "SELECT * FROM users WHERE username = $1", username)
	if err != nil {
		return nil, fmt.Errorf("get user by username: %w", err)
	}
	return &u, nil
}

// GetByEmail fetches a user by email.
func (r *Repository) GetByEmail(ctx context.Context, email string) (*models.User, error) {
	var u models.User
	err := r.db.GetContext(ctx, &u, "SELECT * FROM users WHERE email = $1", email)
	if err != nil {
		return nil, fmt.Errorf("get user by email: %w", err)
	}
	return &u, nil
}

// UpdateRating updates a user's Glicko-2 rating fields.
func (r *Repository) UpdateRating(ctx context.Context, userID string, rating, rd, volatility float64) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE users 
		SET rating = $1, rating_deviation = $2, volatility = $3, updated_at = NOW()
		WHERE id = $4
	`, rating, rd, volatility, userID)
	return err
}

// UpdateStats increments match stats for a user.
func (r *Repository) UpdateStats(ctx context.Context, userID string, won, drawn bool, problemsSolved int) error {
	wonInc, drawnInc := 0, 0
	if won {
		wonInc = 1
	}
	if drawn {
		drawnInc = 1
	}

	_, err := r.db.ExecContext(ctx, `
		UPDATE users SET 
			matches_played = matches_played + 1,
			matches_won = matches_won + $1,
			matches_drawn = matches_drawn + $2,
			total_problems_solved = total_problems_solved + $3,
			updated_at = NOW()
		WHERE id = $4
	`, wonInc, drawnInc, problemsSolved, userID)
	return err
}

// UpdateCFLink updates Codeforces linking fields.
func (r *Repository) UpdateCFLink(ctx context.Context, userID string, handle string, token string) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE users SET cf_handle = $1, cf_verify_token = $2, cf_verified = FALSE, updated_at = NOW()
		WHERE id = $3
	`, handle, token, userID)
	return err
}

// VerifyCF marks a user's Codeforces account as verified and updates their rating.
func (r *Repository) VerifyCF(ctx context.Context, userID string, cfRating int, cmRating float64) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE users SET 
			cf_verified = TRUE, 
			cf_rating = $1, 
			rating = $2, 
			cf_verify_token = NULL,
			updated_at = NOW()
		WHERE id = $3
	`, cfRating, cmRating, userID)
	return err
}

// GetLeaderboard returns top users by rating.
func (r *Repository) GetLeaderboard(ctx context.Context, limit, offset int) ([]*models.User, error) {
	var users []*models.User
	err := r.db.SelectContext(ctx, &users, `
		SELECT * FROM users 
		WHERE matches_played >= 5
		ORDER BY rating DESC 
		LIMIT $1 OFFSET $2
	`, limit, offset)
	return users, err
}

// GetRatingHistory returns a user's rating history.
func (r *Repository) GetRatingHistory(ctx context.Context, userID string, limit int) ([]*models.RatingHistory, error) {
	var history []*models.RatingHistory
	err := r.db.SelectContext(ctx, &history, `
		SELECT * FROM rating_history 
		WHERE user_id = $1 
		ORDER BY recorded_at DESC 
		LIMIT $2
	`, userID, limit)
	return history, err
}

// GetMatchHistory returns a user's recent matches.
func (r *Repository) GetMatchHistory(ctx context.Context, userID string, limit, offset int) ([]*models.Match, error) {
	var matches []*models.Match
	err := r.db.SelectContext(ctx, &matches, `
		SELECT * FROM matches 
		WHERE (player1_id = $1 OR player2_id = $1)
		AND status != 'in_progress'
		ORDER BY created_at DESC 
		LIMIT $2 OFFSET $3
	`, userID, limit, offset)
	return matches, err
}

// SearchUsers searches users by username prefix.
func (r *Repository) SearchUsers(ctx context.Context, query string, limit int) ([]*models.User, error) {
	var users []*models.User
	err := r.db.SelectContext(ctx, &users, `
		SELECT * FROM users 
		WHERE username ILIKE $1 
		ORDER BY rating DESC 
		LIMIT $2
	`, query+"%", limit)
	return users, err
}

// GetUserProgress fetches all module progress for a user.
func (r *Repository) GetUserProgress(ctx context.Context, userID string) ([]*models.UserModuleProgress, error) {
	type progressRow struct {
		UserID           string `db:"user_id"`
		ModuleID         string `db:"module_id"`
		CompletedLessons []byte `db:"completed_lessons"`
		UpdatedAt        string `db:"updated_at"`
	}
	
	var rows []progressRow
	err := r.db.SelectContext(ctx, &rows, `SELECT user_id, module_id, completed_lessons, updated_at FROM user_module_progress WHERE user_id = $1`, userID)
	if err != nil {
		return nil, fmt.Errorf("get user progress: %w", err)
	}

	var results []*models.UserModuleProgress
	for _, row := range rows {
		var lessons []string
		if err := json.Unmarshal(row.CompletedLessons, &lessons); err != nil {
			lessons = []string{}
		}
		results = append(results, &models.UserModuleProgress{
			UserID:           row.UserID,
			ModuleID:         row.ModuleID,
			CompletedLessons: lessons,
		})
	}
	return results, nil
}

// SaveUserProgress upserts progress for a user's module.
func (r *Repository) SaveUserProgress(ctx context.Context, userID string, moduleID string, completedLessons []string) error {
	jsonData, err := json.Marshal(completedLessons)
	if err != nil {
		return fmt.Errorf("marshal completed lessons: %w", err)
	}

	_, err = r.db.ExecContext(ctx, `
		INSERT INTO user_module_progress (user_id, module_id, completed_lessons, updated_at)
		VALUES ($1, $2, $3, NOW())
		ON CONFLICT (user_id, module_id) 
		DO UPDATE SET completed_lessons = EXCLUDED.completed_lessons, updated_at = NOW()
	`, userID, moduleID, jsonData)
	
	if err != nil {
		return fmt.Errorf("upsert user progress: %w", err)
	}
	return nil
}

// CreatePracticeSession creates a new solo practice session record.
func (r *Repository) CreatePracticeSession(ctx context.Context, session *models.PracticeSession) error {
	err := r.db.QueryRowContext(ctx, `
		INSERT INTO practice_sessions (user_id, match_id, duration_secs, rating_min, rating_max, num_problems)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, started_at, problems_solved
	`, session.UserID, session.MatchID, session.DurationSecs, session.RatingMin, session.RatingMax, session.NumProblems).Scan(&session.ID, &session.StartedAt, &session.ProblemsSolved)
	if err != nil {
		return fmt.Errorf("create practice session: %w", err)
	}
	return nil
}

// GetPracticeSessions fetches the practice history of a user.
func (r *Repository) GetPracticeSessions(ctx context.Context, userID string, limit int) ([]*models.PracticeSession, error) {
	var sessions []*models.PracticeSession
	err := r.db.SelectContext(ctx, &sessions, `
		SELECT * FROM practice_sessions 
		WHERE user_id = $1 
		ORDER BY started_at DESC 
		LIMIT $2
	`, userID, limit)
	return sessions, err
}

// EndPracticeSession marks a session as ended and updates the problems solved.
func (r *Repository) EndPracticeSession(ctx context.Context, sessionID string, problemsSolved int) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE practice_sessions SET ended_at = NOW(), problems_solved = $1
		WHERE id = $2
	`, problemsSolved, sessionID)
	return err
}
