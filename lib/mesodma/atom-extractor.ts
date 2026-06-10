// Mesodma V2 — factual atom extraction engine.
// Writes to factual_atoms + mesodma_batch_runs.
// Reads raw_items with ingestion_status = 'ready_for_mesodma'.
// Mesodma boundary: extraction only. No interpretation, no scoring.

import OpenAI from "openai";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { buildAtomExtractionPrompt } from "./prompts";
import type {
  DoctrineContext,
  AtomExtractionOutput,
  AtomBatchReport,
  StructuralInvariant,
  FalseSignalPattern,
} from "./v2-types";

// ── Config ─────────────────────────────────────────────────────────────────────

const ATOM_MODEL          = "gpt-4o-mini";
const PROMPT_VERSION      = "v2.0";
const BATCH_SIZE          = 5;   // Vercel Hobby 10s wall — n8n calls repeatedly to drain queue
const ITEM_TIMEOUT_MS     = 7_000;

const VALID_EVIDENCE_TYPES = new Set([
  "announcement", "data", "policy", "research",
  "deployment", "incident", "financial",
]);

const VALID_DISTRIBUTION_STAGES = new Set([
  "origin", "early", "wave", "saturated",
]);

// source_tier → source_weight for evidence mass formula
const TIER_WEIGHT: Record<string, number> = {
  tier_1_primary:    1.5,
  tier_2_technical:  1.3,
  tier_3_media:      1.0,
  tier_4_noise_prone: 0.6,
};

// ── Supabase / OpenAI helpers ──────────────────────────────────────────────────

