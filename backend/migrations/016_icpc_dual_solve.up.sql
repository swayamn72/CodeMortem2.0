-- Migration 016: ICPC Dual Solve
-- Both players can now independently solve the same problem.
-- Points are awarded based on time elapsed (decay), stored per-player.
-- The original solved_by / solved_at columns track Player 1 (first solver).

ALTER TABLE match_cf_problems
    ADD COLUMN IF NOT EXISTS solved_by_p1     UUID REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS solved_at_p1     TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS points_awarded_p1 INT,
    ADD COLUMN IF NOT EXISTS cf_verified_p1   BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS cf_sub_id_p1     BIGINT,

    ADD COLUMN IF NOT EXISTS solved_by_p2     UUID REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS solved_at_p2     TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS points_awarded_p2 INT,
    ADD COLUMN IF NOT EXISTS cf_verified_p2   BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS cf_sub_id_p2     BIGINT;

-- Index for fast per-player lookups
CREATE INDEX IF NOT EXISTS idx_match_cf_problems_p1 ON match_cf_problems(match_id, solved_by_p1);
CREATE INDEX IF NOT EXISTS idx_match_cf_problems_p2 ON match_cf_problems(match_id, solved_by_p2);
