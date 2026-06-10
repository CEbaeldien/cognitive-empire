// Mesodma V2 + Signal Intelligence V2 — internal types.
// These are separate from V1 types in lib/mesodma/types.ts.

export type StructuralInvariant = {
  id: number;
  code: string;
  name: string;
  statement: string;
  function_note: string | null;
  display_order: number;
  active: boolean;
};

export type FalseSignalPattern = {
  id: number;
  name: string;
  description: string;
  indicators: string[];
  active: boolean;
};

export type DoctrineContext = {
  invariants: StructuralInvariant[];
  falseSignalPatterns: FalseSignalPattern[];
  doctrineVersion: string;
  invariantMap: Map<string, number>; // code → id
};

export type AtomExtractionOutput = {
  status: "atom" | "noise";
  atom_summary: string;
  who: string;
  what_changed: string;
  when_date: string;           // YYYY-MM-DD or ""
  where_location: string;
  why_if_stated: string;
  how_if_stated: string;
  system_affected: string;
  entities: string[];
  companies: string[];
  countries: string[];
  technologies: string[];
  numbers: Array<{ value: string; unit: string; context: string }>;
  evidence_type: string;
  source_claim: string;
  possible_invariant_codes: string[]; // e.g. ["INV-001", "INV-005"] — max 3
  possible_vector_slugs: string[];
  duplicate_risk: number;
  distribution_stage: string;
  false_signal_risk: number;
  extraction_confidence: number;
};

export type AtomBatchReport = {
  started_at: string;
  completed_at: string;
  run_id: number | null;
  input_count: number;
  output_count: number;
  noise_count: number;
  error_count: number;
  doctrine_version: string;
};

export type FactualAtomRow = {
  id: number;
  raw_item_id: string;
  source_id: string | null;
  mesodma_run_id: number | null;
  atom_summary: string;
  who: string | null;
  what_changed: string | null;
  when_date: string | null;
  where_location: string | null;
  why_if_stated: string | null;
  how_if_stated: string | null;
  system_affected: string | null;
  entities: string[];
  companies: string[];
  countries: string[];
  technologies: string[];
  numbers: Record<string, unknown>[];
  evidence_type: string | null;
  source_claim: string | null;
  source_weight: number;
  possible_invariant_ids: number[];
  possible_vector_ids: string[];
  duplicate_risk: number;
  distribution_stage: string | null;
  false_signal_risk: number;
  extraction_confidence: number | null;
  extracted_by_model: string | null;
  doctrine_version: string | null;
  status: "atom" | "noise" | "duplicate" | "needs_enrichment" | "low_confidence" | "rejected";
  created_at: string;
};

export type EvidenceClusterRow = {
  id: number;
  invariant_id: number;
  vector_id: string | null;
  working_title: string | null;
  cluster_summary: string | null;
  status: "seed" | "accumulating" | "mature" | "signal_candidate" | "converted" | "expired" | "rejected" | "contradicted";
  evidence_mass: number;
  atom_count: number;
  source_count: number;
  novelty_level: number;
  contradiction_level: number;
  confidence: number | null;
  distribution_stage: string | null;
  entity_keys: string[];
  geography_keys: string[];
  technology_keys: string[];
  first_atom_at: string | null;
  last_atom_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ClusterAtomRow = {
  cluster_id: number;
  atom_id: number;
  contribution_weight: number;
  created_at: string;
};

export type ClusterPassReport = {
  started_at: string;
  completed_at: string;
  atoms_processed: number;
  clusters_created: number;
  clusters_updated: number;
  clusters_matured: number;
  clusters_expired: number;
  errors: string[];
};

export type SynthesisOutput = {
  title: string;
  summary: string;
  implication: string;
  what_changed: string;
  why_it_matters: string;
  structural_relevance: string;
  second_order_effect: string;
  doctrine_basis: string;
  governance_pressure_note: string;
  maintenance_gravity_note: string;
  continuity_note: string;
  physical_constraint_note: string;
  contradiction_note: string;
  routing_recommendation: "internal" | "human_review" | "needs_more_evidence" | "reject";
  confidence: number;
  category: string;
  supporting_atom_ids: number[];
  source_count: number;
};

export type SynthesisPassReport = {
  started_at: string;
  completed_at: string;
  run_id: number | null;
  clusters_evaluated: number;
  candidates_created: number;
  rejected_count: number;
  error_count: number;
};
