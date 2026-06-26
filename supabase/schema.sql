-- ════════════════════════════════════════════════════════════════
--  AI Gmail Assistant — Supabase Schema
--  Run this in: Supabase Dashboard → SQL Editor → New Query
-- ════════════════════════════════════════════════════════════════

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── email_summaries ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_summaries (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id            TEXT UNIQUE NOT NULL,
  user_email            TEXT NOT NULL,
  summary_arabic        TEXT NOT NULL DEFAULT '',
  action_required       TEXT NOT NULL DEFAULT '',
  priority              TEXT NOT NULL DEFAULT 'medium'
                          CHECK (priority IN ('urgent','high','medium','low')),
  category              TEXT NOT NULL DEFAULT 'other'
                          CHECK (category IN (
                            'projects','clients','engineering','invoices',
                            'meetings','contracts','hr','personal',
                            'marketing','spam','other'
                          )),
  estimated_reading_time INTEGER NOT NULL DEFAULT 1,
  detected_tasks        TEXT[]  NOT NULL DEFAULT '{}',
  detected_deadlines    TEXT[]  NOT NULL DEFAULT '{}',
  detected_meeting      JSONB,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_summaries_user ON email_summaries (user_email);
CREATE INDEX IF NOT EXISTS idx_email_summaries_priority ON email_summaries (priority);
CREATE INDEX IF NOT EXISTS idx_email_summaries_category ON email_summaries (category);

-- ─── generated_replies ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS generated_replies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id  TEXT UNIQUE NOT NULL,
  user_email  TEXT NOT NULL,
  reply_text  TEXT NOT NULL,
  tone        TEXT NOT NULL DEFAULT 'professional'
                CHECK (tone IN ('professional','friendly','formal','short','detailed')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_generated_replies_user ON generated_replies (user_email);

-- ─── ai_settings ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_settings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email          TEXT UNIQUE NOT NULL,
  model               TEXT NOT NULL DEFAULT 'gpt-4o',
  temperature         NUMERIC(3,1) NOT NULL DEFAULT 0.3
                        CHECK (temperature >= 0 AND temperature <= 1),
  summary_length      TEXT NOT NULL DEFAULT 'medium'
                        CHECK (summary_length IN ('short','medium','detailed')),
  reply_style         TEXT NOT NULL DEFAULT 'professional'
                        CHECK (reply_style IN ('professional','friendly','formal','short','detailed')),
  auto_summarize      BOOLEAN NOT NULL DEFAULT TRUE,
  auto_generate_reply BOOLEAN NOT NULL DEFAULT FALSE,
  custom_prompt       TEXT NOT NULL DEFAULT '',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── daily_summaries ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_summaries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email      TEXT NOT NULL,
  date            DATE NOT NULL,
  total_emails    INTEGER NOT NULL DEFAULT 0,
  urgent_emails   INTEGER NOT NULL DEFAULT 0,
  pending_replies INTEGER NOT NULL DEFAULT 0,
  meetings_today  INTEGER NOT NULL DEFAULT 0,
  top_priorities  TEXT[] NOT NULL DEFAULT '{}',
  arabic_summary  TEXT NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_email, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_summaries_user ON daily_summaries (user_email, date DESC);

-- ─── logs ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email  TEXT NOT NULL,
  action      TEXT NOT NULL,
  details     TEXT NOT NULL DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'info'
                CHECK (status IN ('success','error','info')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_logs_user ON logs (user_email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_status ON logs (status);

-- ─── Auto-update updated_at ──────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_email_summaries_updated_at
  BEFORE UPDATE ON email_summaries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_generated_replies_updated_at
  BEFORE UPDATE ON generated_replies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_settings_updated_at
  BEFORE UPDATE ON ai_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── Row Level Security ──────────────────────────────────────────
-- Since we use a service-role key server-side, RLS is optional.
-- Enable it for extra security if needed:

-- ALTER TABLE email_summaries ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE generated_replies ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE ai_settings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE daily_summaries ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- ─── Auto-cleanup old logs (keep last 1000) ───────────────────────
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM logs
  WHERE id NOT IN (
    SELECT id FROM logs
    ORDER BY created_at DESC
    LIMIT 1000
  );
END;
$$ LANGUAGE plpgsql;
