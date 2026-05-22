-- 004_ai_features.up.sql
-- AI-powered hints and post-match analysis

-- Track hint usage per match
CREATE TABLE IF NOT EXISTS match_hints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_index INT NOT NULL,
    hint_level INT NOT NULL CHECK (hint_level BETWEEN 1 AND 3),
    hint_text TEXT NOT NULL,
    points_deducted INT NOT NULL DEFAULT 0,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_match_hints_match_user ON match_hints(match_id, user_id);

-- Store post-match AI analysis reports
CREATE TABLE IF NOT EXISTS match_analysis_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    report_json JSONB NOT NULL,
    generated_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(match_id, user_id)
);

-- Add hint tracking columns to match_questions
ALTER TABLE match_questions ADD COLUMN IF NOT EXISTS hints_used_p1 INT DEFAULT 0;
ALTER TABLE match_questions ADD COLUMN IF NOT EXISTS hints_used_p2 INT DEFAULT 0;
