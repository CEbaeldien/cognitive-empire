# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

There are no tests in this project.

## Environment Variables

Required in root `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # required for all /admin and /api routes
NEXT_PUBLIC_SITE_URL=http://localhost:3000
DRIFT_WORKSPACE_ID=          # UUID of the active workspace row in drift.workspaces (Phase I: single tenant)
OPENAI_API_KEY=              # required for Mesodma extraction (gpt-4o-mini)
MESODMA_API_KEY=             # secret Bearer token for POST /api/mesodma/ingest
```

Note: `app/home/.env.local` is a stale file with an older Supabase project's credentials — the root `.env.local` is authoritative.

## Architecture

**Next.js 16 App Router** with React 19, TypeScript, Tailwind CSS v4, and Supabase as the only backend.

### Two Supabase Clients

- **Anon client** (`lib/supabase.ts`) — used in public server components (`app/signals/page.tsx`) for read-only queries
- **Service role client** — instantiated inline in every admin API route (`app/api/**`) for write access and privileged reads; also used in `lib/drift/data.ts` for server component direct queries
- **Never self-fetch** — server components must not call their own API routes via HTTP (`fetch(NEXT_PUBLIC_SITE_URL/api/...)`). Import shared query functions from `lib/` instead (e.g. `getDriftOverview` from `lib/drift/data.ts`)

Admin server pages (e.g. `app/admin/drift/page.tsx`) fetch data from their own internal API routes via `fetch(${NEXT_PUBLIC_SITE_URL}/api/...)` with `cache: "no-store"` rather than querying Supabase directly.

### Three Product Subsystems

**1. Signals** (`/signals`, `/ce-admin/signals`, `/api/signals/`)
Doctrine-first signal intelligence feed. Every signal is human-scored and passes review before publish. No auto-publish path exists.

**Admin UI** (`app/ce-admin/signals/`) — auth-gated (requires `founder@cognitiveempire.com` Supabase session):
- `layout.tsx` — sidebar shell with auth guard; redirects to `/auth/signin` if not authenticated
- `page.tsx` — signal list with status/category filters
- `new/page.tsx` — create draft signal; multi-section form: core fields, structural analysis, impact layer, pressure vectors, doctrine vectors
- `[id]/page.tsx` — edit metadata, tag vectors, score signal, submit to review

**Schema** (`supabase/migrations/20260528_signals_v1.sql`) — 13 tables:
- `sources` — ingestion sources; columns include `trust_tier`, `subcategory`, `ingestion_mode`, `ingestion_status`, `use_case`, `priority`, `notes`
- `raw_items` — everything Mesodma pulls; includes `extracted_numbers`, `enrichment_status`, `signal_processing_status`, `ingestion_status`
- `signal_laws` — static seed table of the Eight Laws; never modified by the pipeline
- `signals` — doctrine-evaluated signals; status flow: `draft` → `in_review` → `watching` | `decaying` | `approved` → `published`; columns include `subcategory`, `what_changed`, `why_it_matters`, `structural_relevance`, `second_order_effect`, `decay_factor`, `impact_layer`
- `signal_scores` — **one row per signal** (UNIQUE on `signal_id`); multi-dimensional scoring: `strength`, `weight`, `longevity`, `convergence_potential`, `decay_factor`, `governance_impact`, `continuity_pressure`, `prosperity_relevance`, `structural_relevance`, `confidence`; `final_score` is a Postgres generated column: `((weighted_sum / 9.5) * confidence * 10)`
- `convergences` — when 2+ signals activate the same law; includes `what_changed`, `second_order_implications`, `impact_layer`, `subcategories`, `decay_factor`; status includes `watching` | `approved` | `decaying`
- `convergence_signals` — junction: which signals compose a convergence
- `review_queue` — polymorphic queue for both signals and convergences; `entity_type` is `'signal'` or `'convergence'`
- `pressure_vectors` — named structural forces (20 active); junction via `signal_pressure_vectors`
- `signal_pressure_vectors` — junction: signals tagged to pressure vectors
- `doctrine_vectors` — doctrine expressions (16 active); **note: `slug` column does not exist in the DB despite being in the TypeScript type — SELECT only `id, name`**
- `signal_doctrine_vectors` — junction: signals tagged to doctrine vectors
- `convergence_doctrine_vectors` — junction: convergences tagged to doctrine vectors

**Types** (`types/signals.ts`) — `Row` / `Insert` / `Update` for all 13 tables plus all 8 enums. Exports `SignalsDatabase` for typed Supabase clients: `createClient<SignalsDatabase>(url, key)`. `signal_laws` has `Insert: never` / `Update: never`. `signal_scores.final_score` is excluded from `Insert` (generated column).

**Signal categories** (`SignalCategory` enum):
`intelligence` · `physical_systems` · `infrastructure` · `energy` · `science_frontier` · `governance_stability` · `markets_human_prosperity` · `resources_continuity`

**Eight Laws** (`LawId` enum):
`intelligence_abundance` · `bottleneck_migration` · `responsibility_migration` · `output_inflation` · `decision_half_life` · `escalation_preservation` · `optimization_fragility` · `human_differentiation`

**Signal scoring formula** (live-computed in UI, stored as generated column in DB):
```
final_score = ((strength×1.5 + weight×1.2 + longevity×1.0 + convergence_potential×1.3
               + governance_impact×1.0 + continuity_pressure×1.1
               + prosperity_relevance×1.0 + structural_relevance×1.4) / 9.5)
              × confidence × 10
```
Range: 0–100. `decay_factor` is stored but not included in the formula.

