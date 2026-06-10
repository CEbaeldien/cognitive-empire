-- CE SIGNALS V2 — PHASE C: CLUSTERING ENGINE
-- Spec ref: docs/CE_SIGNALS_V2_BUILD_SPEC.md § Phase C
-- Requires: Phase B complete (factual_atoms, mesodma_batch_runs exist).

-- ============================================================
-- RULE 9 DEVIATIONS FROM SPEC
-- ============================================================
-- C1: evidence_clusters.vector_id is uuid (spec says int) — pressure_vectors.id is UUID.
-- Matching logic and evidence mass formula are implemented in code (lib/mesodma/clustering.ts),
-- not in SQL triggers, per deterministic-code-only constraint.
-- ============================================================

-- ============================================================
-- SECTION C1 — evidence_clusters + cluster_atoms
-- ============================================================

CREATE TABLE IF NOT EXISTS evidence_clusters (
  id                  bigserial PRIMARY KEY,
  invariant_id        int NOT NULL REFERENCES structural_invariants(id),
  vector_id           uuid REFERENCES pressure_vectors(id),
  working_title       text,
  cluster_summary     text,
  status              text DEFAULT 'seed' CHECK (status IN (
                        'seed','accumulating','mature','signal_candidate',
                        'converted','expired','rejected','contradicted'
                      )),
  evidence_mass       numeric DEFAULT 0,
  atom_count          int DEFAULT 0,
  source_count        int DEFAULT 0,
  novelty_level       numeric DEFAULT 0,
  contradiction_level numeric DEFAULT 0,
  confidence          numeric,
  distribution_stage  text,
  entity_keys         text[] DEFAULT ARRAY[]::text[],
  geography_keys      text[] DEFAULT ARRAY[]::text[],
  technology_keys     text[] DEFAULT ARRAY[]::text[],
  first_atom_at       timestamptz,
  last_atom_at        timestamptz,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cluster_atoms (
  cluster_id          bigint NOT NULL REFERENCES evidence_clusters(id) ON DELETE CASCADE,
  atom_id             bigint NOT NULL REFERENCES factual_atoms(id) ON DELETE CASCADE,
  contribution_weight numeric DEFAULT 1.0,
  created_at          timestamptz DEFAULT now(),
  PRIMARY KEY (cluster_id, atom_id)
);

CREATE INDEX IF NOT EXISTS idx_clusters_status    ON evidence_clusters(status);
CREATE INDEX IF NOT EXISTS idx_clusters_invariant ON evidence_clusters(invariant_id);
CREATE INDEX IF NOT EXISTS idx_clusters_mass      ON evidence_clusters(evidence_mass DESC);
CREATE INDEX IF NOT EXISTS idx_clusters_updated   ON evidence_clusters(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_cluster_atoms_atom ON cluster_atoms(atom_id);

-- updated_at trigger for evidence_clusters
CREATE OR REPLACE FUNCTION update_evidence_clusters_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_evidence_clusters_updated_at
  BEFORE UPDATE ON evidence_clusters
  FOR EACH ROW EXECUTE FUNCTION update_evidence_clusters_updated_at();

-- ============================================================
-- GATE C verification queries:
-- ============================================================
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'evidence_clusters' ORDER BY ordinal_position;
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'cluster_atoms' ORDER BY ordinal_position;
-- SELECT conname, confrelid::regclass FROM pg_constraint WHERE conrelid = 'evidence_clusters'::regclass;
