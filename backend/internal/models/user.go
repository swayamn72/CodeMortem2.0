package models

import (
	"time"
)

// User represents a platform user.
type User struct {
	ID        string  `json:"id" db:"id"`
	Username  string  `json:"username" db:"username"`
	Email     string  `json:"email" db:"email"`
	PassHash  string  `json:"-" db:"password_hash"`
	GoogleID  *string `json:"-" db:"google_id"`
	AvatarURL *string `json:"avatarUrl" db:"avatar_url"`

	// Glicko-2 Rating
	Rating          float64 `json:"rating" db:"rating"`
	RatingDeviation float64 `json:"ratingDeviation" db:"rating_deviation"`
	Volatility      float64 `json:"-" db:"volatility"`

	// Codeforces
	CFHandle      *string `json:"cfHandle" db:"cf_handle"`
	CFRating      *int    `json:"cfRating" db:"cf_rating"`
	CFVerified    bool    `json:"cfVerified" db:"cf_verified"`
	CFVerifyToken *string `json:"-" db:"cf_verify_token"`

	// Stats
	MatchesPlayed       int `json:"matchesPlayed" db:"matches_played"`
	MatchesWon          int `json:"matchesWon" db:"matches_won"`
	MatchesDrawn        int `json:"matchesDrawn" db:"matches_drawn"`
	TotalProblemsSolved int `json:"totalProblemsSolved" db:"total_problems_solved"`
	SoloMatchesPlayed   int `json:"soloMatchesPlayed" db:"solo_matches_played"`
	SoloProblemsSolved  int `json:"soloProblemsSolved" db:"solo_problems_solved"`

	// Premium
	IsPremium         bool       `json:"isPremium" db:"is_premium"`
	PremiumExpiresAt  *time.Time `json:"premiumExpiresAt" db:"premium_expires_at"`
	PremiumPlan       *string    `json:"premiumPlan" db:"premium_plan"`
	EmailVerified     bool       `json:"emailVerified" db:"email_verified"`

	CreatedAt    time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt    time.Time `json:"updatedAt" db:"updated_at"`
	LastActiveAt time.Time `json:"lastActiveAt" db:"last_active_at"`
}

// HasActivePremium returns true if the user has an active (non-expired) premium subscription.
func (u *User) HasActivePremium() bool {
	if !u.IsPremium {
		return false
	}
	if u.PremiumExpiresAt == nil {
		return true // No expiry = lifetime (institutional, etc.)
	}
	return u.PremiumExpiresAt.After(time.Now())
}

// UserPublic is the public-facing user profile (no sensitive fields).
type UserPublic struct {
	ID                  string     `json:"id"`
	Username            string     `json:"username"`
	AvatarURL           *string    `json:"avatarUrl"`
	Rating              float64    `json:"rating"`
	RatingDeviation     float64    `json:"ratingDeviation"`
	CFHandle            *string    `json:"cfHandle"`
	CFRating            *int       `json:"cfRating"`
	CFVerified          bool       `json:"cfVerified"`
	MatchesPlayed       int        `json:"matchesPlayed"`
	MatchesWon          int        `json:"matchesWon"`
	MatchesDrawn        int        `json:"matchesDrawn"`
	TotalProblemsSolved int        `json:"totalProblemsSolved"`
	SoloMatchesPlayed   int        `json:"soloMatchesPlayed"`
	SoloProblemsSolved  int        `json:"soloProblemsSolved"`
	RankTitle           string     `json:"rankTitle"`
	Email               string     `json:"email"`
	IsPremium           bool       `json:"isPremium"`
	PremiumExpiresAt    *time.Time `json:"premiumExpiresAt"`
	PremiumPlan         *string    `json:"premiumPlan"`
	EmailVerified       bool       `json:"emailVerified"`
	CreatedAt           time.Time  `json:"createdAt"`
}

// ToPublic converts a User to a public profile.
func (u *User) ToPublic() *UserPublic {
	return &UserPublic{
		ID:                  u.ID,
		Username:            u.Username,
		AvatarURL:           u.AvatarURL,
		Rating:              u.Rating,
		RatingDeviation:     u.RatingDeviation,
		CFHandle:            u.CFHandle,
		CFRating:            u.CFRating,
		CFVerified:          u.CFVerified,
		MatchesPlayed:       u.MatchesPlayed,
		MatchesWon:          u.MatchesWon,
		MatchesDrawn:        u.MatchesDrawn,
		TotalProblemsSolved: u.TotalProblemsSolved,
		SoloMatchesPlayed:   u.SoloMatchesPlayed,
		SoloProblemsSolved:  u.SoloProblemsSolved,
		RankTitle:           GetRankTitle(u.Rating),
		Email:               u.Email,
		IsPremium:           u.HasActivePremium(),
		PremiumExpiresAt:    u.PremiumExpiresAt,
		PremiumPlan:         u.PremiumPlan,
		EmailVerified:       u.EmailVerified,
		CreatedAt:           u.CreatedAt,
	}
}

// GetRankTitle returns CF-style rank title based on rating.
func GetRankTitle(rating float64) string {
	switch {
	case rating < 1200:
		return "Newbie"
	case rating < 1400:
		return "Pupil"
	case rating < 1600:
		return "Specialist"
	case rating < 1900:
		return "Expert"
	case rating < 2100:
		return "Candidate Master"
	case rating < 2300:
		return "Master"
	case rating < 2400:
		return "International Master"
	case rating < 2600:
		return "Grandmaster"
	case rating < 3000:
		return "International Grandmaster"
	default:
		return "Legendary Grandmaster"
	}
}

// GetRankColor returns hex color for rank display.
func GetRankColor(rating float64) string {
	switch {
	case rating < 1200:
		return "#808080" // Gray
	case rating < 1400:
		return "#008000" // Green
	case rating < 1600:
		return "#03a89e" // Cyan
	case rating < 1900:
		return "#0000ff" // Blue
	case rating < 2100:
		return "#aa00aa" // Violet
	case rating < 2300:
		return "#ff8c00" // Orange
	case rating < 2400:
		return "#ff8c00" // Orange
	case rating < 2600:
		return "#ff0000" // Red
	case rating < 3000:
		return "#ff0000" // Red
	default:
		return "#aa0000" // Dark Red
	}
}

// UserModuleProgress tracks which lessons a user has completed in a specific module.
type UserModuleProgress struct {
	UserID           string    `json:"userId" db:"user_id"`
	ModuleID         string    `json:"moduleId" db:"module_id"`
	CompletedLessons []string  `json:"completedLessons" db:"completed_lessons"`
	UpdatedAt        time.Time `json:"updatedAt" db:"updated_at"`
}

// PracticeSession represents a logged Play Solo practice session.
type PracticeSession struct {
	ID             string     `json:"id" db:"id"`
	UserID         string     `json:"userId" db:"user_id"`
	MatchID        *string    `json:"matchId" db:"match_id"`
	DurationSecs   int        `json:"durationSecs" db:"duration_secs"`
	RatingMin      int        `json:"ratingMin" db:"rating_min"`
	RatingMax      int        `json:"ratingMax" db:"rating_max"`
	NumProblems    int        `json:"numProblems" db:"num_problems"`
	ProblemsSolved int        `json:"problemsSolved" db:"problems_solved"`
	StartedAt      time.Time  `json:"startedAt" db:"started_at"`
	EndedAt        *time.Time `json:"endedAt" db:"ended_at"`
}
