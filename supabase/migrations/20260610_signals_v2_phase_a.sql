-- CE SIGNALS V2 — PHASE A: DOCTRINE FOUNDATION
-- Run each section alone. Confirm with founder before proceeding to next.
-- Spec ref: docs/CE_SIGNALS_V2_BUILD_SPEC.md

-- ============================================================
-- SECTION A1 — structural_invariants
-- Run alone. Confirm before A2.
-- ============================================================

CREATE TABLE structural_invariants (
  id            serial PRIMARY KEY,
  code          text UNIQUE NOT NULL,      -- 'INV-001' through 'INV-014'
  name          text NOT NULL,
  statement     text NOT NULL,
  function_note text,
  display_order int NOT NULL,
  active        boolean DEFAULT true,
  created_at    timestamptz DEFAULT now()
);

-- RLS: public read; no AI write path, ever. Writes restricted to founder via Studio.
ALTER TABLE structural_invariants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_invariants"
  ON structural_invariants FOR SELECT
  USING (true);

-- ============================================================
-- SECTION A2 — Seed the 14 canon invariants
-- Run alone. Confirm before A3.
-- ============================================================

INSERT INTO structural_invariants (code, name, statement, function_note, display_order) VALUES
('INV-001','Intelligence Abundance',       'Intelligence-like capability is becoming increasingly accessible, reducing the scarcity of analysis, generation, and execution.',          'Root invariant. Everything else follows from it.',                                                                          1),
('INV-002','Output Inflation',             'As intelligence becomes abundant, production volume rises faster than selection quality.',                                                 'Explains why raw output loses value and filtration gains power.',                                                           2),
('INV-003','Value Migration Upstream',     'When execution becomes less scarce, value migrates toward judgment, selection, ownership, governance, and constraint design.',             'Explains where advantage moves.',                                                                                           3),
('INV-004','Visibility Lag',               'Visible popularity trails structural reality; by the time something dominates surface visibility, discovery has often ended and distribution has begun.', 'Core Signals lens. Prevents surface-chasing.',                                                              4),
('INV-005','Bottleneck Migration',         'When one constraint collapses, another becomes dominant, often at a higher layer of coordination, governance, infrastructure, or responsibility.', 'Turns updates into constraint-detection.',                                                                       5),
('INV-006','Capability Volatility',        'Rapid capability change destabilizes strategy, tool mastery, decision half-life, and operational coherence.',                             'Explains drift caused by constant model/tool change.',                                                                     6),
('INV-007','Responsibility Migration',     'As automation expands, ambiguity increases around ownership, liability, escalation, and accountable commitment.',                         'Links AI systems to governance, loop-presence, and consequential judgment.',                                                7),
('INV-008','Governance Pressure',          'Systems with expanding capability require stronger authority boundaries, escalation rules, auditability, and loss-boundary controls.',    'Filters governance-relevant updates from regulation noise.',                                                               8),
('INV-009','Maintenance Gravity',          'Creation friction declines faster than continuity capacity expands, causing operational, governance, and maintenance burden to accumulate.','Detects hidden cost behind new systems and integrations.',                                                              9),
('INV-010','Continuity Scarcity',          'Under abundance and volatility, the ability to preserve coherent execution over time becomes a scarce and valuable property.',            'Connects Signals to Operational Continuity Architecture.',                                                                 10),
('INV-011','Physical Constraint',          'Digital intelligence expansion remains bounded by physical infrastructure: compute, chips, energy, cooling, land, supply chains, capital, and geography.', 'Prevents software-only hallucination. Critical for Infrastructure.',                                    11),
('INV-012','Structural Legibility',        'As agent-mediated systems expand, value shifts toward entities, products, and institutions that are machine-readable, verifiable, attributable, and transaction-ready.', 'AEO foundation. Agentic commerce lens.',                                                12),
('INV-013','Second-Order Pressure',        'The most important consequence of an update is often not the event itself, but where cost, responsibility, power, fragility, or dependency relocates afterward.', 'Prevents first-order spectacle. Core SI lens.',                                                 13),
('INV-014','Survivability Over Speed',     'Systems optimized only for speed and capability become brittle; durable advantage comes from governability, continuity, and resilience under pressure.', 'Evaluates durable capacity vs. velocity.',                                                              14);

-- ============================================================
-- SECTION A3 — pressure_vectors remap + visibility scoping
-- Run alone. Confirm before A4.
-- Requires A2 complete (structural_invariants seeded).
-- Mapping approved by founder 2026-06-10.
-- ============================================================

-- Add invariant parent link and visibility control
ALTER TABLE pressure_vectors
  ADD COLUMN invariant_id int REFERENCES structural_invariants(id),
  ADD COLUMN visibility   text NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public', 'internal'));

