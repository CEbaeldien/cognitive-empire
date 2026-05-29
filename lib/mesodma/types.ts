// Internal types for the Mesodma ingestion service.
// Mesodma boundary: fetch → extract → write raw_items. Nothing beyond.

export type MesodmaSource = {
  id: string;
  slug: string;
  category: string;
  source_type: string;
  endpoint_url: string;
  fetch_interval: number;
  metadata: Record<string, unknown>;
};

export type RawRssItem = {
  title: string;
  body: string | null;
  url: string | null;
  author: string | null;
  published_at: string | null;
  external_id: string | null;
};

export type ExtractionEntities = {
  people: string[];
  organizations: string[];
  technologies: string[];
  locations: string[];
  dates: string[];
  numbers: string[];
};

export type ExtractionResult = {
  clean_title: string;
  clean_summary: string;           // 2-3 sentences, factual only
  entities: ExtractionEntities;
  source_claims: string[];         // explicit claims made in the source text
  possible_category: string;       // best-guess SignalCategory value — not authoritative
  extraction_confidence: number;   // 0.0–1.0, how complete the extraction is
  missing_information: string[];   // what was unclear, redacted, or absent
};

export type ItemIngestOutcome =
  | { status: "extracted"; external_id: string | null }
  | { status: "skipped";   external_id: string | null }
  | { status: "error";     external_id: string | null; error: string };

export type SourceIngestResult = {
  source_id: string;
  slug: string;
  items_fetched: number;
  items_extracted: number;
  items_skipped: number;
  items_errored: number;
  fetch_error?: string;
};

export type IngestReport = {
  started_at: string;
  completed_at: string;
  sources_processed: number;
  total_extracted: number;
  total_skipped: number;
  total_errored: number;
  sources: SourceIngestResult[];
};
