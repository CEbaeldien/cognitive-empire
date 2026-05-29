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

type ScoreInput = {
  law_id: string;
  cesm_score: number;
  cesm_rationale: string;
  cecm_score: number;
  cecm_rationale: string;
};

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { scores }: { scores: ScoreInput[] } = body;

  if (!Array.isArray(scores) || scores.length === 0) {
    return NextResponse.json({ error: "scores must be a non-empty array" }, { status: 400 });
  }

  const rows = scores.map((s) => ({
    signal_id:      id,
    law_id:         s.law_id,
    cesm_score:     Math.min(10, Math.max(1, Math.round(Number(s.cesm_score)))),
    cesm_rationale: s.cesm_rationale ?? "",
    cecm_score:     Math.min(10, Math.max(1, Math.round(Number(s.cecm_score)))),
    cecm_rationale: s.cecm_rationale ?? "",
    scored_at:      new Date().toISOString(),
  }));

  const { data, error } = await sb()
    .from("signal_scores")
    .upsert(rows, { onConflict: "signal_id,law_id" })
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ scores: data });
}