-- Map all 20 vectors to parent invariants.
-- Subquery lookups against code (UNIQUE) — safe regardless of serial ID assignment.
UPDATE pressure_vectors SET invariant_id = (SELECT id FROM structural_invariants WHERE code = 'INV-001') WHERE slug = 'capability_expansion';
UPDATE pressure_vectors SET invariant_id = (SELECT id FROM structural_invariants WHERE code = 'INV-001') WHERE slug = 'cost_compression';
UPDATE pressure_vectors SET invariant_id = (SELECT id FROM structural_invariants WHERE code = 'INV-002') WHERE slug = 'knowledge_compression';
UPDATE pressure_vectors SET invariant_id = (SELECT id FROM structural_invariants WHERE code = 'INV-003') WHERE slug = 'capital_allocation';
UPDATE pressure_vectors SET invariant_id = (SELECT id FROM structural_invariants WHERE code = 'INV-003') WHERE slug = 'human_differentiation';
UPDATE pressure_vectors SET invariant_id = (SELECT id FROM structural_invariants WHERE code = 'INV-003'), visibility = 'internal' WHERE slug = 'prosperity_pressure';
UPDATE pressure_vectors SET invariant_id = (SELECT id FROM structural_invariants WHERE code = 'INV-005') WHERE slug = 'coordination_pressure';
UPDATE pressure_vectors SET invariant_id = (SELECT id FROM structural_invariants WHERE code = 'INV-005') WHERE slug = 'labor_displacement';
UPDATE pressure_vectors SET invariant_id = (SELECT id FROM structural_invariants WHERE code = 'INV-008') WHERE slug = 'governance_pressure';
UPDATE pressure_vectors SET invariant_id = (SELECT id FROM structural_invariants WHERE code = 'INV-008') WHERE slug = 'institutional_adaptation';
UPDATE pressure_vectors SET invariant_id = (SELECT id FROM structural_invariants WHERE code = 'INV-008') WHERE slug = 'regulatory_posture';
UPDATE pressure_vectors SET invariant_id = (SELECT id FROM structural_invariants WHERE code = 'INV-009') WHERE slug = 'synchronization_pressure';
UPDATE pressure_vectors SET invariant_id = (SELECT id FROM structural_invariants WHERE code = 'INV-010') WHERE slug = 'continuity_pressure';
UPDATE pressure_vectors SET invariant_id = (SELECT id FROM structural_invariants WHERE code = 'INV-011') WHERE slug = 'compute_demand';
UPDATE pressure_vectors SET invariant_id = (SELECT id FROM structural_invariants WHERE code = 'INV-011') WHERE slug = 'energy_demand';
UPDATE pressure_vectors SET invariant_id = (SELECT id FROM structural_invariants WHERE code = 'INV-011') WHERE slug = 'infrastructure_strain';
UPDATE pressure_vectors SET invariant_id = (SELECT id FROM structural_invariants WHERE code = 'INV-011') WHERE slug = 'resource_pressure';
UPDATE pressure_vectors SET invariant_id = (SELECT id FROM structural_invariants WHERE code = 'INV-011') WHERE slug = 'supply_chain_pressure';
UPDATE pressure_vectors SET invariant_id = (SELECT id FROM structural_invariants WHERE code = 'INV-012') WHERE slug = 'trust_verification_pressure';
UPDATE pressure_vectors SET invariant_id = (SELECT id FROM structural_invariants WHERE code = 'INV-014') WHERE slug = 'systemic_fragility';

-- Verify: should return 0 rows (no unmapped active vector)
-- SELECT name, slug FROM pressure_vectors WHERE is_active = true AND invariant_id IS NULL;

-- ============================================================
-- SECTION A4 — doctrine_versions
-- Run alone. Confirm before A5.
-- ============================================================

CREATE TABLE doctrine_versions (
  id             serial PRIMARY KEY,
  version        text UNIQUE NOT NULL,          -- e.g. 'doctrine-v2.0'
  invariant_count int NOT NULL DEFAULT 0,
  vector_count    int NOT NULL DEFAULT 0,
  change_note     text,
  active          boolean NOT NULL DEFAULT false,
  created_at      timestamptz DEFAULT now()
);

-- RLS: public read
ALTER TABLE doctrine_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_doctrine_versions"
  ON doctrine_versions FOR SELECT
  USING (true);

-- Seed: V2.0 is the inaugural canonical version (14 invariants, 24 vectors after INV-007 seeds)
INSERT INTO doctrine_versions (version, invariant_count, vector_count, change_note, active)
VALUES ('doctrine-v2.0', 14, 24, 'Inaugural V2 doctrine: 14 structural invariants, 20 legacy vectors + 4 INV-007 seeds.', true);

-- ============================================================
-- SECTION A5 — raw_items upgrade
-- Run alone. Confirm gate before Phase B.
-- ============================================================

-- Add V2 ingest-lane columns to raw_items.
-- All IF NOT EXISTS guarded to be safe against partial runs.
-- Rule 9: idx_raw_items_ingestion_status used (not idx_raw_items_status, which already exists in V1).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'raw_items' AND column_name = 'raw_item_hash'
  ) THEN
    ALTER TABLE raw_items ADD COLUMN raw_item_hash text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'raw_items' AND column_name = 'source_snapshot_hash'
  ) THEN
    ALTER TABLE raw_items ADD COLUMN source_snapshot_hash text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'raw_items' AND column_name = 'ingestion_lane'
  ) THEN
    ALTER TABLE raw_items ADD COLUMN ingestion_lane text DEFAULT 'v1'
      CHECK (ingestion_lane IN ('v1', 'v2'));
  END IF;
END;
$$;

-- Backfill V1 rows as lane 'v1'
UPDATE raw_items SET ingestion_lane = 'v1' WHERE ingestion_lane IS NULL;

-- Index for V2 batch queries (distinct name from V1 status index)
CREATE INDEX IF NOT EXISTS idx_raw_items_ingestion_status
  ON raw_items (ingestion_status)
  WHERE ingestion_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_raw_items_ingestion_lane
  ON raw_items (ingestion_lane);

-- Verify A5: should show all columns present
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'raw_items' AND column_name IN ('raw_item_hash','source_snapshot_hash','ingestion_lane');
