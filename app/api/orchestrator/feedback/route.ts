import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { session_id, task, best_model, rating, notes } = body as Record<string, unknown>;

  if (!rating || typeof rating !== "number" || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "rating must be 1–5" }, { status: 400 });
  }

  const { error } = await sb()
    .from("orchestrator_feedback")
    .insert({
      session_id: session_id ?? null,
      task:       task ?? null,
      best_model: best_model ?? null,
      rating,
      notes:      notes ?? null,
    });

  if (error) {
    console.error("[orchestrator/feedback] insert error:", error.message);
    return NextResponse.json({ error: "Failed to save feedback" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
