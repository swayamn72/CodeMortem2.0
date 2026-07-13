-- Migration 012: Challenge Test Cases
-- Stores pre-generated test cases for learning-path coding challenges.
-- Generated once at server startup (idempotent); user submissions run against these stored pairs.

CREATE TABLE IF NOT EXISTS challenge_test_cases (
    id              SERIAL       PRIMARY KEY,
    challenge_id    VARCHAR(100) NOT NULL,   -- matches challenges.Challenge.ID
    seed            INT          NOT NULL,   -- 0-indexed test number (0 to NumTests-1)
    input           TEXT         NOT NULL,   -- output of GeneratorPy(seed)
    expected_output TEXT         NOT NULL,   -- output of ReferenceCpp(input)
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (challenge_id, seed)              -- prevent duplicate generation
);

-- Primary access pattern: load all tests for a given challenge ordered by seed
CREATE INDEX IF NOT EXISTS idx_ctc_challenge
    ON challenge_test_cases(challenge_id, seed);
