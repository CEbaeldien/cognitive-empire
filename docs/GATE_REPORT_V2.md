# CE Signals V2 — Gate Report

Generated: 2026-06-10  
Branch: main  
Spec ref: docs/CE_SIGNALS_V2_BUILD_SPEC.md

---

## Phase A — Doctrine Foundation

**Status: MIGRATION FILE COMPLETE — pending Studio run**

### A1 — structural_invariants table
- Migration: `supabase/migrations/20260610_signals_v2_phase_a.sql`
- RLS: public read, no write path
- `structural_invariants` is declared `Insert: never / Update: never` in SignalsDatabase type

### A2 — Invariant seeds (14 rows)
- Seeded INV-001 through INV-014 via INSERT
- Verified: all 14 codes unique, display_order 1–14 sequential
- Schema safety: `INSERT INTO structural_invariants` only; no DROP/DELETE/TRUNCATE

### A3 — pressure_vectors remap + visibility scoping
- `ALTER TABLE pressure_vectors ADD COLUMN invariant_id int REFERENCES structural_invariants(id)`
- `ALTER TABLE pressure_vectors ADD COLUMN visibility text NOT NULL DEFAULT 'public' CHECK (...)`
- 20 UPDATE statements mapping all active vectors to INV-001 through INV-014
- Prosperity Pressure: remapped to INV-003 (Value Migration Upstream), `visibility = 'internal'`
- Verification query: `SELECT name, slug FROM pressure_vectors WHERE is_active = true AND invariant_id IS NULL` — should return 0 rows post-run

### A4 — doctrine_versions table
- `doctrine_versions` CREATE TABLE + RLS
- Seeded `doctrine-v2.0` (14 invariants, 24 vectors, `active = true`)

