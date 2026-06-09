package subscription

import (
	"context"
	"fmt"
	"time"

	"github.com/jmoiron/sqlx"
)

// Order represents a subscription purchase order.
type Order struct {
	ID                 string     `db:"id"`
	UserID             string     `db:"user_id"`
	RazorpayOrderID    string     `db:"razorpay_order_id"`
	RazorpayPaymentID  *string    `db:"razorpay_payment_id"`
	Plan               string     `db:"plan"`
	AmountPaise        int        `db:"amount_paise"`
	Status             string     `db:"status"`
	CreatedAt          time.Time  `db:"created_at"`
	PaidAt             *time.Time `db:"paid_at"`
}

// Repository handles subscription DB operations.
type Repository struct {
	db *sqlx.DB
}

// NewRepository creates a new subscription repository.
func NewRepository(db *sqlx.DB) *Repository {
	return &Repository{db: db}
}

// CreateOrder inserts a new subscription order.
func (r *Repository) CreateOrder(ctx context.Context, userID, razorpayOrderID, plan string, amountPaise int) (*Order, error) {
	var order Order
	err := r.db.QueryRowxContext(ctx, `
		INSERT INTO subscription_orders (user_id, razorpay_order_id, plan, amount_paise, status)
		VALUES ($1, $2, $3, $4, 'created')
		RETURNING *
	`, userID, razorpayOrderID, plan, amountPaise).StructScan(&order)
	if err != nil {
		return nil, fmt.Errorf("create order: %w", err)
	}
	return &order, nil
}

// GetOrderByRazorpayID fetches an order by Razorpay order ID.
func (r *Repository) GetOrderByRazorpayID(ctx context.Context, razorpayOrderID string) (*Order, error) {
	var order Order
	if err := r.db.GetContext(ctx, &order, `
		SELECT * FROM subscription_orders WHERE razorpay_order_id = $1
	`, razorpayOrderID); err != nil {
		return nil, fmt.Errorf("get order: %w", err)
	}
	return &order, nil
}

// ActivatePremium marks an order as paid and activates premium for the user.
func (r *Repository) ActivatePremium(ctx context.Context, razorpayOrderID, razorpayPaymentID, plan string, durationMonths int) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	now := time.Now()

	// Mark order paid
	_, err = tx.ExecContext(ctx, `
		UPDATE subscription_orders
		SET status = 'paid', razorpay_payment_id = $1, paid_at = $2
		WHERE razorpay_order_id = $3
	`, razorpayPaymentID, now, razorpayOrderID)
	if err != nil {
		return fmt.Errorf("update order: %w", err)
	}

	// Get user_id from order
	var userID string
	if err := tx.QueryRowContext(ctx,
		"SELECT user_id FROM subscription_orders WHERE razorpay_order_id = $1",
		razorpayOrderID,
	).Scan(&userID); err != nil {
		return fmt.Errorf("get user_id: %w", err)
	}

	// Update user premium status (extend if already premium)
	_, err = tx.ExecContext(ctx, `
		UPDATE users
		SET is_premium = TRUE,
		    premium_expires_at = GREATEST(COALESCE(premium_expires_at, NOW()), NOW()) + ($1 * INTERVAL '1 month'),
		    premium_plan = $2
		WHERE id = $3
	`, durationMonths, plan, userID)
	if err != nil {
		return fmt.Errorf("update user premium: %w", err)
	}

	return tx.Commit()
}

// GetPremiumStatus returns isPremium and expiresAt for a user.
func (r *Repository) GetPremiumStatus(ctx context.Context, userID string) (bool, *time.Time, *string, error) {
	var result struct {
		IsPremium        bool       `db:"is_premium"`
		PremiumExpiresAt *time.Time `db:"premium_expires_at"`
		PremiumPlan      *string    `db:"premium_plan"`
	}
	if err := r.db.GetContext(ctx, &result, `
		SELECT is_premium, premium_expires_at, premium_plan FROM users WHERE id = $1
	`, userID); err != nil {
		return false, nil, nil, err
	}
	// Consider expired subscriptions as inactive
	isActive := result.IsPremium && (result.PremiumExpiresAt == nil || result.PremiumExpiresAt.After(time.Now()))
	return isActive, result.PremiumExpiresAt, result.PremiumPlan, nil
}
