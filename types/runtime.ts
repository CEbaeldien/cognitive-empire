// CE Runtime — TypeScript types aligned to actual DB schema.
// Last verified: 2026-05-31 via live Supabase probe.
// Usage: createClient<RuntimeDatabase>(url, key)

// ============================================================
// ENUMS
// ============================================================

export type MemoryType =
  | "fact"
  | "decision"
  | "assumption"
  | "opinion"
  | "task"
  | "system_state"
  | "risk"
  | "dependency"
  | "doctrine_reference";

export type MemoryConfidence =
  | "confirmed"
  | "inferred"
  | "uncertain"
  | "stale"
  | "conflicted";

export type MemoryLifecycleStatus =
  | "draft"
  | "active"
  | "locked"
  | "stale"
  | "superseded"
  | "archived"
  | "conflicted";

export type MemorySourceType =
  | "founder_input"
  | "codebase"
  | "database"
  | "n8n"
  | "admin_ui"
  | "deployment"
  | "document"
  | "chat_summary"
  | "ai_analysis";

export type SystemType =
  | "public_page"
  | "admin_page"
  | "api_route"
  | "database_table"
  | "workflow"
  | "ai_module"
  | "product_system"
  | "internal_system"
  | "doctrine_release"
  | "service_offer"
  | "external_dependency";

export type SystemStatus =
  | "planned"
  | "active"
  | "paused"
  | "deprecated"
  | "broken"
  | "archived";

export type HealthStatus =
  | "healthy"
  | "warning"
  | "broken"
  | "stale"
  | "unknown"
  | "needs_review";

export type SyncStatus =
  | "in_sync"
  | "stale"
  | "drift_detected"
  | "conflicted"
  | "unknown"
  | "manual_review_required";

export type DataSensitivity = "public" | "internal" | "restricted" | "confidential";

export type ReversibilityClass = "R0" | "R1" | "R2" | "R3" | "R4";

export type ApprovalStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "expired";

export type ConflictStatus = "open" | "investigating" | "resolved" | "dismissed";

export type DoctrineStatus =
  | "draft"
  | "active"
  | "canonical"
  | "superseded"
  | "archived";

export type ImpactLevel = "low" | "medium" | "high" | "critical";

export type CostType =
  | "free"
  | "fixed_subscription"
  | "usage_based"
  | "hybrid"
  | "manual"
  | "unknown";

export type BillingStatus =
  | "none"
  | "free"
  | "trial"
  | "active"
  | "past_due"
  | "cancelled"
  | "unknown";

export type PaymentProvider =
  | "stripe"
  | "paypal"
  | "payoneer"
  | "bank_transfer"
  | "flutterwave"
  | "manual_invoice"
  | "unknown"
  | "none";

export type RuntimeTaskStatus =
  | "pending"
  | "in_progress"
  | "blocked"
  | "done"
  | "cancelled";

// ============================================================
// TABLE: runtime_memories
// Actual cols verified 2026-05-31
// ============================================================

