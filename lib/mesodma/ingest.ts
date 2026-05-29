import OpenAI from "openai";
import Parser from "rss-parser";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type {
  MesodmaSource,
  RawRssItem,
  ExtractionResult,
  ItemIngestOutcome,
  SourceIngestResult,
  IngestReport,
} from "./types";

// ── Configuration ─────────────────────────────────────────────────────────────

const EXTRACTION_MODEL = "gpt-4o-mini";

const EXTRACTION_SYSTEM_PROMPT =
  "You are an extraction engine only. Do not interpret, score, or analyze. " +
  "Extract what is explicitly present in the text. Do not infer doctrine, " +
  "structural relevance, second-order effects, or impact. Do not recommend " +
  "categories with certainty — only guess. Return JSON only.";

const VALID_CATEGORIES = [
  "ai_infrastructure",
  "labor_displacement",
  "capital_allocation",
  "regulatory_posture",
  "institutional_adaptation",
  "human_differentiation",
  "knowledge_compression",
  "systemic_fragility",
] as const;

// ── Clients ───────────────────────────────────────────────────────────────────

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  if (!key) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { persistSession: false } });
}

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) throw new Error("Missing OPENAI_API_KEY");
  return new OpenAI();
}

// ── Fetch active RSS sources ──────────────────────────────────────────────────

async function fetchActiveSources(
  supabase: SupabaseClient<any>
): Promise<MesodmaSource[]> {
  const { data, error } = await supabase
    .from("sources")
    .select("id, slug, category, source_type, endpoint_url, fetch_interval, metadata")
    .eq("is_active", true)
    .eq("source_type", "rss")
    .not("endpoint_url", "is", null);

  if (error) throw new Error(`Failed to fetch sources: ${error.message}`);
  return (data ?? []) as MesodmaSource[];
}

// ── Fetch existing external_ids for a source (dedup check) ───────────────────

async function fetchExistingExternalIds(
  supabase: SupabaseClient<any>,
  sourceId: string
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("raw_items")
    .select("external_id")
    .eq("source_id", sourceId)
    .not("external_id", "is", null);

  if (error) throw new Error(`Failed to fetch existing items: ${error.message}`);
  return new Set((data ?? []).map((r: { external_id: string }) => r.external_id));
}

// ── Parse RSS feed ────────────────────────────────────────────────────────────

const rssParser = new Parser({
  timeout: 10_000,
  headers: { "User-Agent": "Mesodma/1.0 (Cognitive Empire signal ingestion)" },
});

async function fetchRssFeed(url: string): Promise<RawRssItem[]> {
  const feed = await rssParser.parseURL(url);

  return (feed.items ?? []).map((item) => ({
    title:        item.title?.trim() ?? "(no title)",
    body:         item.content ?? item.contentSnippet ?? item.summary ?? null,
    url:          item.link ?? null,
    author:       item.creator ?? item.author ?? null,
    published_at: item.isoDate ?? item.pubDate ?? null,
    external_id:  item.guid ?? item.id ?? item.link ?? null,
  }));
}

// ── Extraction via gpt-4o-mini (structured output) ───────────────────────────

const EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    clean_title: {
      type: "string",
      description: "Cleaned, normalized version of the article title.",
    },
    clean_summary: {
      type: "string",
      description: "2-3 sentence factual summary. No interpretation.",
    },
    entities: {
      type: "object",
      properties: {
        people:        { type: "array", items: { type: "string" } },
        organizations: { type: "array", items: { type: "string" } },
        technologies:  { type: "array", items: { type: "string" } },
        locations:     { type: "array", items: { type: "string" } },
        dates:         { type: "array", items: { type: "string" } },
        numbers:       { type: "array", items: { type: "string" } },
      },
      required: ["people", "organizations", "technologies", "locations", "dates", "numbers"],
      additionalProperties: false,
    },
    source_claims: {
      type: "array",
      items: { type: "string" },
      description: "Explicit claims made in the source text. Verbatim or close paraphrase only.",
    },
    possible_category: {
      type: "string",
      enum: VALID_CATEGORIES,
      description: "Best-guess category from the allowed list. Not authoritative.",
    },
    extraction_confidence: {
      type: "number",
      description: "0.0–1.0. How complete and clear the extraction is given the available text.",
    },
    missing_information: {
      type: "array",
      items: { type: "string" },
      description: "What was unclear, redacted, paywalled, or absent from the source text.",
    },
  },
  required: [
    "clean_title",
    "clean_summary",
    "entities",
    "source_claims",
    "possible_category",
    "extraction_confidence",
    "missing_information",
  ],
  additionalProperties: false,
} as const;

