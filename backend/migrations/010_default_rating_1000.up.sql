-- Migration 010: Change default rating from 1500 to 1000
-- Update the column default for new users
ALTER TABLE users
  ALTER COLUMN rating SET DEFAULT 1000.0;

-- Update any existing users who still have the old Glicko-2 default (1500)
-- and haven't played any matches, resetting them to 1000
UPDATE users
SET rating = 1000.0
WHERE rating = 1500.0
  AND matches_played = 0;
