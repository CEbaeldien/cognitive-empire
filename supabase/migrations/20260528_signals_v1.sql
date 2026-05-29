-- ============================================================
-- CE SIGNALS V1 — SUPABASE SCHEMA
-- Cognitive Empire | Doctrine-first signal intelligence
-- Pipeline: Mesodma → Signals Admin → Human Review → Publish
-- ============================================================

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE signal_category AS ENUM (
  'ai_infrastructure',
  'labor_displacement',
  'capital_allocation',
  'regulatory_posture',
  'institutional_adaptation',
  'human_differentiation',
  'knowledge_compression',
  'systemic_fragility'
);

CREATE TYPE source_type AS ENUM (
  'rss',
  'api',
  'scrape',
  'manual'
);

CREATE TYPE raw_item_status AS ENUM (
  'pending',
  'extracted',
  'skipped',
  'error'
);

CREATE TYPE signal_status AS ENUM (
  'draft',
  'in_review',
  'approved',
  'published',
  'rejected',
  'archived'
);

CREATE TYPE review_action AS ENUM (
  'approve',
  'reject',
  'request_revision',
  'escalate'
);

CREATE TYPE law_id AS ENUM (
  'intelligence_abundance',
  'bottleneck_migration',
  'responsibility_migration',
  'output_inflation',
  'decision_half_life',
  'escalation_preservation',
  'optimization_fragility',
  'human_differentiation'
);

CREATE TYPE temporal_class AS ENUM (
  'fast_moving',    -- Laws I, II, IV
  'slow_burn',      -- Laws III, VI, VII
  'classifier'      -- Law V (governs classification)
);

CREATE TYPE convergence_status AS ENUM (
  'candidate',
  'confirmed',
  'published',
  'dismissed'
);

-- ============================================================
-- 1. SOURCES
-- The 32 locked ingestion sources (8 categories × 4 sources)
-- ============================================================

CREATE TABLE sources (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  category        signal_category NOT NULL,
  source_type     source_type NOT NULL DEFAULT 'rss',
  endpoint_url    TEXT,                         -- RSS feed, API endpoint, or scrape target
  auth_config     JSONB DEFAULT '{}',           -- encrypted credentials ref, not raw keys
  fetch_interval  INTEGER NOT NULL DEFAULT 360, -- minutes between fetches
  is_active       BOOLEAN NOT NULL DEFAULT true,
  last_fetched_at TIMESTAMPTZ,
  metadata        JSONB DEFAULT '{}',           -- extra config per source type
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enforce exactly 4 sources per category (constraint via trigger, not CHECK — Supabase limitation)
CREATE INDEX idx_sources_category ON sources(category);
CREATE INDEX idx_sources_active ON sources(is_active) WHERE is_active = true;

-- ============================================================
-- 2. RAW_ITEMS
-- Everything Mesodma pulls — uninterpreted, unscored
-- Mesodma boundary: extraction only. Title, body, url, date. Nothing more.
-- ============================================================

CREATE TABLE raw_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id       UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  external_id     TEXT,                         -- original item ID from source (dedup)
  title           TEXT NOT NULL,
  body            TEXT,
  url             TEXT,
  author          TEXT,
  published_at    TIMESTAMPTZ,
  fetched_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status          raw_item_status NOT NULL DEFAULT 'pending',
  extraction_model TEXT,                        -- which model ran extraction (haiku, gpt-4o-mini)
  extracted_fields JSONB DEFAULT '{}',          -- {summary, keywords, entities} — extraction only
  error_message   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(source_id, external_id)
);

CREATE INDEX idx_raw_items_source ON raw_items(source_id);
CREATE INDEX idx_raw_items_status ON raw_items(status);
CREATE INDEX idx_raw_items_fetched ON raw_items(fetched_at DESC);
CREATE INDEX idx_raw_items_pending ON raw_items(status) WHERE status = 'pending';

