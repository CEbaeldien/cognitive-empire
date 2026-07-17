-- CE Digital Store — pre-checkout waitlist
-- One table: store_waitlist. RLS pattern copied from mg_scores
-- (supabase/migrations/20260711_mg_scores.sql): the top-level `role`
-- JWT claim never reflects raw_app_meta_data, so the ce_admin predicate
-- reads the nested `app_metadata` claim directly.
-- No public/anon policies — public writes (email capture) happen via a
-- server route using the service role key, which bypasses RLS entirely.

CREATE TABLE store_waitlist (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  email      text        NOT NULL,
  product    text        NOT NULL CHECK (product IN ('operator-kernel', 'gravity-report'))
);

ALTER TABLE store_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_full_access_store_waitlist"
  ON store_waitlist FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'ce_admin');
