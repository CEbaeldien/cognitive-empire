-- Migration: signal_category enum restructure — 8 flat → 3 top-level
-- Tables in scope: signals, sources
-- Tables explicitly OUT OF SCOPE:
--   candidate_evidence / first_pass_signals — domain column already on 3-value schema
--   raw_items.extracted_fields.possible_category — free-form hints, no change by design
-- Subcategory columns: already exist on signals, sources, candidate_evidence,
--   first_pass_signals — NO new columns added here.
--
-- Run order is critical — data must be remapped before enum is rebuilt.
-- All three target values (intelligence, governance_stability, infrastructure) are
-- valid in the current 8-value enum, so UPDATEs execute cleanly before the ALTER.
--
-- Mapping applied:
--   physical_systems        → infrastructure  (subcategory: Physical Systems)
--   energy                  → infrastructure  (subcategory: Energy)
--   resources_continuity    → infrastructure  (subcategory: Resources & Continuity)
--   science_frontier        → intelligence    (subcategory: Science & Frontier)
--   markets_human_prosperity→ governance_stability (subcategory: Markets & Human Prosperity)
--   intelligence            → intelligence    (top-level, no subcategory set)
--   governance_stability    → governance_stability (top-level, no subcategory set)
--   infrastructure          → infrastructure  (top-level, no subcategory set)
--   signals.category        → both rows are 'intelligence', no remap needed

-- ============================================================
-- PHASE 1: Remap sources rows and populate subcategory
-- ============================================================

UPDATE sources
SET category    = 'infrastructure',
    subcategory = COALESCE(NULLIF(subcategory, ''), 'Physical Systems')
WHERE category = 'physical_systems';

UPDATE sources
SET category    = 'infrastructure',
    subcategory = COALESCE(NULLIF(subcategory, ''), 'Energy')
WHERE category = 'energy';

UPDATE sources
SET category    = 'infrastructure',
    subcategory = COALESCE(NULLIF(subcategory, ''), 'Resources & Continuity')
WHERE category = 'resources_continuity';

UPDATE sources
SET category    = 'intelligence',
    subcategory = COALESCE(NULLIF(subcategory, ''), 'Science & Frontier')
WHERE category = 'science_frontier';

UPDATE sources
SET category    = 'governance_stability',
    subcategory = COALESCE(NULLIF(subcategory, ''), 'Markets & Human Prosperity')
WHERE category = 'markets_human_prosperity';

-- signals: both rows are 'intelligence' (top-level) — no category or subcategory change.
-- If any signals.category rows exist with old values (shouldn't, but guard):
UPDATE signals SET category = 'infrastructure' WHERE category IN ('physical_systems', 'energy', 'resources_continuity');
UPDATE signals SET category = 'intelligence'   WHERE category = 'science_frontier';
UPDATE signals SET category = 'governance_stability' WHERE category = 'markets_human_prosperity';

-- ============================================================
-- PHASE 2: Rebuild signal_category enum with 3 top-level values
-- Postgres cannot remove enum values in place — create new type,
-- cast existing columns, drop old type, rename.
-- ============================================================

CREATE TYPE signal_category_v3 AS ENUM (
  'intelligence',
  'governance_stability',
  'infrastructure'
);

ALTER TABLE signals
  ALTER COLUMN category TYPE signal_category_v3
    USING category::text::signal_category_v3;

ALTER TABLE sources
  ALTER COLUMN category TYPE signal_category_v3
    USING category::text::signal_category_v3;

DROP TYPE signal_category;

ALTER TYPE signal_category_v3 RENAME TO signal_category;

-- ============================================================
-- Verification queries (run after applying):
-- ============================================================
-- SELECT category, COUNT(*) FROM signals GROUP BY category;
-- SELECT category, subcategory, COUNT(*) FROM sources GROUP BY category, subcategory ORDER BY category;
-- SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'signal_category';
