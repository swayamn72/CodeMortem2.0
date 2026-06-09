package auth

import (
	"context"
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
	"strings"
	"time"

	"codemortem/internal/models"
)

// GoogleAuthRequest is the payload for Google OAuth sign-in.
type GoogleAuthRequest struct {
	IDToken string `json:"idToken"`
}

// googleTokenInfo holds verified info from Google's tokeninfo endpoint.
type googleTokenInfo struct {
	Sub           string `json:"sub"`   // Google user ID
	Email         string `json:"email"` // verified email
	EmailVerified string `json:"email_verified"`
	Name          string `json:"name"`
	Picture       string `json:"picture"`
	Aud           string `json:"aud"` // must match our client ID
}

// GoogleLogin verifies a Google ID token and returns CodeMortem JWT tokens,
// creating the user account if it doesn't exist yet.
func (s *Service) GoogleLogin(ctx context.Context, req *GoogleAuthRequest) (*AuthResponse, error) {
	// Verify token with Google's tokeninfo endpoint (no extra library needed)
	info, err := verifyGoogleIDToken(req.IDToken)
	if err != nil {
		return nil, fmt.Errorf("invalid google token: %w", err)
	}

	// Validate audience matches our client ID
	if s.googleClientID != "" && info.Aud != s.googleClientID {
		return nil, fmt.Errorf("token audience mismatch")
	}

	if info.EmailVerified != "true" {
		return nil, fmt.Errorf("google email not verified")
	}

	email := strings.ToLower(strings.TrimSpace(info.Email))

	// ── Step 1: look up by google_id (fastest path — returning user) ──────────
	var user models.User
	err = s.db.GetContext(ctx, &user,
		"SELECT * FROM users WHERE google_id = $1 LIMIT 1", info.Sub)

	if err == nil {
		// Returning Google user — just update last active and return
		_, _ = s.db.ExecContext(ctx, "UPDATE users SET last_active_at = $1 WHERE id = $2", time.Now(), user.ID)
		tokens, err := s.jwtMgr.GenerateTokenPair(user.ID, user.Username)
		if err != nil {
			return nil, fmt.Errorf("generate tokens: %w", err)
		}
		return &AuthResponse{User: user.ToPublic(), Tokens: tokens}, nil
	}

	// ── Step 2: look up by email (existing email-only user linking Google) ────
	err = s.db.GetContext(ctx, &user,
		"SELECT * FROM users WHERE email = $1 LIMIT 1", email)

	if err == nil {
		// Existing email account — link google_id and mark email verified
		_, _ = s.db.ExecContext(ctx,
			"UPDATE users SET google_id = $1, avatar_url = COALESCE(NULLIF(avatar_url,''), $2), email_verified = TRUE, last_active_at = $3 WHERE id = $4",
			info.Sub, info.Picture, time.Now(), user.ID)
		user.GoogleID = &info.Sub
		tokens, err := s.jwtMgr.GenerateTokenPair(user.ID, user.Username)
		if err != nil {
			return nil, fmt.Errorf("generate tokens: %w", err)
		}
		return &AuthResponse{User: user.ToPublic(), Tokens: tokens}, nil
	}

	// ── Step 3: brand-new user — create account ───────────────────────────────
	username, usernameErr := s.generateUniqueUsername(ctx, info.Name)
	if usernameErr != nil {
		return nil, fmt.Errorf("generate username: %w", usernameErr)
	}

	// Determine if Somaiya student
	somaiya := isSomaiyaEmail(email)
	var premiumExpiresAt *time.Time
	var premiumPlan *string
	isPremium := somaiya
	if somaiya {
		exp := time.Now().AddDate(0, 3, 0)
		premiumExpiresAt = &exp
		plan := "institutional_free"
		premiumPlan = &plan
	}

	// Use ON CONFLICT DO NOTHING to prevent race-condition duplicates,
	// then re-fetch to get the actual row.
	avatarURL := info.Picture
	_, err = s.db.ExecContext(ctx, `
		INSERT INTO users (username, email, password_hash, google_id, avatar_url, email_verified, is_premium, premium_expires_at, premium_plan)
		VALUES ($1, $2, '', $3, $4, TRUE, $5, $6, $7)
		ON CONFLICT (email) DO UPDATE
		  SET google_id      = EXCLUDED.google_id,
		      avatar_url     = COALESCE(NULLIF(users.avatar_url,''), EXCLUDED.avatar_url),
		      email_verified = TRUE,
		      last_active_at = NOW()
	`, username, email, info.Sub, avatarURL, isPremium, premiumExpiresAt, premiumPlan)
	if err != nil {
		return nil, fmt.Errorf("upsert google user: %w", err)
	}

	// Re-fetch the (possibly just-created, possibly already-existed) user
	if err = s.db.GetContext(ctx, &user, "SELECT * FROM users WHERE email = $1 LIMIT 1", email); err != nil {
		return nil, fmt.Errorf("fetch user after upsert: %w", err)
	}

	// Send Somaiya welcome email for genuinely new users (non-blocking)
	if somaiya && s.emailSender != nil {
		go s.emailSender.SendWelcomePremium(email, user.Username)
	}

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

// generateUniqueUsername creates a URL-safe username from the Google display name.
func (s *Service) generateUniqueUsername(ctx context.Context, displayName string) (string, error) {
	// Sanitize: keep only alphanumeric chars, replace spaces with underscores
	base := strings.Map(func(r rune) rune {
		if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') {
			return r
		}
		return '_'
	}, displayName)

	// Collapse repeated underscores and trim
	for strings.Contains(base, "__") {
		base = strings.ReplaceAll(base, "__", "_")
	}
	base = strings.Trim(base, "_")

	if len(base) < 3 {
		base = "user"
	}
	if len(base) > 20 {
		base = base[:20]
	}

	// Try username, then username + random suffix
	for attempts := 0; attempts < 10; attempts++ {
		candidate := base
		if attempts > 0 {
			candidate = fmt.Sprintf("%s%d", base, rand.Intn(9000)+1000)
		}

		var exists bool
		err := s.db.GetContext(ctx, &exists,
			"SELECT EXISTS(SELECT 1 FROM users WHERE username = $1)", candidate)
		if err != nil {
			return "", err
		}
		if !exists {
			return candidate, nil
		}
	}

	// Fallback: use google sub suffix
	return fmt.Sprintf("user%d", rand.Intn(999999)), nil
}

// verifyGoogleIDToken calls Google's tokeninfo endpoint to validate the ID token.
func verifyGoogleIDToken(idToken string) (*googleTokenInfo, error) {
	url := "https://oauth2.googleapis.com/tokeninfo?id_token=" + idToken
	resp, err := http.Get(url) //nolint:gosec
	if err != nil {
		return nil, fmt.Errorf("google tokeninfo request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("google tokeninfo returned status %d", resp.StatusCode)
	}

	var info googleTokenInfo
	if err := json.NewDecoder(resp.Body).Decode(&info); err != nil {
		return nil, fmt.Errorf("decode tokeninfo: %w", err)
	}

	if info.Sub == "" || info.Email == "" {
		return nil, fmt.Errorf("incomplete token info from google")
	}

	return &info, nil
}
