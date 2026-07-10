import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 10;

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

// Unchanged — used by the existing generate-flow polling. Kept separate from
// LIST_COLUMNS below so that flow keeps working even before the render-queue
// migration (20260705_content_briefs_render_columns.sql) has been applied.
const POLL_COLUMNS = "id, format, title, output, status";

const LIST_COLUMNS =
  "id, format, title, output, status, created_at, rendered_video_path, rendered_at, render_queued, error_note";

export async function GET(req: NextRequest) {
  const ids = req.nextUrl.searchParams.get("ids");
  const sb = getServiceClient();

  // No ids param: list mode — used by the review queue to show all existing
  // briefs, not just the ones just submitted in this browser session. Needs
  // the render-queue migration applied; that's new-feature-only, isolated
  // from the ids-mode poll path below.
  if (!ids) {
    const format = req.nextUrl.searchParams.get("format");
    let query = sb.from("content_briefs").select(LIST_COLUMNS).order("created_at", { ascending: false }).limit(200);
    if (format) query = query.eq("format", format);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ rows: data ?? [] });
  }

  const idList = ids.split(",").map(s => s.trim()).filter(Boolean);
  if (idList.length === 0) return NextResponse.json({ rows: [] });

  const { data, error } = await sb.from("content_briefs").select(POLL_COLUMNS).in("id", idList);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ rows: data ?? [] });
}
