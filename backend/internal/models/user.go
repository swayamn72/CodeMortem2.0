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

	CreatedAt    time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt    time.Time `json:"updatedAt" db:"updated_at"`
	LastActiveAt time.Time `json:"lastActiveAt" db:"last_active_at"`
}

// UserPublic is the public-facing user profile (no sensitive fields).
type UserPublic struct {
	ID                  string  `json:"id"`
	Username            string  `json:"username"`
	AvatarURL           *string `json:"avatarUrl"`
	Rating              float64 `json:"rating"`
	RatingDeviation     float64 `json:"ratingDeviation"`
	CFHandle            *string `json:"cfHandle"`
	CFRating            *int    `json:"cfRating"`
	CFVerified          bool    `json:"cfVerified"`
	MatchesPlayed       int     `json:"matchesPlayed"`
	MatchesWon          int     `json:"matchesWon"`
	MatchesDrawn        int     `json:"matchesDrawn"`
	TotalProblemsSolved int     `json:"totalProblemsSolved"`
	RankTitle           string  `json:"rankTitle"`
	Email               string  `json:"email"`
	CreatedAt           time.Time `json:"createdAt"`
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
		RankTitle:           GetRankTitle(u.Rating),
		Email:               u.Email,
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
