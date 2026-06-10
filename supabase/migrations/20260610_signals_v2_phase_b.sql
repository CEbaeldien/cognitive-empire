-- CE SIGNALS V2 — PHASE B: MESODMA V2 (ATOM EXTRACTION PIPELINE)
-- Spec ref: docs/CE_SIGNALS_V2_BUILD_SPEC.md § Phase B
-- Requires: Phase A complete (structural_invariants seeded, pressure_vectors remapped).

-- ============================================================
-- RULE 9 DEVIATIONS FROM SPEC (most conservative additive path)
-- ============================================================
-- B3: Table named 'mesodma_batch_runs' (not 'mesodma_runs').
--     Existing mesodma_runs has V1 per-item/per-module schema used by
--     /api/mesodma/runs/* routes and batch.ts. Both tables coexist.
-- B2: factual_atoms.raw_item_id uuid (spec says bigint) — raw_items.id is UUID.
-- B2: factual_atoms.source_id uuid (spec says int) — sources.id is UUID.
-- B2: factual_atoms.possible_vector_ids uuid[] (spec says int[]) — pressure_vectors.id is UUID.
-- INV-007 vectors: inserted per founder authorization in same section.
-- ============================================================

-- ============================================================
-- SECTION B1 — false_signal_patterns + seed 9 canon patterns
-- ============================================================

CREATE TABLE IF NOT EXISTS false_signal_patterns (
  id          serial PRIMARY KEY,
  name        text NOT NULL,
  description text NOT NULL,
  indicators  text[],
  active      boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

INSERT INTO false_signal_patterns (name, description, indicators) VALUES
(
  'Single vendor announcement with no adoption proof',
  'A company announces a new capability with no evidence of third-party adoption, production deployment, or independent corroboration.',
  ARRAY['only source is vendor press release','no customer quotes or case studies','no third-party confirmation','launch event or conference announcement']
),
(
  'Media wave with no primary source',
  'Multiple media outlets reporting the same development, but no primary source, primary research, or original documentation is cited.',
  ARRAY['all citations trace back to the same single article','no direct link to primary documentation','coordinated publication timing','no official statement or filing']
),
(
  'Benchmark claim without deployment consequence',
  'A performance benchmark is cited as evidence of capability, but no deployment, production usage, or real-world consequence is documented.',
  ARRAY['benchmark score without deployment evidence','synthetic test environment','no production system reference','academic or internal benchmark only']
),
(
  'Regulatory proposal with no enforcement path',
  'A regulatory proposal, policy draft, or legislative suggestion is treated as fact, but no enforcement mechanism, timeline, or binding commitment exists.',
  ARRAY['proposal or draft stage only','no implementation timeline','no enforcement mechanism described','committee vote pending','consultation period open']
),
(
  'Funding news with no infrastructure buildout',
  'A funding announcement is treated as infrastructure evidence, but no physical construction, procurement, or operational commitment is documented.',
  ARRAY['funding or investment announcement only','no ground-breaking or construction evidence','no supply chain or procurement announced','no operational timeline']
),
(
  'AI agent demo without economic transaction evidence',
  'An AI agent capability is demonstrated in a controlled or synthetic environment with no evidence of real economic transactions, live workflow integration, or commercial deployment.',
  ARRAY['demo or prototype environment','no live production deployment','no commercial transaction evidence','no enterprise customer reference','sandboxed demonstration']
),
(
  'Tool launch with no workflow dependency shift',
  'A new tool is launched, but no evidence of adoption displacing existing workflows, altering procurement decisions, or creating measurable dependency shift.',
  ARRAY['product launch with no migration evidence','no enterprise adoption documented','existing tools not displaced','free tier only','early access or beta stage']
),
(
  'Marketing claim without measured adoption',
  'A claim about adoption, scale, or impact is made in marketing materials without independently verified data, audited numbers, or third-party measurement.',
  ARRAY['self-reported numbers only','no independent audit or third-party verification','marketing materials as sole source','vague scale language']
),
(
  'Social hype without institutional movement',
  'High social media engagement or viral content exists around a topic, but no institutional response, regulatory action, enterprise procurement, or physical infrastructure change is documented.',
  ARRAY['trending on social media','no institutional response documented','no regulatory or enterprise action','influencer-driven discussion','no primary source confirmation']
)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SECTION B2 — factual_atoms
-- ============================================================
-- Rule 9: raw_item_id uuid, source_id uuid, possible_vector_ids uuid[]
-- mesodma_run_id FK wired in B3 after mesodma_batch_runs exists.

CREATE TABLE IF NOT EXISTS factual_atoms (
  id                        bigserial PRIMARY KEY,
  raw_item_id               uuid REFERENCES raw_items(id) ON DELETE SET NULL,
  source_id                 uuid REFERENCES sources(id) ON DELETE SET NULL,
  mesodma_run_id            bigint,
  atom_summary              text NOT NULL,
  who                       text,
  what_changed              text,
  when_date                 date,
  where_location            text,
  why_if_stated             text,
  how_if_stated             text,
  system_affected           text,
  entities                  text[] DEFAULT ARRAY[]::text[],
  companies                 text[] DEFAULT ARRAY[]::text[],
  countries                 text[] DEFAULT ARRAY[]::text[],
  technologies              text[] DEFAULT ARRAY[]::text[],
  numbers                   jsonb  DEFAULT '[]'::jsonb,
  evidence_type             text CHECK (evidence_type IN (
                              'announcement','data','policy','research',
                              'deployment','incident','financial'
                            )),
  source_claim              text,
  source_weight             numeric DEFAULT 1.0,
  possible_invariant_ids    int[],
  possible_vector_ids       uuid[] DEFAULT ARRAY[]::uuid[],
  duplicate_risk            numeric DEFAULT 0,
  distribution_stage        text CHECK (distribution_stage IN (
                              'origin','early','wave','saturated'
                            )),
  false_signal_risk         numeric DEFAULT 0,
  extraction_confidence     numeric,
  extracted_by_model        text,
  extraction_prompt_version text,
  doctrine_version          text,
  status                    text DEFAULT 'atom' CHECK (status IN (
                              'atom','noise','duplicate',
                              'needs_enrichment','low_confidence','rejected'
                            )),
  created_at                timestamptz DEFAULT now(),
  CONSTRAINT max_three_invariants
    CHECK (array_length(possible_invariant_ids, 1) IS NULL
        OR array_length(possible_invariant_ids, 1) <= 3)
);

CREATE INDEX IF NOT EXISTS idx_atoms_status     ON factual_atoms(status);
CREATE INDEX IF NOT EXISTS idx_atoms_invariants ON factual_atoms USING gin(possible_invariant_ids);
CREATE INDEX IF NOT EXISTS idx_atoms_raw_item   ON factual_atoms(raw_item_id);
CREATE INDEX IF NOT EXISTS idx_atoms_created    ON factual_atoms(created_at DESC);

-- ============================================================
-- SECTION B3 — mesodma_batch_runs + FK wire
-- ============================================================
-- Named 'mesodma_batch_runs' — see Rule 9 note above.

CREATE TABLE IF NOT EXISTS mesodma_batch_runs (
  id               bigserial PRIMARY KEY,
  input_count      int DEFAULT 0,
  output_count     int DEFAULT 0,
  noise_count      int DEFAULT 0,
  duplicate_count  int DEFAULT 0,
  model_used       text,
  prompt_version   text,
  doctrine_version text,
  failed_items     jsonb DEFAULT '[]'::jsonb,
  error_count      int DEFAULT 0,
  started_at       timestamptz DEFAULT now(),
  completed_at     timestamptz,
  status           text DEFAULT 'running' CHECK (status IN (
                     'running','completed','completed_with_errors','failed','cancelled'
                   ))
);

ALTER TABLE factual_atoms
  ADD CONSTRAINT fk_atom_run
  FOREIGN KEY (mesodma_run_id) REFERENCES mesodma_batch_runs(id)
  ON DELETE SET NULL;

-- ============================================================
-- SECTION B-INV007 — Seed INV-007 Responsibility Migration vectors
-- Per founder authorization (2026-06-10): seed before Mesodma v2 wiring.
-- ============================================================

INSERT INTO pressure_vectors (name, slug, description, is_active, invariant_id, visibility)
VALUES
(
  'Liability Pressure',
  'liability_pressure',
  'Increasing ambiguity and legal exposure around who bears responsibility when automated systems cause harm, fail, or produce contested outputs.',
  true,
  (SELECT id FROM structural_invariants WHERE code = 'INV-007'),
  'public'
),
(
  'Escalation Pressure',
  'escalation_pressure',
  'Growing pressure on organizations to define and maintain clear human escalation paths as automated systems handle more consequential decisions.',
  true,
  (SELECT id FROM structural_invariants WHERE code = 'INV-007'),
  'public'
),
(
  'Auditability Pressure',
  'auditability_pressure',
  'Increasing demand for traceable, auditable records of AI-assisted decisions, outputs, and the humans who authorized or deployed them.',
  true,
  (SELECT id FROM structural_invariants WHERE code = 'INV-007'),
  'public'
),
(
  'Ownership Ambiguity',
  'ownership_ambiguity',
  'Expanding zones of unclear ownership over AI outputs, automated workflows, and the organizational units accountable for their consequences.',
  true,
  (SELECT id FROM structural_invariants WHERE code = 'INV-007'),
  'public'
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- GATE B verification queries (run manually after applying):
-- ============================================================
-- SELECT count(*) FROM false_signal_patterns;       -- expect 9
-- SELECT count(*) FROM pressure_vectors WHERE is_active = true; -- expect 24
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'factual_atoms' ORDER BY ordinal_position;
-- SELECT conname FROM pg_constraint WHERE conrelid = 'factual_atoms'::regclass;
