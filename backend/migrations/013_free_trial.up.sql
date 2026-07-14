-- 013: Free 1-month trial for non-Somaiya users

-- Track whether a user has already claimed their free trial
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS trial_claimed_at TIMESTAMPTZ;
