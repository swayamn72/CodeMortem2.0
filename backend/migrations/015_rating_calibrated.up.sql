-- Migration 015: one-time CF rating calibration flag
ALTER TABLE users ADD COLUMN IF NOT EXISTS rating_calibrated BOOLEAN NOT NULL DEFAULT FALSE;

-- Backfill: users already linked/verified to CF have effectively been calibrated once;
-- mark them so match-earned rating is never re-seeded from CF.
UPDATE users SET rating_calibrated = TRUE WHERE cf_verified = TRUE OR cf_rating IS NOT NULL;
