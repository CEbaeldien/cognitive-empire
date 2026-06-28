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
    .from("mmcp_weekly_reviews")
    .select("*")
    .order("week_of", { ascending: false })
    .limit(8);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const b = body as Record<string, unknown>;

  if (!b.week_of) return NextResponse.json({ error: "week_of required" }, { status: 400 });

  const { data, error } = await sb()
    .from("mmcp_weekly_reviews")
    .insert({
      week_of:                 b.week_of,
      mission_score:           b.mission_score ?? null,
      signals_upgraded:        b.signals_upgraded ?? [],
      decisions_canonized:     b.decisions_canonized ?? [],
      gravity_start:           b.gravity_start ?? null,
      gravity_end:             b.gravity_end ?? null,
      gravity_delta:           b.gravity_delta ?? null,
      biggest_risk:            b.biggest_risk ?? null,
      mission_moved:           b.mission_moved ?? null,
      next_week_priority:      b.next_week_priority ?? null,
      failure_modes_triggered: b.failure_modes_triggered ?? [],
      raw_data:                b.raw_data ?? null,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: data.id });
}
