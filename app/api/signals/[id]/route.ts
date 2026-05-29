import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [signalRes, scoresRes] = await Promise.all([
    sb().from("signals").select("*").eq("id", id).single(),
    sb().from("signal_scores").select("*").eq("signal_id", id).order("law_id"),
  ]);

  if (signalRes.error) {
    const status = signalRes.error.code === "PGRST116" ? 404 : 500;
    return NextResponse.json({ error: signalRes.error.message }, { status });
  }

  return NextResponse.json({ signal: signalRes.data, scores: scoresRes.data ?? [] });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  // Strip server-managed fields — caller should not overwrite them
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { created_at, id: _id, ...patch } = body;

  const { data, error } = await sb()
    .from("signals")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { error } = await sb()
    .from("signals")
    .update({ status: "archived" })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
