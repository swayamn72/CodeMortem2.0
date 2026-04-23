package auth

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"
	"time"

	"codemortem/internal/models"

	"github.com/jmoiron/sqlx"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrUserNotFound       = errors.New("user not found")
	ErrEmailTaken         = errors.New("email already registered")
	ErrUsernameTaken      = errors.New("username already taken")
	ErrInvalidCredentials = errors.New("invalid email or password")
)

// RegisterRequest is the payload for user registration.
type RegisterRequest struct {
	Username string `json:"username" validate:"required,min=3,max=30,alphanum"`
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=8,max=72"`
}

// LoginRequest is the payload for user login.
type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

// AuthResponse is returned after successful auth operations.
type AuthResponse struct {
	User   *models.UserPublic `json:"user"`
	Tokens *TokenPair         `json:"tokens"`
}

// Service handles authentication business logic.
type Service struct {
	db     *sqlx.DB
	jwtMgr *JWTManager
}

// NewService creates a new auth service.
func NewService(db *sqlx.DB, jwtMgr *JWTManager) *Service {
	return &Service{db: db, jwtMgr: jwtMgr}
}

// Register creates a new user account.
func (s *Service) Register(ctx context.Context, req *RegisterRequest) (*AuthResponse, error) {
	// Normalize
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))
	req.Username = strings.TrimSpace(req.Username)

	// Check existing user
	var exists bool
	err := s.db.GetContext(ctx, &exists, "SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)", req.Email)
	if err != nil {
		return nil, fmt.Errorf("check email: %w", err)
	}
	if exists {
		return nil, ErrEmailTaken
	}

	err = s.db.GetContext(ctx, &exists, "SELECT EXISTS(SELECT 1 FROM users WHERE username = $1)", req.Username)
	if err != nil {
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

	// Insert user
	var user models.User
	err = s.db.QueryRowxContext(ctx, `
		INSERT INTO users (username, email, password_hash)
		VALUES ($1, $2, $3)
		RETURNING *
	`, req.Username, req.Email, string(hash)).StructScan(&user)
	if err != nil {
		return nil, fmt.Errorf("insert user: %w", err)
	}

	// Generate tokens
	tokens, err := s.jwtMgr.GenerateTokenPair(user.ID, user.Username)
	if err != nil {
		return nil, fmt.Errorf("generate tokens: %w", err)
	}

	return &AuthResponse{
		User:   user.ToPublic(),
		Tokens: tokens,
	}, nil
}

// Login authenticates a user with email and password.
func (s *Service) Login(ctx context.Context, req *LoginRequest) (*AuthResponse, error) {
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))

	var user models.User
	err := s.db.GetContext(ctx, &user, "SELECT * FROM users WHERE email = $1", req.Email)
	if err != nil {
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
	err = s.db.GetContext(ctx, &user, "SELECT * FROM users WHERE id = $1", claims.UserID)
	if err != nil {
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
