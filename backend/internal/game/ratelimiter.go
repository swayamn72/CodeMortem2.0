package game

import (
	"sync"
	"time"
)

// SubmissionRateLimiter tracks submission rate limits per user using a sliding window.
type SubmissionRateLimiter struct {
	// Map of userID -> submission timestamps within the current window
	submissions map[string][]time.Time
	mu          sync.Mutex
	// Max submissions per window
	maxPerWindow int
	// Time window
	window time.Duration
	// Minimum cooldown between consecutive submissions
	cooldown time.Duration
}

// NewSubmissionRateLimiter creates a new submission rate limiter.
// maxPerMinute sets the maximum submissions allowed per minute.
// Each submission also has a minimum 3-second cooldown from the previous one.
func NewSubmissionRateLimiter(maxPerMinute int) *SubmissionRateLimiter {
	limiter := &SubmissionRateLimiter{
		submissions:  make(map[string][]time.Time),
		maxPerWindow: maxPerMinute,
		window:       1 * time.Minute,
		cooldown:     3 * time.Second,
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
// Enforces both: (1) a minimum 3-second cooldown between submissions, and
// (2) a maximum of maxPerWindow submissions within the sliding window.
func (rl *SubmissionRateLimiter) IsAllowed(userID string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	cutoff := now.Add(-rl.window)

	// Prune old timestamps outside the window
	timestamps := rl.submissions[userID]
	valid := timestamps[:0]
	for _, t := range timestamps {
		if t.After(cutoff) {
			valid = append(valid, t)
		}
	}
	rl.submissions[userID] = valid

	// Check cooldown: last submission must be at least 3 seconds ago
	if len(valid) > 0 && now.Sub(valid[len(valid)-1]) < rl.cooldown {
		return false
	}

	// Check window limit
	if len(valid) >= rl.maxPerWindow {
		return false
	}

	// Record this submission
	rl.submissions[userID] = append(valid, now)
	return true
}

// cleanup removes all entries for users with no recent submissions
func (rl *SubmissionRateLimiter) cleanup() {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	cutoff := time.Now().Add(-rl.window)
	for userID, timestamps := range rl.submissions {
		valid := timestamps[:0]
		for _, t := range timestamps {
			if t.After(cutoff) {
				valid = append(valid, t)
			}
		}
		if len(valid) == 0 {
			delete(rl.submissions, userID)
		} else {
			rl.submissions[userID] = valid
		}
	}
}
