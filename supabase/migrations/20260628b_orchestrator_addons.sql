-- Add mode column to orchestrator_feedback
ALTER TABLE orchestrator_feedback ADD COLUMN IF NOT EXISTS mode TEXT;

-- signal_evidence: logs evidence without applying state changes
CREATE TABLE IF NOT EXISTS signal_evidence (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  signal_id      uuid        REFERENCES signals(id) ON DELETE SET NULL,
  session_id     uuid,
  raw_input      TEXT,
  model_synthesis JSONB,
  evidence_type  TEXT        DEFAULT 'observation',
  logged_at      TIMESTAMPTZ DEFAULT NOW()
);
