package matchmaking

import (
	"math"
	"testing"
	"time"

	"codemortem/internal/config"
)

func defaultMatchConfig() *config.MatchConfig {
	return &config.MatchConfig{
		RatingRange:    200,
		RatingExpand:   50,
		ExpandInterval: 10 * time.Second,
		MaxRatingRange: 500,
		UnboundedAfter: 60 * time.Second,
	}
}

func TestAcceptableRange(t *testing.T) {
	cfg := defaultMatchConfig()

	tests := []struct {
		name string
		wait time.Duration
		want float64
	}{
		{"initial", 0, 200},
		{"one step", 10 * time.Second, 250},
		{"three steps", 30 * time.Second, 350},
		{"five steps just before unbounded", 59 * time.Second, 450},
		{"unbounded at threshold", 60 * time.Second, math.MaxFloat64},
		{"unbounded after threshold", 5 * time.Minute, math.MaxFloat64},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got := acceptableRange(cfg, tc.wait)
			if got != tc.want {
				t.Errorf("acceptableRange(wait=%s) = %v, want %v", tc.wait, got, tc.want)
			}
		})
	}
}

// TestAcceptableRange_SoftCap verifies the MaxRatingRange soft cap applies during
// the closest-preferred phase when the window would otherwise grow past it before
// the unbounded threshold is reached.
func TestAcceptableRange_SoftCap(t *testing.T) {
	cfg := &config.MatchConfig{
		RatingRange:    200,
		RatingExpand:   50,
		ExpandInterval: 10 * time.Second,
		MaxRatingRange: 500,
		UnboundedAfter: 5 * time.Minute, // far out, so the cap is reachable first
	}
	// 70s -> 7 steps -> 200 + 350 = 550, capped to 500.
	if got := acceptableRange(cfg, 70*time.Second); got != 500 {
		t.Errorf("acceptableRange(wait=70s) = %v, want 500 (soft cap)", got)
	}
}

// TestAcceptableRange_UnblocksLargeGap verifies the reported 1v1 bug is fixed:
// an unrated CF account (internal rating 800) and a CF-1456 account (diff 656)
// can never pair while the window is capped at 500, but do pair once the window
// is unbounded after the wait threshold.
func TestAcceptableRange_UnblocksLargeGap(t *testing.T) {
	cfg := defaultMatchConfig()
	const diff = 656.0

	if early := acceptableRange(cfg, 30*time.Second); diff <= early {
		t.Fatalf("expected diff %v to exceed early range %v (should not pair yet)", diff, early)
	}
	if late := acceptableRange(cfg, 60*time.Second); diff > late {
		t.Fatalf("expected diff %v to be within unbounded range %v (should pair)", diff, late)
	}
}
