import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function GET(req: NextRequest) {
  const sp     = req.nextUrl.searchParams;
  const domain           = sp.get("domain");
  const status           = sp.get("status");
  const signal_potential = sp.get("signal_potential");
  const limit  = Math.min(200, parseInt(sp.get("limit")  ?? "50", 10));
  const offset =               parseInt(sp.get("offset") ?? "0",  10);

  let q = sb()
    .from("first_pass_signals")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (domain)           q = q.eq("domain",           domain);
  if (status)           q = q.eq("status",            status);
  if (signal_potential) q = q.eq("signal_potential",  signal_potential);

  const { data, error, count } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ signals: data ?? [], total: count ?? 0 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { data, error } = await sb()
    .from("first_pass_signals")
    .insert(body)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const { id, status } = await req.json();
  if (!id || !status) return NextResponse.json({ error: "id and status required" }, { status: 400 });

  const VALID_STATUSES = [
    "first_pass", "needs_more_sources", "needs_human_check",
    "rejected_by_mesodma", "ready_for_signal_intelligence",
  ];
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: `Invalid status: ${status}` }, { status: 400 });
  }

  const { data, error } = await sb()
    .from("first_pass_signals")
    .update({ status })
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
