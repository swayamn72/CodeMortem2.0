package database

import (
	"context"
	"fmt"
	"log"
	"time"

	"codemortem/internal/config"

	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
)

const (
	maxRetries    = 30
	retryInterval = 2 * time.Second
)

// NewPostgres creates a new PostgreSQL connection pool.
// It retries up to maxRetries times (at retryInterval each) to handle the case
// where Postgres is still starting up (error code 57P03 — "database system is
// not yet accepting connections").
func NewPostgres(cfg *config.DatabaseConfig) (*sqlx.DB, error) {
	var (
		db  *sqlx.DB
		err error
	)

	for attempt := 1; attempt <= maxRetries; attempt++ {
		db, err = sqlx.Open("postgres", cfg.DSN())
		if err != nil {
			// DSN parse error — no point retrying.
			return nil, fmt.Errorf("failed to open postgres: %w", err)
		}

		db.SetMaxOpenConns(cfg.MaxConns)
		db.SetMaxIdleConns(cfg.MaxConns / 2)
		db.SetConnMaxLifetime(30 * time.Minute)
		db.SetConnMaxIdleTime(5 * time.Minute)

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		pingErr := db.PingContext(ctx)
		cancel()

		if pingErr == nil {
			// Successfully connected.
			return db, nil
		}

		// Close the failed pool before retrying.
		_ = db.Close()

		if attempt < maxRetries {
			log.Printf("[db] postgres not ready (attempt %d/%d): %v — retrying in %s…",
				attempt, maxRetries, pingErr, retryInterval)
			time.Sleep(retryInterval)
		} else {
			err = pingErr
		}
	}

	return nil, fmt.Errorf("failed to connect to postgres after %d attempts: %w", maxRetries, err)
}

