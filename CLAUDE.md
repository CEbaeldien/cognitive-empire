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
```

Note: `app/home/.env.local` is a stale file with an older Supabase project's credentials — the root `.env.local` is authoritative.

## Architecture

**Next.js 16 App Router** with React 19, TypeScript, Tailwind CSS v4, and Supabase as the only backend.

### Two Supabase Clients

- **Anon client** (`lib/supabase.ts`) — used in public server components (`app/signals/page.tsx`) for read-only queries
- **Service role client** — instantiated inline in every admin API route (`app/api/**`) for write access and privileged reads; never shared via `lib/`

Admin server pages (e.g. `app/admin/drift/page.tsx`) fetch data from their own internal API routes via `fetch(${NEXT_PUBLIC_SITE_URL}/api/...)` with `cache: "no-store"` rather than querying Supabase directly.

### Three Product Subsystems

**1. Signals** (`/signals`, `/admin/signals`, `/api/signals/`)
Intelligence feed of structural events scored and published by the founder.
- Supabase tables: `signals`, `signal_scores`, `review_queue`
- `signal_scores` joins to `signals`; the page fetches top 3 per domain sorted by `final_score`
- Review flow: signals enter `review_queue` → founder approves/rejects/revises via `POST /api/signals/review` → updates both `review_queue` and `signals.publication_status`

**2. Drift** (`/admin/drift`, `/api/drift/`)
Revenue decay detection engine — identifies stalling sales opportunities and generates interventions.
- Supabase tables: `drift_accounts`, `drift_opportunities`, `drift_scores`, `drift_interventions`
- Scoring logic lives entirely in `lib/drift/scoring.ts` (`calculateDriftScore`) — pure function, no Supabase calls
- Pipeline: `POST /api/drift/score` scores all open opportunities → `POST /api/drift/interventions` generates intervention rows for moderate/high/critical deals → `/admin/drift` dashboard reads via `GET /api/drift/overview`
- Drift levels: `low` / `moderate` / `high` / `critical` (thresholds: 35 / 60 / 80)

**3. Runtime** (`/admin/runtime`, `/api/runtime/`)
Internal operational registry — CE's own systems, decisions, tasks, and workflows.
- Supabase tables: `runtime_systems`, `runtime_project_states`, `runtime_decisions`, `runtime_tasks`, `runtime_workflows`
- Read-only dashboard; no write operations from the app

### Routing

- `/` — 3-second splash that redirects to `/home`
- `/home` — public marketing page (client component, hamburger nav, section-by-section layout)
- `/signals` — public intelligence feed (server component)
- `/admin/*` — founder-only dashboards (no auth guard in the code currently)

### Styling

- `app/globals.css` — custom `ce-*` CSS classes used exclusively in the marketing home page (`app/home/page.tsx`) and entry splash (`app/page.tsx`)
- All other pages (signals, admin) use Tailwind utility classes directly with a dark `bg-black` / `bg-[#020817]` base
