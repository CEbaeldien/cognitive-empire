-- Maintenance Gravity score tool — persistence
-- One table: mg_scores. RLS pattern copied from hunt_* tables
-- (supabase/migrations/20260710_mg_hunt_engine_v0.sql): the top-level
-- `role` JWT claim never reflects raw_app_meta_data, so the ce_admin
-- predicate reads the nested `app_metadata` claim directly.
-- No public/anon policies — public writes (score inserts, email/testimonial
-- updates) happen via a server route using the service role key, which
-- bypasses RLS entirely. The public "Systems scored: N" counter is also
-- read server-side with the service role, for the same reason.

CREATE TABLE mg_scores (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            timestamptz NOT NULL DEFAULT now(),
  gravity_score         int         NOT NULL CHECK (gravity_score BETWEEN 0 AND 100),
  ownerless             int         NOT NULL DEFAULT 0,
  loops                 int         NOT NULL DEFAULT 0,
  band                  text        NOT NULL CHECK (band IN (
                          'Light', 'Manageable Drag', 'Operational Weight',
                          'Fragility Zone', 'Collapse Risk'
                        )),
  analysis              text,
  fastest_win           text,
  context               text,
  email                 text,
  name                  text,
  testimonial           text,
  testimonial_permission bool       NOT NULL DEFAULT false,
  audit_interest        bool        NOT NULL DEFAULT false
);

ALTER TABLE mg_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_full_access_mg_scores"
  ON mg_scores FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'ce_admin');
