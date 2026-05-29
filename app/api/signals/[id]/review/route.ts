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
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: signal, error: signalErr } = await sb()
    .from("signals")
    .select("id, status")
    .eq("id", id)
    .single();

  if (signalErr) {
    const status = signalErr.code === "PGRST116" ? 404 : 500;
    return NextResponse.json({ error: signalErr.message }, { status });
  }

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
    sb()
      .from("signals")
      .update({ status: "in_review" })
      .eq("id", id),
  ]);

  if (queueRes.error)  return NextResponse.json({ error: queueRes.error.message  }, { status: 500 });
  if (updateRes.error) return NextResponse.json({ error: updateRes.error.message }, { status: 500 });

  return NextResponse.json({ queue_entry: queueRes.data, signal_id: id });
}