async function runExtraction(
  openai: OpenAI,
  item: RawRssItem
): Promise<ExtractionResult> {
  const userContent =
    `Title: ${item.title}\n\n` +
    (item.body ? `Content: ${item.body.slice(0, 4000)}` : "(no body provided)");

  const response = await openai.chat.completions.create({
    model: EXTRACTION_MODEL,
    temperature: 0,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "extraction_result",
        strict: true,
        schema: EXTRACTION_SCHEMA,
      },
    },
    messages: [
      { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
      { role: "user",   content: userContent },
    ],
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error("gpt-4o-mini returned empty content");

  const parsed = JSON.parse(raw) as ExtractionResult;

  // Clamp confidence to valid range in case the model drifts
  parsed.extraction_confidence = Math.min(1, Math.max(0, parsed.extraction_confidence ?? 0));

  return parsed;
}

// ── Write one raw_item row ────────────────────────────────────────────────────

async function writeRawItem(
  supabase: SupabaseClient<any>,
  sourceId: string,
  item: RawRssItem,
  extraction: ExtractionResult
): Promise<void> {
  const { error } = await supabase.from("raw_items").insert({
    source_id:        sourceId,
    external_id:      item.external_id,
    title:            item.title,
    body:             item.body,
    url:              item.url,
    author:           item.author,
    published_at:     item.published_at,
    status:           "extracted",
    extraction_model: EXTRACTION_MODEL,
    extracted_fields: extraction,
  });

  if (error) throw new Error(`DB insert failed: ${error.message}`);
}

async function writeErrorItem(
  supabase: SupabaseClient<any>,
  sourceId: string,
  item: RawRssItem,
  errorMessage: string
): Promise<void> {
  await supabase.from("raw_items").insert({
    source_id:     sourceId,
    external_id:   item.external_id,
    title:         item.title,
    body:          item.body,
    url:           item.url,
    author:        item.author,
    published_at:  item.published_at,
    status:        "error",
    error_message: errorMessage,
  }).then(({ error }) => {
    if (error) console.error("[mesodma] error writing error row:", error.message);
  });
}

// ── Ingest one source ─────────────────────────────────────────────────────────

async function ingestSource(
  supabase: SupabaseClient<any>,
  openai: OpenAI,
  source: MesodmaSource
): Promise<SourceIngestResult> {
  const result: SourceIngestResult = {
    source_id:       source.id,
    slug:            source.slug,
    items_fetched:   0,
    items_extracted: 0,
    items_skipped:   0,
    items_errored:   0,
  };

  let feedItems: RawRssItem[];
  try {
    feedItems = await fetchRssFeed(source.endpoint_url);
    result.items_fetched = feedItems.length;
  } catch (err) {
    result.fetch_error = err instanceof Error ? err.message : String(err);
    console.error(`[mesodma] feed fetch failed for ${source.slug}:`, result.fetch_error);
    return result;
  }

  let existingIds: Set<string>;
  try {
    existingIds = await fetchExistingExternalIds(supabase, source.id);
  } catch (err) {
    result.fetch_error = err instanceof Error ? err.message : String(err);
    console.error(`[mesodma] dedup check failed for ${source.slug}:`, result.fetch_error);
    return result;
  }

  for (const item of feedItems) {
    const outcome = await processItem(supabase, openai, source.id, item, existingIds);

    if (outcome.status === "extracted") result.items_extracted++;
    else if (outcome.status === "skipped") result.items_skipped++;
    else result.items_errored++;
  }

  await supabase
    .from("sources")
    .update({ last_fetched_at: new Date().toISOString() })
    .eq("id", source.id)
    .then(({ error }) => {
      if (error) console.error(`[mesodma] failed to stamp last_fetched_at for ${source.slug}`);
    });

  return result;
}

async function processItem(
  supabase: SupabaseClient<any>,
  openai: OpenAI,
  sourceId: string,
  item: RawRssItem,
  existingIds: Set<string>
): Promise<ItemIngestOutcome> {
  if (item.external_id && existingIds.has(item.external_id)) {
    return { status: "skipped", external_id: item.external_id };
  }

  try {
    const extraction = await runExtraction(openai, item);
    await writeRawItem(supabase, sourceId, item, extraction);
    if (item.external_id) existingIds.add(item.external_id);
    return { status: "extracted", external_id: item.external_id };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[mesodma] item error (${item.external_id ?? item.url}):`, message);
    await writeErrorItem(supabase, sourceId, item, message);
    return { status: "error", external_id: item.external_id, error: message };
  }
}

// ── Public entry point ────────────────────────────────────────────────────────

export async function runMesodmaIngest(): Promise<IngestReport> {
  const started_at = new Date().toISOString();

  const supabase = getSupabaseClient();
  const openai = getOpenAIClient();

  let sources: MesodmaSource[] = [];
  try {
    sources = await fetchActiveSources(supabase);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[mesodma] failed to load sources:", message);
    return {
      started_at,
      completed_at: new Date().toISOString(),
      sources_processed: 0,
      total_extracted: 0,
      total_skipped: 0,
      total_errored: 0,
      sources: [],
    };
  }

  const sourceResults: SourceIngestResult[] = [];

  for (const source of sources) {
    console.log(`[mesodma] ingesting ${source.slug} (${source.endpoint_url})`);
    const result = await ingestSource(supabase, openai, source);
    sourceResults.push(result);
    console.log(
      `[mesodma] ${source.slug}: ${result.items_extracted} extracted, ` +
      `${result.items_skipped} skipped, ${result.items_errored} errored`
    );
  }

  return {
    started_at,
    completed_at: new Date().toISOString(),
    sources_processed: sourceResults.length,
    total_extracted:   sourceResults.reduce((n, r) => n + r.items_extracted, 0),
    total_skipped:     sourceResults.reduce((n, r) => n + r.items_skipped, 0),
    total_errored:     sourceResults.reduce((n, r) => n + r.items_errored, 0),
    sources: sourceResults,
  };
}
