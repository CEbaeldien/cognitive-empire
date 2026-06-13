// Mesodma drain script — runs back-to-back batches until pending=0 or first-pass found
// Uses @supabase/supabase-js (already in node_modules) for correct PostgREST filter encoding.
// Ephemeral — do not commit.

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL  = "https://qgykfjnuaowcyiuzdvsa.supabase.co";
const SERVICE_KEY   = "sb_secret_nGFx1BL5M8sreweA_GZtCQ_usvvMF0S";
const PROCESS_URL   = "https://cognitiveempire.com/api/mesodma/process";
const BATCH_SIZE    = 50;

function sb() {
  return createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
}

const PENDING_OR =
  "signal_processing_status.is.null," +
  "signal_processing_status.eq.pending," +
  "signal_processing_status.eq.needs_enrichment," +
  "signal_processing_status.eq.mesodma_pending";

async function getPendingIds() {
  const { data, error } = await sb()
    .from("raw_items")
    .select("id")
    .eq("status", "extracted")
    .or(PENDING_OR)
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE);
  if (error) throw new Error(`getPendingIds: ${error.message}`);
  return (data ?? []).map((r) => r.id);
}

async function getPendingCount() {
  const { count, error } = await sb()
    .from("raw_items")
    .select("*", { count: "exact", head: true })
    .eq("status", "extracted")
    .or(PENDING_OR);
  if (error) throw new Error(`getPendingCount: ${error.message}`);
  return count ?? 0;
}

async function getFirstPassCount() {
  const { count, error } = await sb()
    .from("first_pass_signals")
    .select("*", { count: "exact", head: true })
    .eq("status", "ready_for_signal_intelligence");
  if (error) throw new Error(`getFirstPassCount: ${error.message}`);
  return count ?? 0;
}

async function processItem(id) {
  try {
    const res  = await fetch(PROCESS_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ raw_item_id: id }),
      signal:  AbortSignal.timeout(45000),
    });
    const json = await res.json().catch(() => ({}));
    return { id, status: res.status, result: json };
  } catch (e) {
    return { id, status: 0, result: { error: String(e) } };
  }
}

async function main() {
  let batchNum      = 0;
  let totalPromoted = 0;
  let doctrineError = false;

  const initialFp = await getFirstPassCount();
  const startPending = await getPendingCount();
  console.log(`[START] pending=${startPending}  first_pass=${initialFp}  batch_size=${BATCH_SIZE}`);

  while (true) {
    batchNum++;
    const ids = await getPendingIds();

    if (ids.length === 0) {
      console.log(`\n[DONE] No more pending items.`);
      break;
    }

    const t0 = Date.now();
    console.log(`\n--- Batch ${batchNum} | ${ids.length} items ---`);

    const results = await Promise.all(ids.map(processItem));
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

    const tally = {};
    for (const { id, status, result } of results) {
      const route = result.route_taken ?? result.error ?? `http_${status}`;
      tally[route] = (tally[route] ?? 0) + 1;

      if (status !== 200) {
        console.log(`  ERR ${status} | ${id} | ${JSON.stringify(result).slice(0, 120)}`);
      }

      if (route === "promoted_to_first_pass_signal") {
        totalPromoted++;
        console.log(`  ★ FIRST-PASS | conf=${result.confidence?.toFixed(2)} potential=${result.signal_potential}`);
        console.log(`    "${(result.first_pass_signal ?? "").slice(0, 100)}"`);
      }

      const errStr = String(result.error ?? "");
      if (errStr.toLowerCase().includes("doctrine") || errStr.toLowerCase().includes("anthropic")) {
        doctrineError = true;
        console.log(`  ⚠ DOCTRINE/ANTHROPIC ERROR | ${id} | ${errStr.slice(0, 120)}`);
      }
    }

    console.log(`  ${elapsed}s | routes: ${JSON.stringify(tally)}`);

    const [pending, fp] = await Promise.all([getPendingCount(), getFirstPassCount()]);
    console.log(`  pending=${pending}  first_pass=${fp}`);

    if (doctrineError) {
      console.log("\n⚠ PAUSED — doctrine_filter / Anthropic error detected. See above.");
      break;
    }

    if (fp > initialFp) {
      console.log(`  ★ new first-pass total: ${fp} — continuing drain`);
    }

    if (pending === 0) {
      console.log("\n✓ Drain complete — pending = 0.");
      break;
    }
  }

  const [finalPending, finalFp] = await Promise.all([getPendingCount(), getFirstPassCount()]);
  console.log(`\n=== FINAL STATE ===`);
  console.log(`  Batches run      : ${batchNum}`);
  console.log(`  Pending remaining: ${finalPending}`);
  console.log(`  First-pass total : ${finalFp}`);
  console.log(`  Promoted this run: ${totalPromoted}`);
  console.log(`  Doctrine error   : ${doctrineError}`);
}

main().catch((e) => { console.error("FATAL:", e); process.exit(1); });
