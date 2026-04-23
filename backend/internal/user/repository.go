package user

import (
	"context"
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
