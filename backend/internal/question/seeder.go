package question

import (
	"context"
	"log"
	"sync"
	"time"

	"codemortem/internal/ai"
	"codemortem/internal/config"
)

// BankSeeder pre-generates question sets in the background so matches don't
// wait for AI generation. It ensures each rating bracket has enough sets.
type BankSeeder struct {
	repo      *Repository
	generator *ai.QuestionGenerator
	cfg       *config.AIConfig
	
	// Target: how many active sets per rating bracket
	targetSetsPerBracket int

	mu      sync.Mutex
	running bool
}

// NewBankSeeder creates a new question bank seeder.
func NewBankSeeder(repo *Repository, generator *ai.QuestionGenerator, cfg *config.AIConfig) *BankSeeder {
	return &BankSeeder{
		repo:                 repo,
		generator:            generator,
		cfg:                  cfg,
		targetSetsPerBracket: 3, // keep at least 3 sets per bracket
	}
}

// RatingBracket defines a range for which question sets are pre-generated.
type RatingBracket struct {
	Min      int
	Max      int
	AvgRating int
}

// GetBrackets returns the standard rating brackets.
func GetBrackets() []RatingBracket {
	return []RatingBracket{
		{800, 1200, 1000},     // Newbie
		{1200, 1400, 1300},    // Pupil
		{1400, 1600, 1500},    // Specialist
		{1600, 1900, 1750},    // Expert
		{1900, 2100, 2000},    // Candidate Master
		{2100, 2400, 2250},    // Master / IM
		{2400, 3500, 2600},    // GM / LGM
	}
}

// Start begins the background seeding loop.
func (s *BankSeeder) Start(ctx context.Context) {
	s.mu.Lock()
	if s.running {
		s.mu.Unlock()
		return
	}
	s.running = true
	s.mu.Unlock()

	log.Println("[bank-seeder] 🌱 starting background question bank seeder")

	// Initial seed on startup
	go s.seedAll(ctx)

	// Periodic check every 5 minutes
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			log.Println("[bank-seeder] stopped")
			return
		case <-ticker.C:
			s.seedAll(ctx)
		}
	}
}

// seedAll checks all brackets and seeds any that are below target.
func (s *BankSeeder) seedAll(ctx context.Context) {
	brackets := GetBrackets()

	for _, bracket := range brackets {
		if ctx.Err() != nil {
			return
		}

		count, err := s.repo.GetSetCount(ctx, bracket.Min, bracket.Max)
		if err != nil {
			log.Printf("[bank-seeder] error checking bracket %d-%d: %v", bracket.Min, bracket.Max, err)
			continue
		}

		if count >= s.targetSetsPerBracket {
			continue
		}

		needed := s.targetSetsPerBracket - count
		log.Printf("[bank-seeder] bracket %d-%d needs %d more sets (has %d, target %d)",
			bracket.Min, bracket.Max, needed, count, s.targetSetsPerBracket)

		for i := 0; i < needed; i++ {
			if ctx.Err() != nil {
				return
			}

			err := s.generateAndSave(ctx, bracket)
			if err != nil {
				log.Printf("[bank-seeder] ❌ failed to generate set for bracket %d-%d: %v",
					bracket.Min, bracket.Max, err)
				// Don't retry immediately, wait for next tick
				break
			}

			// Rate limit: wait between generations to avoid API rate limits
			time.Sleep(3 * time.Second)
		}
	}
}

// generateAndSave generates a full 7-question set and saves it.
func (s *BankSeeder) generateAndSave(ctx context.Context, bracket RatingBracket) error {
	log.Printf("[bank-seeder] 🎲 generating set for rating %d-%d (avg: %d)...",
		bracket.Min, bracket.Max, bracket.AvgRating)

	questions, err := s.generator.GenerateMatchSet(ctx, bracket.AvgRating)
	if err != nil {
		return err
	}

	providerModel := s.cfg.Provider + "/" + s.cfg.Model
	_, err = s.repo.SaveGeneratedMatchSet(ctx, questions, bracket.AvgRating, providerModel)
	if err != nil {
		return err
	}

	log.Printf("[bank-seeder] ✓ set generated and saved for bracket %d-%d", bracket.Min, bracket.Max)
	return nil
}

// GenerateOnDemand generates a question set on demand if none are available.
// Called during matchmaking when no pre-generated set exists.
func (s *BankSeeder) GenerateOnDemand(ctx context.Context, avgRating int) (string, error) {
	log.Printf("[bank-seeder] ⚡ on-demand generation for rating %d", avgRating)

	questions, err := s.generator.GenerateMatchSet(ctx, avgRating)
	if err != nil {
		return "", err
	}

	providerModel := s.cfg.Provider + "/" + s.cfg.Model
	qs, err := s.repo.SaveGeneratedMatchSet(ctx, questions, avgRating, providerModel)
	if err != nil {
		return "", err
	}

	return qs.ID, nil
}
