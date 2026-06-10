-- CE SIGNALS V2 — PHASE D: SIGNAL INTELLIGENCE
-- Spec ref: docs/CE_SIGNALS_V2_BUILD_SPEC.md § Phase D
-- Requires: Phase C complete (evidence_clusters exists).
-- GOVERNANCE: Every synthesis candidate lands as status='draft'. Nothing auto-publishes.

-- ============================================================
-- SECTION D1a — signal_intelligence_runs
-- (must exist before ALTER TABLE signals adds the FK)
-- ============================================================

CREATE TABLE IF NOT EXISTS signal_intelligence_runs (
  id                  bigserial PRIMARY KEY,
  trigger_type        text CHECK (trigger_type IN ('threshold','cycle','manual')),
  clusters_evaluated  int DEFAULT 0,
  candidates_created  int DEFAULT 0,
  model_used          text,
  prompt_version      text,
  doctrine_version    text,
  error_count         int DEFAULT 0,
  started_at          timestamptz DEFAULT now(),
  completed_at        timestamptz,
  status              text DEFAULT 'running' CHECK (status IN (
                        'running','completed','completed_with_errors','failed','cancelled'
                      ))
);

-- ============================================================
-- SECTION D1b — ALTER TABLE signals (additive only)
-- ============================================================
-- All IF NOT EXISTS: several columns (what_changed, why_it_matters,
-- structural_relevance, second_order_effect) already exist per live schema.

ALTER TABLE signals
  ADD COLUMN IF NOT EXISTS cluster_id            bigint REFERENCES evidence_clusters(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS invariant_id          int REFERENCES structural_invariants(id),
  ADD COLUMN IF NOT EXISTS birth_type            text CHECK (birth_type IN ('threshold','cycle','human_promoted')),
  ADD COLUMN IF NOT EXISTS evidence_mass_at_birth numeric,
  ADD COLUMN IF NOT EXISTS evidence_snapshot     jsonb,
  ADD COLUMN IF NOT EXISTS doctrine_basis        text,
  ADD COLUMN IF NOT EXISTS governance_pressure_note text,
  ADD COLUMN IF NOT EXISTS maintenance_gravity_note text,
  ADD COLUMN IF NOT EXISTS continuity_note       text,
  ADD COLUMN IF NOT EXISTS physical_constraint_note text,
  ADD COLUMN IF NOT EXISTS contradiction_note    text,
  ADD COLUMN IF NOT EXISTS lifecycle_status      text DEFAULT 'emerging' CHECK (lifecycle_status IN (
                              'emerging','strengthening','weakening',
                              'confirmed','contradicted','distributed','retired'
                            )),
  ADD COLUMN IF NOT EXISTS legacy_signal         boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_by_run_id     bigint REFERENCES signal_intelligence_runs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_signals_cluster   ON signals(cluster_id);
CREATE INDEX IF NOT EXISTS idx_signals_invariant ON signals(invariant_id);
CREATE INDEX IF NOT EXISTS idx_signals_lifecycle ON signals(lifecycle_status);

-- Grandfather pass: all existing signals (cluster_id IS NULL) are legacy.
-- Safe to run multiple times — already-true rows are no-ops.
UPDATE signals SET legacy_signal = true WHERE cluster_id IS NULL AND (legacy_signal IS NULL OR legacy_signal = false);

-- ============================================================
-- SECTION D1c — human_governance_actions
-- ============================================================

CREATE TABLE IF NOT EXISTS human_governance_actions (
  id          bigserial PRIMARY KEY,
  signal_id   uuid REFERENCES signals(id) ON DELETE CASCADE,
  action_type text CHECK (action_type IN (
                 'approve','revise','reject','retire','mark_contradicted',
                 'request_more_evidence','escalate_to_internal','publish'
               )),
  notes       text,
  acted_by    text,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_governance_actions_signal ON human_governance_actions(signal_id);

-- ============================================================
-- GATE D verification queries:
-- ============================================================
-- SELECT count(*) FROM signals WHERE legacy_signal = true;  -- should equal total existing signal count
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'signals' ORDER BY ordinal_position;
-- SELECT conname, confrelid::regclass FROM pg_constraint WHERE conrelid = 'signals'::regclass AND contype = 'f';
