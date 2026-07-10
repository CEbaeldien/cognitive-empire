-- MG Hunt Engine v0 — schema only
-- Three tables: hunt_prospects, hunt_drafts, hunt_events
-- RLS pattern based on supabase/migrations/20260528_signals_v1.sql's
-- "admin_full_access_*" policies, corrected: the original signals_v1.sql
-- predicate (auth.jwt() ->> 'role' = 'ce_admin') checks the top-level JWT
-- role claim, which is always 'authenticated' for a logged-in user and
-- never reflects raw_app_meta_data — see the note above the CREATE POLICY
-- block below for the fix used here ((auth.jwt() -> 'app_metadata' ->>
-- 'role') = 'ce_admin'). Service role (used by all admin API routes
-- elsewhere in the repo) bypasses RLS entirely; /hunt intentionally does
-- NOT use service role so this predicate is actually exercised.
-- No public/anon policies are created on any of these tables — there is no
-- anon read or write path.

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE hunt_prospects (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at        timestamptz DEFAULT now(),
  source            text        NOT NULL,
    -- hn_hiring | greenhouse | lever | remote_board | funding_feed |
    -- google_alert | manual
  signal_type       text,
  signal_text       text,
  signal_url        text,
  company_name      text,
  company_size      int,
  person_name       text,
  person_role       text,
  linkedin_url      text,
  icp_score         int,
  score_breakdown   jsonb,
  status            text        NOT NULL DEFAULT 'new',
    -- new | qualified | rejected | queued | sent | replied |
    -- call | proposal | closed_won | closed_dead
  rejected_reason   text,
  next_followup_at  timestamptz,
  last_action_at    timestamptz,
  notes             text
);

CREATE TABLE hunt_drafts (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id   uuid        NOT NULL REFERENCES hunt_prospects(id) ON DELETE CASCADE,
  variant       text        NOT NULL,
    -- direct | soft | followup_1 | followup_2
  draft_text    text        NOT NULL,
  edited_text   text,
  status        text        NOT NULL DEFAULT 'awaiting_principal',
    -- awaiting_principal | approved | sent | discarded
  sent_at       timestamptz,
  created_at    timestamptz DEFAULT now()
);

CREATE TABLE hunt_events (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id   uuid        NOT NULL REFERENCES hunt_prospects(id) ON DELETE CASCADE,
  event_type    text        NOT NULL,
  payload       jsonb,
  created_at    timestamptz DEFAULT now()
);

-- ============================================================
-- CONSTRAINTS + INDEXES
-- ============================================================

CREATE UNIQUE INDEX hunt_prospects_linkedin_url_key
  ON hunt_prospects(linkedin_url) WHERE linkedin_url IS NOT NULL;

CREATE UNIQUE INDEX hunt_prospects_company_signal_key
  ON hunt_prospects(company_name, signal_url);

CREATE INDEX hunt_prospects_status_idx
  ON hunt_prospects(status);

CREATE INDEX hunt_prospects_next_followup_at_idx
  ON hunt_prospects(next_followup_at) WHERE next_followup_at IS NOT NULL;

CREATE INDEX hunt_drafts_prospect_status_idx
  ON hunt_drafts(prospect_id, status);

CREATE INDEX hunt_events_prospect_id_idx
  ON hunt_events(prospect_id);

-- ============================================================
-- RLS POLICIES
-- Founder-only, replicated from signals_v1.sql's admin_full_access_* pattern.
-- No public/anon SELECT policy exists on any of these three tables.
-- ============================================================

ALTER TABLE hunt_prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE hunt_drafts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE hunt_events    ENABLE ROW LEVEL SECURITY;

-- NOTE (corrected post-Session-1 verification): the top-level `role` claim
-- in a Supabase JWT is reserved for the Postgres role selector (anon /
-- authenticated / service_role) — it is always 'authenticated' for a
-- logged-in user and is NOT populated from auth.users.raw_app_meta_data.
-- Custom claims set via raw_app_meta_data land nested under `app_metadata`
-- instead. `auth.jwt() ->> 'role' = 'ce_admin'` (the pattern copied from
-- signals_v1.sql's admin_full_access_* policies) therefore never matches
-- for a real session and silently filters every row to zero. The correct
-- predicate reads the nested claim directly; no Access Token Hook is
-- required. This has been applied live in Studio — the block below makes
-- the tracked migration match production.
CREATE POLICY "admin_full_access_hunt_prospects"
  ON hunt_prospects FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'ce_admin');

CREATE POLICY "admin_full_access_hunt_drafts"
  ON hunt_drafts FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'ce_admin');

CREATE POLICY "admin_full_access_hunt_events"
  ON hunt_events FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'ce_admin');

-- ============================================================
-- VERIFICATION — already run manually in Supabase SQL editor against
-- production. Kept here as the record of what was checked, in the order
-- it was actually done (steps 1–3: initial run; step 4 added when the
-- app_metadata predicate above was corrected).
-- ============================================================

-- 1. Confirm the founder's JWT actually carries the ce_admin role claim.
--
-- select email, raw_app_meta_data
-- from auth.users
-- where email = 'founder@cognitiveempire.com';

-- 2. Only if "role": "ce_admin" is MISSING above, run:
--
-- update auth.users
-- set raw_app_meta_data =
--   coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"ce_admin"}'::jsonb
-- where email = 'founder@cognitiveempire.com';
--
-- THEN: log out and back in on cognitiveempire.com — the claim only
-- enters the JWT on fresh token issue.

-- 3. Confirm tables exist and RLS is enforced.
--
-- select * from hunt_prospects limit 1;
-- select * from hunt_drafts    limit 1;
-- select * from hunt_events    limit 1;

-- 4. Confirm policies are live (this is what caught the top-level-`role`
--    vs. `app_metadata`-role bug — the fix is already reflected in the
--    CREATE POLICY statements above):
--
-- select tablename, policyname, qual
-- from pg_policies
-- where tablename in ('hunt_prospects','hunt_drafts','hunt_events');
