// Dedup candidate_evidence: keep oldest row per raw_item_id, delete the rest.
// mesodma_runs.candidate_evidence_id FK is nulled for deleted rows before removal.
// Ephemeral — do not commit.

import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  "https://qgykfjnuaowcyiuzdvsa.supabase.co",
  "sb_secret_nGFx1BL5M8sreweA_GZtCQ_usvvMF0S",
  { auth: { persistSession: false } }
);

// 1. Fetch all candidate_evidence rows (oldest first → first occurrence per raw_item_id is kept)
const { data: rows, error } = await sb
  .from("candidate_evidence")
  .select("id, raw_item_id, created_at")
  .order("created_at", { ascending: true });
if (error) throw new Error(`fetch: ${error.message}`);

console.log(`Total candidate_evidence rows: ${rows.length}`);

const seen    = new Map();
const toDelete = [];

for (const row of rows) {
  if (!seen.has(row.raw_item_id)) {
    seen.set(row.raw_item_id, row.id);
  } else {
    toDelete.push(row.id);
  }
}

console.log(`Unique raw_item_ids : ${seen.size}`);
console.log(`Duplicates to delete: ${toDelete.length}`);

if (toDelete.length === 0) {
  console.log("No duplicates — nothing to do.");
  process.exit(0);
}

// 2. Null out mesodma_runs.candidate_evidence_id for all rows referencing duplicates
const CHUNK = 100;
let nulled = 0;
for (let i = 0; i < toDelete.length; i += CHUNK) {
  const chunk = toDelete.slice(i, i + CHUNK);
  const { error: nullErr } = await sb
    .from("mesodma_runs")
    .update({ candidate_evidence_id: null })
    .in("candidate_evidence_id", chunk);
  if (nullErr) throw new Error(`null FK batch ${i}: ${nullErr.message}`);
  nulled += chunk.length;
  process.stdout.write(`\r  nulled FK in mesodma_runs: ${nulled}/${toDelete.length} batches`);
}
console.log();

// 3. Delete duplicate candidate_evidence rows
let deleted = 0;
for (let i = 0; i < toDelete.length; i += CHUNK) {
  const chunk = toDelete.slice(i, i + CHUNK);
  const { error: delErr } = await sb
    .from("candidate_evidence")
    .delete()
    .in("id", chunk);
  if (delErr) throw new Error(`delete batch ${i}: ${delErr.message}`);
  deleted += chunk.length;
  process.stdout.write(`\r  deleted: ${deleted}/${toDelete.length}`);
}

console.log(`\nDone — ${deleted} duplicate candidate_evidence rows removed.`);
