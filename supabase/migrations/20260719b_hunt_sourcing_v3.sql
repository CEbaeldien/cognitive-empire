-- Hunt Sourcing v3 — identity-first sources
-- Problem: last run was 128 items -> 5 pass -> ~1 insert. HN threads and job
-- boards (RemoteOK, WWR) structurally carry no person identity, so they can
-- only ever land research/unqualified — but a couple of them slipped through
-- to 'buyer' under v1 because an HN commenter happened to have a real
-- LinkedIn profile attached. This caps hiring-type sources to 'research'
-- regardless of score: an HN commenter or job posting is context, not a
-- direct prospect. Trigger from v1 (hunt_prospects_gate_trigger) is left
-- structurally as-is — this only appends one guard clause to the function
-- body via CREATE OR REPLACE.

-- ============================================================
-- COLUMN
-- ============================================================

ALTER TABLE hunt_prospects
  ADD COLUMN signal_type text NOT NULL DEFAULT 'content'
    CHECK (signal_type IN ('hiring', 'content', 'launch', 'funding', 'manual'));

-- ============================================================
-- GATE — append hiring-cap guard clause (minimal change: same function,
-- same trigger, one addition before RETURN NEW)
-- ============================================================

CREATE OR REPLACE FUNCTION hunt_prospects_gate()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  has_identity boolean;
  is_peer_role boolean;
BEGIN
  has_identity := NEW.person_name IS NOT NULL AND NEW.linkedin_url IS NOT NULL;
  is_peer_role := lower(coalesce(NEW.person_role, '')) LIKE '%podcast%'
    OR lower(coalesce(NEW.person_role, '')) LIKE '%host%'
    OR lower(coalesce(NEW.person_role, '')) LIKE '%creator%'
    OR lower(coalesce(NEW.person_role, '')) LIKE '%analyst%';

  NEW.icp_score := hunt_calc_icp_score(NEW.signal_text, NEW.person_role, NEW.company_name, NEW.company_size);

  IF has_identity AND is_peer_role THEN
    NEW.tier := 'peer';
  ELSIF has_identity AND NEW.icp_score >= 50 THEN
    NEW.tier := 'buyer';
  ELSIF has_identity AND NEW.icp_score >= 20 THEN
    NEW.tier := 'peer';
  ELSIF NEW.company_name IS NOT NULL THEN
    NEW.tier := 'research';
  ELSIF NEW.person_name IS NOT NULL THEN
    NEW.tier := 'research';
  ELSE
    NEW.tier := 'unqualified';
  END IF;

  IF NEW.linkedin_url IS NULL AND NEW.company_name IS NOT NULL THEN
    NEW.linkedin_search_url := 'https://www.linkedin.com/search/results/people/?keywords='
      || hunt_url_encode(NEW.company_name || ' founder OR CTO OR "engineering lead"');
  ELSE
    NEW.linkedin_search_url := NULL;
  END IF;

  -- v3 guard clause: hiring-type sources (HN-hiring, RemoteOK, WWR) carry no
  -- direct-buyer signal by construction — cap them to research even if
  -- identity + score would otherwise clear the buyer/peer threshold.
  IF NEW.signal_type IS NULL OR NEW.signal_type = 'content' THEN
    IF NEW.source IN ('hn_hiring', 'remote_board', 'remoteok', 'weworkremotely') THEN
      NEW.signal_type := 'hiring';
    END IF;
  END IF;

  IF NEW.signal_type = 'hiring' AND NEW.tier IN ('buyer', 'peer') THEN
    NEW.tier := 'research';
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================
-- BACKFILL — existing rows only
-- ============================================================

UPDATE hunt_prospects
SET signal_type = CASE
  WHEN source IN ('hn_hiring', 'remote_board') THEN 'hiring'
  WHEN source = 'manual' THEN 'manual'
  ELSE 'content'
END;

-- Apply the same cap retroactively. NOTE: this demotes the two rows
-- currently at 'buyer' (Ray Myers, Ian Reppel) to 'research' — both were
-- sourced from hn_hiring, an HN commenter with a real LinkedIn profile, not
-- an actual buying-intent signal. This is the intended effect of the cap,
-- not a bug — flagging since it's a visible change to current state.
UPDATE hunt_prospects
SET tier = 'research'
WHERE signal_type = 'hiring' AND tier IN ('buyer', 'peer');

-- ============================================================
-- VERIFICATION — run manually in Supabase SQL editor after applying.
-- ============================================================

-- 1. Confirm column + constraint.
--
-- select column_name, data_type, column_default, is_nullable
-- from information_schema.columns
-- where table_name = 'hunt_prospects' and column_name = 'signal_type';

-- 2. Confirm distribution — no buyer/peer rows should have signal_type='hiring'.
--
-- select signal_type, tier, count(*) from hunt_prospects group by signal_type, tier order by 1, 2;

-- 3. Sanity-check the cap on a throwaway insert (delete it after).
--
-- insert into hunt_prospects (source, signal_type, company_name, person_name, person_role, linkedin_url, signal_text)
-- values ('manual', 'hiring', 'Acme Agency', 'Jane Doe', 'Founder', 'https://linkedin.com/in/janedoe', 'We inherited a legacy codebase full of technical debt and need to refactor it fast.')
-- returning id, tier, icp_score;
-- -- expect tier = 'research' even though icp_score would otherwise clear 50 (buyer)
--
-- -- then clean up:
-- -- delete from hunt_prospects where company_name = 'Acme Agency' and person_name = 'Jane Doe';
