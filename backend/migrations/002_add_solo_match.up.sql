-- Migration 002: Add Solo Match Support

-- Make player2_id optional to support solo matches
ALTER TABLE matches ALTER COLUMN player2_id DROP NOT NULL;

-- Add a mode column to differentiate between 1v1 and solo matches
ALTER TABLE matches ADD COLUMN mode VARCHAR(20) DEFAULT '1v1';
UPDATE matches SET mode = '1v1';

-- Add new statistics fields to users table to track solo performance separately
ALTER TABLE users ADD COLUMN solo_matches_played INT DEFAULT 0;
ALTER TABLE users ADD COLUMN solo_problems_solved INT DEFAULT 0;
