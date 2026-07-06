-- Schéma databáze pro Tarot o Lásce (PostgreSQL).
-- Aplikace si tabulky vytvoří sama při prvním připojení (viz lib/db.ts),
-- tento soubor je pro ruční založení nebo kontrolu.

create table if not exists readings (
  id          text primary key,
  email       text,
  question    text not null,
  spread_key  text not null,
  spread_name text not null,
  cards       jsonb not null,
  text        text not null,
  created_at  bigint not null
);
create index if not exists readings_email_idx on readings (email, created_at desc);

create table if not exists feedback (
  reading_id text primary key,
  rating     text not null,
  comment    text not null default '',
  created_at bigint not null
);

-- ===== v1.1 §A/§B: účty, ledger, OTP, sessions (produkce PostgreSQL) =====
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  email_verified_at TIMESTAMPTZ,
  intro_used_at TIMESTAMPTZ,
  daily_opt_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- append-only; zůstatek = SUM(delta); ref unikátní = idempotence webhooků
CREATE TABLE IF NOT EXISTS credit_ledger (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  ref TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS otp_codes (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  purpose TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  used_at TIMESTAMPTZ,
  superseded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
