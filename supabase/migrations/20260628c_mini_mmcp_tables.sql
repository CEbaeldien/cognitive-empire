-- Mini MMCP v0.1 — three operational tables

CREATE TABLE IF NOT EXISTS mmcp_weekly_reviews (
  id                      UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  week_of                 DATE         NOT NULL,
  mission_score           INTEGER      CHECK (mission_score >= 0 AND mission_score <= 5),
  signals_upgraded        JSONB        DEFAULT '[]',
  decisions_canonized     JSONB        DEFAULT '[]',
  gravity_start           INTEGER,
  gravity_end             INTEGER,
  gravity_delta           INTEGER,
  biggest_risk            TEXT,
  mission_moved           TEXT,
  next_week_priority      TEXT,
  failure_modes_triggered JSONB        DEFAULT '[]',
  raw_data                JSONB,
  created_at              TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mmcp_decisions (
  id                    UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  title                 TEXT         NOT NULL,
  stage                 INTEGER      DEFAULT 0 CHECK (stage >= 0 AND stage <= 5),
  authority             TEXT         DEFAULT 'self' CHECK (authority IN ('self','review','canon')),
  readiness_pct         INTEGER      DEFAULT 0,
  stage_log             JSONB        DEFAULT '[]',
  constraints_identified TEXT,
  risks_surfaced        TEXT,
  contradictions        TEXT,
  operator_move         TEXT,
  outcome               TEXT,
  canonized_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ  DEFAULT NOW(),
  updated_at            TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mmcp_gravity_history (
  id                       UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  week_of                  DATE         NOT NULL,
  score                    INTEGER      NOT NULL,
  ownerless                INTEGER      DEFAULT 0,
  open_loops               INTEGER      DEFAULT 0,
  unreviewed_automations   INTEGER      DEFAULT 0,
  critical_dependencies    INTEGER      DEFAULT 0,
  target                   INTEGER,
  verdict                  TEXT,
  created_at               TIMESTAMPTZ  DEFAULT NOW()
);

ALTER TABLE mmcp_weekly_reviews  ENABLE ROW LEVEL SECURITY;
ALTER TABLE mmcp_decisions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE mmcp_gravity_history  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin only mmcp_weekly_reviews"
  ON mmcp_weekly_reviews FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin only mmcp_decisions"
  ON mmcp_decisions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin only mmcp_gravity_history"
  ON mmcp_gravity_history FOR ALL USING (auth.role() = 'authenticated');
