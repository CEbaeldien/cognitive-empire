// CE Signals V1 — TypeScript types
// Updated to reflect post-migration schema.
// Usage: createClient<SignalsDatabase>(url, key)

// ============================================================
// ENUMS
// ============================================================

export type SignalCategory =
  | "intelligence"
  | "physical_systems"
  | "infrastructure"
  | "energy"
  | "science_frontier"
  | "governance_stability"
  | "markets_human_prosperity"
  | "resources_continuity";

export type SourceType = "rss" | "api" | "scrape" | "manual";

export type RawItemStatus = "pending" | "extracted" | "skipped" | "error";

export type SignalStatus =
  | "draft"
  | "in_review"
  | "watching"
  | "decaying"
  | "approved"
  | "published"
  | "rejected"
  | "archived";

export type ReviewAction =
  | "approve"
  | "reject"
  | "request_revision"
  | "escalate";

export type LawId =
  | "intelligence_abundance"
  | "bottleneck_migration"
  | "responsibility_migration"
  | "output_inflation"
  | "decision_half_life"
  | "escalation_preservation"
  | "optimization_fragility"
  | "human_differentiation";

export type TemporalClass = "fast_moving" | "slow_burn" | "classifier";

export type ConvergenceStatus =
  | "candidate"
  | "confirmed"
  | "watching"
  | "approved"
  | "decaying"
  | "published"
  | "dismissed";

// ============================================================
// TABLE: sources
// ============================================================

