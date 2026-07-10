-- Content Engine: render-queue bookkeeping columns.
-- Additive only. Run manually in Supabase Studio SQL editor (service role
-- key cannot execute DDL via PostgREST — same pattern as prior migrations
-- in this project).

ALTER TABLE content_briefs ADD COLUMN IF NOT EXISTS rendered_video_path TEXT;
ALTER TABLE content_briefs ADD COLUMN IF NOT EXISTS rendered_at TIMESTAMPTZ;
ALTER TABLE content_briefs ADD COLUMN IF NOT EXISTS error_note TEXT;
ALTER TABLE content_briefs ADD COLUMN IF NOT EXISTS render_queued BOOLEAN NOT NULL DEFAULT false;

-- Widen the status check constraint to allow the new queue states:
-- 'rendering' (set by render-queue.mjs while it works), 'rendered', 'render_failed'.
ALTER TABLE content_briefs DROP CONSTRAINT IF EXISTS content_briefs_status_check;
ALTER TABLE content_briefs ADD CONSTRAINT content_briefs_status_check
  CHECK (status IN ('draft','reviewed','approved','published','rendering','rendered','render_failed'));
