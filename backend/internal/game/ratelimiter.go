package game

import (
	"sync"
	"time"
)

// SubmissionRateLimiter tracks submission rate limits per user per match.
type SubmissionRateLimiter struct {
	// Map of userID -> last submission time
	submissions map[string]time.Time
	mu          sync.RWMutex
	// Max submissions per minute
	maxPerMinute int
	// Time window
	window time.Duration
}

// NewSubmissionRateLimiter creates a new submission rate limiter.
func NewSubmissionRateLimiter(maxPerMinute int) *SubmissionRateLimiter {
	limiter := &SubmissionRateLimiter{
		submissions:  make(map[string]time.Time),
		maxPerMinute: maxPerMinute,
		window:       1 * time.Minute,
	}

	// Cleanup goroutine to remove old entries
	go func() {
		ticker := time.NewTicker(5 * time.Minute)
		defer ticker.Stop()
		for range ticker.C {
			limiter.cleanup()
		}
	}()

	return limiter
}

// IsAllowed checks if a user can make a submission now.
// It tracks the last submission time and enforces rate limiting.
func (rl *SubmissionRateLimiter) IsAllowed(userID string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	lastSubmission, exists := rl.submissions[userID]

	if !exists {
		rl.submissions[userID] = now
		return true
	}

	// Allow one submission per 3 seconds (20 submissions per minute max)
	if now.Sub(lastSubmission) >= 3*time.Second {
		rl.submissions[userID] = now
		return true
	}

	return false
}

// cleanup removes entries older than the time window
func (rl *SubmissionRateLimiter) cleanup() {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	for userID, lastSubmission := range rl.submissions {
		if now.Sub(lastSubmission) > rl.window {
			delete(rl.submissions, userID)
		}
	}
}
