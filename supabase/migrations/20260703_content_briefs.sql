-- Content Engine: brief queue
-- Stores AI-generated content briefs for YouTube Shorts, long-form, LinkedIn, and thumbnail specs.

CREATE TABLE IF NOT EXISTS content_briefs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic      text NOT NULL,
  notes      text,
  format     text NOT NULL CHECK (format IN ('short','longform','thumbnail_brief','linkedin')),
  title      text,
  output     text,
  status     text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','reviewed','approved','published')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE content_briefs ENABLE ROW LEVEL SECURITY;
-- Service role bypasses RLS — no public access needed.
