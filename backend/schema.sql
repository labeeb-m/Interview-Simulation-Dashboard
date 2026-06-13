-- Asendia AI Monitor — Database Schema

CREATE TABLE IF NOT EXISTS bots (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  vertical TEXT NOT NULL,  -- IT, healthcare, sales, engineering, light_industrial, early_careers
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  vertical TEXT NOT NULL,
  client_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS interviews (
  id TEXT PRIMARY KEY,
  candidate_id TEXT NOT NULL,
  job_id TEXT NOT NULL REFERENCES jobs(id),
  bot_id TEXT NOT NULL REFERENCES bots(id),
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_ms INTEGER,
  tokens_used INTEGER,
  cost_usd NUMERIC(8,4),
  match_score NUMERIC(4,2),         -- 0.0 to 1.0
  outcome TEXT,                      -- shortlisted, rejected, no_show, pending
  transcript_snippet TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS interview_flags (
  id SERIAL PRIMARY KEY,
  interview_id TEXT NOT NULL REFERENCES interviews(id),
  flag TEXT NOT NULL,               -- low_confidence_answer, salary_mismatch, off_topic, no_response, ats_sync_failed, long_pause, repeated_question
  severity TEXT NOT NULL,           -- low, medium, high
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_interviews_started_at ON interviews(started_at);
CREATE INDEX IF NOT EXISTS idx_interviews_bot_id ON interviews(bot_id);
CREATE INDEX IF NOT EXISTS idx_interviews_job_id ON interviews(job_id);
CREATE INDEX IF NOT EXISTS idx_interviews_outcome ON interviews(outcome);
CREATE INDEX IF NOT EXISTS idx_flags_interview_id ON interview_flags(interview_id);
CREATE INDEX IF NOT EXISTS idx_flags_flag ON interview_flags(flag);