function sb(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

function oai(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// ── JSON schema for structured output (gpt-4o-mini strict mode) ───────────────

const NUMBER_ITEM_SCHEMA = {
  type: "object" as const,
  properties: {
    value:   { type: "string" as const },
    unit:    { type: "string" as const },
    context: { type: "string" as const },
  },
  required: ["value", "unit", "context"],
  additionalProperties: false,
};

const ATOM_JSON_SCHEMA = {
  type: "object" as const,
  properties: {
    status:                    { type: "string" as const, enum: ["atom", "noise"] as const },
    atom_summary:              { type: "string" as const },
    who:                       { type: "string" as const },
    what_changed:              { type: "string" as const },
    when_date:                 { type: "string" as const },
    where_location:            { type: "string" as const },
    why_if_stated:             { type: "string" as const },
    how_if_stated:             { type: "string" as const },
    system_affected:           { type: "string" as const },
    entities:                  { type: "array" as const, items: { type: "string" as const } },
    companies:                 { type: "array" as const, items: { type: "string" as const } },
    countries:                 { type: "array" as const, items: { type: "string" as const } },
    technologies:              { type: "array" as const, items: { type: "string" as const } },
    numbers:                   { type: "array" as const, items: NUMBER_ITEM_SCHEMA },
    evidence_type:             { type: "string" as const },
    source_claim:              { type: "string" as const },
    possible_invariant_codes:  { type: "array" as const, items: { type: "string" as const } },
    possible_vector_slugs:     { type: "array" as const, items: { type: "string" as const } },
    duplicate_risk:            { type: "number" as const },
    distribution_stage:        { type: "string" as const },
    false_signal_risk:         { type: "number" as const },
    extraction_confidence:     { type: "number" as const },
  },
  required: [
    "status", "atom_summary", "who", "what_changed", "when_date",
    "where_location", "why_if_stated", "how_if_stated", "system_affected",
    "entities", "companies", "countries", "technologies", "numbers",
    "evidence_type", "source_claim", "possible_invariant_codes",
    "possible_vector_slugs", "duplicate_risk", "distribution_stage",
    "false_signal_risk", "extraction_confidence",
  ],
  additionalProperties: false,
};

// ── Doctrine context loader ────────────────────────────────────────────────────

export async function loadDoctrineContext(client: SupabaseClient): Promise<DoctrineContext> {
  const [invariantsRes, patternsRes, versionRes] = await Promise.all([
    client
      .from("structural_invariants")
      .select("id, code, name, statement, function_note, display_order, active")
      .eq("active", true)
      .order("display_order"),
    client
      .from("false_signal_patterns")
      .select("id, name, description, indicators, active")
      .eq("active", true),
    client
      .from("doctrine_versions")
      .select("version")
      .eq("active", true)
      .single(),
  ]);

  if (invariantsRes.error) throw new Error(`Invariants load failed: ${invariantsRes.error.message} (code: ${invariantsRes.error.code})`);
  if (patternsRes.error)   throw new Error(`Patterns load failed: ${patternsRes.error.message} (code: ${patternsRes.error.code})`);

  // Hard guard: a batch with zero invariants must never proceed — items would be classified
  // with no doctrine lens and produce useless noise atoms that waste raw_item budget.
  const invariants = (invariantsRes.data ?? []) as StructuralInvariant[];
  if (invariants.length === 0) {
    throw new Error(
      "Doctrine context empty: structural_invariants returned 0 active rows. " +
      "Verify migrations ran and active=true is set on all 14 rows."
    );
  }

  const falseSignalPatterns = (patternsRes.data ?? []) as FalseSignalPattern[];

  if (versionRes.error && versionRes.error.code !== "PGRST116") {
    // PGRST116 = "JSON object requested, multiple (or no) rows returned" — acceptable if table
    // was not yet seeded. Any other error is unexpected and logged loudly.
    console.error("[loadDoctrineContext] doctrine_versions query error:", versionRes.error.message, versionRes.error.code);
  }
  const doctrineVersion = (versionRes.data as { version?: string } | null)?.version ?? "unknown";

  console.log(
    `[loadDoctrineContext] loaded: ${invariants.length} invariants, ` +
    `${falseSignalPatterns.length} patterns, doctrine=${doctrineVersion}`
  );

  const invariantMap = new Map<string, number>(invariants.map((i) => [i.code, i.id]));

  return { invariants, falseSignalPatterns, doctrineVersion, invariantMap };
}

// ── Extract one atom ───────────────────────────────────────────────────────────

async function extractAtom(
  openai: OpenAI,
  systemPrompt: string,
  item: { title: string; body: string | null }
): Promise<AtomExtractionOutput> {
  const userContent =
    `Title: ${item.title}\n\n` +
    (item.body ? `Content: ${item.body.slice(0, 3500)}` : "(no body)");

  const response = await openai.chat.completions.create({
    model: ATOM_MODEL,
    temperature: 0,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "atom_extraction",
        strict: true,
        schema: ATOM_JSON_SCHEMA,
      },
    },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user",   content: userContent },
    ],
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error("Model returned empty content");

  const parsed = JSON.parse(raw) as AtomExtractionOutput;
  parsed.extraction_confidence = Math.min(1, Math.max(0, parsed.extraction_confidence ?? 0));
  parsed.false_signal_risk     = Math.min(1, Math.max(0, parsed.false_signal_risk ?? 0));
  parsed.duplicate_risk        = Math.min(1, Math.max(0, parsed.duplicate_risk ?? 0));

  // Enforce max-3 invariant codes
  if (parsed.possible_invariant_codes.length > 3) {
    parsed.possible_invariant_codes = parsed.possible_invariant_codes.slice(0, 3);
  }

  return parsed;
}

// ── Resolve codes/slugs to DB IDs ─────────────────────────────────────────────

function resolveInvariantIds(codes: string[], invariantMap: Map<string, number>): number[] {
  return codes.map((c) => invariantMap.get(c)).filter((id): id is number => id !== undefined);
}

async function resolveVectorIds(
  slugs: string[],
  client: SupabaseClient
): Promise<string[]> {
  if (slugs.length === 0) return [];
  const { data } = await client
    .from("pressure_vectors")
    .select("id, slug")
    .in("slug", slugs)
    .eq("is_active", true);
  return (data ?? []).map((r: { id: string }) => r.id);
}

// ── Write factual_atom row ─────────────────────────────────────────────────────

function nullify(s: string): string | null {
  return s.trim() === "" ? null : s.trim();
}

function toDate(s: string): string | null {
  if (!s || s.trim() === "") return null;
  // Validate YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s.trim())) return s.trim();
  return null;
}

async function writeAtom(
  client: SupabaseClient,
  rawItem: { id: string; source_id: string; source_tier: string | null },
  output: AtomExtractionOutput,
  invariantIds: number[],
  vectorIds: string[],
  runId: number,
  doctrineVersion: string
): Promise<void> {
  const sourceWeight = TIER_WEIGHT[rawItem.source_tier ?? ""] ?? 1.0;
  const isNoise = output.status === "noise";

  const row = {
    raw_item_id:              rawItem.id,
    source_id:                rawItem.source_id,
    mesodma_run_id:           runId,
    atom_summary:             isNoise ? "(noise)" : (output.atom_summary || "(empty)"),
    who:                      isNoise ? null : nullify(output.who),
    what_changed:             isNoise ? null : nullify(output.what_changed),
    when_date:                isNoise ? null : toDate(output.when_date),
    where_location:           isNoise ? null : nullify(output.where_location),
    why_if_stated:            isNoise ? null : nullify(output.why_if_stated),
    how_if_stated:            isNoise ? null : nullify(output.how_if_stated),
    system_affected:          isNoise ? null : nullify(output.system_affected),
    entities:                 isNoise ? [] : output.entities,
    companies:                isNoise ? [] : output.companies,
    countries:                isNoise ? [] : output.countries,
    technologies:             isNoise ? [] : output.technologies,
    numbers:                  isNoise ? [] : output.numbers,
    evidence_type:            isNoise ? null : (VALID_EVIDENCE_TYPES.has(output.evidence_type) ? output.evidence_type : null),
    source_claim:             isNoise ? null : nullify(output.source_claim),
    source_weight:            sourceWeight,
    possible_invariant_ids:   isNoise ? [] : invariantIds,
    possible_vector_ids:      isNoise ? [] : vectorIds,
    duplicate_risk:           isNoise ? 0 : output.duplicate_risk,
    distribution_stage:       isNoise ? null : (VALID_DISTRIBUTION_STAGES.has(output.distribution_stage) ? output.distribution_stage : null),
    false_signal_risk:        isNoise ? 0 : output.false_signal_risk,
    extraction_confidence:    isNoise ? null : output.extraction_confidence,
    extracted_by_model:       ATOM_MODEL,
    extraction_prompt_version: PROMPT_VERSION,
    doctrine_version:         doctrineVersion,
    status:                   isNoise ? "noise" : "atom",
  };

  const { error } = await client.from("factual_atoms").insert(row);
  if (error) throw new Error(`Insert atom: ${error.message}`);
}

// ── Main batch entry point ─────────────────────────────────────────────────────

export async function runAtomBatch(): Promise<AtomBatchReport> {
  const started_at = new Date().toISOString();
  const client = sb();
  const openai  = oai();

  // Load doctrine context
  let ctx: DoctrineContext;
  try {
    ctx = await loadDoctrineContext(client);
  } catch (err) {
    console.error("[atom-extractor] doctrine context load failed:", err);
    return {
      started_at,
      completed_at: new Date().toISOString(),
      run_id: null,
      input_count: 0,
      output_count: 0,
      noise_count: 0,
      error_count: 1,
      doctrine_version: "unknown",
    };
  }

  const systemPrompt = buildAtomExtractionPrompt(
    ctx.invariants,
    ctx.falseSignalPatterns,
    ctx.doctrineVersion
  );

  // Open a batch run row
  const { data: runRow, error: runErr } = await client
    .from("mesodma_batch_runs")
    .insert({
      model_used:       ATOM_MODEL,
      prompt_version:   PROMPT_VERSION,
      doctrine_version: ctx.doctrineVersion,
      status:           "running",
    })
    .select("id")
    .single();

  if (runErr || !runRow) {
    console.error("[atom-extractor] failed to open batch run:", runErr?.message);
    return {
      started_at,
      completed_at: new Date().toISOString(),
      run_id: null,
      input_count: 0,
      output_count: 0,
      noise_count: 0,
      error_count: 1,
      doctrine_version: ctx.doctrineVersion,
    };
  }

  const runId: number = runRow.id;

  // Load ready items
  const { data: rawItems, error: fetchErr } = await client
    .from("raw_items")
    .select("id, title, body, source_id, sources(source_tier)")
    .eq("ingestion_status", "ready_for_mesodma")
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (fetchErr) {
    await client.from("mesodma_batch_runs").update({ status: "failed", completed_at: new Date().toISOString() }).eq("id", runId);
    return {
      started_at,
      completed_at: new Date().toISOString(),
      run_id: runId,
      input_count: 0,
      output_count: 0,
      noise_count: 0,
      error_count: 1,
      doctrine_version: ctx.doctrineVersion,
    };
  }

  const items = (rawItems ?? []) as unknown as Array<{
    id: string;
    title: string;
    body: string | null;
    source_id: string;
    sources: { source_tier: string | null } | null;
  }>;

  let outputCount = 0;
  let noiseCount  = 0;
  let errorCount  = 0;
  const failedItems: Array<{ id: string; error: string }> = [];

  // Process all items with individual timeout guards
  await Promise.allSettled(
    items.map(async (item) => {
      const abort = new AbortController();
      const timer = setTimeout(() => abort.abort(), ITEM_TIMEOUT_MS);

      try {
        const output = await Promise.race([
          extractAtom(openai, systemPrompt, item),
          new Promise<never>((_, reject) =>
            abort.signal.addEventListener("abort", () =>
              reject(new Error(`Item ${item.id} timed out after ${ITEM_TIMEOUT_MS}ms`))
            )
          ),
        ]);

        const invariantIds = resolveInvariantIds(output.possible_invariant_codes, ctx.invariantMap);
        const vectorIds    = await resolveVectorIds(output.possible_vector_slugs, client);

        await writeAtom(
          client,
          { id: item.id, source_id: item.source_id, source_tier: item.sources?.source_tier ?? null },
          output,
          invariantIds,
          vectorIds,
          runId,
          ctx.doctrineVersion
        );

        if (output.status === "noise") noiseCount++;
        else outputCount++;

        // Mark raw_item processed
        await client
          .from("raw_items")
          .update({ ingestion_status: "mesodma_processed" })
          .eq("id", item.id);

      } catch (err) {
        errorCount++;
        const msg = err instanceof Error ? err.message : String(err);
        failedItems.push({ id: item.id, error: msg });
        console.error(`[atom-extractor] item ${item.id} failed:`, msg);
      } finally {
        clearTimeout(timer);
      }
    })
  );

  const finalStatus = errorCount > 0 && outputCount + noiseCount === 0
    ? "failed"
    : errorCount > 0
    ? "completed_with_errors"
    : "completed";

  await client.from("mesodma_batch_runs").update({
    input_count:  items.length,
    output_count: outputCount,
    noise_count:  noiseCount,
    error_count:  errorCount,
    failed_items: failedItems,
    status:       finalStatus,
    completed_at: new Date().toISOString(),
  }).eq("id", runId);

  return {
    started_at,
    completed_at: new Date().toISOString(),
    run_id: runId,
    input_count:     items.length,
    output_count:    outputCount,
    noise_count:     noiseCount,
    error_count:     errorCount,
    doctrine_version: ctx.doctrineVersion,
  };
}
