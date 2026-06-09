package auth

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"math/big"
	"strings"
	"time"

	"codemortem/internal/email"
	"codemortem/internal/models"

	"github.com/jmoiron/sqlx"
	"github.com/redis/go-redis/v9"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrUserNotFound       = errors.New("user not found")
	ErrEmailTaken         = errors.New("email already registered")
	ErrUsernameTaken      = errors.New("username already taken")
	ErrInvalidCredentials = errors.New("invalid email or password")
	ErrInvalidOTP         = errors.New("invalid or expired verification code")
	ErrOTPCooldown        = errors.New("please wait before requesting a new code")
)

// SendOTPRequest is the payload for requesting an OTP.
type SendOTPRequest struct {
	Email string `json:"email" validate:"required,email"`
}

// RegisterRequest is the payload for user registration (with OTP).
type RegisterRequest struct {
	Username string `json:"username" validate:"required,min=3,max=30,alphanum"`
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=8,max=72"`
	OTP      string `json:"otp" validate:"required,len=6"`
}

// LoginRequest is the payload for user login.
type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

// AuthResponse is returned after successful auth operations.
type AuthResponse struct {
	User             *models.UserPublic `json:"user"`
	Tokens           *TokenPair         `json:"tokens"`
	SomaiyaPremium   bool               `json:"somaiyaPremium,omitempty"`
}

// Service handles authentication business logic.
type Service struct {
	db             *sqlx.DB
	rdb            *redis.Client
	jwtMgr         *JWTManager
	googleClientID string
	emailSender    *email.Sender
}

// NewService creates a new auth service.
func NewService(db *sqlx.DB, rdb *redis.Client, jwtMgr *JWTManager, googleClientID string, emailSender *email.Sender) *Service {
	return &Service{
		db:             db,
		rdb:            rdb,
		jwtMgr:         jwtMgr,
		googleClientID: googleClientID,
		emailSender:    emailSender,
	}
}

// otpKey returns the Redis key for an OTP.
func otpKey(email string) string { return "otp:" + email }

// otpCooldownKey returns the Redis key for OTP cooldown.
func otpCooldownKey(email string) string { return "otp_cooldown:" + email }

// generateOTP generates a random 6-digit OTP string.
func generateOTP() (string, error) {
	n, err := rand.Int(rand.Reader, big.NewInt(1_000_000))
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%06d", n.Int64()), nil
}

// SendOTP generates and sends a 6-digit OTP to the given email.
// Returns ErrOTPCooldown if called again within 60 seconds.
func (s *Service) SendOTP(ctx context.Context, req *SendOTPRequest) error {
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))

	// Check cooldown
	cooldownKey := otpCooldownKey(req.Email)
	exists, err := s.rdb.Exists(ctx, cooldownKey).Result()
	if err != nil {
		return fmt.Errorf("check otp cooldown: %w", err)
	}
	if exists > 0 {
		return ErrOTPCooldown
	}

	otp, err := generateOTP()
	if err != nil {
		return fmt.Errorf("generate otp: %w", err)
	}

	// Store OTP in Redis (10 min TTL)
	if err := s.rdb.Set(ctx, otpKey(req.Email), otp, 10*time.Minute).Err(); err != nil {
		return fmt.Errorf("store otp: %w", err)
	}

	// Set cooldown (60s)
	if err := s.rdb.Set(ctx, cooldownKey, "1", 60*time.Second).Err(); err != nil {
		return fmt.Errorf("set otp cooldown: %w", err)
	}

	// Send email (non-blocking — log failure but don't fail the request)
	if s.emailSender != nil {
		if err := s.emailSender.SendOTP(req.Email, otp); err != nil {
			// Log but don't block registration
			fmt.Printf("[email] failed to send OTP to %s: %v\n", req.Email, err)
		}
	}

	return nil
}

// verifyOTP checks the OTP from Redis and deletes it on success.
func (s *Service) verifyOTP(ctx context.Context, email, otp string) error {
	stored, err := s.rdb.Get(ctx, otpKey(email)).Result()
	if err == redis.Nil {
		return ErrInvalidOTP
	}
	if err != nil {
		return fmt.Errorf("get otp: %w", err)
	}
	if stored != otp {
		return ErrInvalidOTP
	}
	// Delete OTP after successful verification (one-time use)
	s.rdb.Del(ctx, otpKey(email))
	return nil
}

