// CE Signals V1/V2 — TypeScript types
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
  // V2 columns (A5)
  raw_item_hash: string | null;
  source_snapshot_hash: string | null;
  ingestion_lane: "v1" | "v2" | null;
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
  // V2 columns (Phase D)
  cluster_id: number | null;
  invariant_id: number | null;
  birth_type: "evidence_cluster" | "legacy" | null;
  evidence_mass_at_birth: number | null;
  evidence_snapshot: Record<string, unknown> | null;
  doctrine_basis: string | null;
  governance_pressure_note: string | null;
  maintenance_gravity_note: string | null;
  continuity_note: string | null;
  physical_constraint_note: string | null;
  contradiction_note: string | null;
  lifecycle_status: "active" | "decaying" | "archived" | null;
  legacy_signal: boolean;
  created_by_run_id: number | null;
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
  // V2 columns (Phase E)
  linked_cluster_ids: number[] | null;
  dominant_invariant_ids: number[] | null;
  convergence_strength: number | null;
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
  // V2 columns (A3)
  invariant_id: number | null;
  visibility: "public" | "internal";
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
// V2 TABLES — Phase A
// ============================================================

export type StructuralInvariantRow = {
  id: number;
  code: string;
  name: string;
  statement: string;
  function_note: string | null;
  display_order: number;
  active: boolean;
  created_at: string;
};

export type DoctrineVersionRow = {
  id: number;
  version: string;
  invariant_count: number;
  vector_count: number;
  change_note: string | null;
  active: boolean;
  created_at: string;
};

// ============================================================
// V2 TABLES — Phase B
// ============================================================

// Table schema: id, name, description, indicators text[], active, created_at
// (no pattern_name/severity/detection_hint — those were a type-authoring error)
export type FalseSignalPatternRow = {
  id: number;
  name: string;
  description: string;
  indicators: string[];
  active: boolean;
  created_at: string;
};

export type FactualAtomRow = {
  id: number;
  raw_item_id: string | null;
  source_id: string | null;
  mesodma_run_id: number | null;
  atom_summary: string;
  who: string | null;
  what: string | null;
  when_occurred: string | null;
  where_occurred: string | null;
  why_stated: string | null;
  how_stated: string | null;
  entities: Record<string, unknown>;
  evidence_type: string | null;
  distribution_stage: string | null;
  possible_invariant_ids: number[] | null;
  possible_vector_ids: string[] | null;
  false_signal_risk: number;
  extraction_confidence: number | null;
  source_weight: number;
  extracted_by_model: string | null;
  doctrine_version: string | null;
  status: "atom" | "noise" | "duplicate" | "error";
  error_message: string | null;
  created_at: string;
};

export type MesodmaBatchRunRow = {
  id: number;
  model_used: string | null;
  prompt_version: string | null;
  doctrine_version: string | null;
  input_count: number;
  output_count: number;
  noise_count: number;
  duplicate_count: number;
  error_count: number;
  failed_items: Record<string, unknown>[];
  status: "running" | "completed" | "completed_with_errors" | "failed" | "cancelled";
  started_at: string;
  completed_at: string | null;
};

// ============================================================
// V2 TABLES — Phase C
// ============================================================

export type EvidenceClusterRow = {
  id: number;
  invariant_id: number;
  vector_id: string | null;
  label: string | null;
  status: "seed" | "accumulating" | "mature" | "signal_candidate" | "converted" | "decayed";
  evidence_mass: number;
  atom_count: number;
  source_count: number;
  independence_bonus: number;
  vector_spread_bonus: number;
  corroboration_bonus: number;
  contradiction_penalty: number;
  last_atom_at: string | null;
  last_mass_computed_at: string | null;
  decay_check_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ClusterAtomRow = {
  cluster_id: number;
  atom_id: number;
  match_score: number;
  attached_at: string;
};

// ============================================================
// V2 TABLES — Phase D
// ============================================================

export type SignalIntelligenceRunRow = {
  id: number;
  trigger_type: "threshold" | "cycle" | "manual";
  clusters_evaluated: number;
  signals_created: number;
  signals_routed_internal: number;
  signals_blocked: number;
  started_at: string;
  completed_at: string | null;
  status: "running" | "complete" | "error";
  error_message: string | null;
};

export type HumanGovernanceActionRow = {
  id: number;
  signal_id: string;
  run_id: number | null;
  action: string;
  actor: string | null;
  note: string | null;
  created_at: string;
};

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
      // V2 tables
      structural_invariants: {
        Row: StructuralInvariantRow;
        Insert: never;
        Update: never;
      };
      doctrine_versions: {
        Row: DoctrineVersionRow;
        Insert: Omit<DoctrineVersionRow, "id" | "created_at"> & { id?: number; created_at?: string };
        Update: Partial<Omit<DoctrineVersionRow, "id" | "created_at">>;
      };
      false_signal_patterns: {
        Row: FalseSignalPatternRow;
        Insert: Omit<FalseSignalPatternRow, "id" | "created_at"> & { id?: number; created_at?: string };
        Update: Partial<Omit<FalseSignalPatternRow, "id" | "created_at">>;
      };
      factual_atoms: {
        Row: FactualAtomRow;
        Insert: Omit<FactualAtomRow, "id" | "created_at"> & { id?: number; created_at?: string };
        Update: Partial<Omit<FactualAtomRow, "id" | "created_at">>;
      };
      mesodma_batch_runs: {
        Row: MesodmaBatchRunRow;
        Insert: Omit<MesodmaBatchRunRow, "id"> & { id?: number };
        Update: Partial<Omit<MesodmaBatchRunRow, "id">>;
      };
      evidence_clusters: {
        Row: EvidenceClusterRow;
        Insert: Omit<EvidenceClusterRow, "id" | "created_at" | "updated_at"> & { id?: number; created_at?: string; updated_at?: string };
        Update: Partial<Omit<EvidenceClusterRow, "id" | "created_at">>;
      };
      cluster_atoms: {
        Row: ClusterAtomRow;
        Insert: Omit<ClusterAtomRow, "attached_at"> & { attached_at?: string };
        Update: Partial<Omit<ClusterAtomRow, "cluster_id" | "atom_id">>;
      };
      signal_intelligence_runs: {
        Row: SignalIntelligenceRunRow;
        Insert: Omit<SignalIntelligenceRunRow, "id"> & { id?: number };
        Update: Partial<Omit<SignalIntelligenceRunRow, "id">>;
      };
      human_governance_actions: {
        Row: HumanGovernanceActionRow;
        Insert: Omit<HumanGovernanceActionRow, "id" | "created_at"> & { id?: number; created_at?: string };
        Update: never;
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
