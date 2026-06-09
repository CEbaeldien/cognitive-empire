-- Mesodma V1: candidate evidence pipeline + first-pass signals
-- Adds four new tables and updates raw_items signal_processing_status values.
-- New signal_processing_status values used by this pipeline:
--   mesodma_pending, mesodma_processed, rejected_noise, needs_enrichment
-- (raw_items.signal_processing_status is a free-text column — no check constraint to alter)

-- TABLE: candidate_evidence
-- Structured output from the Evidence Structurer module.
-- Every item that passes the Noise Flood Blocker lands here.
CREATE TABLE IF NOT EXISTS candidate_evidence (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_item_id         uuid REFERENCES raw_items(id) ON DELETE CASCADE,
  source_id           uuid REFERENCES sources(id),
  domain              text CHECK (domain IN ('intelligence', 'infrastructure', 'governance_stability')),
  subcategory         text,
  clean_summary       text,
  source_provenance   text,
  source_type         text CHECK (source_type IN (
    'research', 'technical_docs', 'api_changelog', 'policy',
    'infrastructure', 'funding', 'deployment', 'market', 'news', 'commentary'
  )),
  evidence_type       text CHECK (evidence_type IN (
    'research_evidence', 'technical_documentation', 'api_change',
    'infrastructure_investment', 'governance_update', 'policy_shift',
    'deployment_evidence', 'funding_pattern', 'market_movement',
    'incident_or_failure', 'commentary'
  )),
  entities_detected   jsonb DEFAULT '[]'::jsonb,
  numbers_extracted   jsonb DEFAULT '[]'::jsonb,
  claims_detected     jsonb DEFAULT '[]'::jsonb,
  verification_status text CHECK (verification_status IN (
    'unverified', 'partially_verified', 'verified', 'disputed'
  )),
  visibility_stage    text CHECK (visibility_stage IN (
    'upstream', 'early_distribution', 'mainstream_distribution', 'saturated_noise', 'unknown'
  )),
  duplicate_risk      text CHECK (duplicate_risk IN ('low', 'medium', 'high')),
  noise_level         text CHECK (noise_level IN ('low', 'medium', 'high')),
  route               text CHECK (route IN ('reject_noise', 'needs_enrichment', 'candidate_evidence')),
  confidence          numeric CHECK (confidence >= 0 AND confidence <= 1),
  created_at          timestamptz DEFAULT NOW()
);

-- TABLE: first_pass_signals
-- Output of the full pipeline: doctrine-evaluated signal candidates.
-- Mesodma writes here. Signal Intelligence reads here to create signals.
CREATE TABLE IF NOT EXISTS first_pass_signals (
  id                             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_item_id                    uuid REFERENCES raw_items(id) ON DELETE CASCADE,
  candidate_evidence_id          uuid REFERENCES candidate_evidence(id) ON DELETE CASCADE,
  source_id                      uuid REFERENCES sources(id),
  domain                         text CHECK (domain IN ('intelligence', 'infrastructure', 'governance_stability')),
  subcategory                    text,
  first_pass_signal              text,
  clean_summary                  text,
  source_provenance              text,
  evidence_type                  text,
  visibility_stage               text CHECK (visibility_stage IN (
    'upstream', 'early_distribution', 'mainstream_distribution', 'saturated_noise', 'unknown'
  )),
  signal_potential               text CHECK (signal_potential IN ('low', 'medium', 'high', 'critical')),
  possible_constraint_shift      text,
  possible_bottleneck_migration  text,
  possible_maintenance_gravity   text,
  possible_continuity_pressure   text,
  candidate_pressure_vectors     text[] DEFAULT ARRAY[]::text[],
  active_laws_candidate          text[] DEFAULT ARRAY[]::text[],
  skeptic_note                   text,
  evidence_limitations           text,
  confidence                     numeric CHECK (confidence >= 0 AND confidence <= 1),
  reason_for_signal_candidate    text,
  status                         text DEFAULT 'ready_for_signal_intelligence' CHECK (status IN (
    'first_pass', 'needs_more_sources', 'needs_human_check',
    'rejected_by_mesodma', 'ready_for_signal_intelligence'
  )),
  created_at                     timestamptz DEFAULT NOW()
);

-- TABLE: mesodma_runs
-- Audit log of every module execution. One row per module per raw_item.
CREATE TABLE IF NOT EXISTS mesodma_runs (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_item_id           uuid REFERENCES raw_items(id) ON DELETE CASCADE,
  candidate_evidence_id uuid REFERENCES candidate_evidence(id),
  first_pass_signal_id  uuid REFERENCES first_pass_signals(id),
  module_name           text CHECK (module_name IN (
    'noise_flood_blocker', 'evidence_structurer', 'doctrine_filter', 'skeptic_check'
  )),
  model_used            text,
  input_snapshot        jsonb DEFAULT '{}'::jsonb,
  output_json           jsonb DEFAULT '{}'::jsonb,
  route                 text,
  confidence            numeric,
  error_flag            boolean DEFAULT false,
  created_at            timestamptz DEFAULT NOW()
);

-- TABLE: mesodma_training_examples
-- Curated examples used to calibrate and audit module behavior.
CREATE TABLE IF NOT EXISTS mesodma_training_examples (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title                    text NOT NULL,
  input_text               text,
  source_type              text,
  evidence_type            text,
  expected_route           text CHECK (expected_route IN (
    'reject_noise', 'candidate_evidence', 'promote_first_pass_signal',
    'needs_more_sources', 'needs_human_check'
  )),
  expected_noise_level     text CHECK (expected_noise_level IN ('low', 'medium', 'high')),
  expected_signal_potential text CHECK (expected_signal_potential IN ('low', 'medium', 'high', 'critical')),
  expected_reasoning       text,
  lesson                   text,
  example_category         text CHECK (example_category IN (
    'obvious_noise', 'candidate_evidence', 'strong_signal',
    'false_signal_trap', 'edge_case'
  )),
  created_at               timestamptz DEFAULT NOW()
);
