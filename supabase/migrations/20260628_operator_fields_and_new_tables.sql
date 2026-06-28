-- ── Signals: add operator_move and directional_weight columns ─────────────────
ALTER TABLE signals ADD COLUMN IF NOT EXISTS operator_move TEXT;
ALTER TABLE signals ADD COLUMN IF NOT EXISTS directional_weight INTEGER;

-- ── Seed base signal operator metadata ────────────────────────────────────────
-- Infrastructure Concentration
UPDATE signals SET
  operator_move      = 'Build provider-portable AI architecture now.',
  directional_weight = 45,
  is_featured        = true
WHERE title = 'Infrastructure Concentration' AND is_base_signal = true;

-- Epistemic Collapse
UPDATE signals SET
  operator_move      = 'Add evidence ledgers to all signals.',
  directional_weight = 35,
  is_featured        = false
WHERE title = 'Epistemic Collapse' AND is_base_signal = true;

-- Accountability Diffusion
UPDATE signals SET
  operator_move      = 'Add approval matrix and incident logs.',
  directional_weight = 30,
  is_featured        = false
WHERE title = 'Accountability Diffusion' AND is_base_signal = true;

-- Labor Identity Displacement
UPDATE signals SET
  operator_move      = 'Build operator proof artifacts weekly.',
  directional_weight = 35,
  is_featured        = false
WHERE title = 'Labor Identity Displacement' AND is_base_signal = true;

-- Sovereignty Fragmentation
UPDATE signals SET
  operator_move      = 'Create CE Jurisdiction Register.',
  directional_weight = 30,
  is_featured        = false
WHERE title = 'Sovereignty Fragmentation' AND is_base_signal = true;

-- Physical Compute Ceiling
UPDATE signals SET
  operator_move      = 'Track energy geography as AI geography.',
  directional_weight = 35,
  is_featured        = true
WHERE title = 'Physical Compute Ceiling' AND is_base_signal = true;

-- Access Stratification
UPDATE signals SET
  operator_move      = 'Build low-bandwidth, PWA-first, provider-flexible systems.',
  directional_weight = 35,
  is_featured        = true
WHERE title = 'Access Stratification' AND is_base_signal = true;

-- ── audit_requests: for /work page ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_requests (
  id                      uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name                    TEXT NOT NULL,
  email                   TEXT NOT NULL,
  operation_description   TEXT,
  symptom                 TEXT,
  status                  TEXT DEFAULT 'pending',
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ── orchestrator_feedback: for /orchestrator page ─────────────────────────────
CREATE TABLE IF NOT EXISTS orchestrator_feedback (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id  uuid,
  task        TEXT,
  best_model  TEXT,
  rating      INTEGER CHECK (rating BETWEEN 1 AND 5),
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