// isSomaiyaEmail returns true for @somaiya.edu addresses.
func isSomaiyaEmail(email string) bool {
	return strings.HasSuffix(strings.ToLower(email), "@somaiya.edu")
}

// Register creates a new user account after OTP verification.
func (s *Service) Register(ctx context.Context, req *RegisterRequest) (*AuthResponse, error) {
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))
	req.Username = strings.TrimSpace(req.Username)

	// Verify OTP
	if err := s.verifyOTP(ctx, req.Email, req.OTP); err != nil {
		return nil, err
	}

	// Check existing user
	var exists bool
	if err := s.db.GetContext(ctx, &exists, "SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)", req.Email); err != nil {
		return nil, fmt.Errorf("check email: %w", err)
	}
	if exists {
		return nil, ErrEmailTaken
	}

	if err := s.db.GetContext(ctx, &exists, "SELECT EXISTS(SELECT 1 FROM users WHERE username = $1)", req.Username); err != nil {
		return nil, fmt.Errorf("check username: %w", err)
	}
	if exists {
		return nil, ErrUsernameTaken
	}

	// Hash password
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("hash password: %w", err)
	}

	// Determine if Somaiya student
	somaiya := isSomaiyaEmail(req.Email)
	var premiumExpiresAt *time.Time
	var premiumPlan *string
	isPremium := somaiya

	if somaiya {
		exp := time.Now().AddDate(0, 3, 0)
		premiumExpiresAt = &exp
		plan := "institutional_free"
		premiumPlan = &plan
	}

	// Insert user
	var user models.User
	err = s.db.QueryRowxContext(ctx, `
		INSERT INTO users (username, email, password_hash, email_verified, is_premium, premium_expires_at, premium_plan)
		VALUES ($1, $2, $3, TRUE, $4, $5, $6)
		RETURNING *
	`, req.Username, req.Email, string(hash), isPremium, premiumExpiresAt, premiumPlan).StructScan(&user)
	if err != nil {
		return nil, fmt.Errorf("insert user: %w", err)
	}

	// Send Somaiya welcome email (non-blocking)
	if somaiya && s.emailSender != nil {
		go s.emailSender.SendWelcomePremium(req.Email, req.Username)
	}

	// Generate tokens
	tokens, err := s.jwtMgr.GenerateTokenPair(user.ID, user.Username)
	if err != nil {
		return nil, fmt.Errorf("generate tokens: %w", err)
	}

	return &AuthResponse{
		User:           user.ToPublic(),
		Tokens:         tokens,
		SomaiyaPremium: somaiya,
	}, nil
}

// Login authenticates a user with email and password.
func (s *Service) Login(ctx context.Context, req *LoginRequest) (*AuthResponse, error) {
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))

	var user models.User
	if err := s.db.GetContext(ctx, &user, "SELECT * FROM users WHERE email = $1", req.Email); err != nil {
		return nil, ErrInvalidCredentials
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PassHash), []byte(req.Password)); err != nil {
		return nil, ErrInvalidCredentials
	}

	// Update last active
	_, _ = s.db.ExecContext(ctx, "UPDATE users SET last_active_at = $1 WHERE id = $2", time.Now(), user.ID)

	tokens, err := s.jwtMgr.GenerateTokenPair(user.ID, user.Username)
	if err != nil {
		return nil, fmt.Errorf("generate tokens: %w", err)
	}

	return &AuthResponse{
		User:   user.ToPublic(),
		Tokens: tokens,
	}, nil
}

// RefreshTokens generates a new token pair from a valid refresh token.
func (s *Service) RefreshTokens(ctx context.Context, refreshToken string) (*TokenPair, error) {
	claims, err := s.jwtMgr.ValidateRefreshToken(refreshToken)
	if err != nil {
		return nil, err
	}

	var user models.User
	if err := s.db.GetContext(ctx, &user, "SELECT * FROM users WHERE id = $1", claims.UserID); err != nil {
		return nil, ErrUserNotFound
	}

	return s.jwtMgr.GenerateTokenPair(user.ID, user.Username)
}

// GenerateVerifyToken creates a random verification token.
func GenerateVerifyToken() (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return "CM_" + hex.EncodeToString(b), nil
}
