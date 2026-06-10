# CE SIGNALS V2 — BUILD SPEC FOR CLAUDE CODE
## Mesodma v2 + Signal Intelligence Layer
### Doctrine reference: CE Signals Full System Map v2 (2026-06-10)

---

## GOVERNANCE RULES (READ FIRST — NON-NEGOTIABLE)

1. **No single update births a signal.** Update → atom → cluster → mature cluster → signal candidate → human governance → signal.
2. **Structural invariants are fixed.** 14 rows, founder-edit only. No AI write path to this table, ever.
3. **Evidence mass is deterministic.** AI never scores. AI may explain a score; it may not produce one.
4. **Mesodma is extraction-only.** Cheap model. No interpretation, no synthesis, no doctrine conclusions.
5. **No prediction language** anywhere in synthesis output. Allowed: indicates pressure, suggests movement, supports the cluster, raises watch priority, points toward, is consistent with. Forbidden: will happen, guaranteed, inevitable, certain, forecast, prediction.
6. **All SQL runs in sections with founder confirmation between each section.** Never run a full migration unattended.
7. **Legacy signals are grandfathered:** `legacy_signal = true`, `cluster_id = null`. No backfill. All NEW signals require cluster lineage.
8. **Canon invariants are INV-001 through INV-014 exactly as seeded in Phase A.** Any other "14 lenses" list found in assets or prior chats is non-canonical and must be ignored.

---

## BUILD ORDER

```
Phase A — Doctrine Foundation     (tables + seeds, no AI changes)
Phase B — Mesodma v2              (atom extraction pipeline)
Phase C — Clustering Engine       (deterministic accumulation)
Phase D — Signal Intelligence     (synthesis + governance routing)
Phase E — Outputs                 (public/internal/convergence)
```

Each phase ends with a verification gate. Do not start the next phase until the gate passes and the founder confirms.

Deferred (post-E, no rework required): source_snapshots full versioning, incident_hazard source lane, CE object export API.

---

# PHASE A — DOCTRINE FOUNDATION

## A1. structural_invariants table

```sql
-- SECTION A1 — run alone, confirm before A2
CREATE TABLE structural_invariants (
  id            serial PRIMARY KEY,
  code          text UNIQUE NOT NULL,        -- 'INV-001'
  name          text NOT NULL,
  statement     text NOT NULL,
  function_note text,
  display_order int NOT NULL,
  active        boolean DEFAULT true,
  created_at    timestamptz DEFAULT now()
);
-- RLS: read for service role; write restricted to founder/admin role only.
```

## A2. Seed the 14 canon invariants

```sql
-- SECTION A2 — run alone, confirm before A3
INSERT INTO structural_invariants (code, name, statement, function_note, display_order) VALUES
('INV-001','Intelligence Abundance','Intelligence-like capability is becoming increasingly accessible, reducing the scarcity of analysis, generation, and execution.','Root invariant. Everything else follows from it.',1),
('INV-002','Output Inflation','As intelligence becomes abundant, production volume rises faster than selection quality.','Explains why raw output loses value and filtration gains power.',2),
('INV-003','Value Migration Upstream','When execution becomes less scarce, value migrates toward judgment, selection, ownership, governance, and constraint design.','Explains where advantage moves.',3),
('INV-004','Visibility Lag','Visible popularity trails structural reality; by the time something dominates surface visibility, discovery has often ended and distribution has begun.','Core Signals lens. Prevents surface-chasing.',4),
('INV-005','Bottleneck Migration','When one constraint collapses, another becomes dominant, often at a higher layer of coordination, governance, infrastructure, or responsibility.','Turns updates into constraint-detection.',5),
('INV-006','Capability Volatility','Rapid capability change destabilizes strategy, tool mastery, decision half-life, and operational coherence.','Explains drift caused by constant model/tool change.',6),
('INV-007','Responsibility Migration','As automation expands, ambiguity increases around ownership, liability, escalation, and accountable commitment.','Links AI systems to governance, loop-presence, and consequential judgment.',7),
('INV-008','Governance Pressure','Systems with expanding capability require stronger authority boundaries, escalation rules, auditability, and loss-boundary controls.','Filters governance-relevant updates from regulation noise.',8),
('INV-009','Maintenance Gravity','Creation friction declines faster than continuity capacity expands, causing operational, governance, and maintenance burden to accumulate.','Detects hidden cost behind new systems and integrations.',9),
('INV-010','Continuity Scarcity','Under abundance and volatility, the ability to preserve coherent execution over time becomes a scarce and valuable property.','Connects Signals to Operational Continuity Architecture.',10),
('INV-011','Physical Constraint','Digital intelligence expansion remains bounded by physical infrastructure: compute, chips, energy, cooling, land, supply chains, capital, and geography.','Prevents software-only hallucination. Critical for Infrastructure.',11),
('INV-012','Structural Legibility','As agent-mediated systems expand, value shifts toward entities, products, and institutions that are machine-readable, verifiable, attributable, and transaction-ready.','AEO foundation. Agentic commerce lens.',12),
('INV-013','Second-Order Pressure','The most important consequence of an update is often not the event itself, but where cost, responsibility, power, fragility, or dependency relocates afterward.','Prevents first-order spectacle. Core SI lens.',13),
('INV-014','Survivability Over Speed','Systems optimized only for speed and capability become brittle; durable advantage comes from governability, continuity, and resilience under pressure.','Evaluates durable capacity vs. velocity.',14);
```

