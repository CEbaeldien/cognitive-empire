-- Dr. E chat-first UI: single persisted conversation thread per founder.
-- Append-only log, no separate "threads" table — matches the single-thread
-- design (contrast with MMCP's multi-session model).

CREATE TABLE dre_chat_messages (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  principal_id uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role         text        NOT NULL CHECK (role IN ('user', 'assistant')),
  model        text        CHECK (model IN ('claude', 'chatgpt')),
  content      text        NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_dre_chat_messages_principal_created
  ON dre_chat_messages (principal_id, created_at);

-- No RLS policy — consistent with every other dre_* table (dre_inbox,
-- dre_projects, dre_research, dre_actions, dre_governance), all of which
-- rely entirely on service-role bypass from requireFounder()-gated routes.
