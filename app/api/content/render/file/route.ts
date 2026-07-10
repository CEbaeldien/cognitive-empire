import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

export const maxDuration = 10;

// Streams a rendered MP4 straight off local disk. Local-dev-only: rendered
// videos live wherever scripts/render-queue.mjs ran (this operator's
// machine), never on Vercel — see lib/content/render-queue-shared.mjs.
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const sb = getServiceClient();
  const { data: brief, error } = await sb
    .from("content_briefs")
    .select("rendered_video_path")
    .eq("id", id)
    .single();

  if (error || !brief?.rendered_video_path) {
    return NextResponse.json({ error: "No rendered video for this brief." }, { status: 404 });
  }

  const videoDir = path.join(process.cwd(), "outputs", "videos");
  const filePath = path.resolve(brief.rendered_video_path);

  if (!filePath.startsWith(videoDir + path.sep)) {
    return NextResponse.json({ error: "Invalid video path." }, { status: 400 });
  }
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "Video file not found on disk." }, { status: 404 });
  }

  const stat = fs.statSync(filePath);
  const buffer = fs.readFileSync(filePath);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "video/mp4",
      "Content-Length": String(stat.size),
      "Cache-Control": "no-store",
    },
  });
}