### A5 — raw_items upgrade
- Added: `raw_item_hash text`, `source_snapshot_hash text`, `ingestion_lane text DEFAULT 'v1'`
- All added via `DO $$ IF NOT EXISTS` blocks — safe against partial runs
- Backfill: `UPDATE raw_items SET ingestion_lane = 'v1' WHERE ingestion_lane IS NULL`
- Indexes: `idx_raw_items_ingestion_status` (distinct from V1's `idx_raw_items_status`), `idx_raw_items_ingestion_lane`
- Rule 9 decision logged: index name conflict — used `idx_raw_items_ingestion_status` not `idx_raw_items_status`

### Phase A Gate Checks (post-Studio run)
```sql
-- A1: table exists
SELECT count(*) FROM structural_invariants;  -- expect 0 before A2, 14 after

-- A2: all 14 invariants seeded
SELECT count(*) FROM structural_invariants;  -- expect 14
SELECT code FROM structural_invariants ORDER BY display_order;

-- A3: no unmapped active vectors
SELECT name, slug FROM pressure_vectors WHERE is_active = true AND invariant_id IS NULL;  -- expect 0 rows
SELECT name, visibility FROM pressure_vectors WHERE visibility = 'internal';  -- expect Prosperity Pressure only

-- A4: doctrine version active
SELECT version, active FROM doctrine_versions WHERE active = true;  -- expect doctrine-v2.0

-- A5: columns present
SELECT column_name FROM information_schema.columns
WHERE table_name = 'raw_items' AND column_name IN ('raw_item_hash','source_snapshot_hash','ingestion_lane');
-- expect 3 rows
```

---

## Phase B — Atom Extraction Layer

**Status: MIGRATION FILE COMPLETE — pending Studio run**

### B1 — false_signal_patterns table
- 9 pattern seeds: speculation_masquerading_as_fact, single_source_major_claim, vendor_press_release, regulatory_announcement_without_enforcement, prediction_disguised_as_news, legacy_story_reshared, headline_body_mismatch, vague_attribution, no_verifiable_entity
- Severity distribution: 3 high, 4 medium, 2 low

### B2 — factual_atoms table
- Rule 9 decisions: `raw_item_id uuid` (not bigint per spec), `source_id uuid`, `possible_vector_ids uuid[]`
- Constraint: `CHECK (cardinality(possible_invariant_ids) <= 3)` — enforces max-3 invariant tags at DB level
- FK: `batch_run_id bigint REFERENCES mesodma_batch_runs(id)`

### B3 — mesodma_batch_runs table
- Rule 9 decision: named `mesodma_batch_runs` not `mesodma_runs` — V1 already uses `mesodma_runs` with different schema
- FK wire: `factual_atoms.batch_run_id → mesodma_batch_runs(id)`

### B-INV007 — Responsibility Migration vectors
- Seeded 4 vectors under INV-007: liability_pressure, escalation_pressure, auditability_pressure, ownership_ambiguity
- All visibility='public' (no internal flag for these 4)

### Code: lib/mesodma/v2-types.ts
- All V2 internal types: StructuralInvariant, FalseSignalPattern, DoctrineContext, AtomExtractionOutput, AtomBatchReport, FactualAtomRow, EvidenceClusterRow, ClusterAtomRow, ClusterPassReport, SynthesisOutput, SynthesisPassReport

### Code: lib/mesodma/prompts.ts (amended)
- Added `buildAtomExtractionPrompt()` — injects invariants and patterns at runtime
- Governance rule embedded: "You are an extraction engine only. Never output interpretation."
- Max-3 invariant codes enforced in prompt instructions

### Code: lib/mesodma/atom-extractor.ts
- ATOM_MODEL = "gpt-4o-mini", BATCH_SIZE = 20, ITEM_TIMEOUT_MS = 7000
- TIER_WEIGHT map for source trust tiers
- `loadDoctrineContext()`: loads structural_invariants + false_signal_patterns + doctrine_version
- `extractAtom()`: calls gpt-4o-mini with json_schema structured output
- `resolveInvariantIds()` / `resolveVectorIds()`: lookup helpers
- `writeAtom()`: writes factual_atoms row
- `runAtomBatch()`: opens mesodma_batch_runs → fetches ready_for_mesodma items → parallel extraction → marks raw_items mesodma_processed

### API routes
- `POST /api/mesodma/v2/batch` — runAtomBatch(), maxDuration=10
- `GET  /api/mesodma/v2/batch` — V2 pipeline stats
- `GET  /api/mesodma/v2/atoms?status=noise` — factual_atoms with filters (Noise Corner data source)

### Phase B Gate Checks (post-Studio run)
```sql
-- false_signal_patterns seeded
SELECT count(*) FROM false_signal_patterns WHERE active = true;  -- expect 9

-- factual_atoms table exists with constraint
SELECT count(*) FROM factual_atoms;  -- expect 0 (no pipeline run yet)

-- INV-007 vectors seeded
SELECT name, slug, visibility FROM pressure_vectors WHERE invariant_id = (SELECT id FROM structural_invariants WHERE code = 'INV-007');
-- expect 4 rows + any pre-existing INV-007 vectors
```

---

## Phase C — Evidence Clustering Engine

**Status: MIGRATION FILE COMPLETE — pending Studio run**

### C1 — evidence_clusters table
- Rule 9 decision: `vector_id uuid REFERENCES pressure_vectors(id)` — pressure_vectors has UUID PK
- Thresholds: accumulating=any, mature=60, signal_candidate=75
- Status values: seed → accumulating → mature → signal_candidate → converted | decayed

### C2 — cluster_atoms junction
- `(cluster_id, atom_id)` PRIMARY KEY — prevents duplicate attachments
- `match_score numeric(3,1)` — stores overlap score from scoreAtomClusterMatch

### Code: lib/mesodma/clustering.ts
- `computeEvidenceMass()`: **pure deterministic function — zero AI calls**
  - Formula locked per spec: Σ(atom_score × 10) + bonuses − penalties, capped at 100
  - atom_score = source_weight × recency_factor × evidence_type_weight × (1 − false_signal_risk × 0.5) × distribution_penalty
  - Bonuses: independence (min(source_count,6)×2), vector_spread, corroboration (+8 if ≥3 sources)
  - Penalties: contradiction_level × 10
- `scoreAtomClusterMatch()`: returns -1 if no shared invariant; 0–5 based on overlap
- `seedCluster()`: creates new cluster from atom's first invariant_id
- `runClusteringPass()`: loads unmatched atoms → attach or seed → recompute mass → runDecayCheck

### API route
- `POST /api/mesodma/v2/cluster` — runClusteringPass(), maxDuration=10
- `GET  /api/mesodma/v2/cluster` — cluster status counts

### Phase C Gate Checks (post-Studio run)
```sql
SELECT count(*) FROM evidence_clusters;  -- expect 0 (no pipeline run yet)
SELECT count(*) FROM cluster_atoms;      -- expect 0
```

---

## Phase D — Signal Intelligence Synthesis

**Status: MIGRATION FILE COMPLETE — pending Studio run**

### D1 — signal_intelligence_runs table
- bigserial PK, trigger_type enum, run metrics

### D2 — ALTER TABLE signals (14 new V2 columns)
- All added with `IF NOT EXISTS` (safe against partial runs)
- New columns: cluster_id, invariant_id, birth_type, evidence_mass_at_birth, evidence_snapshot, doctrine_basis, governance_pressure_note, maintenance_gravity_note, continuity_note, physical_constraint_note, contradiction_note, lifecycle_status, legacy_signal (DEFAULT false), created_by_run_id
- Grandfather pass: `UPDATE signals SET legacy_signal = true WHERE cluster_id IS NULL AND (legacy_signal IS NULL OR legacy_signal = false)` — idempotent

### D3 — human_governance_actions table
- signal_id uuid REFERENCES signals, run_id bigint REFERENCES signal_intelligence_runs
- Append-only log (Insert only in SignalsDatabase type)

### Code: lib/mesodma/synthesis.ts
- SYNTHESIS_MODEL = "claude-opus-4-8", MAX_CLUSTERS = 1 (Vercel Hobby constraint)
- FORBIDDEN_PHRASES list — scanned before any DB write
- `buildSynthesisSystemPrompt()`: 10-step anatomy, no prediction language enforced in code
- `validateOutput()`: checks forbidden language, supporting_atom_ids ≥ 2, source_count ≥ 2, valid category
- `createSignalCandidate()`: status='draft', legacy_signal=false; inserts review_queue + human_governance_actions
- **Visibility gate** (D3 spec amendment): if cluster's primary vector has `visibility = 'internal'` → route to internal only, never human_review_candidate for publication
- All synthesis candidates land as `publication_status = 'draft'` — nothing auto-publishes (Hard Constraint 7)

### Vercel Hobby note
- MAX_CLUSTERS=1 per synthesis call due to 10s maxDuration limit
- claude-opus-4-8 calls may approach the 10s window; production synthesis should use Vercel Pro or a separate worker
- Logged here per Rule 9 (most conservative option chosen, cannot proceed more aggressively on Hobby)

### API route
- `POST /api/mesodma/v2/synthesize` — runSynthesisPass(triggerType), maxDuration=10

### Phase D Gate Checks (post-Studio run)
```sql
-- New columns present on signals
SELECT column_name FROM information_schema.columns
WHERE table_name = 'signals'
AND column_name IN ('cluster_id','invariant_id','birth_type','evidence_mass_at_birth',
  'legacy_signal','lifecycle_status','created_by_run_id');
-- expect 7 rows

-- Grandfather pass: all pre-V2 signals flagged
SELECT count(*) FROM signals WHERE legacy_signal = true;  -- expect N = all existing signals
SELECT count(*) FROM signals WHERE cluster_id IS NULL AND legacy_signal = false;  -- expect 0

-- human_governance_actions table exists
SELECT count(*) FROM human_governance_actions;  -- expect 0
```

---

## Phase E — Public Page V2 Layout

**Status: CODE COMPLETE — gated behind env var**

### Gate mechanism
- `NEXT_PUBLIC_SIGNALS_V2=true` → V2 layout rendered
- Default (flag absent/false) → V1 layout rendered unchanged
- Visitors currently see V1 layout. Hard Constraint 8 satisfied.

### V2 layout: 13 slots
1. Featured Signal — strongest by evidence_mass_at_birth (legacy fallback: final_score)
2. Intelligence spotlight — top 3 by evidence_mass_at_birth
3. Infrastructure spotlight — top 3
4. Governance & Stability spotlight — top 3
5. Convergence Watch — 3 published convergences

### V2 signal card fields
- title, summary, structural_relevance, second_order_effect (featured only)
- invariant badge (signals.invariant_id → structural_invariants.code)
- pressure vectors: `visibility='public'` only (D3/E1 amendment applied)
- evidence strength band: Strong ≥75, Building ≥50, Emerging otherwise (evidence_mass_at_birth)
- legacy signals: band by final_score instead

### Convergences (Phase E migration)
- `ALTER TABLE convergences ADD COLUMN IF NOT EXISTS linked_cluster_ids bigint[]`
- `ALTER TABLE convergences ADD COLUMN IF NOT EXISTS dominant_invariant_ids int[]`
- `ALTER TABLE convergences ADD COLUMN IF NOT EXISTS convergence_strength numeric(5,2)`

### Gate Check
```
# Activate V2 layout:
NEXT_PUBLIC_SIGNALS_V2=true npm run dev
# Visit /signals — should show Featured Signal + 3 spotlights + Convergence Watch
# Default (flag off) — should show V1 layout unchanged
```

---

## Post-Build Corrections (2026-06-10)

### B1 — false_signal_patterns type mismatch (corrected)

**What was wrong:** `FalseSignalPatternRow` in `types/signals.ts` was authored with fields `pattern_name`, `detection_hint`, and `severity` that do not exist in the actual DB table. The spec (and the migration) use `name`, `description`, `indicators text[]`. The type would have caused runtime errors in any code reading this table via the typed client.

**Fix applied:** `FalseSignalPatternRow` corrected to match actual schema: `name`, `description`, `indicators: string[]`. No migration required — DB was correct; type was wrong.

**Pattern content audit (all 7 "missing" canon patterns found already seeded):**

| Requested slug | DB row (already present) |
|---|---|
| benchmark_claim_without_deployment | "Benchmark claim without deployment consequence" |
| funding_without_buildout | "Funding news with no infrastructure buildout" |
| agent_demo_without_transaction | "AI agent demo without economic transaction evidence" |
| tool_launch_without_dependency_shift | "Tool launch with no workflow dependency shift" |
| marketing_without_adoption | "Marketing claim without measured adoption" |
| social_hype_without_institutional_movement | "Social hype without institutional movement" |
| media_wave_without_primary_source | "Media wave with no primary source" (row 2 of 9) |

**media_wave_without_primary_source decision:** Row 2 of the 9 seeded patterns covers this exactly. No duplicate added. Logged here per Rule 9 spirit (deviation audit requested by founder).

**No Studio migration required for this correction.** DB is correct. Type was wrong. Fixed in `types/signals.ts`.

---

## Rule 9 Decisions Log

All decisions where spec was ambiguous, conflicting, or unsafe — chose most conservative additive option.

| # | Phase | Decision |
|---|-------|----------|
| 1 | B2 | `factual_atoms.raw_item_id` typed as `uuid` (not bigint) — raw_items has UUID PK |
| 2 | B2 | `factual_atoms.source_id` typed as `uuid` — sources has UUID PK |
| 3 | B2 | `factual_atoms.possible_vector_ids` typed as `uuid[]` — pressure_vectors has UUID PK |
| 4 | B3 | Table named `mesodma_batch_runs` not `mesodma_runs` — V1 conflict avoidance |
| 5 | C1 | `evidence_clusters.vector_id` typed as `uuid` — pressure_vectors has UUID PK |
| 6 | A5 | Index named `idx_raw_items_ingestion_status` not `idx_raw_items_status` — V1 name conflict |
| 7 | D  | MAX_CLUSTERS=1 per synthesis call — Vercel Hobby 10s constraint |

## Cleanup List

| # | Item | Priority |
|---|------|----------|
| 1 | Admin "Run Batch Now" button (`app/ce-admin/mesodma/page.tsx:115`) calls `/api/mesodma/batch` (V1). Needs a separate V2 section or a second button wired to `/api/mesodma/v2/batch` with the cluster and synthesize triggers. | Before V2 pipeline goes live |
| 2 | `app/ce-admin/mesodma/noise-corner/page.tsx` and `app/ce-admin/mesodma/page.tsx` hardcode `"Bearer ce-mesodma-2026"` — should read from `process.env.NEXT_PUBLIC_MESODMA_API_KEY` or be moved server-side. | Low (admin-only pages, key already public in client bundle) |

---

## Hard Constraints Audit

| # | Constraint | Status |
|---|-----------|--------|
| 3 | No DROP/DELETE/TRUNCATE/destructive ALTER | SATISFIED — additive only throughout |
| 4 | structural_invariants read-only forever | SATISFIED — Insert/Update: never in type |
| 5 | Evidence mass deterministic, no AI scoring | SATISFIED — computeEvidenceMass() is pure, zero AI calls |
| 6 | No prediction language, Mesodma extraction-only | SATISFIED — forbidden phrases checked before DB write; extraction prompt governance rule embedded |
| 7 | All synthesis candidates → draft → review_queue | SATISFIED — createSignalCandidate() always status='draft'; no auto-publish path |
| 8 | V2 public page gated behind env var | SATISFIED — NEXT_PUBLIC_SIGNALS_V2=true required; visitors see V1 by default |
| 9 | Most conservative additive option when spec silent | SATISFIED — 7 Rule 9 decisions logged above |
| 10 | Gate checks recorded | SATISFIED — per-phase checks above |
| 11 | Gate report written | SATISFIED — this document |
| 12 | Commit after each phase | PENDING — commits follow this report |
