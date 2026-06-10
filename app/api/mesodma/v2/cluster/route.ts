// Clustering pass trigger. POST runs one deterministic clustering pass.
// Called by n8n daily cron. Processes up to 50 atoms per call.

import { NextRequest, NextResponse } from "next/server";
import { runClusteringPass } from "@/lib/mesodma/clustering";

export const dynamic    = "force-dynamic";
export const maxDuration = 10;

export async function POST(req: NextRequest) {
  const apiKey = process.env.MESODMA_API_KEY;
  if (!apiKey || req.headers.get("authorization") !== `Bearer ${apiKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const report = await runClusteringPass();
    return NextResponse.json(report);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[v2/cluster] unexpected error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  const { createClient } = await import("@supabase/supabase-js");
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const [seed, accumulating, mature, candidate, converted] = await Promise.all([
    client.from("evidence_clusters").select("*", { count: "exact", head: true }).eq("status", "seed"),
    client.from("evidence_clusters").select("*", { count: "exact", head: true }).eq("status", "accumulating"),
    client.from("evidence_clusters").select("*", { count: "exact", head: true }).eq("status", "mature"),
    client.from("evidence_clusters").select("*", { count: "exact", head: true }).eq("status", "signal_candidate"),
    client.from("evidence_clusters").select("*", { count: "exact", head: true }).eq("status", "converted"),
  ]);

  return NextResponse.json({
    seed:             seed.count ?? 0,
    accumulating:     accumulating.count ?? 0,
    mature:           mature.count ?? 0,
    signal_candidate: candidate.count ?? 0,
    converted:        converted.count ?? 0,
  });
}
