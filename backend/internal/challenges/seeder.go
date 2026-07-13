package challenges

import (
	"bytes"
	"context"
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/jmoiron/sqlx"
)

// StoredTestCase holds a pre-generated (input, expected_output) pair from the DB.
type StoredTestCase struct {
	Seed           int    `db:"seed"`
	Input          string `db:"input"`
	ExpectedOutput string `db:"expected_output"`
}

// SeedAll generates and stores test cases for every registered challenge that
// doesn't already have a full set in the DB. Safe to call on every startup —
// it skips challenges where the stored count matches challenge.NumTests.
func SeedAll(ctx context.Context, db *sqlx.DB) {
	log.Println("[challenge-seeder] 🌱 starting challenge test case seeder")

	all := All()
	for id, ch := range all {
		if ctx.Err() != nil {
			return
		}
		if err := seedChallenge(ctx, db, ch); err != nil {
			log.Printf("[challenge-seeder] ❌ failed to seed %q: %v", id, err)
		}
	}

	log.Println("[challenge-seeder] ✅ seeding complete")
}

// GetStoredTestCases loads all pre-generated test cases for a challenge from the DB.
// Returns an error if the challenge hasn't been seeded yet.
func GetStoredTestCases(ctx context.Context, db *sqlx.DB, challengeID string, expected int) ([]StoredTestCase, error) {
	var tests []StoredTestCase
	err := db.SelectContext(ctx, &tests,
		`SELECT seed, input, expected_output
		 FROM challenge_test_cases
		 WHERE challenge_id = $1
		 ORDER BY seed`,
		challengeID,
	)
	if err != nil {
		return nil, fmt.Errorf("load test cases: %w", err)
	}
	if len(tests) != expected {
		return nil, fmt.Errorf("challenge %q has %d/%d test cases in DB — still seeding, try again shortly", challengeID, len(tests), expected)
	}
	return tests, nil
}

// seedChallenge seeds a single challenge if it doesn't already have all its tests.
func seedChallenge(ctx context.Context, db *sqlx.DB, ch *Challenge) error {
	// Check how many test cases already exist
	var count int
	if err := db.QueryRowContext(ctx,
		`SELECT COUNT(*) FROM challenge_test_cases WHERE challenge_id = $1`,
		ch.ID,
	).Scan(&count); err != nil {
		return fmt.Errorf("count query: %w", err)
	}

	if count >= ch.NumTests {
		log.Printf("[challenge-seeder] ✓ %q already has %d/%d tests — skipping", ch.ID, count, ch.NumTests)
		return nil
	}

	log.Printf("[challenge-seeder] generating %d tests for %q (%d already exist)...", ch.NumTests-count, ch.ID, count)

	// Write generator and reference solution to temp files
	tmpDir, err := os.MkdirTemp("", "cm_seed_"+ch.ID+"_")
	if err != nil {
		return err
	}
	defer os.RemoveAll(tmpDir)

	genPath := filepath.Join(tmpDir, "generator.py")
	if err := os.WriteFile(genPath, []byte(ch.GeneratorPy), 0644); err != nil {
		return err
	}

	refSrcPath := filepath.Join(tmpDir, "ref.cpp")
	refBinPath := filepath.Join(tmpDir, "ref")
	if err := os.WriteFile(refSrcPath, []byte(ch.ReferenceCpp), 0644); err != nil {
		return err
	}

	// Compile reference solution
	compileCtx, compileCancel := context.WithTimeout(ctx, 60*time.Second)
	defer compileCancel()
	compileOut, err := exec.CommandContext(compileCtx, "g++", "-O2", "-o", refBinPath, refSrcPath).CombinedOutput()
	if err != nil {
		return fmt.Errorf("compile reference for %q: %s: %w", ch.ID, string(compileOut), err)
	}

	// Generate and store each missing test case
	for seed := 0; seed < ch.NumTests; seed++ {
		if ctx.Err() != nil {
			return ctx.Err()
		}

		// Skip seeds that already have a row
		var exists bool
		if err := db.QueryRowContext(ctx,
			`SELECT EXISTS(SELECT 1 FROM challenge_test_cases WHERE challenge_id = $1 AND seed = $2)`,
			ch.ID, seed,
		).Scan(&exists); err != nil {
			return err
		}
		if exists {
			continue
		}

		input, expected, err := generateTestCase(ctx, genPath, refBinPath, seed)
		if err != nil {
			return fmt.Errorf("seed %d: %w", seed, err)
		}

		if _, err := db.ExecContext(ctx,
			`INSERT INTO challenge_test_cases (challenge_id, seed, input, expected_output)
			 VALUES ($1, $2, $3, $4)
			 ON CONFLICT (challenge_id, seed) DO NOTHING`,
			ch.ID, seed, input, expected,
		); err != nil {
			return fmt.Errorf("insert seed %d: %w", seed, err)
		}
	}

	log.Printf("[challenge-seeder] ✓ %q seeded with %d tests", ch.ID, ch.NumTests)
	return nil
}

// generateTestCase runs the generator for the given seed and then the reference
// solution to produce the expected output.
func generateTestCase(ctx context.Context, genPath, refBinPath string, seed int) (input, expected string, err error) {
	// Run generator
	genCtx, genCancel := context.WithTimeout(ctx, 30*time.Second)
	defer genCancel()

	genCmd := exec.CommandContext(genCtx, "python3", genPath, fmt.Sprint(seed))
	genOut, genErr := genCmd.Output()
	if genErr != nil {
		// Fallback for Windows
		genCmd = exec.CommandContext(genCtx, "python", genPath, fmt.Sprint(seed))
		genOut, genErr = genCmd.Output()
		if genErr != nil {
			return "", "", fmt.Errorf("generator (seed %d): %w", seed, genErr)
		}
	}
	input = string(genOut)

	// Run reference solution
	refCtx, refCancel := context.WithTimeout(ctx, 30*time.Second)
	defer refCancel()

	refCmd := exec.CommandContext(refCtx, refBinPath)
	refCmd.Stdin = strings.NewReader(input)
	var refOut bytes.Buffer
	refCmd.Stdout = &refOut
	if err := refCmd.Run(); err != nil {
		return "", "", fmt.Errorf("reference solution (seed %d): %w", seed, err)
	}

	return input, refOut.String(), nil
}
