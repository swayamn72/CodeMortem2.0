CREATE TABLE IF NOT EXISTS practice_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    match_id        UUID REFERENCES matches(id),
    duration_secs   INT NOT NULL,
    rating_min      INT NOT NULL,
    rating_max      INT NOT NULL,
    num_problems    INT NOT NULL,
    problems_solved INT DEFAULT 0,
    started_at      TIMESTAMPTZ DEFAULT NOW(),
    ended_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_practice_sessions_user ON practice_sessions(user_id, started_at DESC);