export type RuntimeMemoryRow = {
  id: string;
  memory_type: MemoryType;
  confidence: MemoryConfidence;
  lifecycle_status: MemoryLifecycleStatus;
  source_type: MemorySourceType;
  title: string;
  content: string;
  tags: string[] | null;
  source_ref: string | null;
  source_timestamp: string | null;
  related_entity_type: string | null;
  related_entity_id: string | null;
  related_system_id: string | null;
  stale_after_days: number | null;
  supersedes_id: string | null;
  superseded_by_id: string | null;
  locked: boolean;
  locked_at: string | null;
  locked_by: string | null;
  lock_reason: string | null;
  last_verified_at: string | null;
  verified_by: string | null;
  verification_notes: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type RuntimeMemoryInsert = Omit<RuntimeMemoryRow, "id" | "created_at" | "updated_at"> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type RuntimeMemoryUpdate = Partial<RuntimeMemoryInsert>;

// ============================================================
// TABLE: runtime_systems
// Actual cols verified via working API route
// ============================================================

export type RuntimeSystemRow = {
  id: string;
  name: string;
  system_slug: string;
  system_type: SystemType | null;
  status: SystemStatus;
  description: string | null;
  health_status: HealthStatus;
  sync_status: SyncStatus;
  data_sensitivity: DataSensitivity;
  risk_level: string | null;
  priority: string | null;
  owner_role: string | null;
  owner: string | null;
  environment: string | null;
  public_url: string | null;
  admin_url: string | null;
  repo_path: string | null;
  database_tables: string[] | null;
  n8n_workflows: string[] | null;
  workflow_count: number | null;
  api_dependencies: string[] | null;
  auth_method: string | null;
  source_of_truth: string | null;
  sync_frequency: string | null;
  last_sync_check: string | null;
  last_sync_result: string | null;
  current_phase: string | null;
  next_action: string | null;
  requires_founder_review: boolean | null;
  cost_monthly: number | null;
  cost_currency: string | null;
  cost_type: CostType;
  billing_status: BillingStatus;
  revenue_linked: boolean | null;
  payment_provider: PaymentProvider;
  last_health_check: string | null;
  last_verified_at: string | null;
  memory_confidence: string | null;
  continuity_contract: Record<string, unknown>;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type RuntimeSystemInsert = Omit<RuntimeSystemRow, "id" | "created_at" | "updated_at"> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type RuntimeSystemUpdate = Partial<RuntimeSystemInsert>;

// ============================================================
// TABLE: runtime_tasks
// Actual cols verified 2026-05-31
// Note: task category stored in 'system' col (no task_type col)
// ============================================================

export type RuntimeTaskRow = {
  id: string;
  title: string;
  description: string | null;
  system: string | null;         // task category / area (e.g. "runtime", "signals")
  status: RuntimeTaskStatus;
  priority: number | null;
  assigned_to: string | null;
  due_date: string | null;       // date string, not timestamp
  dependencies: string[] | null;
  related_system_id: string | null;
  completed_at: string | null;
  blocked_reason: string | null;
  reversibility_class: ReversibilityClass | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type RuntimeTaskInsert = Omit<RuntimeTaskRow, "id" | "created_at" | "updated_at"> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type RuntimeTaskUpdate = Partial<RuntimeTaskInsert>;

// ============================================================
// TABLE: runtime_health_checks
// Actual cols verified via route implementation
// ============================================================

export type RuntimeHealthCheckRow = {
  id: string;
  system_id: string;
  status: HealthStatus;
  check_type: string | null;
  checked_by: string | null;
  issues_found: string | null;
  notes: string | null;
  checked_at: string;
  created_at: string;
};

export type RuntimeHealthCheckInsert = Omit<RuntimeHealthCheckRow, "id" | "checked_at" | "created_at"> & {
  id?: string;
  checked_at?: string;
  created_at?: string;
};

export type RuntimeHealthCheckUpdate = Partial<RuntimeHealthCheckInsert>;

// ============================================================
// TABLE: runtime_approvals
// Actual cols verified 2026-05-31
// Note: no impact_level col; uses action_requested + assigned_to
// ============================================================

export type RuntimeApprovalRow = {
  id: string;
  title: string;
  description: string | null;
  entity_type: string;
  entity_id: string;
  action_requested: string;
  status: ApprovalStatus;
  reversibility_class: ReversibilityClass | null;
  priority: number | null;
  requested_by: string | null;
  requested_at: string;
  assigned_to: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  expires_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type RuntimeApprovalInsert = Omit<RuntimeApprovalRow, "id" | "requested_at" | "created_at" | "updated_at"> & {
  id?: string;
  requested_at?: string;
  created_at?: string;
  updated_at?: string;
};

export type RuntimeApprovalUpdate = Partial<RuntimeApprovalInsert>;

// ============================================================
// TABLE: runtime_conflicts
// Actual cols verified 2026-05-31
// Note: uses conflict_type + entity_a/b pattern; no single 'type' col
// ============================================================

export type RuntimeConflictRow = {
  id: string;
  title: string;
  description: string;            // NOT NULL in DB
  conflict_type: string;          // NOT NULL in DB
  status: ConflictStatus;
  entity_a_type: string;          // NOT NULL in DB
  entity_a_id: string | null;
  entity_a_value: string | null;
  entity_b_type: string;          // NOT NULL in DB
  entity_b_id: string | null;
  entity_b_value: string | null;
  detected_by: string | null;
  detected_at: string;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type RuntimeConflictInsert = Omit<RuntimeConflictRow, "id" | "detected_at" | "created_at" | "updated_at"> & {
  id?: string;
  detected_at?: string;
  created_at?: string;
  updated_at?: string;
};

export type RuntimeConflictUpdate = Partial<RuntimeConflictInsert>;

// ============================================================
// TABLE: runtime_projects
// Actual cols verified 2026-05-31
// Note: uses phase/current_state/blockers; no data_sensitivity/impact_level
// ============================================================

export type RuntimeProjectRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  priority: number | null;
  owner_role: string | null;
  related_system_id: string | null;
  phase: string | null;
  current_state: string | null;
  next_action: string | null;
  blockers: string | null;
  risk_level: string | null;
  requires_founder_review: boolean | null;
  start_date: string | null;
  target_date: string | null;
  completed_at: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type RuntimeProjectInsert = Omit<RuntimeProjectRow, "id" | "created_at" | "updated_at"> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type RuntimeProjectUpdate = Partial<RuntimeProjectInsert>;

// ============================================================
// TABLE: runtime_doctrine_documents
// Actual cols verified 2026-05-31
// Note: document_type col (not 'type'); canonical_url/storage_ref instead of content
// ============================================================

export type RuntimeDoctrineDocumentRow = {
  id: string;
  title: string;
  slug: string;
  document_type: string;
  version: string | null;
  status: DoctrineStatus;
  summary: string | null;
  canonical_url: string | null;
  storage_ref: string | null;
  published_at: string | null;
  effective_date: string | null;
  supersedes_id: string | null;
  superseded_by_id: string | null;
  created_at: string;
  updated_at: string;
};

export type RuntimeDoctrineDocumentInsert = Omit<RuntimeDoctrineDocumentRow, "id" | "created_at" | "updated_at"> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type RuntimeDoctrineDocumentUpdate = Partial<RuntimeDoctrineDocumentInsert>;

// ============================================================
// TABLE: runtime_doctrine_concepts
// Actual cols verified 2026-05-31
// Note: concept_name/concept_slug/concept_type (not name/slug/type); requires definition
// ============================================================

export type RuntimeDoctrineConceptRow = {
  id: string;
  document_id: string | null;
  concept_name: string;           // NOT NULL
  concept_slug: string;           // NOT NULL
  concept_type: string;           // NOT NULL
  definition: string;             // NOT NULL
  summary: string | null;
  version: string | null;
  status: DoctrineStatus;
  created_at: string;
  updated_at: string;
};

export type RuntimeDoctrineConceptInsert = Omit<RuntimeDoctrineConceptRow, "id" | "created_at" | "updated_at"> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type RuntimeDoctrineConceptUpdate = Partial<RuntimeDoctrineConceptInsert>;

// ============================================================
// TABLE: runtime_doctrine_references
// Actual cols verified 2026-05-31
// Note: doctrine_document_id FK; referenced_entity_type/id (not entity_type/id)
// ============================================================

export type RuntimeDoctrineReferenceRow = {
  id: string;
  doctrine_document_id: string;
  doctrine_concept_id: string | null;
  referenced_entity_type: string;   // NOT NULL
  referenced_entity_id: string | null;
  reference_reason: string | null;
  impact_level: ImpactLevel | null;
  created_by: string | null;
  created_at: string;
};

export type RuntimeDoctrineReferenceInsert = Omit<RuntimeDoctrineReferenceRow, "id" | "created_at"> & {
  id?: string;
  created_at?: string;
};

export type RuntimeDoctrineReferenceUpdate = Partial<RuntimeDoctrineReferenceInsert>;

// ============================================================
// DATABASE TYPE — for typed Supabase client
// Usage: createClient<RuntimeDatabase>(url, key)
// ============================================================

export type RuntimeDatabase = {
  public: {
    Tables: {
      runtime_memories: {
        Row: RuntimeMemoryRow;
        Insert: RuntimeMemoryInsert;
        Update: RuntimeMemoryUpdate;
      };
      runtime_systems: {
        Row: RuntimeSystemRow;
        Insert: RuntimeSystemInsert;
        Update: RuntimeSystemUpdate;
      };
      runtime_tasks: {
        Row: RuntimeTaskRow;
        Insert: RuntimeTaskInsert;
        Update: RuntimeTaskUpdate;
      };
      runtime_health_checks: {
        Row: RuntimeHealthCheckRow;
        Insert: RuntimeHealthCheckInsert;
        Update: RuntimeHealthCheckUpdate;
      };
      runtime_approvals: {
        Row: RuntimeApprovalRow;
        Insert: RuntimeApprovalInsert;
        Update: RuntimeApprovalUpdate;
      };
      runtime_conflicts: {
        Row: RuntimeConflictRow;
        Insert: RuntimeConflictInsert;
        Update: RuntimeConflictUpdate;
      };
      runtime_projects: {
        Row: RuntimeProjectRow;
        Insert: RuntimeProjectInsert;
        Update: RuntimeProjectUpdate;
      };
      runtime_doctrine_documents: {
        Row: RuntimeDoctrineDocumentRow;
        Insert: RuntimeDoctrineDocumentInsert;
        Update: RuntimeDoctrineDocumentUpdate;
      };
      runtime_doctrine_concepts: {
        Row: RuntimeDoctrineConceptRow;
        Insert: RuntimeDoctrineConceptInsert;
        Update: RuntimeDoctrineConceptUpdate;
      };
      runtime_doctrine_references: {
        Row: RuntimeDoctrineReferenceRow;
        Insert: RuntimeDoctrineReferenceInsert;
        Update: RuntimeDoctrineReferenceUpdate;
      };
    };
    Enums: {
      memory_type: MemoryType;
      memory_confidence: MemoryConfidence;
      memory_lifecycle_status: MemoryLifecycleStatus;
      memory_source_type: MemorySourceType;
      system_type: SystemType;
      system_status: SystemStatus;
      health_status: HealthStatus;
      sync_status: SyncStatus;
      data_sensitivity: DataSensitivity;
      reversibility_class: ReversibilityClass;
      approval_status: ApprovalStatus;
      conflict_status: ConflictStatus;
      doctrine_status: DoctrineStatus;
      impact_level: ImpactLevel;
      cost_type: CostType;
      billing_status: BillingStatus;
      payment_provider: PaymentProvider;
      runtime_task_status: RuntimeTaskStatus;
    };
  };
};
