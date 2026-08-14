-- Jan Abhilekh — Supabase / Postgres schema
-- Run once in Supabase SQL Editor (Project -> SQL Editor -> New query -> paste -> Run)

CREATE TABLE IF NOT EXISTS citizens (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  village TEXT,
  taluka TEXT,
  occ TEXT
);

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  citizen_id INTEGER NOT NULL REFERENCES citizens(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending',
  ocr_confidence INTEGER,
  source TEXT NOT NULL DEFAULT 'seed',      -- 'seed' | 'live-scan'
  fields JSONB DEFAULT '[]'::jsonb,          -- extracted Label/Value pairs
  raw_text TEXT DEFAULT '',
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documents_citizen_id ON documents(citizen_id);
CREATE INDEX IF NOT EXISTS idx_documents_raw_text ON documents USING gin (to_tsvector('simple', coalesce(raw_text, '')));
