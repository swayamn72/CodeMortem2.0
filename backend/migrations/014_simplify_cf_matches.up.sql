-- Migration 014: Simplify CF Matchmaking
-- Replaces the complex questions/question_sets/match_questions chain
-- with a single lean match_cf_problems table for CF matches.

-- New lean table: tracks CF problems used in a match + solve state
CREATE TABLE IF NOT EXISTS match_cf_problems (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id         UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    problem_index    INT NOT NULL,                  -- 1-based position in match
    cf_contest_id    INT NOT NULL,
    cf_problem_index VARCHAR(5) NOT NULL,           -- e.g. "A", "B1", "C"
    cf_name          TEXT NOT NULL,
    cf_rating        INT NOT NULL,
    cf_url           TEXT NOT NULL,
    cf_tags          TEXT[] DEFAULT '{}',
    -- Solve tracking
    solved_by        UUID REFERENCES users(id),
    solved_at        TIMESTAMPTZ,
    cf_verified      BOOLEAN DEFAULT FALSE,
    cf_submission_id BIGINT,
    points_value     INT NOT NULL DEFAULT 100,
    UNIQUE(match_id, problem_index)
);

CREATE INDEX IF NOT EXISTS idx_match_cf_problems_match ON match_cf_problems(match_id);

-- Allow question_set_id to be NULL for CF-native matches (they don't use question_sets)
ALTER TABLE matches ALTER COLUMN question_set_id DROP NOT NULL;
