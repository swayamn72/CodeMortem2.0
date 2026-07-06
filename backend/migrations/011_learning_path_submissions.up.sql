-- Migration 011: Learning Path Submissions
-- Stores every authenticated submission made on a learning-path coding challenge.
-- Intentionally separate from the match `submissions` table (which requires match_id NOT NULL).

CREATE TABLE IF NOT EXISTS learning_path_submissions (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    challenge_id    VARCHAR(100) NOT NULL,   -- backend challenge id, e.g. "queue_anomalies"
    language        VARCHAR(20)  NOT NULL,   -- "cpp" | "python"
    source_code     TEXT         NOT NULL,   -- the code the user submitted
    verdict         VARCHAR(30)  NOT NULL,   -- "accepted" | "wrong_answer" | "time_limit_exceeded" | ...
    tests_passed    INT          NOT NULL DEFAULT 0,
    tests_total     INT          NOT NULL DEFAULT 0,
    execution_time  FLOAT,                   -- seconds (from judge), nullable
    memory_used     FLOAT,                   -- KB (from judge), nullable
    submitted_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Primary access pattern: user's last N submissions for a given challenge
CREATE INDEX IF NOT EXISTS idx_lp_submissions_user_challenge
    ON learning_path_submissions(user_id, challenge_id, submitted_at DESC);