-- ============================================================
-- 3. SIGNAL_LAWS
-- The Eight Laws — static doctrine table
-- Seeded once. Never modified by the pipeline.
-- ============================================================

CREATE TABLE signal_laws (
  id              law_id PRIMARY KEY,
  name            TEXT NOT NULL,
  short_desc      TEXT NOT NULL,
  full_desc       TEXT,
  temporal_class  temporal_class NOT NULL,
  display_order   SMALLINT NOT NULL UNIQUE,     -- 1–8
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed the Eight Laws
INSERT INTO signal_laws (id, name, short_desc, full_desc, temporal_class, display_order) VALUES
  ('intelligence_abundance',   'Intelligence Abundance',   'AI capability is now a commodity. The differentiator shifts upstream.',           'Raw intelligence is no longer scarce. The competitive axis has moved to judgment, context, and domain application.', 'fast_moving',  1),
  ('bottleneck_migration',     'Bottleneck Migration',     'When one constraint is removed, the next one becomes visible.',                   'Automation does not eliminate bottlenecks — it relocates them. Whoever maps the next bottleneck first captures the next value layer.', 'fast_moving',  2),
  ('responsibility_migration', 'Responsibility Migration', 'As AI executes more, accountability pressure migrates to decision-makers.',       'The human who chooses the system inherits liability for the system''s outcomes. Delegation does not dissolve ownership.', 'slow_burn',    3),
  ('output_inflation',         'Output Inflation',         'Volume of AI-generated output expands faster than human capacity to evaluate it.','When everything can be produced, the constraint becomes curation, verification, and judgment — not generation.', 'fast_moving',  4),
  ('decision_half_life',       'Decision Half-Life',       'The useful lifespan of strategic decisions is compressing.',                      'Faster capability cycles mean assumptions expire sooner. Decisions made on 3-year horizons may be obsolete in 18 months.', 'classifier',   5),
  ('escalation_preservation',  'Escalation Preservation',  'High-stakes, irreversible, and ambiguous decisions must remain human.',           'Not all decisions should be delegated. The ability to recognize what requires human escalation is itself a core capability.', 'slow_burn',    6),
  ('optimization_fragility',   'Optimization Fragility',   'Highly optimized systems become brittle at the edges they were not optimized for.','Maximum efficiency creates maximum fragility. The same systems that perform best in normal conditions fail hardest under novel ones.', 'slow_burn',    7),
  ('human_differentiation',    'Human Differentiation',    'The value of distinctly human attributes increases as AI capability expands.',     'Judgment, trust, embodied experience, moral authority, and contextual wisdom become premium assets, not soft skills.', 'fast_moving',  8);

-- ============================================================
-- 4. SIGNALS
-- Doctrine-evaluated signals. Written by Signals Admin or human.
-- Never auto-published. Every signal passes human review.
-- ============================================================

CREATE TABLE signals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_item_id     UUID REFERENCES raw_items(id) ON DELETE SET NULL, -- nullable: signals can be manually created
  category        signal_category NOT NULL,
  title           TEXT NOT NULL,
  summary         TEXT NOT NULL,                -- 2–3 sentence CE-voice summary
  implication     TEXT NOT NULL,               -- so-what for the CE reader
  status          signal_status NOT NULL DEFAULT 'draft',
  is_featured     BOOLEAN NOT NULL DEFAULT false, -- top 3 per category for public page
  published_at    TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,                  -- optional decay window
  authored_by     UUID REFERENCES auth.users(id),
  reviewed_by     UUID REFERENCES auth.users(id),
  reviewed_at     TIMESTAMPTZ,
  revision_notes  TEXT,                         -- reviewer instructions if request_revision
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_signals_category ON signals(category);
CREATE INDEX idx_signals_status ON signals(status);
CREATE INDEX idx_signals_published ON signals(published_at DESC) WHERE status = 'published';
CREATE INDEX idx_signals_featured ON signals(is_featured, category) WHERE is_featured = true;

-- ============================================================
-- 5. SIGNAL_SCORES
-- CESIC engine output: CESM + CECM per signal × law
-- Doctrine layer scores. Admin assigns, human confirms.
-- ============================================================

CREATE TABLE signal_scores (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_id       UUID NOT NULL REFERENCES signals(id) ON DELETE CASCADE,
  law_id          law_id NOT NULL REFERENCES signal_laws(id),

  -- CESM: CE Signal Magnitude (1–10) — how strong is this signal's force?
  cesm_score      SMALLINT NOT NULL CHECK (cesm_score BETWEEN 1 AND 10),
  cesm_rationale  TEXT NOT NULL,

  -- CECM: CE Convergence Magnitude (1–10) — how much does this align with other signals?
  cecm_score      SMALLINT NOT NULL CHECK (cecm_score BETWEEN 1 AND 10),
  cecm_rationale  TEXT NOT NULL,

  -- Composite CESIC = (CESM * 0.6) + (CECM * 0.4) — computed, stored for query speed
  cesic_score     NUMERIC(4,2) GENERATED ALWAYS AS ((cesm_score * 0.6) + (cecm_score * 0.4)) STORED,

  scored_by       UUID REFERENCES auth.users(id), -- human who assigned scores
  scored_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(signal_id, law_id)
);

CREATE INDEX idx_signal_scores_signal ON signal_scores(signal_id);
CREATE INDEX idx_signal_scores_law ON signal_scores(law_id);
CREATE INDEX idx_signal_scores_cesic ON signal_scores(cesic_score DESC);

-- ============================================================
-- 6. CONVERGENCES
-- When 2+ signals across different categories activate the same law
-- Top 3 convergences published on public page
-- ============================================================

CREATE TABLE convergences (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  summary         TEXT NOT NULL,               -- CE-voice synthesis of the convergence
  law_id          law_id NOT NULL REFERENCES signal_laws(id),
  status          convergence_status NOT NULL DEFAULT 'candidate',
  convergence_score NUMERIC(5,2),              -- aggregate CESIC across constituent signals
  is_dominant     BOOLEAN NOT NULL DEFAULT false, -- marks the top convergence for public page
  published_at    TIMESTAMPTZ,
  authored_by     UUID REFERENCES auth.users(id),
  reviewed_by     UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Junction: which signals compose this convergence
CREATE TABLE convergence_signals (
  convergence_id  UUID NOT NULL REFERENCES convergences(id) ON DELETE CASCADE,
  signal_id       UUID NOT NULL REFERENCES signals(id) ON DELETE CASCADE,
  added_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (convergence_id, signal_id)
);

CREATE INDEX idx_convergences_law ON convergences(law_id);
CREATE INDEX idx_convergences_status ON convergences(status);
CREATE INDEX idx_convergences_dominant ON convergences(is_dominant) WHERE is_dominant = true;
CREATE INDEX idx_convergence_signals_signal ON convergence_signals(signal_id);

-- ============================================================
-- 7. REVIEW_QUEUE
-- Every signal and convergence passes through here before publish
-- Human review is non-negotiable. No auto-publish path exists.
-- ============================================================

CREATE TABLE review_queue (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- polymorphic ref: either a signal or a convergence
  entity_type     TEXT NOT NULL CHECK (entity_type IN ('signal', 'convergence')),
  entity_id       UUID NOT NULL,
  submitted_by    UUID REFERENCES auth.users(id),
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_to     UUID REFERENCES auth.users(id),
  action_taken    review_action,
  action_at       TIMESTAMPTZ,
  action_by       UUID REFERENCES auth.users(id),
  notes           TEXT,
  is_resolved     BOOLEAN NOT NULL DEFAULT false,
  priority        SMALLINT NOT NULL DEFAULT 5 CHECK (priority BETWEEN 1 AND 10), -- 1=urgent, 10=low
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_review_queue_unresolved ON review_queue(is_resolved, submitted_at) WHERE is_resolved = false;
CREATE INDEX idx_review_queue_entity ON review_queue(entity_type, entity_id);
CREATE INDEX idx_review_queue_assigned ON review_queue(assigned_to) WHERE is_resolved = false;

-- ============================================================
-- 8. PRESSURE_VECTORS
-- Named structural forces that recur across signals and convergences
-- Admin-curated. Links signals to named vectors for pattern tracking.
-- ============================================================

CREATE TABLE pressure_vectors (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL UNIQUE,
  slug            TEXT NOT NULL UNIQUE,
  description     TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Junction: signals tagged to pressure vectors
CREATE TABLE signal_pressure_vectors (
  signal_id       UUID NOT NULL REFERENCES signals(id) ON DELETE CASCADE,
  vector_id       UUID NOT NULL REFERENCES pressure_vectors(id) ON DELETE CASCADE,
  tagged_by       UUID REFERENCES auth.users(id),
  tagged_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (signal_id, vector_id)
);

CREATE INDEX idx_pressure_vectors_active ON pressure_vectors(is_active) WHERE is_active = true;
CREATE INDEX idx_signal_pressure_vectors_vector ON signal_pressure_vectors(vector_id);

-- ============================================================
-- UPDATED_AT TRIGGERS (shared utility)
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sources_updated_at
  BEFORE UPDATE ON sources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_signals_updated_at
  BEFORE UPDATE ON signals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_convergences_updated_at
  BEFORE UPDATE ON convergences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_pressure_vectors_updated_at
  BEFORE UPDATE ON pressure_vectors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- RLS POLICIES (Supabase)
-- Public: read published signals + convergences only
-- Admin: full access to all tables
-- Mesodma service role: insert to raw_items, update sources.last_fetched_at only
-- ============================================================

ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE convergences ENABLE ROW LEVEL SECURITY;
ALTER TABLE convergence_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE pressure_vectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_pressure_vectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_laws ENABLE ROW LEVEL SECURITY;

-- Public read: published signals only
CREATE POLICY "public_read_published_signals"
  ON signals FOR SELECT
  USING (status = 'published');

-- Public read: published convergences only
CREATE POLICY "public_read_published_convergences"
  ON convergences FOR SELECT
  USING (status = 'published');

-- Public read: laws always readable
CREATE POLICY "public_read_laws"
  ON signal_laws FOR SELECT
  USING (true);

-- Public read: published signal scores (for published signals)
CREATE POLICY "public_read_signal_scores"
  ON signal_scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM signals s
      WHERE s.id = signal_scores.signal_id
      AND s.status = 'published'
    )
  );

-- Admin full access (service_role bypasses RLS — these are for authenticated admin users)
-- Assumes admin users have a role claim in JWT. Adjust to your auth setup.
CREATE POLICY "admin_full_access_sources"
  ON sources FOR ALL
  USING (auth.jwt() ->> 'role' = 'ce_admin');

CREATE POLICY "admin_full_access_raw_items"
  ON raw_items FOR ALL
  USING (auth.jwt() ->> 'role' = 'ce_admin');

CREATE POLICY "admin_full_access_signals"
  ON signals FOR ALL
  USING (auth.jwt() ->> 'role' = 'ce_admin');

CREATE POLICY "admin_full_access_scores"
  ON signal_scores FOR ALL
  USING (auth.jwt() ->> 'role' = 'ce_admin');

CREATE POLICY "admin_full_access_convergences"
  ON convergences FOR ALL
  USING (auth.jwt() ->> 'role' = 'ce_admin');

CREATE POLICY "admin_full_access_review_queue"
  ON review_queue FOR ALL
  USING (auth.jwt() ->> 'role' = 'ce_admin');

CREATE POLICY "admin_full_access_pressure_vectors"
  ON pressure_vectors FOR ALL
  USING (auth.jwt() ->> 'role' = 'ce_admin');

-- ============================================================
-- END OF SCHEMA — CE SIGNALS V1
-- ============================================================
