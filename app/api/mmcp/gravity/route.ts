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
    .from("mmcp_gravity_history")
    .select("*")
    .order("week_of", { ascending: false })
    .limit(12);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const b = body as Record<string, unknown>;
  if (!b.week_of || b.score === undefined) {
    return NextResponse.json({ error: "week_of and score required" }, { status: 400 });
  }

  const score = Number(b.score);
  const verdict = score <= 30 ? "green" : score <= 60 ? "amber" : "red";

  const { data, error } = await sb()
    .from("mmcp_gravity_history")
    .insert({
      week_of:                b.week_of,
      score,
      ownerless:              Number(b.ownerless ?? 0),
      open_loops:             Number(b.open_loops ?? 0),
      unreviewed_automations: Number(b.unreviewed_automations ?? 0),
      critical_dependencies:  Number(b.critical_dependencies ?? 0),
      target:                 b.target ? Number(b.target) : null,
      verdict,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: data.id, verdict });
}
