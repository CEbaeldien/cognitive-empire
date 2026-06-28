import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function GET() {
  const { data, error } = await sb()
    .from("mmcp_decisions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { title } = body as Record<string, unknown>;
  if (!title || typeof title !== "string") return NextResponse.json({ error: "title required" }, { status: 400 });

  const { data, error } = await sb()
    .from("mmcp_decisions")
    .insert({ title, stage: 0, authority: "self", readiness_pct: 0 })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const b = body as Record<string, unknown>;
  if (!b.id || typeof b.id !== "string") return NextResponse.json({ error: "id required" }, { status: 400 });

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (b.stage          !== undefined) updates.stage          = b.stage;
  if (b.authority      !== undefined) updates.authority      = b.authority;
  if (b.readiness_pct  !== undefined) updates.readiness_pct  = b.readiness_pct;
  if (b.operator_move  !== undefined) updates.operator_move  = b.operator_move;
  if (b.outcome        !== undefined) updates.outcome        = b.outcome;
  if (b.stage_log      !== undefined) updates.stage_log      = b.stage_log;
  if (b.constraints_identified !== undefined) updates.constraints_identified = b.constraints_identified;
  if (b.risks_surfaced         !== undefined) updates.risks_surfaced         = b.risks_surfaced;
  if (b.contradictions         !== undefined) updates.contradictions         = b.contradictions;
  if (b.stage === 5) {
    updates.canonized_at = new Date().toISOString();
    updates.authority    = "canon";
  }

  const { data, error } = await sb()
    .from("mmcp_decisions")
    .update(updates)
    .eq("id", b.id as string)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
