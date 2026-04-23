-- CodeMortem Database Schema
-- Migration 001: Initial Setup

-- ==================== USERS ====================
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username        VARCHAR(30) UNIQUE NOT NULL,
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   TEXT NOT NULL,
    avatar_url      TEXT,
    
    -- Rating (Glicko-2)
    rating          FLOAT DEFAULT 1500.0,
    rating_deviation FLOAT DEFAULT 350.0,
    volatility      FLOAT DEFAULT 0.06,
    
    -- Codeforces linking
    cf_handle       VARCHAR(50),
    cf_rating       INT,
    cf_verified     BOOLEAN DEFAULT FALSE,
    cf_verify_token VARCHAR(64),
    
    -- Stats
    matches_played  INT DEFAULT 0,
    matches_won     INT DEFAULT 0,
    matches_drawn   INT DEFAULT 0,
    total_problems_solved INT DEFAULT 0,
    
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    last_active_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== QUESTIONS ====================
CREATE TABLE IF NOT EXISTS questions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           VARCHAR(200) NOT NULL,
    slug            VARCHAR(200) UNIQUE NOT NULL,
    
    statement       TEXT NOT NULL,
    input_format    TEXT NOT NULL,
    output_format   TEXT NOT NULL,
    constraints     TEXT NOT NULL,
    examples        JSONB NOT NULL DEFAULT '[]',
    
    difficulty      INT NOT NULL,
    tags            TEXT[] DEFAULT '{}',
    
    generated_by    VARCHAR(50) NOT NULL DEFAULT 'manual',
    generation_prompt TEXT,
    human_verified  BOOLEAN DEFAULT FALSE,
    verification_notes TEXT,
    
    times_used      INT DEFAULT 0,
    avg_solve_time  FLOAT,
    solve_rate      FLOAT,
    
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== TEST CASES ====================
CREATE TABLE IF NOT EXISTS test_cases (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id     UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    
    input           TEXT NOT NULL,
    expected_output TEXT NOT NULL,
    is_sample       BOOLEAN DEFAULT FALSE,
    is_edge_case    BOOLEAN DEFAULT FALSE,
    
    generator_code  TEXT,
    checker_code    TEXT,
    
    ordinal         INT NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(question_id, ordinal)
);

-- ==================== QUESTION SETS ====================
CREATE TABLE IF NOT EXISTS question_sets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rating_min      INT NOT NULL,
    rating_max      INT NOT NULL,
    
    q1_id           UUID REFERENCES questions(id),
    q2_id           UUID REFERENCES questions(id),
    q3_id           UUID REFERENCES questions(id),
    q4_id           UUID REFERENCES questions(id),
    q5_id           UUID REFERENCES questions(id),
    q6_id           UUID REFERENCES questions(id),
    q7_id           UUID REFERENCES questions(id),
    
    times_used      INT DEFAULT 0,
    is_active       BOOLEAN DEFAULT TRUE,
    generated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== MATCHES ====================
CREATE TABLE IF NOT EXISTS matches (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    player1_id      UUID NOT NULL REFERENCES users(id),
    player2_id      UUID NOT NULL REFERENCES users(id),
    question_set_id UUID NOT NULL REFERENCES question_sets(id),
    
    status          VARCHAR(20) NOT NULL DEFAULT 'in_progress',
    
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at        TIMESTAMPTZ,
    duration_secs   INT DEFAULT 1800,
    
    winner_id       UUID REFERENCES users(id),
    player1_score   INT DEFAULT 0,
    player2_score   INT DEFAULT 0,
    
    player1_rating_before   FLOAT,
    player1_rating_after    FLOAT,
    player1_delta           FLOAT,
    player2_rating_before   FLOAT,
    player2_rating_after    FLOAT,
    player2_delta           FLOAT,
    
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== MATCH QUESTIONS ====================
CREATE TABLE IF NOT EXISTS match_questions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id        UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    question_id     UUID NOT NULL REFERENCES questions(id),
    question_index  INT NOT NULL,
    points_value    INT NOT NULL,
    
    solved_by       UUID REFERENCES users(id),
    solved_at       TIMESTAMPTZ,
    
    unlocked_at     TIMESTAMPTZ NOT NULL,
    
    UNIQUE(match_id, question_index)
);

-- ==================== SUBMISSIONS ====================
CREATE TABLE IF NOT EXISTS submissions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id        UUID NOT NULL REFERENCES matches(id),
    question_id     UUID NOT NULL REFERENCES questions(id),
    user_id         UUID NOT NULL REFERENCES users(id),
    
    language        VARCHAR(20) NOT NULL,
    source_code     TEXT NOT NULL,
    
    verdict         VARCHAR(30) NOT NULL DEFAULT 'pending',
    execution_time  FLOAT,
    memory_used     INT,
    
    test_results    JSONB,
    tests_passed    INT DEFAULT 0,
    tests_total     INT DEFAULT 0,
    
    points_awarded  INT DEFAULT 0,
    is_first_solve  BOOLEAN DEFAULT FALSE,
    
    submitted_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== RATING HISTORY ====================
CREATE TABLE IF NOT EXISTS rating_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    match_id        UUID NOT NULL REFERENCES matches(id),
    
    rating_before   FLOAT NOT NULL,
    rating_after    FLOAT NOT NULL,
    rd_before       FLOAT NOT NULL,
    rd_after        FLOAT NOT NULL,
    delta           FLOAT NOT NULL,
    
    recorded_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== INDEXES ====================
CREATE INDEX IF NOT EXISTS idx_users_rating ON users(rating);
CREATE INDEX IF NOT EXISTS idx_users_cf_handle ON users(cf_handle);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_tags ON questions USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_question_sets_rating ON question_sets(rating_min, rating_max);
CREATE INDEX IF NOT EXISTS idx_question_sets_active ON question_sets(is_active, times_used);
CREATE INDEX IF NOT EXISTS idx_matches_players ON matches(player1_id, player2_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_created ON matches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_match ON submissions(match_id, user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_question ON submissions(question_id, user_id);
CREATE INDEX IF NOT EXISTS idx_rating_history_user ON rating_history(user_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_test_cases_question ON test_cases(question_id, ordinal);
