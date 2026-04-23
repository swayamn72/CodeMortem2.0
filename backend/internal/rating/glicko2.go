package rating

import (
	"math"
)

// Glicko-2 system constants
const (
	DefaultRating    = 1500.0
	DefaultDeviation = 350.0
	DefaultVolatility = 0.06
	SystemTau         = 0.5 // constrains volatility change
	ConvergenceTol    = 0.000001
)

// Player represents a player's Glicko-2 rating state.
type Player struct {
	Rating    float64 // Glicko-1 scale (e.g., 1500)
	Deviation float64 // Glicko-1 RD (e.g., 350)
	Volatility float64 // σ (e.g., 0.06)
}

// Result represents the outcome of a single game.
type Result struct {
	Opponent *Player
	Score    float64 // 1.0 = win, 0.5 = draw, 0.0 = loss
}

// RatingDelta contains the rating change details after a match.
type RatingDelta struct {
	NewRating    float64
	NewDeviation float64
	NewVolatility float64
	Delta         float64 // rating change
}

// toGlicko2 converts from Glicko-1 to Glicko-2 scale.
func toGlicko2Rating(r float64) float64 {
	return (r - 1500.0) / 173.7178
}

// toGlicko2RD converts RD from Glicko-1 to Glicko-2 scale.
func toGlicko2RD(rd float64) float64 {
	return rd / 173.7178
}

// fromGlicko2Rating converts from Glicko-2 back to Glicko-1 scale.
func fromGlicko2Rating(mu float64) float64 {
	return mu*173.7178 + 1500.0
}

// fromGlicko2RD converts RD from Glicko-2 back to Glicko-1 scale.
func fromGlicko2RD(phi float64) float64 {
	return phi * 173.7178
}

// g computes the g function used in Glicko-2.
func g(phi float64) float64 {
	return 1.0 / math.Sqrt(1.0+3.0*phi*phi/(math.Pi*math.Pi))
}

// e computes the expected score.
func e(mu, muj, phij float64) float64 {
	return 1.0 / (1.0 + math.Exp(-g(phij)*(mu-muj)))
}

// Calculate computes the new rating for a player after a set of results.
// This implements the full Glicko-2 algorithm (Mark Glickman, 2012).
func Calculate(player *Player, results []Result) *RatingDelta {
	if len(results) == 0 {
		// No games: only RD increases (rating period decay)
		phi := toGlicko2RD(player.Deviation)
		newPhi := math.Sqrt(phi*phi + player.Volatility*player.Volatility)
		newRD := fromGlicko2RD(newPhi)
		if newRD > DefaultDeviation {
			newRD = DefaultDeviation
		}
		return &RatingDelta{
			NewRating:     player.Rating,
			NewDeviation:  newRD,
			NewVolatility: player.Volatility,
			Delta:         0,
		}
	}

	mu := toGlicko2Rating(player.Rating)
	phi := toGlicko2RD(player.Deviation)
	sigma := player.Volatility

	// Step 3: Compute variance (v)
	vInv := 0.0
	delta := 0.0

	for _, r := range results {
		muj := toGlicko2Rating(r.Opponent.Rating)
		phij := toGlicko2RD(r.Opponent.Deviation)
		gPhij := g(phij)
		eMu := e(mu, muj, phij)
		vInv += gPhij * gPhij * eMu * (1.0 - eMu)
		delta += gPhij * (r.Score - eMu)
	}

	v := 1.0 / vInv
	delta = v * delta // estimated improvement

	// Step 4: Compute new volatility (σ')
	newSigma := computeNewVolatility(sigma, phi, v, delta)

	// Step 5: Update RD to pre-rating period value
	phiStar := math.Sqrt(phi*phi + newSigma*newSigma)

	// Step 6: Update rating and RD
	newPhi := 1.0 / math.Sqrt(1.0/(phiStar*phiStar)+1.0/v)
	newMu := mu + newPhi*newPhi*delta/v

	newRating := fromGlicko2Rating(newMu)
	newRD := fromGlicko2RD(newPhi)

	// Clamp RD
	if newRD > DefaultDeviation {
		newRD = DefaultDeviation
	}
	if newRD < 30 {
		newRD = 30
	}

	// Clamp rating floor
	if newRating < 100 {
		newRating = 100
	}

	return &RatingDelta{
		NewRating:     newRating,
		NewDeviation:  newRD,
		NewVolatility: newSigma,
		Delta:         newRating - player.Rating,
	}
}

// computeNewVolatility uses the Illinois algorithm to solve for σ'.
func computeNewVolatility(sigma, phi, v, delta float64) float64 {
	a := math.Log(sigma * sigma)
	tau := SystemTau

	f := func(x float64) float64 {
		ex := math.Exp(x)
		d2 := delta * delta
		p2 := phi * phi
		num1 := ex * (d2 - p2 - v - ex)
		den1 := 2.0 * (p2 + v + ex) * (p2 + v + ex)
		return num1/den1 - (x-a)/(tau*tau)
	}

	// Initial bounds
	A := a
	var B float64
	if delta*delta > phi*phi+v {
		B = math.Log(delta*delta - phi*phi - v)
	} else {
		k := 1.0
		for f(a-k*tau) < 0 {
			k++
		}
		B = a - k*tau
	}

	// Illinois algorithm
	fA := f(A)
	fB := f(B)

	for math.Abs(B-A) > ConvergenceTol {
		C := A + (A-B)*fA/(fB-fA)
		fC := f(C)

		if fC*fB <= 0 {
			A = B
			fA = fB
		} else {
			fA /= 2.0
		}
		B = C
		fB = fC
	}

	return math.Exp(A / 2.0)
}

// CalculateMatch is a convenience function for a single 1v1 match.
func CalculateMatch(p1, p2 *Player, p1Score float64) (delta1, delta2 *RatingDelta) {
	p2Score := 1.0 - p1Score
	if p1Score == 0.5 {
		p2Score = 0.5
	}

	delta1 = Calculate(p1, []Result{{Opponent: p2, Score: p1Score}})
	delta2 = Calculate(p2, []Result{{Opponent: p1, Score: p2Score}})

	return delta1, delta2
}

// InitialRatingFromCF derives an initial CodeMortem rating from a Codeforces rating.
func InitialRatingFromCF(cfRating int) float64 {
	switch {
	case cfRating <= 0:
		return DefaultRating
	case cfRating < 1200:
		return 1200
	case cfRating < 1400:
		return 1400
	case cfRating < 1600:
		return 1500
	case cfRating < 1900:
		return 1600
	case cfRating < 2100:
		return 1800
	case cfRating < 2400:
		return 2000
	default:
		return 2200 // capped
	}
}
