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
  strength: number;
  weight: number;
  longevity: number;
  convergence_potential: number;
  decay_factor: number;
  governance_impact: number;
  continuity_pressure: number;
  prosperity_relevance: number;
  structural_relevance: number;
  confidence: number;
  scoring_notes?: string | null;
};

function clamp110(v: unknown): number {
  return Math.min(10, Math.max(1, Math.round(Number(v) || 1)));
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { score }: { score: ScoreInput } = body;

  if (!score) {
    return NextResponse.json({ error: "score object required" }, { status: 400 });
  }

  const row = {
    signal_id:             id,
    strength:              clamp110(score.strength),
    weight:                clamp110(score.weight),
    longevity:             clamp110(score.longevity),
    convergence_potential: clamp110(score.convergence_potential),
    decay_factor:          clamp110(score.decay_factor),
    governance_impact:     clamp110(score.governance_impact),
    continuity_pressure:   clamp110(score.continuity_pressure),
    prosperity_relevance:  clamp110(score.prosperity_relevance),
    structural_relevance:  clamp110(score.structural_relevance),
    confidence:            Math.min(1, Math.max(0, parseFloat(String(score.confidence)) || 0)),
    scoring_notes:         score.scoring_notes ?? null,
    scored_at:             new Date().toISOString(),
  };

  const { data, error } = await sb()
    .from("signal_scores")
    .upsert(row, { onConflict: "signal_id" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ score: data });
}
