import { createClient } from "@supabase/supabase-js";

export type BatchResult = {
  total_pending:          number;
  processed_this_run:     number;
  promoted_to_candidate:  number;
  promoted_to_first_pass: number;
  rejected:               number;
  errors:                 number;
};

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

const RUN_SIZE = 20;

export async function runBatch(): Promise<BatchResult> {
  const client  = sb();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  // Count full queue depth for accurate reporting
  const { count: pendingCount } = await client
    .from("raw_items")
    .select("*", { count: "exact", head: true })
    .eq("status", "extracted")
    .or("signal_processing_status.is.null,signal_processing_status.eq.pending,signal_processing_status.eq.needs_enrichment");

  const total_pending = pendingCount ?? 0;

  if (total_pending === 0) {
    return { total_pending: 0, processed_this_run: 0, promoted_to_candidate: 0, promoted_to_first_pass: 0, rejected: 0, errors: 0 };
  }

  // Fetch only the oldest RUN_SIZE items for this run
  const { data: items, error } = await client
    .from("raw_items")
    .select("id")
    .eq("status", "extracted")
    .or("signal_processing_status.is.null,signal_processing_status.eq.pending,signal_processing_status.eq.needs_enrichment")
    .order("created_at", { ascending: true })
    .limit(RUN_SIZE);

  if (error) throw new Error(error.message);

  const batch = (items ?? []) as { id: string }[];

  // Process all in parallel — single allSettled, no loop
  const results = await Promise.allSettled(
    batch.map(({ id }) =>
      fetch(`${siteUrl}/api/mesodma/process`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ raw_item_id: id }),
      }).then(r => {
        if (!r.ok) throw new Error(`process HTTP ${r.status}`);
        return r.json() as Promise<{ route_taken?: string }>;
      })
    )
  );

  let processed_this_run = 0, promoted_to_candidate = 0, promoted_to_first_pass = 0, rejected = 0, errors = 0;

  for (const r of results) {
    processed_this_run++;
    if (r.status === "rejected") {
      errors++;
    } else {
      const rt = (r.value as { route_taken?: string }).route_taken ?? "";
      if (rt === "promoted_to_first_pass_signal") {
        promoted_to_first_pass++;
        promoted_to_candidate++;
      } else if (rt === "candidate_evidence_stored" || rt === "stored_as_candidate_evidence") {
        promoted_to_candidate++;
      } else if (rt === "rejected_noise" || rt === "rejected_at_doctrine_filter") {
        rejected++;
      } else {
        errors++;
      }
    }
  }

  return { total_pending, processed_this_run, promoted_to_candidate, promoted_to_first_pass, rejected, errors };
}

export type BatchStats = {
  pending_count:    number;
  candidate_count:  number;
  first_pass_count: number;
  rejected_count:   number;
  last_batch_run:   string | null;
};

export async function getBatchStats(): Promise<BatchStats> {
  const client = sb();

  const [pending, candidates, firstPass, rejected, lastRun] = await Promise.all([
    client
      .from("raw_items")
      .select("*", { count: "exact", head: true })
      .eq("status", "extracted")
      .or("signal_processing_status.is.null,signal_processing_status.eq.pending,signal_processing_status.eq.needs_enrichment"),
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
