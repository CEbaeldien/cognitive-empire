import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validateRenderRequest, queueFields } from "@/lib/content/render-queue-shared.mjs";

export const maxDuration = 10;

// Rendering itself takes 2-5 minutes (TTS + Remotion, local headless Chrome)
// and cannot run inside this serverless function — see maxDuration above and
// lib/content/render-queue-shared.mjs for why. This route only validates the
// brief and flips it to "queued"; the actual video is produced by running
// `node scripts/render-queue.mjs` on the local machine.
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  let body: { id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const { id } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const sb = getServiceClient();
  const { data: brief, error: fetchErr } = await sb
    .from("content_briefs")
    .select("id, format, status")
    .eq("id", id)
    .single();

  if (fetchErr || !brief) {
    return NextResponse.json({ error: "Brief not found." }, { status: 404 });
  }

  const check = validateRenderRequest(brief);
  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: 409 });
  }

  const { error: updateErr } = await sb.from("content_briefs").update(queueFields()).eq("id", id);
  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ queued: true, status: "approved" });
}
