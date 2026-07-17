package user

// SeedRatingFromCF maps a Codeforces rating to the CodeMortem seed ladder.
// This is applied exactly once, the first time a user verifies their CF account;
// afterwards only match results change the CodeMortem rating.
//
// Bands (tighter in the mid range so nearby CF ratings still match easily):
//
//	CF < 1200 (incl. unrated cf_rating 0) -> 1000
//	1200-1299                             -> 1100
//	1300-1399                             -> 1200
//	1400-1499                             -> 1300
//	1500-1599                             -> 1400
//	>= 1600                               -> 1500
func SeedRatingFromCF(cfRating int) float64 {
	switch {
	case cfRating < 1200:
		return 1000
	case cfRating < 1300:
		return 1100
	case cfRating < 1400:
		return 1200
	case cfRating < 1500:
		return 1300
	case cfRating < 1600:
		return 1400
	default:
		return 1500
	}
}