## A3. pressure_vectors remap

```sql
-- SECTION A3 — run alone, confirm before A4
ALTER TABLE pressure_vectors
  ADD COLUMN invariant_id int REFERENCES structural_invariants(id);
-- Then map all 20 existing vectors to a parent invariant.
-- Produce the proposed mapping as a SELECT preview FIRST; founder approves
-- the mapping before the UPDATE statements run.
```

## A4. doctrine_versions

```sql
-- SECTION A4 — run alone, confirm before A5
CREATE TABLE doctrine_versions (
  id           serial PRIMARY KEY,
  version_tag  text UNIQUE NOT NULL,        -- 'doctrine-v2.0'
  description  text,
  invariant_set jsonb,                      -- snapshot of invariant codes active
  active       boolean DEFAULT false,
  created_at   timestamptz DEFAULT now()
);
INSERT INTO doctrine_versions (version_tag, description, active)
VALUES ('doctrine-v2.0','System Map v2 — 14 invariants, atom/cluster/synthesis architecture', true);
```

## A5. raw_items upgrade

```sql
-- SECTION A5 — run alone, confirm gate
ALTER TABLE raw_items
  ADD COLUMN IF NOT EXISTS raw_item_hash text,
  ADD COLUMN IF NOT EXISTS source_snapshot_hash text,
  ADD COLUMN IF NOT EXISTS ingestion_lane text,         -- rss | api | direct | doctrine
  ADD COLUMN IF NOT EXISTS ingestion_status text DEFAULT 'new';
-- statuses: new | ingested | duplicate | needs_fetch | failed_fetch
--           | ready_for_mesodma | mesodma_processed | rejected_noise
CREATE INDEX IF NOT EXISTS idx_raw_items_status ON raw_items(ingestion_status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_raw_items_hash ON raw_items(raw_item_hash);
```

**GATE A:** 14 invariants seeded and readable; all 20 vectors mapped to parents; doctrine-v2.0 active; raw_items dedup by hash working on next ingestion run.

---

# PHASE B — MESODMA V2

## B1. false_signal_patterns

```sql
-- SECTION B1
CREATE TABLE false_signal_patterns (
  id          serial PRIMARY KEY,
  name        text NOT NULL,
  description text NOT NULL,
  indicators  text[],
  active      boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
);
```

Seed (9 patterns): single vendor announcement with no adoption proof; media wave with no primary source; benchmark claim without deployment consequence; regulatory proposal with no enforcement path; funding news with no infrastructure buildout; AI agent demo without economic transaction evidence; tool launch with no workflow dependency shift; marketing claim without measured adoption; social hype without institutional movement.

