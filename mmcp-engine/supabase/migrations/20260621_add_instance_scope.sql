-- Add instance_scope to mmcp_sessions
-- 'principal' → Dr. E mode: CE doctrine header injected into synthesis prompt
-- 'public'    → clean mode: no doctrine injection
ALTER TABLE mmcp_sessions
  ADD COLUMN instance_scope TEXT NOT NULL DEFAULT 'public'
  CHECK (instance_scope IN ('principal', 'public'));
