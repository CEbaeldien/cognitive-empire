// POST /api/mesodma/v2/enrich
// Fetches full article text for thin raw_items before atom extraction.
// Runs BEFORE /api/mesodma/v2/batch in the pipeline order.
// BATCH_SIZE=3, FETCH_TIMEOUT=2500ms — sized for Vercel Hobby 10s wall.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { runEnrichmentPass } from "@/lib/mesodma/enricher";

export const dynamic    = "force-dynamic";
export const maxDuration = 10;

export async function POST(req: NextRequest) {
  const apiKey = process.env.MESODMA_API_KEY;
  if (!apiKey || req.headers.get("authorization") !== `Bearer ${apiKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const report = await runEnrichmentPass();
    return NextResponse.json(report);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[v2/enrich] unexpected error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET: queue status — how many items are waiting for enrichment
export async function GET(req: NextRequest) {
  const apiKey = process.env.MESODMA_API_KEY;
  if (!apiKey || req.headers.get("authorization") !== `Bearer ${apiKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const [pending, enriched, failed, skipped] = await Promise.all([
    client.from("raw_items").select("id", { count: "exact", head: true })
      .eq("ingestion_status", "ready_for_mesodma").is("enrichment_status", null),
    client.from("raw_items").select("id", { count: "exact", head: true })
      .eq("enrichment_status", "body_enriched"),
    client.from("raw_items").select("id", { count: "exact", head: true })
      .eq("enrichment_status", "body_failed"),
    client.from("raw_items").select("id", { count: "exact", head: true })
      .eq("enrichment_status", "body_skipped"),
  ]);

  return NextResponse.json({
    pending_enrichment: pending.count ?? 0,
    body_enriched:      enriched.count ?? 0,
    body_failed:        failed.count ?? 0,
    body_skipped:       skipped.count ?? 0,
  });
}
