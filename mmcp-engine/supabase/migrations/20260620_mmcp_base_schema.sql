-- ============================================================
-- MMCP Engine — Base Schema
-- Reconstructed from src/types/mmcp.ts
-- Dated 20260620 — must run before 20260621_add_instance_scope.sql
--
-- NOTE: instance_scope is included here in mmcp_sessions.
-- The 20260621 migration (ALTER TABLE ... ADD COLUMN instance_scope)
-- will fail if run after this — drop or guard it with IF NOT EXISTS.
-- ============================================================

-- ── updated_at trigger function ──────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── mmcp_sessions ────────────────────────────────────────────

CREATE TABLE mmcp_sessions (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  principal_id   uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title          text        NOT NULL,
  status         text        NOT NULL DEFAULT 'open'
                             CHECK (status IN ('open', 'active', 'pending_approval', 'closed', 'archived')),
  priority       text        NOT NULL DEFAULT 'normal'
                             CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  instance_scope text        NOT NULL DEFAULT 'public'
                             CHECK (instance_scope IN ('public', 'principal')),
  closed_at      timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE mmcp_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mmcp_sessions: owner full access"
  ON mmcp_sessions FOR ALL
  USING  (auth.uid() = principal_id)
  WITH CHECK (auth.uid() = principal_id);

CREATE INDEX idx_mmcp_sessions_principal_id ON mmcp_sessions (principal_id);
CREATE INDEX idx_mmcp_sessions_created_at   ON mmcp_sessions (created_at DESC);

CREATE TRIGGER trg_mmcp_sessions_updated_at
  BEFORE UPDATE ON mmcp_sessions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── mission_briefs ───────────────────────────────────────────

CREATE TABLE mission_briefs (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      uuid        NOT NULL REFERENCES mmcp_sessions(id) ON DELETE CASCADE,
  title           text        NOT NULL,
  context         text,
  objective       text        NOT NULL,
  constraints     text,
  models_selected text[]      NOT NULL DEFAULT '{}',
  status          text        NOT NULL DEFAULT 'draft'
                              CHECK (status IN ('draft', 'active', 'complete')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE mission_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mission_briefs: session owner full access"
  ON mission_briefs FOR ALL
  USING  ((SELECT principal_id FROM mmcp_sessions WHERE id = session_id) = auth.uid())
  WITH CHECK ((SELECT principal_id FROM mmcp_sessions WHERE id = session_id) = auth.uid());

CREATE INDEX idx_mission_briefs_session_id ON mission_briefs (session_id);
CREATE INDEX idx_mission_briefs_created_at ON mission_briefs (created_at DESC);

CREATE TRIGGER trg_mission_briefs_updated_at
  BEFORE UPDATE ON mission_briefs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── model_outputs ────────────────────────────────────────────
-- Stores raw AI output per model per session/mission (OEP input stage)

CREATE TABLE model_outputs (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    uuid        NOT NULL REFERENCES mmcp_sessions(id) ON DELETE CASCADE,
  mission_id    uuid        NOT NULL REFERENCES mission_briefs(id) ON DELETE CASCADE,
  model_name    text        NOT NULL
                            CHECK (model_name IN ('claude', 'claude-code', 'codex', 'grok', 'chatgpt', 'gemini')),
  raw_output    text        NOT NULL,
  input_prompt  text,
  token_count   integer,
  pasted_at     timestamptz NOT NULL DEFAULT now(),
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE model_outputs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "model_outputs: session owner full access"
  ON model_outputs FOR ALL
  USING  ((SELECT principal_id FROM mmcp_sessions WHERE id = session_id) = auth.uid())
  WITH CHECK ((SELECT principal_id FROM mmcp_sessions WHERE id = session_id) = auth.uid());

CREATE INDEX idx_model_outputs_session_id ON model_outputs (session_id);
CREATE INDEX idx_model_outputs_mission_id ON model_outputs (mission_id);
CREATE INDEX idx_model_outputs_created_at ON model_outputs (created_at DESC);

-- ── oep_comparisons ──────────────────────────────────────────
-- Structured OEP analysis: convergence, divergence, blind spots, etc.

CREATE TABLE oep_comparisons (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id          uuid        NOT NULL REFERENCES mmcp_sessions(id) ON DELETE CASCADE,
  mission_id          uuid        NOT NULL REFERENCES mission_briefs(id) ON DELETE CASCADE,
  convergence_notes   text,
  divergence_notes    text,
  blind_spots         text,
  contradictions      text,
  risk_notes          text,
  missing_assumptions text,
  status              text        NOT NULL DEFAULT 'draft'
                                  CHECK (status IN ('draft', 'complete')),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE oep_comparisons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "oep_comparisons: session owner full access"
  ON oep_comparisons FOR ALL
  USING  ((SELECT principal_id FROM mmcp_sessions WHERE id = session_id) = auth.uid())
  WITH CHECK ((SELECT principal_id FROM mmcp_sessions WHERE id = session_id) = auth.uid());

CREATE INDEX idx_oep_comparisons_session_id ON oep_comparisons (session_id);
CREATE INDEX idx_oep_comparisons_mission_id ON oep_comparisons (mission_id);
CREATE INDEX idx_oep_comparisons_created_at ON oep_comparisons (created_at DESC);

CREATE TRIGGER trg_oep_comparisons_updated_at
  BEFORE UPDATE ON oep_comparisons
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── syntheses ────────────────────────────────────────────────

CREATE TABLE syntheses (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id         uuid        NOT NULL REFERENCES mmcp_sessions(id) ON DELETE CASCADE,
  mission_id         uuid        NOT NULL REFERENCES mission_briefs(id) ON DELETE CASCADE,
  oep_comparison_id  uuid        REFERENCES oep_comparisons(id),
  synthesis_text     text        NOT NULL,
  confidence_level   text        CHECK (confidence_level IN ('low', 'medium', 'high')),
  uncertainty_flags  text,
  recommended_action text,
  status             text        NOT NULL DEFAULT 'pending_approval'
                                 CHECK (status IN ('pending_approval', 'approved', 'revised', 'rejected')),
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE syntheses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "syntheses: session owner full access"
  ON syntheses FOR ALL
  USING  ((SELECT principal_id FROM mmcp_sessions WHERE id = session_id) = auth.uid())
  WITH CHECK ((SELECT principal_id FROM mmcp_sessions WHERE id = session_id) = auth.uid());

CREATE INDEX idx_syntheses_session_id ON syntheses (session_id);
CREATE INDEX idx_syntheses_mission_id ON syntheses (mission_id);
CREATE INDEX idx_syntheses_created_at ON syntheses (created_at DESC);

CREATE TRIGGER trg_syntheses_updated_at
  BEFORE UPDATE ON syntheses
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── approvals ────────────────────────────────────────────────

CREATE TABLE approvals (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      uuid        NOT NULL REFERENCES mmcp_sessions(id) ON DELETE CASCADE,
  synthesis_id    uuid        NOT NULL REFERENCES syntheses(id) ON DELETE CASCADE,
  principal_id    uuid        NOT NULL REFERENCES auth.users(id),
  decision        text        NOT NULL
                              CHECK (decision IN ('approve', 'revise', 'reject', 'escalate')),
  notes           text,
  authority_level text        NOT NULL
                              CHECK (authority_level IN ('R0', 'R1', 'R2', 'R3', 'R4')),
  decided_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "approvals: principal full access"
  ON approvals FOR ALL
  USING  (auth.uid() = principal_id)
  WITH CHECK (auth.uid() = principal_id);

CREATE INDEX idx_approvals_session_id   ON approvals (session_id);
CREATE INDEX idx_approvals_principal_id ON approvals (principal_id);
CREATE INDEX idx_approvals_decided_at   ON approvals (decided_at DESC);

-- ── actions ──────────────────────────────────────────────────

CREATE TABLE actions (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      uuid        NOT NULL REFERENCES mmcp_sessions(id) ON DELETE CASCADE,
  synthesis_id    uuid        NOT NULL REFERENCES syntheses(id) ON DELETE CASCADE,
  approval_id     uuid        NOT NULL REFERENCES approvals(id) ON DELETE CASCADE,
  title           text        NOT NULL,
  description     text        NOT NULL,
  authority_level text        NOT NULL
                              CHECK (authority_level IN ('R0', 'R1', 'R2', 'R3', 'R4')),
  status          text        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending', 'in_progress', 'complete', 'cancelled')),
  completed_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "actions: session owner full access"
  ON actions FOR ALL
  USING  ((SELECT principal_id FROM mmcp_sessions WHERE id = session_id) = auth.uid())
  WITH CHECK ((SELECT principal_id FROM mmcp_sessions WHERE id = session_id) = auth.uid());

CREATE INDEX idx_actions_session_id ON actions (session_id);
CREATE INDEX idx_actions_created_at ON actions (created_at DESC);

CREATE TRIGGER trg_actions_updated_at
  BEFORE UPDATE ON actions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── memory_items ─────────────────────────────────────────────

CREATE TABLE memory_items (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      uuid        NOT NULL REFERENCES mmcp_sessions(id) ON DELETE CASCADE,
  synthesis_id    uuid        NOT NULL REFERENCES syntheses(id) ON DELETE CASCADE,
  approval_id     uuid        NOT NULL REFERENCES approvals(id) ON DELETE CASCADE,
  title           text        NOT NULL,
  content         text        NOT NULL,
  tags            text[]      NOT NULL DEFAULT '{}',
  classification  text        NOT NULL
                              CHECK (classification IN ('general', 'doctrine', 'pattern', 'decision', 'canon')),
  exportable      boolean     NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE memory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "memory_items: session owner full access"
  ON memory_items FOR ALL
  USING  ((SELECT principal_id FROM mmcp_sessions WHERE id = session_id) = auth.uid())
  WITH CHECK ((SELECT principal_id FROM mmcp_sessions WHERE id = session_id) = auth.uid());

CREATE INDEX idx_memory_items_session_id     ON memory_items (session_id);
CREATE INDEX idx_memory_items_classification ON memory_items (classification);
CREATE INDEX idx_memory_items_created_at     ON memory_items (created_at DESC);

CREATE TRIGGER trg_memory_items_updated_at
  BEFORE UPDATE ON memory_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── audit_logs ───────────────────────────────────────────────

CREATE TABLE audit_logs (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      uuid        REFERENCES mmcp_sessions(id) ON DELETE SET NULL,
  principal_id    uuid        REFERENCES auth.users(id),
  event_type      text        NOT NULL,
  entity_type     text        NOT NULL,
  entity_id       text,
  authority_level text        CHECK (authority_level IN ('R0', 'R1', 'R2', 'R3', 'R4')),
  payload         jsonb,
  logged_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs: principal can read own"
  ON audit_logs FOR SELECT
  USING (
    auth.uid() = principal_id
    OR auth.uid() = (SELECT principal_id FROM mmcp_sessions WHERE id = session_id)
  );

CREATE POLICY "audit_logs: authenticated can insert"
  ON audit_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE INDEX idx_audit_logs_session_id   ON audit_logs (session_id);
CREATE INDEX idx_audit_logs_principal_id ON audit_logs (principal_id);
CREATE INDEX idx_audit_logs_event_type   ON audit_logs (event_type);
CREATE INDEX idx_audit_logs_logged_at    ON audit_logs (logged_at DESC);