## B2. factual_atoms

```sql
-- SECTION B2
CREATE TABLE factual_atoms (
  id                     bigserial PRIMARY KEY,
  raw_item_id            bigint REFERENCES raw_items(id),
  source_id              int REFERENCES sources(id),
  mesodma_run_id         bigint,                  -- FK added after B3
  atom_summary           text NOT NULL,
  who                    text,
  what_changed           text,
  when_date              date,
  where_location         text,
  why_if_stated          text,
  how_if_stated          text,
  system_affected        text,
  entities               text[],
  companies              text[],
  countries              text[],
  technologies           text[],
  numbers                jsonb,
  evidence_type          text,    -- announcement | data | policy | research
                                  -- | deployment | incident | financial
  source_claim           text,
  source_weight          numeric DEFAULT 1.0,
  possible_invariant_ids int[],   -- HARD CAP 3 — enforce in code AND constraint
  possible_vector_ids    int[],
  duplicate_risk         numeric DEFAULT 0,
  distribution_stage     text,    -- origin | early | wave | saturated
  false_signal_risk      numeric DEFAULT 0,
  extraction_confidence  numeric,
  extracted_by_model     text,
  extraction_prompt_version text,
  doctrine_version       text,
  status                 text DEFAULT 'atom',
  -- atom | noise | duplicate | needs_enrichment | low_confidence | rejected
  created_at             timestamptz DEFAULT now(),
  CONSTRAINT max_three_invariants
    CHECK (array_length(possible_invariant_ids,1) IS NULL
        OR array_length(possible_invariant_ids,1) <= 3)
);
CREATE INDEX idx_atoms_status ON factual_atoms(status);
CREATE INDEX idx_atoms_invariants ON factual_atoms USING gin(possible_invariant_ids);
```

## B3. mesodma_runs

```sql
-- SECTION B3
CREATE TABLE mesodma_runs (
  id              bigserial PRIMARY KEY,
  input_count     int,
  output_count    int,
  noise_count     int,
  duplicate_count int,
  model_used      text,
  prompt_version  text,
  doctrine_version text,
  failed_items    jsonb,
  error_count     int DEFAULT 0,
  started_at      timestamptz,
  completed_at    timestamptz,
  status          text DEFAULT 'running'
  -- running | completed | completed_with_errors | failed | cancelled
);
ALTER TABLE factual_atoms
  ADD CONSTRAINT fk_atom_run FOREIGN KEY (mesodma_run_id) REFERENCES mesodma_runs(id);
```

## B4. Mesodma prompt v2 (replaces classification prompt)

System prompt core — adapt formatting to existing module structure:

```
You are Mesodma, the digestion layer of CE Signals. You extract factual
atoms from raw updates. You do not interpret. You do not conclude. You do
not decide whether something is a signal.

For each raw update, do exactly this:

1. NOISE CHECK. If the update is opinion, hype, ads, filler, repetition,
   or contains no concrete factual change, output {"status":"noise"} and stop.

2. 5W1H EXTRACTION. Extract: who, what_changed, when, where, why_if_stated,
   how_if_stated, system_affected. Only what the source states. Never infer.

3. ENTITY/NUMBER EXTRACTION. entities, companies, countries, technologies,
   numbers (with units), dates.

4. EVIDENCE TYPE. One of: announcement, data, policy, research, deployment,
   incident, financial.

5. POSSIBLE INVARIANT TAGS. From the fixed list of 14 structural invariants
   provided below, tag AT MOST 3 that this fact could contribute evidence
   toward. If unsure, tag fewer. These are hints, not conclusions.

6. FALSE-SIGNAL PRECHECK. Compare against the provided false-signal
   patterns. Output false_signal_risk 0.0–1.0.

7. DISTRIBUTION STAGE. origin (primary source), early, wave, saturated.

OUTPUT: a single JSON object per update. No prose.

A good atom: "Company X announced a 500MW energy procurement agreement for
data center expansion in region Y on date Z."
A bad atom: "AI infrastructure bottlenecks are shifting toward energy."
The second is interpretation. Interpretation is not your job.
```

