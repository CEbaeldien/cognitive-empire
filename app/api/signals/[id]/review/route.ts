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

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: { action?: string; notes?: string } = {};
  try { body = await req.json(); } catch { /* no body — submit path */ }

  const { data: signal, error: signalErr } = await sb()
    .from("signals")
    .select("id, status")
    .eq("id", id)
    .single();

  if (signalErr) {
    const status = signalErr.code === "PGRST116" ? 404 : 500;
    return NextResponse.json({ error: signalErr.message }, { status });
  }

  // ── No action body: submit signal to review queue ─────────────────────────
  if (!body.action) {
    if (signal.status === "in_review") {
      return NextResponse.json({ error: "Signal is already in review" }, { status: 409 });
    }
    if (signal.status === "published") {
      return NextResponse.json({ error: "Published signals cannot be re-submitted" }, { status: 409 });
    }

    const [queueRes, updateRes] = await Promise.all([
      sb()
        .from("review_queue")
        .insert({ entity_type: "signal", entity_id: id, is_resolved: false, priority: 5 })
        .select()
        .single(),
      sb().from("signals").update({ status: "in_review" }).eq("id", id),
    ]);

    if (queueRes.error)  return NextResponse.json({ error: queueRes.error.message  }, { status: 500 });
    if (updateRes.error) return NextResponse.json({ error: updateRes.error.message }, { status: 500 });

    return NextResponse.json({ queue_entry: queueRes.data, signal_id: id });
  }

  // ── Reviewer actions ──────────────────────────────────────────────────────
  const { action, notes } = body;

  // Publish: only allowed from approved status, no queue entry to resolve
  if (action === "publish") {
    if (signal.status !== "approved") {
      return NextResponse.json({ error: "Only approved signals can be published" }, { status: 409 });
    }
    const { error } = await sb()
      .from("signals")
      .update({ status: "published", published_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ signal_id: id, action: "publish", status: "published" });
  }

  // approve / reject / request_revision: signal must be in_review
  if (signal.status !== "in_review") {
    return NextResponse.json({ error: "Signal is not currently in review" }, { status: 409 });
  }

  const now = new Date().toISOString();
  let signalUpdate: Record<string, unknown> = { reviewed_at: now };
  let actionTaken: string;

  if (action === "approve") {
    signalUpdate.status = "approved";
    actionTaken = "approve";
  } else if (action === "reject") {
    signalUpdate.status = "rejected";
    actionTaken = "reject";
  } else if (action === "request_revision") {
    signalUpdate.status = "draft";
    signalUpdate.revision_notes = notes ?? null;
    actionTaken = "request_revision";
  } else {
    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  }

  const [signalRes, queueRes] = await Promise.all([
    sb().from("signals").update(signalUpdate).eq("id", id),
    sb()
      .from("review_queue")
      .update({ action_taken: actionTaken, is_resolved: true, action_at: now, notes: notes ?? null })
      .eq("entity_id", id)
      .eq("entity_type", "signal")
      .eq("is_resolved", false),
  ]);

  if (signalRes.error) return NextResponse.json({ error: signalRes.error.message }, { status: 500 });
  if (queueRes.error)  return NextResponse.json({ error: queueRes.error.message  }, { status: 500 });

  return NextResponse.json({ signal_id: id, action, status: signalUpdate.status });
}
