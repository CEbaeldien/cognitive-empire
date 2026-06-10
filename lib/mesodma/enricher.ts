// Mesodma V2 — full-text body enrichment for raw_items.
// Fetches article URLs and extracts main text before atom extraction runs.
// Operates on: ingestion_status='ready_for_mesodma' AND enrichment_status IS NULL AND url IS NOT NULL
// Sets enrichment_status to 'body_enriched' | 'body_skipped' | 'body_failed'.
// Never throws — all item errors are caught and reported. Failures are visible in the report.

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { EnrichReport } from "./v2-types";

// ── Config ─────────────────────────────────────────────────────────────────────

const ENRICH_BATCH_SIZE  = 3;      // 3 fetches × 2.5s timeout ≈ 7.5s max; fits Vercel Hobby 10s wall
const FETCH_TIMEOUT_MS   = 2_500;
const MIN_BODY_LENGTH    = 500;    // items already above this are skipped (body is already adequate)
const MAX_BODY_CHARS     = 8_000;  // cap stored body to avoid bloat

const USER_AGENT =
  "Mozilla/5.0 (compatible; CESignalsBot/2.0; +https://cognitiveempire.com)";

// ── Supabase helper ────────────────────────────────────────────────────────────

function sb(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

// ── HTML → plain text ──────────────────────────────────────────────────────────
// No external deps — pure regex. Prefers <article>/<main> blocks over full page.

function extractTextFromHtml(html: string): string {
  // Strip boilerplate blocks entirely before any text extraction
  const cleaned = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, "")
    .replace(/<nav\b[\s\S]*?<\/nav>/gi, "")
    .replace(/<header\b[\s\S]*?<\/header>/gi, "")
    .replace(/<footer\b[\s\S]*?<\/footer>/gi, "")
    .replace(/<aside\b[\s\S]*?<\/aside>/gi, "");

  // Prefer semantic content containers
  const articleMatch = cleaned.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i);
  const mainMatch    = cleaned.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  const source       = articleMatch?.[1] ?? mainMatch?.[1] ?? cleaned;

  return source
    .replace(/<[^>]+>/g, " ")          // strip remaining tags
    .replace(/&nbsp;/gi, " ")
    .replace(/&[a-z#0-9]+;/gi, "")     // strip HTML entities
    .replace(/\s+/g, " ")              // normalise whitespace
    .trim()
    .slice(0, MAX_BODY_CHARS);
}

// ── Fetch with hard timeout ────────────────────────────────────────────────────

async function fetchArticleText(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal:  controller.signal,
      headers: { "User-Agent": USER_AGENT },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("text/html")) {
      throw new Error(`non-HTML content-type: ${ct.split(";")[0].trim()}`);
    }

    const html = await res.text();
    const text = extractTextFromHtml(html);

    if (text.length < 80) {
      throw new Error(`extracted text too short after stripping (${text.length} chars)`);
    }

    return text;
  } finally {
    clearTimeout(timer);
  }
}

// ── Main enrichment pass ───────────────────────────────────────────────────────

export async function runEnrichmentPass(): Promise<EnrichReport> {
  const started_at = new Date().toISOString();
  const client     = sb();

  let items_checked  = 0;
  let items_enriched = 0;
  let items_skipped  = 0;
  let items_failed   = 0;
  const failures: EnrichReport["failures"] = [];

  // Load items: V2 lane items not yet touched by enricher that have a URL
  const { data, error } = await client
    .from("raw_items")
    .select("id, url, body, title")
    .eq("ingestion_status", "ready_for_mesodma")
    .not("url", "is", null)
    .is("enrichment_status", null)
    .limit(ENRICH_BATCH_SIZE);

  if (error) {
    return {
      started_at,
      completed_at:   new Date().toISOString(),
      items_checked:  0,
      items_enriched: 0,
      items_skipped:  0,
      items_failed:   1,
      failures:       [{ id: "query", url: "", error: error.message }],
    };
  }

  const items = (data ?? []) as Array<{
    id: string;
    url: string | null;
    body: string | null;
    title: string;
  }>;

  items_checked = items.length;

  for (const item of items) {
    // Skip if body is already long enough — no fetch needed
    if (item.body && item.body.length >= MIN_BODY_LENGTH) {
      const { error: ue } = await client
        .from("raw_items")
        .update({ enrichment_status: "body_skipped" })
        .eq("id", item.id);
      if (ue) console.error(`[enricher] skip update failed for ${item.id}:`, ue.message);
      items_skipped++;
      continue;
    }

    // Should not happen given the query filter, but guard anyway
    if (!item.url) {
      await client.from("raw_items").update({ enrichment_status: "body_skipped" }).eq("id", item.id);
      items_skipped++;
      continue;
    }

    try {
      const text = await fetchArticleText(item.url);

      const { error: ue } = await client
        .from("raw_items")
        .update({ body: text, enrichment_status: "body_enriched" })
        .eq("id", item.id);

      if (ue) throw new Error(`DB write failed: ${ue.message}`);

      items_enriched++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[enricher] item ${item.id} (${item.url}): ${message}`);

      // Mark failed so this item is not retried in the same cycle
      await client
        .from("raw_items")
        .update({ enrichment_status: "body_failed" })
        .eq("id", item.id);

      failures.push({ id: item.id, url: item.url, error: message });
      items_failed++;
      // Never rethrow — continue to next item
    }
  }

  return {
    started_at,
    completed_at: new Date().toISOString(),
    items_checked,
    items_enriched,
    items_skipped,
    items_failed,
    failures,
  };
}
