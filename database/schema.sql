-- PostgreSQL schema for STM Dos Ni Roha.
-- Apply to a new database; do not import demo data as real member/payment records.

CREATE TABLE IF NOT EXISTS families (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  member_number VARCHAR(24) NOT NULL UNIQUE,
  head_name VARCHAR(120) NOT NULL,
  phone VARCHAR(30),
  status VARCHAR(12) NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif', 'nonaktif')),
  joined_on DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS savings_types (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  default_amount BIGINT NOT NULL CHECK (default_amount > 0),
  type VARCHAR(20) NOT NULL DEFAULT 'tabungan' CHECK (type = 'tabungan'),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app_users (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  username VARCHAR(80) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'bendahara')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  family_id BIGINT NOT NULL REFERENCES families(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  savings_type_id BIGINT NOT NULL REFERENCES savings_types(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  period_month SMALLINT NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  period_year SMALLINT NOT NULL CHECK (period_year BETWEEN 2000 AND 2200),
  amount BIGINT NOT NULL CHECK (amount >= 1000),
  paid_on DATE NOT NULL,
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('Tunai', 'Transfer', 'QRIS')),
  note TEXT NOT NULL DEFAULT '',
  recorded_by BIGINT REFERENCES app_users(id) ON UPDATE RESTRICT ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_family_date ON transactions(family_id, paid_on DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_period ON transactions(period_year, period_month);
CREATE INDEX IF NOT EXISTS idx_transactions_type_period ON transactions(savings_type_id, period_year, period_month);

CREATE TABLE IF NOT EXISTS activity_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT REFERENCES app_users(id) ON UPDATE RESTRICT ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Totals should be queried from transactions, never stored as a separately editable balance.
CREATE OR REPLACE VIEW family_savings_balances AS
SELECT f.id AS family_id,
       f.member_number,
       f.head_name,
       COALESCE(SUM(t.amount), 0)::BIGINT AS total_saved,
       COUNT(t.id)::BIGINT AS transaction_count,
       MAX(t.paid_on) AS last_payment_date
FROM families f
LEFT JOIN transactions t ON t.family_id = f.id
GROUP BY f.id, f.member_number, f.head_name;
