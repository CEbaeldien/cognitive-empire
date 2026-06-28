import { NextResponse } from "next/server";
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
    .from("signals")
    .select("id, title, directional_thesis, signal_state, dominant_path, operator_move, directional_weight, signal_scores ( final_score )")
    .eq("is_base_signal", true)
    .eq("status", "published")
    .order("directional_weight", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