export type SourceRow = {
  id: string;
  name: string;
  slug: string;
  category: SignalCategory;
  source_type: SourceType;
  endpoint_url: string | null;
  auth_config: Record<string, unknown>;
  fetch_interval: number;
  is_active: boolean;
  last_fetched_at: string | null;
  metadata: Record<string, unknown>;
  trust_tier: number | null;
  subcategory: string | null;
  ingestion_mode: string | null;
  ingestion_status: string | null;
  use_case: string | null;
  priority: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type SourceInsert = Omit<SourceRow, "id" | "created_at" | "updated_at"> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type SourceUpdate = Partial<SourceInsert>;

// ============================================================
// TABLE: raw_items
// ============================================================

export type RawItemRow = {
  id: string;
  source_id: string;
  external_id: string | null;
  title: string;
  body: string | null;
  url: string | null;
  author: string | null;
  published_at: string | null;
  fetched_at: string;
  status: RawItemStatus;
  extraction_model: string | null;
  extracted_fields: Record<string, unknown>;
  extracted_numbers: Record<string, unknown>;
  error_message: string | null;
  enrichment_status: string | null;
  signal_processing_status: string | null;
  ingestion_status: string | null;
  created_at: string;
};

export type RawItemInsert = Omit<RawItemRow, "id" | "fetched_at" | "created_at"> & {
  id?: string;
  fetched_at?: string;
  created_at?: string;
};

export type RawItemUpdate = Partial<RawItemInsert>;

// ============================================================
// TABLE: signal_laws
// ============================================================

export type SignalLawRow = {
  id: LawId;
  name: string;
  short_desc: string;
  full_desc: string | null;
  temporal_class: TemporalClass;
  display_order: number;
  is_active: boolean;
  created_at: string;
};

// signal_laws is a static seed table — no insert/update types exposed.

// ============================================================
// TABLE: signals
// ============================================================

export type SignalRow = {
  id: string;
  raw_item_id: string | null;
  category: SignalCategory;
  subcategory: string | null;
  title: string;
  summary: string;
  implication: string;
  what_changed: string | null;
  why_it_matters: string | null;
  structural_relevance: string | null;
  second_order_effect: string | null;
  decay_factor: number | null;
  impact_layer: string | null;
  status: SignalStatus;
  is_featured: boolean;
  published_at: string | null;
  expires_at: string | null;
  authored_by: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  revision_notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type SignalInsert = Omit<SignalRow, "id" | "created_at" | "updated_at"> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type SignalUpdate = Partial<SignalInsert>;

// ============================================================
// TABLE: signal_scores
// One row per signal (UNIQUE on signal_id).
// final_score is GENERATED ALWAYS AS in Postgres — never written by the client.
// ============================================================

export type SignalScoreRow = {
  id: string;
  signal_id: string;
  strength: number;
  weight: number;
  longevity: number;
  convergence_potential: number;
  decay_factor: number;
  governance_impact: number;
  continuity_pressure: number;
  prosperity_relevance: number;
  structural_relevance: number;
  confidence: number;
  final_score: number; // generated column
  scored_by: string | null;
  scored_at: string;
  scoring_notes: string | null;
};

export type SignalScoreInsert = Omit<
  SignalScoreRow,
  "id" | "final_score" | "scored_at"
> & {
  id?: string;
  scored_at?: string;
};

export type SignalScoreUpdate = Partial<SignalScoreInsert>;

// ============================================================
// TABLE: convergences
// ============================================================

export type ConvergenceRow = {
  id: string;
  title: string;
  summary: string;
  law_id: LawId;
  status: ConvergenceStatus;
  convergence_score: number | null;
  is_dominant: boolean;
  published_at: string | null;
  authored_by: string | null;
  reviewed_by: string | null;
  what_changed: string | null;
  second_order_implications: string | null;
  impact_layer: string | null;
  subcategories: string[] | null;
  decay_factor: number | null;
  created_at: string;
  updated_at: string;
};

export type ConvergenceInsert = Omit<
  ConvergenceRow,
  "id" | "created_at" | "updated_at"
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type ConvergenceUpdate = Partial<ConvergenceInsert>;

// ============================================================
// TABLE: convergence_signals  (junction)
// ============================================================

export type ConvergenceSignalRow = {
  convergence_id: string;
  signal_id: string;
  added_at: string;
};

export type ConvergenceSignalInsert = Omit<ConvergenceSignalRow, "added_at"> & {
  added_at?: string;
};

export type ConvergenceSignalUpdate = Partial<ConvergenceSignalInsert>;

// ============================================================
// TABLE: review_queue
// ============================================================

export type ReviewQueueRow = {
  id: string;
  entity_type: "signal" | "convergence";
  entity_id: string;
  submitted_by: string | null;
  submitted_at: string;
  assigned_to: string | null;
  action_taken: ReviewAction | null;
  action_at: string | null;
  action_by: string | null;
  notes: string | null;
  is_resolved: boolean;
  priority: number;
  created_at: string;
};

export type ReviewQueueInsert = Omit<
  ReviewQueueRow,
  "id" | "submitted_at" | "created_at"
> & {
  id?: string;
  submitted_at?: string;
  created_at?: string;
};

export type ReviewQueueUpdate = Partial<ReviewQueueInsert>;

// ============================================================
// TABLE: pressure_vectors
// ============================================================

export type PressureVectorRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type PressureVectorInsert = Omit<
  PressureVectorRow,
  "id" | "created_at" | "updated_at"
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type PressureVectorUpdate = Partial<PressureVectorInsert>;

// ============================================================
// TABLE: signal_pressure_vectors  (junction)
// ============================================================

export type SignalPressureVectorRow = {
  signal_id: string;
  vector_id: string;
  tagged_by: string | null;
  tagged_at: string;
};

export type SignalPressureVectorInsert = Omit<
  SignalPressureVectorRow,
  "tagged_at"
> & {
  tagged_at?: string;
};

export type SignalPressureVectorUpdate = Partial<SignalPressureVectorInsert>;

// ============================================================
// TABLE: doctrine_vectors
// ============================================================

export type DoctrineVectorRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type DoctrineVectorInsert = Omit<
  DoctrineVectorRow,
  "id" | "created_at" | "updated_at"
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type DoctrineVectorUpdate = Partial<DoctrineVectorInsert>;

// ============================================================
// TABLE: signal_doctrine_vectors  (junction)
// ============================================================

export type SignalDoctrineVectorRow = {
  signal_id: string;
  doctrine_vector_id: string;
  tagged_by: string | null;
  tagged_at: string;
};

export type SignalDoctrineVectorInsert = Omit<
  SignalDoctrineVectorRow,
  "tagged_at"
> & {
  tagged_at?: string;
};

export type SignalDoctrineVectorUpdate = Partial<SignalDoctrineVectorInsert>;

// ============================================================
// TABLE: convergence_doctrine_vectors  (junction)
// ============================================================

export type ConvergenceDoctrineVectorRow = {
  convergence_id: string;
  doctrine_vector_id: string;
  tagged_by: string | null;
  tagged_at: string;
};

export type ConvergenceDoctrineVectorInsert = Omit<
  ConvergenceDoctrineVectorRow,
  "tagged_at"
> & {
  tagged_at?: string;
};

export type ConvergenceDoctrineVectorUpdate = Partial<ConvergenceDoctrineVectorInsert>;

// ============================================================
// DATABASE TYPE — for typed Supabase client
// Usage: createClient<SignalsDatabase>(url, key)
// ============================================================

export type SignalsDatabase = {
  public: {
    Tables: {
      sources: {
        Row: SourceRow;
        Insert: SourceInsert;
        Update: SourceUpdate;
      };
      raw_items: {
        Row: RawItemRow;
        Insert: RawItemInsert;
        Update: RawItemUpdate;
      };
      signal_laws: {
        Row: SignalLawRow;
        Insert: never;
        Update: never;
      };
      signals: {
        Row: SignalRow;
        Insert: SignalInsert;
        Update: SignalUpdate;
      };
      signal_scores: {
        Row: SignalScoreRow;
        Insert: SignalScoreInsert;
        Update: SignalScoreUpdate;
      };
      convergences: {
        Row: ConvergenceRow;
        Insert: ConvergenceInsert;
        Update: ConvergenceUpdate;
      };
      convergence_signals: {
        Row: ConvergenceSignalRow;
        Insert: ConvergenceSignalInsert;
        Update: ConvergenceSignalUpdate;
      };
      review_queue: {
        Row: ReviewQueueRow;
        Insert: ReviewQueueInsert;
        Update: ReviewQueueUpdate;
      };
      pressure_vectors: {
        Row: PressureVectorRow;
        Insert: PressureVectorInsert;
        Update: PressureVectorUpdate;
      };
      signal_pressure_vectors: {
        Row: SignalPressureVectorRow;
        Insert: SignalPressureVectorInsert;
        Update: SignalPressureVectorUpdate;
      };
      doctrine_vectors: {
        Row: DoctrineVectorRow;
        Insert: DoctrineVectorInsert;
        Update: DoctrineVectorUpdate;
      };
      signal_doctrine_vectors: {
        Row: SignalDoctrineVectorRow;
        Insert: SignalDoctrineVectorInsert;
        Update: SignalDoctrineVectorUpdate;
      };
      convergence_doctrine_vectors: {
        Row: ConvergenceDoctrineVectorRow;
        Insert: ConvergenceDoctrineVectorInsert;
        Update: ConvergenceDoctrineVectorUpdate;
      };
    };
    Enums: {
      signal_category: SignalCategory;
      source_type: SourceType;
      raw_item_status: RawItemStatus;
      signal_status: SignalStatus;
      review_action: ReviewAction;
      law_id: LawId;
      temporal_class: TemporalClass;
      convergence_status: ConvergenceStatus;
    };
  };
};