**API routes** (`app/api/signals/`):
- `GET/POST /api/signals` — list with status/category filters; POST creates signal + inserts junction rows for `pressure_vector_ids` and `doctrine_vector_ids`
- `GET /api/signals/[id]` — returns `{ signal, score, pressure_vector_ids, doctrine_vector_ids }`; `score` is a single row or `null`
- `PATCH /api/signals/[id]` — updates signal fields; syncs both junction tables if `pressure_vector_ids` / `doctrine_vector_ids` are in the body (delete + reinsert)
- `DELETE /api/signals/[id]` — sets `status = 'archived'`
- `POST /api/signals/[id]/score` — upserts one score row per signal (`onConflict: "signal_id"`); never writes `final_score`
- `POST /api/signals/[id]/review` — submits signal to review queue; sets `status = 'in_review'`
- `GET /api/signals/pressure-vectors` — all active pressure vectors (`id`, `name`, `slug`)
- `GET /api/signals/doctrine-vectors` — all active doctrine vectors (`id`, `name` only — no `slug`)

**RLS rules**: public anon key can read `published` signals, `published` convergences, all `signal_laws`, and scores for published signals only. All write access requires `ce_admin` JWT role claim. Service role bypasses RLS entirely (used by Mesodma and admin API routes).

**Known schema/type mismatch**: `impact_layer` is stored as JSONB in the DB (returns `{}` for legacy rows) but typed as `string | null` in `SignalRow`. Always guard with `typeof s.impact_layer === "string"` before calling `.split()`. `doctrine_vectors.slug` does not exist in the DB — do not SELECT it.

**Mesodma** — ingestion service (`lib/mesodma/`, `/api/mesodma/ingest`)
Fetch-and-extract pipeline. Boundary is strict: Mesodma writes to `raw_items` only. No signal creation, no scoring.
- `lib/mesodma/types.ts` — internal types (`MesodmaSource`, `RawRssItem`, `ExtractionResult`, `IngestReport`, etc.)
- `lib/mesodma/ingest.ts` — `runMesodmaIngest()`: loads active RSS sources → fetches feed → deduplicates against existing `raw_items` → runs extraction → writes `status = 'extracted'` or `status = 'error'`
- `app/api/mesodma/ingest/route.ts` — `POST /api/mesodma/ingest`, protected by `Authorization: Bearer {MESODMA_API_KEY}`
- Extraction model: `gpt-4o-mini` via OpenAI structured output (`response_format: json_schema`, `strict: true`), `temperature: 0`
- Extracted fields per item (stored verbatim in `raw_items.extracted_fields`): `clean_title`, `clean_summary` (2-3 sentences, factual), `entities` (`{ people, organizations, technologies, locations, dates, numbers }`), `source_claims` (explicit claims only), `possible_category` (best-guess `SignalCategory`, not authoritative), `extraction_confidence` (0.0–1.0), `missing_information`
- Dedup: existing `external_id`s are loaded per source before processing; duplicate items are skipped without calling the extraction model
- Errors per item are written to `raw_items` with `status = 'error'` and `error_message`; `runMesodmaIngest` never throws

**2. Drift** (`/admin/drift`, `/api/drift/`)
Revenue decay detection engine — identifies stalling sales opportunities and generates interventions.
- Supabase tables: `drift_accounts`, `drift_opportunities`, `drift_scores`, `drift_interventions`
- Scoring logic lives entirely in `lib/drift/scoring.ts` (`calculateDriftScore`) — pure function, no Supabase calls
- Pipeline: `POST /api/drift/score` scores all open opportunities → `POST /api/drift/interventions` generates intervention rows for moderate/high/critical deals → `/admin/drift` dashboard reads via `GET /api/drift/overview`
- Drift levels: `low` / `moderate` / `high` / `critical` (thresholds: 35 / 60 / 80)

**3. Runtime** (`/ce-admin/runtime`, `/api/runtime/`)
Internal operational registry — CE's own systems, memories, decisions, approvals, conflicts, and doctrine references.
- Supabase tables: `runtime_systems`, `runtime_memories`, `runtime_tasks`, `runtime_projects`, `runtime_approvals`, `runtime_conflicts`, `runtime_health_checks`, `runtime_doctrine_documents`, `runtime_doctrine_concepts`, `runtime_doctrine_references`
- Health Dashboard (`/ce-admin/runtime`) — read-only server component; queries all runtime tables directly via service role
- Control Panel (`/ce-admin/runtime/control`) — write-enabled client component; 6 actions: health check, create memory, resolve conflict, review approvals, register system, generate state snapshot

### Routing

- `/` — 3-second splash that redirects to `/home`
- `/home` — public marketing page (client component, hamburger nav, section-by-section layout)
- `/signals` — public intelligence feed (server component)
- `/ce-admin/signals/*` — Signals admin; auth-guarded by layout (requires `founder@cognitiveempire.com` Supabase session, redirects to `/auth/signin`)
- `/admin/*` — Drift/Runtime dashboards (no auth guard currently)

### Styling

- `app/globals.css` — custom `ce-*` CSS classes used exclusively in the marketing home page (`app/home/page.tsx`) and entry splash (`app/page.tsx`)
- All other pages (signals, admin) use Tailwind utility classes directly with a dark `bg-black` / `bg-[#020817]` base
