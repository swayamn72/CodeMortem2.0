package user

import "testing"

func TestSeedRatingFromCF(t *testing.T) {
	tests := []struct {
		cf   int
		want float64
	}{
		{0, 1000},    // unrated
		{800, 1000},  // old floor value now bands to 1000
		{1199, 1000}, // upper edge of <1200
		{1200, 1100},
		{1299, 1100},
		{1300, 1200},
		{1399, 1200},
		{1400, 1300},
		{1499, 1300},
		{1500, 1400},
		{1599, 1400},
		{1600, 1500},
		{2200, 1500},
	}

	for _, tc := range tests {
		if got := SeedRatingFromCF(tc.cf); got != tc.want {
			t.Errorf("SeedRatingFromCF(%d) = %v, want %v", tc.cf, got, tc.want)
		}
	}
}
