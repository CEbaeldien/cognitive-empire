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
    .select("id, status")
    .eq("id", id)
    .single();

  if (fetchErr || !brief) {
    return NextResponse.json({ error: "Brief not found." }, { status: 404 });
  }
  if (brief.status !== "draft" && brief.status !== "reviewed") {
    return NextResponse.json({ error: `Cannot approve from status "${brief.status}".` }, { status: 409 });
  }

  const { error: updateErr } = await sb.from("content_briefs").update({ status: "approved" }).eq("id", id);
  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ status: "approved" });
}
