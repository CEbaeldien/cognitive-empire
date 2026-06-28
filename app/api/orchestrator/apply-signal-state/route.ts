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
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { signal_id, new_state, action, session_id, raw_input, model_synthesis } =
    body as Record<string, unknown>;

  if (!signal_id || typeof signal_id !== "string") {
    return NextResponse.json({ error: "signal_id required" }, { status: 400 });
  }

  // "apply" — update signal_state
  if (action === "apply") {
    if (!new_state || typeof new_state !== "string") {
      return NextResponse.json({ error: "new_state required for apply action" }, { status: 400 });
    }
    const { error } = await sb()
      .from("signals")
      .update({ signal_state: new_state })
      .eq("id", signal_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, applied: new_state });
  }

  // "evidence-only" — log to signal_evidence, no state change
  if (action === "evidence-only") {
    const { error } = await sb()
      .from("signal_evidence")
      .insert({
        signal_id,
        session_id: session_id ?? null,
        raw_input:  raw_input ?? null,
        model_synthesis: model_synthesis ?? null,
        evidence_type: "operator-session",
      });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, logged: true });
  }

  return NextResponse.json({ error: "action must be 'apply' or 'evidence-only'" }, { status: 400 });
}
