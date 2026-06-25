-- Guard: add instance_scope to mmcp_sessions only if not already present.
-- Safe to run after 20260620_mmcp_base_schema.sql which includes this column.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mmcp_sessions' AND column_name = 'instance_scope'
  ) THEN
    ALTER TABLE mmcp_sessions ADD COLUMN instance_scope text
      NOT NULL DEFAULT 'public'
      CHECK (instance_scope IN ('public', 'principal'));
  END IF;
END $$;
