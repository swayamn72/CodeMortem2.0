-- 009: Premium subscription + email verification

-- Premium fields on users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_premium          BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS premium_expires_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS premium_plan        VARCHAR(30),
  ADD COLUMN IF NOT EXISTS email_verified      BOOLEAN     NOT NULL DEFAULT FALSE;

-- Subscription orders (payment audit trail)
CREATE TABLE IF NOT EXISTS subscription_orders (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  razorpay_order_id    TEXT        UNIQUE NOT NULL,
  razorpay_payment_id  TEXT,
  plan                 VARCHAR(20) NOT NULL,
  amount_paise         INTEGER     NOT NULL,
  status               VARCHAR(20) NOT NULL DEFAULT 'created',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at              TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sub_orders_user ON subscription_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_sub_orders_rzp  ON subscription_orders(razorpay_order_id);
