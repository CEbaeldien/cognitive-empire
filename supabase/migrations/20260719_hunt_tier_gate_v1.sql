-- Hunt Engine tier gate v1
-- Problem: hunt_prospects fills with unsendable rows (no person_name, no
-- linkedin_url) and off-ICP items rank equal to real buyers. n8n currently
-- writes directly into hunt_prospects (there is no HTTP ingestion route in
-- this app for it to call), so the gate + scoring logic is implemented here
-- as triggers rather than in app code — this is the only place guaranteed
-- to run for every insert path (n8n's direct writes, Manual Inject, and any
-- future path) without requiring changes to the live n8n workflow.
--
-- ============================================================
-- COLUMNS
-- ============================================================

ALTER TABLE hunt_prospects
  ADD COLUMN tier text NOT NULL DEFAULT 'research'
    CHECK (tier IN ('buyer', 'peer', 'research', 'unqualified')),
  ADD COLUMN linkedin_search_url text;

ALTER TABLE hunt_prospects
  ALTER COLUMN icp_score SET DEFAULT 0;

CREATE INDEX hunt_prospects_status_tier_score_idx
  ON hunt_prospects(status, tier, icp_score DESC);

-- ============================================================
-- HELPERS
-- ============================================================

-- Percent-encodes a string for use in a URL query parameter.
CREATE OR REPLACE FUNCTION hunt_url_encode(input text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  result text := '';
  i int;
  j int;
  c text;
  b bytea;
BEGIN
  FOR i IN 1..length(input) LOOP
    c := substr(input, i, 1);
    IF c ~ '[A-Za-z0-9\-_.~]' THEN
      result := result || c;
    ELSE
      b := convert_to(c, 'UTF8');
      FOR j IN 0..length(b) - 1 LOOP
        result := result || '%' || upper(to_hex(get_byte(b, j)));
      END LOOP;
    END IF;
  END LOOP;
  RETURN result;
END;
$$;

-- Rule-based ICP score. No LLM call — plain keyword/field checks against
-- signal_text, person_role, company_name, company_size.
CREATE OR REPLACE FUNCTION hunt_calc_icp_score(
  p_signal_text text,
  p_person_role text,
  p_company_name text,
  p_company_size int
)
RETURNS int
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  score int := 0;
  txt text := lower(coalesce(p_signal_text, ''));
  role text := lower(coalesce(p_person_role, ''));
  company text := lower(coalesce(p_company_name, ''));
BEGIN
  -- +30 AI-assisted/AI-built/generated code, legacy inherit, refactor,
  -- rewrite, technical debt, velocity + maintenance
  IF txt LIKE '%ai-assisted%' OR txt LIKE '%ai assisted%'
     OR txt LIKE '%ai-built%' OR txt LIKE '%ai built%'
     OR txt LIKE '%generated code%'
     OR (txt LIKE '%legacy%' AND txt LIKE '%inherit%')
     OR txt LIKE '%refactor%'
     OR txt LIKE '%rewrite%'
     OR txt LIKE '%technical debt%'
     OR (txt LIKE '%velocity%' AND txt LIKE '%maintenance%')
  THEN
    score := score + 30;
  END IF;

  -- +25 founder/CTO/CEO/VP Eng/Head of Eng
  IF role LIKE '%founder%' OR role LIKE '%cto%' OR role LIKE '%ceo%'
     OR role LIKE '%vp eng%' OR role LIKE '%vp of eng%' OR role LIKE '%head of eng%'
  THEN
    score := score + 25;
  END IF;

  -- +20 agency/studio/consultancy context
  IF txt LIKE '%agency%' OR txt LIKE '%studio%' OR txt LIKE '%consultanc%'
     OR company LIKE '%agency%' OR company LIKE '%studio%' OR company LIKE '%consultanc%'
  THEN
    score := score + 20;
  END IF;

  -- +15 hiring signal for stabilization/refactor/maintenance roles
  IF txt LIKE '%hiring%'
     AND (txt LIKE '%stabiliz%' OR txt LIKE '%refactor%' OR txt LIKE '%maintenance%')
  THEN
    score := score + 15;
  END IF;

  -- -20 podcast host/creator/analyst
  IF role LIKE '%podcast%' OR role LIKE '%host%' OR role LIKE '%creator%' OR role LIKE '%analyst%' THEN
    score := score - 20;
  END IF;

  -- -30 enterprise >1000 employees
  IF p_company_size IS NOT NULL AND p_company_size > 1000 THEN
    score := score - 30;
  END IF;

  RETURN score;
END;
$$;

-- ============================================================
-- INGESTION GATE (BEFORE trigger — fires on insert and on any update that
-- touches identity/signal fields, e.g. the Research-card promotion form)
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

  RETURN NEW;
END;
$$;

CREATE TRIGGER hunt_prospects_gate_trigger
  BEFORE INSERT OR UPDATE OF person_name, person_role, linkedin_url, company_name, company_size, signal_text
  ON hunt_prospects
  FOR EACH ROW
  EXECUTE FUNCTION hunt_prospects_gate();

-- ============================================================
-- EVENT LOG (AFTER trigger — unconditional INSERT/UPDATE so it still sees
-- tier changes made by the BEFORE trigger above even when the original
-- UPDATE statement didn't name `tier` directly, e.g. a promotion PATCH that
-- only sets person_name/linkedin_url)
-- ============================================================

CREATE OR REPLACE FUNCTION hunt_prospects_log_tier_event()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO hunt_events (prospect_id, event_type, payload)
    VALUES (NEW.id, 'tier_assigned', jsonb_build_object('tier', NEW.tier, 'icp_score', NEW.icp_score));
  ELSIF TG_OP = 'UPDATE' AND OLD.tier IS DISTINCT FROM NEW.tier THEN
    INSERT INTO hunt_events (prospect_id, event_type, payload)
    VALUES (NEW.id, 'prospect_promoted', jsonb_build_object('from_tier', OLD.tier, 'to_tier', NEW.tier, 'icp_score', NEW.icp_score));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER hunt_prospects_log_tier_event_trigger
  AFTER INSERT OR UPDATE ON hunt_prospects
  FOR EACH ROW
  EXECUTE FUNCTION hunt_prospects_log_tier_event();

-- ============================================================
-- BACKFILL — existing rows only. Reuses each row's existing icp_score
-- (already populated by whatever upstream process was scoring before this
-- migration) rather than recomputing it, since only tier assignment was
-- asked for here. This UPDATE does not touch person_name/linkedin_url/etc,
-- so it does not re-fire the BEFORE gate trigger above (which only fires
-- on those specific columns) — it sets tier/linkedin_search_url directly
-- via the same decision rule, and the AFTER trigger logs a tier_assigned
-- event for it same as it would for a fresh insert.
-- ============================================================

UPDATE hunt_prospects
SET
  tier = CASE
    WHEN person_name IS NOT NULL AND linkedin_url IS NOT NULL AND COALESCE(icp_score, 0) >= 50 THEN 'buyer'
    WHEN person_name IS NOT NULL AND linkedin_url IS NOT NULL AND COALESCE(icp_score, 0) >= 20 THEN 'peer'
    WHEN company_name IS NOT NULL THEN 'research'
    WHEN person_name IS NOT NULL THEN 'research'
    ELSE 'unqualified'
  END,
  linkedin_search_url = CASE
    WHEN linkedin_url IS NULL AND company_name IS NOT NULL
      THEN 'https://www.linkedin.com/search/results/people/?keywords=' || hunt_url_encode(company_name || ' founder OR CTO OR "engineering lead"')
    ELSE NULL
  END;

-- ============================================================
-- VERIFICATION — run manually in Supabase SQL editor after applying.
-- ============================================================

-- 1. Confirm new columns exist with correct defaults/constraints.
--
-- select column_name, data_type, column_default, is_nullable
-- from information_schema.columns
-- where table_name = 'hunt_prospects' and column_name in ('tier', 'icp_score', 'linkedin_search_url');

-- 2. Confirm backfill produced a sane tier distribution (no row left at the
--    add-column default that shouldn't be there).
--
-- select tier, count(*) from hunt_prospects group by tier order by tier;

-- 3. Confirm triggers are attached.
--
-- select tgname, tgrelid::regclass, tgtype
-- from pg_trigger
-- where tgrelid = 'hunt_prospects'::regclass and not tgisinternal;

-- 4. Sanity-check the gate on a throwaway insert (delete it after).
--
-- insert into hunt_prospects (source, company_name, person_name, person_role, linkedin_url, signal_text)
-- values ('manual', 'Acme Agency', 'Jane Doe', 'Founder', 'https://linkedin.com/in/janedoe', 'We inherited a legacy codebase full of technical debt and need to refactor it fast.')
-- returning id, tier, icp_score, linkedin_search_url;
--
-- select * from hunt_events order by created_at desc limit 5;
--
-- -- then clean up:
-- -- delete from hunt_prospects where company_name = 'Acme Agency' and person_name = 'Jane Doe';
