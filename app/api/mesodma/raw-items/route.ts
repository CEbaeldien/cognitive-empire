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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit     = Math.min(200, parseInt(searchParams.get("limit")     ?? "50", 10));
  const offset    =               parseInt(searchParams.get("offset")    ?? "0",  10);
  const status    = searchParams.get("status");
  const source_id = searchParams.get("source_id");

  const sig_proc = searchParams.get("signal_processing_status");

  let q = sb()
    .from("raw_items")
    .select("*, sources(name, category)", { count: "exact" })
    .order("fetched_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status)    q = q.eq("status",    status);
  if (source_id) q = q.eq("source_id", source_id);
  if (sig_proc === "null") {
    q = q.is("signal_processing_status", null);
  } else if (sig_proc) {
    q = q.eq("signal_processing_status", sig_proc);
  }

  const { data, error, count } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ items: data ?? [], total: count ?? 0 });
}
