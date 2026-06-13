import { createClient } from "@supabase/supabase-js";

export type PendingBatch = {
  total_pending: number;
  item_ids:      string[];
};

export type BatchStats = {
  pending_count:    number;
  candidate_count:  number;
  first_pass_count: number;
  rejected_count:   number;
  last_batch_run:   string | null;
};

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

const RUN_SIZE = 50;

// Returns pending item IDs — no AI calls, completes well within Vercel Hobby 10s limit.
// Actual processing is done client-side (cockpit) or per-item by n8n.
export async function getPendingBatch(): Promise<PendingBatch> {
  const client = sb();

  const [countResult, itemsResult] = await Promise.all([
    client
      .from("raw_items")
      .select("*", { count: "exact", head: true })
      .eq("status", "extracted")
      .or("signal_processing_status.is.null,signal_processing_status.eq.pending,signal_processing_status.eq.needs_enrichment,signal_processing_status.eq.mesodma_pending"),
    client
      .from("raw_items")
      .select("id")
      .eq("status", "extracted")
      .or("signal_processing_status.is.null,signal_processing_status.eq.pending,signal_processing_status.eq.needs_enrichment,signal_processing_status.eq.mesodma_pending")
      .order("created_at", { ascending: true })
      .limit(RUN_SIZE),
  ]);

  if (itemsResult.error) throw new Error(itemsResult.error.message);

  return {
    total_pending: countResult.count ?? 0,
    item_ids:      (itemsResult.data ?? []).map((r: { id: string }) => r.id),
  };
}

export async function getBatchStats(): Promise<BatchStats> {
  const client = sb();

  const [pending, candidates, firstPass, rejected, lastRun] = await Promise.all([
    client
      .from("raw_items")
      .select("*", { count: "exact", head: true })
      .eq("status", "extracted")
      .or("signal_processing_status.is.null,signal_processing_status.eq.pending,signal_processing_status.eq.needs_enrichment,signal_processing_status.eq.mesodma_pending"),
    client
      .from("candidate_evidence")
      .select("*", { count: "exact", head: true }),
    client
      .from("first_pass_signals")
      .select("*", { count: "exact", head: true })
      .eq("status", "ready_for_signal_intelligence"),
    client
      .from("raw_items")
      .select("*", { count: "exact", head: true })
      .eq("signal_processing_status", "rejected_noise"),
    client
      .from("mesodma_runs")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return {
    pending_count:    pending.count    ?? 0,
    candidate_count:  candidates.count ?? 0,
    first_pass_count: firstPass.count  ?? 0,
    rejected_count:   rejected.count   ?? 0,
    last_batch_run:   lastRun.data?.created_at ?? null,
  };
}
