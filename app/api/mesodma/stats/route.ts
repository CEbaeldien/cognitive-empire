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
  const client = sb();
  const now       = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const h24ago     = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: sourcesData,     error: e1 },
    { count: todayCount,     error: e2 },
    { count: pendingEnrich,  error: e3 },
    { count: errorCount,     error: e4 },
    { data: lastRow,         error: e5 },
    // V1 pipeline stats — null count if tables not migrated yet
    { count: rawPending      },
    { count: rejectedNoise   },
    { count: candidateCount  },
    { count: firstPassReady  },
    { count: runsTotal       },
  ] = await Promise.all([
    client.from("sources").select("ingestion_status, is_active"),
    client.from("raw_items").select("id", { count: "exact", head: true }).gte("fetched_at", todayStart),
    client.from("raw_items").select("id", { count: "exact", head: true }).or("enrichment_status.is.null,enrichment_status.eq.pending"),
    client.from("raw_items").select("id", { count: "exact", head: true }).eq("status", "error").gte("created_at", h24ago),
    client.from("raw_items").select("fetched_at").order("fetched_at", { ascending: false }).limit(1),
    // V1
    client.from("raw_items").select("id", { count: "exact", head: true }).eq("signal_processing_status", "pending"),
    client.from("raw_items").select("id", { count: "exact", head: true }).eq("signal_processing_status", "rejected_noise"),
    client.from("candidate_evidence").select("id", { count: "exact", head: true }),
    client.from("first_pass_signals").select("id", { count: "exact", head: true }).eq("status", "ready_for_signal_intelligence"),
    client.from("mesodma_runs").select("id", { count: "exact", head: true }),
  ]);

  if (e1 || e2 || e3 || e4) {
    return NextResponse.json({ error: "Stats query failed" }, { status: 500 });
  }

  const sources = (sourcesData ?? []) as { ingestion_status: string | null; is_active: boolean }[];
  const active  = sources.filter(s => s.ingestion_status === "active" || (!s.ingestion_status && s.is_active)).length;
  const paused  = sources.filter(s => s.ingestion_status === "paused").length;
  const blocked = sources.filter(s => s.ingestion_status === "blocked").length;

  return NextResponse.json({
    // Legacy fields (old UI still uses these)
    sources:            { total: sources.length, active, paused, blocked },
    raw_items_today:    todayCount    ?? 0,
    pending_enrichment: pendingEnrich ?? 0,
    errors_24h:         errorCount    ?? 0,
    last_ingest_at:     (lastRow as Array<{ fetched_at: string }>)?.[0]?.fetched_at ?? null,
    // V1 pipeline counts
    raw_items_pending:          rawPending     ?? 0,
    rejected_noise_count:       rejectedNoise  ?? 0,
    candidate_evidence_count:   candidateCount ?? 0,
    first_pass_signals_ready:   firstPassReady ?? 0,
    mesodma_runs_count:         runsTotal      ?? 0,
  });
}
