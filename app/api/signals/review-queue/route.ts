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

export async function GET() {
  const supabase = sb();

  const { data: signals, error: signalsErr } = await supabase
    .from("signals")
    .select("id, title, category, subcategory, status, created_at, updated_at")
    .eq("status", "in_review")
    .order("updated_at", { ascending: false });

  if (signalsErr) {
    return NextResponse.json({ error: signalsErr.message }, { status: 500 });
  }

  if (!signals || signals.length === 0) {
    return NextResponse.json({ items: [] });
  }

  const ids = signals.map((s) => s.id);

  const [scoresRes, queueRes] = await Promise.all([
    supabase
      .from("signal_scores")
      .select("signal_id, final_score")
      .in("signal_id", ids),
    supabase
      .from("review_queue")
      .select("entity_id, submitted_by, submitted_at")
      .eq("entity_type", "signal")
      .eq("is_resolved", false)
      .in("entity_id", ids),
  ]);

  const scoreMap = new Map(
    (scoresRes.data ?? []).map((s) => [s.signal_id, s.final_score as number])
  );
  const queueMap = new Map(
    (queueRes.data ?? []).map((q) => [q.entity_id, q as { entity_id: string; submitted_by: string | null; submitted_at: string }])
  );

  const items = signals.map((s) => ({
    signal: s,
    final_score: scoreMap.get(s.id) ?? null,
    queue_entry: queueMap.get(s.id) ?? null,
  }));

  return NextResponse.json({ items });
}
