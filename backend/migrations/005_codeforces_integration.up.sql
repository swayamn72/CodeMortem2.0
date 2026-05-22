-- Migration 005: Codeforces Integration
-- Changes match system from AI-generated to CF-sourced problems (5 questions per match)

-- Add CF problem fields to questions table
ALTER TABLE questions ADD COLUMN IF NOT EXISTS cf_contest_id INT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS cf_index VARCHAR(5);
ALTER TABLE questions ADD COLUMN IF NOT EXISTS cf_url TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS cf_rating INT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'ai';

-- Track CF submission verification in match_questions
ALTER TABLE match_questions ADD COLUMN IF NOT EXISTS cf_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE match_questions ADD COLUMN IF NOT EXISTS cf_submission_id BIGINT;

-- Allow player2_id to be NULL (already supported for solo, but ensure schema matches)
ALTER TABLE matches ALTER COLUMN player2_id DROP NOT NULL;

-- Index for CF problem lookups
CREATE INDEX IF NOT EXISTS idx_questions_cf ON questions(cf_contest_id, cf_index);
CREATE INDEX IF NOT EXISTS idx_questions_source ON questions(source, difficulty);
CREATE UNIQUE INDEX IF NOT EXISTS idx_questions_cf_unique ON questions(cf_contest_id, cf_index) WHERE cf_contest_id IS NOT NULL;
