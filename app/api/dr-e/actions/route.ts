// Minimum role: service_role (bypasses RLS on dre_actions)
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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status     = searchParams.get("status");
  const risk_level = searchParams.get("risk_level");
  const limit      = Math.min(200, parseInt(searchParams.get("limit")  ?? "50", 10));
  const offset     =              parseInt(searchParams.get("offset") ?? "0",  10);

  let q = sb()
    .from("dre_actions")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status)     q = q.eq("status",     status);
  if (risk_level) q = q.eq("risk_level", risk_level);

  const { data, error, count } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ actions: data ?? [], total: count ?? 0 });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { title, action_type, source_module, risk_level, status, requires_approval, payload, notes } = body;

  if (!title) {
    return NextResponse.json({ error: "Missing required field: title" }, { status: 400 });
  }

  const { data, error } = await sb()
    .from("dre_actions")
    .insert({
      title,
      action_type:       action_type       ?? null,
      source_module:     source_module     ?? null,
      risk_level:        risk_level        ?? "safe",
      status:            status            ?? "suggested",
      requires_approval: requires_approval ?? false,
      payload:           payload           ?? {},
      notes:             notes             ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const { id, status, notes, payload } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing required field: id" }, { status: 400 });
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (status  !== undefined) patch.status  = status;
  if (notes   !== undefined) patch.notes   = notes;
  if (payload !== undefined) patch.payload = payload;

  const { data, error } = await sb()
    .from("dre_actions")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
