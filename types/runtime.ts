// CE Runtime — TypeScript types for all runtime tables.
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

export type ConflictType =
  | "memory"
  | "sync"
  | "schema"
  | "authority"
  | "state"
  | "doctrine";

export type ConflictStatus = "open" | "investigating" | "resolved" | "dismissed";

export type DoctrineDocumentType =
  | "doctrine"
  | "paper"
  | "report"
  | "note"
  | "methodology"
  | "standard";

export type DoctrineConceptType =
  | "law"
  | "principle"
  | "vector"
  | "rule"
  | "framework"
  | "metric"
  | "methodology"
  | "constraint";

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

// ============================================================
// TABLE: runtime_memories
// ============================================================

export type RuntimeMemoryRow = {
  id: string;
  type: MemoryType;
  confidence: MemoryConfidence;
  lifecycle_status: MemoryLifecycleStatus;
  source_type: MemorySourceType;
  title: string;
  content: string;
  tags: string[] | null;
  source_ref: string | null;
  entity_type: string | null;
  entity_id: string | null;
  expires_at: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type RuntimeMemoryInsert = Omit<
  RuntimeMemoryRow,
  "id" | "created_at" | "updated_at"
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type RuntimeMemoryUpdate = Partial<RuntimeMemoryInsert>;

// ============================================================
// TABLE: runtime_systems
// ============================================================

export type RuntimeSystemRow = {
  id: string;
  name: string;
  system_slug: string;
  system_type: SystemType;
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

export type RuntimeSystemInsert = Omit<
  RuntimeSystemRow,
  "id" | "created_at" | "updated_at"
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type RuntimeSystemUpdate = Partial<RuntimeSystemInsert>;

// ============================================================
// TABLE: runtime_tasks
// ============================================================

export type RuntimeTaskStatus =
  | "pending"
  | "in_progress"
  | "blocked"
  | "done"
  | "cancelled";

export type RuntimeTaskRow = {
  id: string;
  title: string;
  description: string | null;
  status: RuntimeTaskStatus;
  priority: number | null;
  impact_level: ImpactLevel | null;
  reversibility_class: ReversibilityClass | null;
  system_id: string | null;
  project_id: string | null;
  assigned_to: string | null;
  due_at: string | null;
  completed_at: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type RuntimeTaskInsert = Omit<
  RuntimeTaskRow,
  "id" | "created_at" | "updated_at"
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type RuntimeTaskUpdate = Partial<RuntimeTaskInsert>;

// ============================================================
// TABLE: runtime_projects
// ============================================================

export type RuntimeProjectStatus =
  | "planned"
  | "active"
  | "paused"
  | "completed"
  | "archived";

export type RuntimeProjectRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: RuntimeProjectStatus;
  impact_level: ImpactLevel;
  data_sensitivity: DataSensitivity;
  owner: string | null;
  started_at: string | null;
  completed_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type RuntimeProjectInsert = Omit<
  RuntimeProjectRow,
  "id" | "created_at" | "updated_at"
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type RuntimeProjectUpdate = Partial<RuntimeProjectInsert>;

// ============================================================
// TABLE: runtime_approvals
// ============================================================

export type RuntimeApprovalRow = {
  id: string;
  entity_type: string;
  entity_id: string;
  status: ApprovalStatus;
  reversibility_class: ReversibilityClass;
  impact_level: ImpactLevel;
  title: string;
  description: string | null;
  requested_by: string | null;
  requested_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  notes: string | null;
  expires_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type RuntimeApprovalInsert = Omit<
  RuntimeApprovalRow,
  "id" | "requested_at" | "created_at"
> & {
  id?: string;
  requested_at?: string;
  created_at?: string;
};

export type RuntimeApprovalUpdate = Partial<RuntimeApprovalInsert>;

// ============================================================
// TABLE: runtime_conflicts
// ============================================================

export type RuntimeConflictRow = {
  id: string;
  type: ConflictType;
  status: ConflictStatus;
  title: string;
  description: string | null;
  entity_type: string | null;
  entity_id: string | null;
  detected_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type RuntimeConflictInsert = Omit<
  RuntimeConflictRow,
  "id" | "detected_at" | "created_at" | "updated_at"
> & {
  id?: string;
  detected_at?: string;
  created_at?: string;
  updated_at?: string;
};

export type RuntimeConflictUpdate = Partial<RuntimeConflictInsert>;

// ============================================================
// TABLE: runtime_health_checks
// ============================================================

export type RuntimeHealthCheckRow = {
  id: string;
  system_id: string;
  health_status: HealthStatus;
  sync_status: SyncStatus;
  notes: string | null;
  checked_by: string | null;
  checked_at: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type RuntimeHealthCheckInsert = Omit<
  RuntimeHealthCheckRow,
  "id" | "checked_at" | "created_at"
> & {
  id?: string;
  checked_at?: string;
  created_at?: string;
};

export type RuntimeHealthCheckUpdate = Partial<RuntimeHealthCheckInsert>;

// ============================================================
// TABLE: runtime_doctrine_documents
// ============================================================

export type RuntimeDoctrineDocumentRow = {
  id: string;
  title: string;
  slug: string;
  type: DoctrineDocumentType;
  status: DoctrineStatus;
  version: string | null;
  summary: string | null;
  content: string | null;
  author: string | null;
  data_sensitivity: DataSensitivity;
  published_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type RuntimeDoctrineDocumentInsert = Omit<
  RuntimeDoctrineDocumentRow,
  "id" | "created_at" | "updated_at"
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type RuntimeDoctrineDocumentUpdate = Partial<RuntimeDoctrineDocumentInsert>;

// ============================================================
// TABLE: runtime_doctrine_concepts
// ============================================================

export type RuntimeDoctrineConceptRow = {
  id: string;
  document_id: string | null;
  name: string;
  slug: string;
  type: DoctrineConceptType;
  status: DoctrineStatus;
  description: string | null;
  full_text: string | null;
  display_order: number | null;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type RuntimeDoctrineConceptInsert = Omit<
  RuntimeDoctrineConceptRow,
  "id" | "created_at" | "updated_at"
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type RuntimeDoctrineConceptUpdate = Partial<RuntimeDoctrineConceptInsert>;

// ============================================================
// TABLE: runtime_doctrine_references  (junction)
// ============================================================

export type RuntimeDoctrineReferenceRow = {
  id: string;
  concept_id: string;
  entity_type: string;
  entity_id: string;
  context: string | null;
  referenced_by: string | null;
  referenced_at: string;
  created_at: string;
};

export type RuntimeDoctrineReferenceInsert = Omit<
  RuntimeDoctrineReferenceRow,
  "id" | "referenced_at" | "created_at"
> & {
  id?: string;
  referenced_at?: string;
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
      runtime_projects: {
        Row: RuntimeProjectRow;
        Insert: RuntimeProjectInsert;
        Update: RuntimeProjectUpdate;
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
      runtime_health_checks: {
        Row: RuntimeHealthCheckRow;
        Insert: RuntimeHealthCheckInsert;
        Update: RuntimeHealthCheckUpdate;
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
      conflict_type: ConflictType;
      conflict_status: ConflictStatus;
      doctrine_document_type: DoctrineDocumentType;
      doctrine_concept_type: DoctrineConceptType;
      doctrine_status: DoctrineStatus;
      impact_level: ImpactLevel;
      cost_type: CostType;
      billing_status: BillingStatus;
      payment_provider: PaymentProvider;
    };
  };
};
