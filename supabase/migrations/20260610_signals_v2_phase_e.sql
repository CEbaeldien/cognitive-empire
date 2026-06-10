-- CE SIGNALS V2 — PHASE E: OUTPUTS
-- Spec ref: docs/CE_SIGNALS_V2_BUILD_SPEC.md § Phase E
-- Requires: Phase D complete (evidence_clusters exists for FK).
-- NOTE: Public page (E1) and internal view (E2) are code-gated behind
--       NEXT_PUBLIC_SIGNALS_V2=true env var. Existing public page unchanged until flag is set.

-- ============================================================
-- SECTION E3 — ALTER convergences (additive only)
-- ============================================================

ALTER TABLE convergences
  ADD COLUMN IF NOT EXISTS linked_cluster_ids      bigint[],
  ADD COLUMN IF NOT EXISTS dominant_invariant_ids  int[],
  ADD COLUMN IF NOT EXISTS convergence_strength    numeric;

-- ============================================================
-- GATE E verification queries:
-- ============================================================
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'convergences' ORDER BY ordinal_position;
-- Verify Phase E public page: set NEXT_PUBLIC_SIGNALS_V2=true and check /signals renders 13-slot layout.