Inject at runtime: the 14 invariants (code + name + statement), active false_signal_patterns, doctrine_version tag. Keep the cheap model (current Haiku/4o-mini choice unchanged).

## B5. Pipeline wiring

- `/api/mesodma/batch` v2: pull `ready_for_mesodma` raw_items → run prompt v2 → insert factual_atoms → mark `mesodma_processed` → log mesodma_run. Keep maxDuration=10, 20-item cap, Promise.allSettled.
- Noise Corner now reads `factual_atoms.status = 'noise'` (preserve existing UI, swap data source).

**GATE B:** Run one live batch. Verify: atoms have 5W1H fields populated, ≤3 invariant tags, provenance fields set, run logged, noise routed correctly. Founder spot-checks 10 atoms for interpretation leakage.

**Phase B backlog (complete before Mesodma v2 goes live):** Seed 3–4 pressure vectors under INV-007 Responsibility Migration — this invariant has no existing vector. Candidates: Liability Pressure, Escalation Pressure, Auditability Pressure, Ownership Ambiguity. Add via Studio, set `visibility = 'public'`, map `invariant_id` to INV-007.

---

# PHASE C — CLUSTERING ENGINE

## C1. evidence_clusters + cluster_atoms

```sql
-- SECTION C1
CREATE TABLE evidence_clusters (
  id                  bigserial PRIMARY KEY,
  invariant_id        int NOT NULL REFERENCES structural_invariants(id),
  vector_id           int REFERENCES pressure_vectors(id),
  working_title       text,
  cluster_summary     text,
  status              text DEFAULT 'seed',
  -- seed | accumulating | mature | signal_candidate | converted
  -- | expired | rejected | contradicted
  evidence_mass       numeric DEFAULT 0,
  atom_count          int DEFAULT 0,
  source_count        int DEFAULT 0,
  novelty_level       numeric DEFAULT 0,
  contradiction_level numeric DEFAULT 0,
  confidence          numeric,
  distribution_stage  text,
  entity_keys         text[],     -- graph-like link dimensions
  geography_keys      text[],
  technology_keys     text[],
  first_atom_at       timestamptz,
  last_atom_at        timestamptz,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

CREATE TABLE cluster_atoms (
  cluster_id          bigint REFERENCES evidence_clusters(id),
  atom_id             bigint REFERENCES factual_atoms(id),
  contribution_weight numeric DEFAULT 1.0,
  created_at          timestamptz DEFAULT now(),
  PRIMARY KEY (cluster_id, atom_id)
);
CREATE INDEX idx_clusters_status ON evidence_clusters(status);
CREATE INDEX idx_clusters_invariant ON evidence_clusters(invariant_id);
```

## C2. Matching logic (deterministic, code not AI)

An atom attaches to an open cluster (status in seed/accumulating/mature) when:

```
REQUIRED:  shared invariant_id (atom tag ∩ cluster invariant)
PLUS ≥2 of:
  - shared pressure vector
  - entity overlap (any of entities/companies)
  - geography overlap
  - technology overlap
  - within cluster's active time window (last_atom_at + 30 days)
```

No qualifying cluster → seed a new one (invariant from atom's strongest tag, vector if present, entity/geo/tech keys copied in). An atom with 2–3 invariant tags may attach to multiple clusters — that is correct behavior, convergence feeds on it.

## C3. Evidence mass formula (deterministic — locked)

```
For each atom in cluster:
  atom_score = source_weight                 (official/primary 1.5, research 1.3,
                                              quality media 1.0, aggregator 0.6)
             × recency_factor                (1.0 ≤7d, 0.8 ≤14d, 0.6 ≤30d, 0.3 older)
             × evidence_type_weight          (deployment/data/incident 1.3,
                                              policy 1.2, financial 1.1,
                                              research 1.0, announcement 0.8)
             × (1 − false_signal_risk × 0.5)
             × distribution_penalty          (origin 1.0, early 0.9,
                                              wave 0.6, saturated 0.4)

cluster bonuses:
  independence_bonus  = min(source_count, 6) × 2
  vector_spread_bonus = distinct vectors > 1 ? +5 : 0
  corroboration       = atoms from ≥3 independent sources within 14d ? +8 : 0

penalties:
  contradiction_penalty = contradiction_level × 10
  staleness: recompute nightly; recency_factor decays automatically

evidence_mass = Σ(atom_score × 10) + bonuses − penalties, capped at 100
```

Tune multipliers after 2 weeks of real data. AI never touches this computation.

## C4. Maturity thresholds + decay (locked)

```
mass ≥ 60  → status mature            (synthesis eligible)
mass ≥ 75  → internal signal candidate
mass ≥ 85  → human review candidate for publication
14 days no new atom → decay toward expired
(governance/infrastructure clusters: revisit decay window after Phase E)
```

## C5. Cron wiring (extend existing n8n cycles)

- **Daily:** clustering pass on new atoms → recompute mass → update statuses → decay check.
- Log every pass to `pipeline_runs` (same field shape as mesodma_runs, run_type='clustering').

**GATE C:** After 3 daily cycles: clusters forming with correct lineage, mass recomputing deterministically (same inputs → same score), decay firing, no orphan atoms. Founder reviews cluster list.

---

# PHASE D — SIGNAL INTELLIGENCE

## D1. Tables

```sql
-- SECTION D1
CREATE TABLE signal_intelligence_runs (
  id               bigserial PRIMARY KEY,
  trigger_type     text,      -- threshold | cycle
  clusters_evaluated int,
  candidates_created int,
  model_used       text,
  prompt_version   text,
  doctrine_version text,
  error_count      int DEFAULT 0,
  started_at       timestamptz,
  completed_at     timestamptz,
  status           text DEFAULT 'running'
);

ALTER TABLE signals
  ADD COLUMN IF NOT EXISTS cluster_id bigint REFERENCES evidence_clusters(id),
  ADD COLUMN IF NOT EXISTS invariant_id int REFERENCES structural_invariants(id),
  ADD COLUMN IF NOT EXISTS birth_type text,    -- threshold | cycle | human_promoted
  ADD COLUMN IF NOT EXISTS evidence_mass_at_birth numeric,
  ADD COLUMN IF NOT EXISTS evidence_snapshot jsonb,
  ADD COLUMN IF NOT EXISTS doctrine_basis text,
  ADD COLUMN IF NOT EXISTS second_order_effect text,
  ADD COLUMN IF NOT EXISTS governance_pressure_note text,
  ADD COLUMN IF NOT EXISTS maintenance_gravity_note text,
  ADD COLUMN IF NOT EXISTS continuity_note text,
  ADD COLUMN IF NOT EXISTS physical_constraint_note text,
  ADD COLUMN IF NOT EXISTS contradiction_note text,
  ADD COLUMN IF NOT EXISTS lifecycle_status text DEFAULT 'emerging',
  -- emerging | strengthening | weakening | confirmed | contradicted
  -- | distributed | retired
  ADD COLUMN IF NOT EXISTS legacy_signal boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_by_run_id bigint;

-- Grandfather pass:
UPDATE signals SET legacy_signal = true WHERE cluster_id IS NULL;

CREATE TABLE human_governance_actions (
  id          bigserial PRIMARY KEY,
  signal_id   bigint REFERENCES signals(id),
  action_type text,   -- approve | revise | reject | retire | mark_contradicted
                      -- | request_more_evidence | escalate_to_internal | publish
  notes       text,
  acted_by    text,
  created_at  timestamptz DEFAULT now()
);
```

## D2. Synthesis module (the ONE expensive model call in the system)

Trigger: threshold (mass crosses 60) or weekly cycle pass over all mature clusters.

Input package per cluster: cluster summary + all atoms (5W1H + provenance) + invariant statement + mapped vectors + Eight Laws + false_signal_patterns + any contradicting atoms.

The synthesis prompt runs the 10-step anatomy in order:

```
1. Cluster intake — restate accumulated evidence factually
2. Invariant alignment — which invariant(s), how directly
3. Doctrine weighting — Eight Laws + prime chain application
4. Pressure vector interpretation — what pressure, manifesting how
5. Contradiction/adversarial check — rival explanations, hype test
6. Second-order analysis — where cost/responsibility/power/fragility/
   dependency relocates
7. Maintenance Gravity / Continuity check
8. Governance/Responsibility check — auditability, escalation,
   accountability, loop-presence gaps
9. Signal synthesis — statement + summary + confidence + doctrine basis
   (NO prediction language — enforce with output validation)
10. Routing recommendation — internal | human_review | needs_more_evidence
    | reject
```

Output: signal candidate row (`publication_status='draft'`) with full Signal Object fields → existing review_queue. Existing Admin → Review → Publish UI continues to work; add the new fields to the review view.

## D3. Validation layer (code, post-model)

- Reject output containing forbidden prediction phrases → flag for re-run.
- Reject if supporting_atom_ids < 2 or source_count < 2.
- Reject if cluster status ≠ mature.
- Reject publication path if cluster's primary vector has `visibility = 'internal'` — route to internal queue only, never `human_review_candidate` for publication.

**GATE D:** One full synthesis run on real mature clusters. Founder reviews candidates in review queue: provenance complete, doctrine basis sound, no prediction language, second-order field populated.

---

# PHASE E — OUTPUTS

## E1. Public page restructure (cognitiveempire.com/signals)

```
Featured Signal        — 1 strongest published signal
Top 3 Intelligence
Top 3 Infrastructure
Top 3 Governance & Stability
Convergence Watch      — 3 cross-domain patterns
Max visible: 13
```

Public signal card shows: title, signal statement, structural relevance, second-order effect, active invariant, pressure vectors, evidence strength (banded — Strong/Building/Emerging, not raw mass), source count, published date. No internal complexity exposed.

This also resolves the long-standing public query bug — the public page query rewrites against the new signal structure; verify it returns rows as part of this phase.

**Visibility filter (amendment 2026-06-10):** All public page queries must join `pressure_vectors` and filter on `visibility = 'public'`. Signals whose anchoring vector has `visibility = 'internal'` must not appear on the public page.

## E2. Internal view (ce-admin)

Cluster map, supporting atoms with provenance chain, evidence mass history, contradiction checks, false-signal warnings, doctrine basis, lifecycle status, governance action log.

## E3. Convergence layer

```sql
-- SECTION E3
ALTER TABLE convergences
  ADD COLUMN IF NOT EXISTS linked_cluster_ids bigint[],
  ADD COLUMN IF NOT EXISTS dominant_invariant_ids int[],
  ADD COLUMN IF NOT EXISTS convergence_strength numeric;
```

Detection (deterministic first pass): ≥2 mature clusters under different invariants sharing ≥2 of {entity, geography, technology, time window} → convergence candidate → synthesis model writes the convergence statement → human governance approves.

## E4. Lifecycle maintenance (weekly n8n cycle)

New atoms attaching to a converted cluster → strengthen its signal. Contradicting atoms → flag `weakening`/`contradicted` → governance review. Auto-retire never; retirement is a human action.

**GATE E:** Public page renders 13-slot layout from real signals; internal view traceable atom→signal; one convergence detected or correctly absent; lifecycle cycle logged.

---

## EXECUTION NOTES FOR CLAUDE CODE

- Project: cognitive-empire (Next.js, Vercel + Supabase) — build inside existing project.
- Every SQL section above: present to founder → confirm → run → verify → next section.
- Reuse existing tables where stated (sources, raw_items, signals, review_queue, convergences). Do not drop anything.
- Mesodma model choice unchanged (cheap). Signal Intelligence synthesis uses the Anthropic API already integrated in Mesodma V1 — strongest available model, called only on mature clusters.
- All runs logged. No magic fog.

## CLOSING DOCTRINE LINE

Doctrine installs the weights. Reality supplies the atoms.
Accumulation reveals pressure. Governance authorizes the signal.
