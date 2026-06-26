// ============================================================
// MMCP ENGINE — TypeScript Types
// All entity types derived directly from schema.sql
// ============================================================

// ── Primitives ──────────────────────────────────────────────

export type SessionStatus = 'open' | 'active' | 'pending_approval' | 'closed' | 'archived'
export type SessionPriority = 'low' | 'normal' | 'high' | 'critical'
export type MissionStatus = 'draft' | 'active' | 'complete'
export type OEPStatus = 'draft' | 'complete'
export type SynthesisStatus = 'pending_approval' | 'approved' | 'revised' | 'rejected'
export type ApprovalDecision = 'approve' | 'revise' | 'reject' | 'escalate'
export type ActionStatus = 'pending' | 'in_progress' | 'complete' | 'cancelled'
export type MemoryClassification = 'general' | 'doctrine' | 'pattern' | 'decision' | 'canon'
export type ConfidenceLevel = 'low' | 'medium' | 'high'

// Authority levels — R4 always requires explicit Principal approval
export type AuthorityLevel = 'R0' | 'R1' | 'R2' | 'R3' | 'R4'

// Instance scope — 'principal' injects CE doctrine header into synthesis
export type InstanceScope = 'principal' | 'public'

// Intelligence Models available in v0
export type ModelName = 'claude' | 'claude-code' | 'codex' | 'grok' | 'chatgpt' | 'gemini'

// ── Database Row Types ───────────────────────────────────────

export interface MmcpSession {
  id: string
  principal_id: string
  title: string
  status: SessionStatus
  priority: SessionPriority
  instance_scope: InstanceScope
  created_at: string
  updated_at: string
  closed_at: string | null
}

export interface MissionBrief {
  id: string
  session_id: string
  title: string
  context: string | null
  objective: string
  constraints: string | null
  models_selected: ModelName[]
  status: MissionStatus
  created_at: string
  updated_at: string
}

export interface ModelOutput {
  id: string
  session_id: string
  mission_id: string
  model_name: ModelName
  raw_output: string
  input_prompt: string | null
  token_count: number | null
  pasted_at: string
  created_at: string
}

export interface OEPComparison {
  id: string
  session_id: string
  mission_id: string
  convergence_notes: string | null
  divergence_notes: string | null
  blind_spots: string | null
  contradictions: string | null
  risk_notes: string | null
  missing_assumptions: string | null
  status: OEPStatus
  created_at: string
  updated_at: string
}

export interface Synthesis {
  id: string
  session_id: string
  mission_id: string
  oep_comparison_id: string | null
  synthesis_text: string
  confidence_level: ConfidenceLevel | null
  uncertainty_flags: string | null   // never erased — preserved as doctrine
  recommended_action: string | null
  status: SynthesisStatus
  created_at: string
  updated_at: string
}

export interface Approval {
  id: string
  session_id: string
  synthesis_id: string
  principal_id: string
  decision: ApprovalDecision
  notes: string | null
  authority_level: AuthorityLevel
  decided_at: string
}

export interface Action {
  id: string
  session_id: string
  synthesis_id: string
  approval_id: string              // FK — no action without an approval
  title: string
  description: string
  authority_level: AuthorityLevel
  status: ActionStatus
  created_at: string
  updated_at: string
  completed_at: string | null
}

export interface MemoryItem {
  id: string
  session_id: string
  synthesis_id: string | null      // null for pre-synthesis captures
  approval_id: string | null       // null for pre-approval captures
  title: string
  content: string
  tags: string[]
  classification: MemoryClassification
  exportable: boolean
  created_at: string
  updated_at: string
}

export interface AuditLog {
  id: string
  session_id: string | null
  principal_id: string | null
  event_type: AuditEventType
  entity_type: AuditEntityType
  entity_id: string | null
  authority_level: AuthorityLevel | null
  payload: Record<string, unknown> | null
  logged_at: string
}

// ── Audit Event Constants ────────────────────────────────────

export const AUDIT_EVENT = {
  SESSION_CREATED:         'SESSION_CREATED',
  SESSION_STATUS_CHANGED:  'SESSION_STATUS_CHANGED',
  MISSION_CREATED:         'MISSION_CREATED',
  MISSION_STATUS_CHANGED:  'MISSION_STATUS_CHANGED',
  OUTPUT_PASTED:           'OUTPUT_PASTED',
  COMPARISON_SAVED:        'COMPARISON_SAVED',
  COMPARISON_COMPLETED:    'COMPARISON_COMPLETED',
  SYNTHESIS_CREATED:       'SYNTHESIS_CREATED',
  SYNTHESIS_REVISED:       'SYNTHESIS_REVISED',
  APPROVAL_DECIDED:        'APPROVAL_DECIDED',
  ACTION_CREATED:          'ACTION_CREATED',
  ACTION_STATUS_CHANGED:   'ACTION_STATUS_CHANGED',
  MEMORY_ITEM_CREATED:     'MEMORY_ITEM_CREATED',
  UNDEFINED_STATE_SURFACED: 'UNDEFINED_STATE_SURFACED',
  // v1: API-Router events — key is never included in payload
  API_CALL_ATTEMPTED:      'API_CALL_ATTEMPTED',
  API_CALL_COMPLETED:      'API_CALL_COMPLETED',
  API_CALL_FAILED:         'API_CALL_FAILED',
} as const

export type AuditEventType = typeof AUDIT_EVENT[keyof typeof AUDIT_EVENT]

export const AUDIT_ENTITY = {
  SESSION:        'mmcp_sessions',
  MISSION:        'mission_briefs',
  OUTPUT:         'model_outputs',
  COMPARISON:     'oep_comparisons',
  SYNTHESIS:      'syntheses',
  APPROVAL:       'approvals',
  ACTION:         'actions',
  MEMORY_ITEM:    'memory_items',
} as const

export type AuditEntityType = typeof AUDIT_ENTITY[keyof typeof AUDIT_ENTITY]

// ── Authority Level Metadata ─────────────────────────────────

export const AUTHORITY_LEVELS: Record<AuthorityLevel, { label: string; short: string; description: string; requiresApproval: boolean }> = {
  R0: { label: 'Observe — no action',       short: 'Observe',  description: 'Read / monitor only',                                      requiresApproval: false },
  R1: { label: 'Suggest — needs review',    short: 'Suggest',  description: 'Surface insights, no action',                              requiresApproval: false },
  R2: { label: 'Execute — with oversight',  short: 'Execute',  description: 'Prepare outputs for review',                               requiresApproval: false },
  R3: { label: 'Execute — independently',   short: 'Delegate', description: 'Reversible internal action',                               requiresApproval: false },
  R4: { label: 'Founder — final authority', short: 'Founder',  description: 'External, irreversible, financial, legal, or publishing',  requiresApproval: true  },
}

// ── Model Metadata ───────────────────────────────────────────

export const MODEL_META: Record<ModelName, { label: string; role: string }> = {
  'claude':       { label: 'Claude',       role: 'Primary reasoning, doctrine, synthesis' },
  'claude-code':  { label: 'Claude Code',  role: 'Interactive coding, real-time sessions' },
  'codex':        { label: 'Codex',        role: 'Async queue, PRs, parallel tasks' },
  'grok':         { label: 'Grok',         role: 'Adversarial pass, real-time signals' },
  'chatgpt':      { label: 'ChatGPT',      role: 'Speed, polish, visuals, voice pipeline' },
  'gemini':       { label: 'Gemini',       role: 'Gmail, Workspace, vision — narrow' },
}

// ── Form / Insert Types ──────────────────────────────────────

export interface CreateSessionInput {
  title: string
  priority: SessionPriority
  instance_scope: InstanceScope
}

export interface CreateMissionInput {
  session_id: string
  title: string
  context?: string
  objective: string
  constraints?: string
  models_selected: ModelName[]
}

export interface PasteOutputInput {
  session_id: string
  mission_id: string
  model_name: ModelName
  raw_output: string
  input_prompt?: string
}

export interface SaveComparisonInput {
  session_id: string
  mission_id: string
  convergence_notes?: string
  divergence_notes?: string
  blind_spots?: string
  contradictions?: string
  risk_notes?: string
  missing_assumptions?: string
}

export interface CreateSynthesisInput {
  session_id: string
  mission_id: string
  oep_comparison_id?: string
  synthesis_text: string
  confidence_level?: ConfidenceLevel
  uncertainty_flags?: string
  recommended_action?: string
}

export interface RecordApprovalInput {
  session_id: string
  synthesis_id: string
  decision: ApprovalDecision
  notes?: string
  authority_level: AuthorityLevel
}

export interface CreateActionInput {
  session_id: string
  synthesis_id: string
  approval_id: string
  title: string
  description: string
  authority_level: AuthorityLevel
}

export interface CreateMemoryItemInput {
  session_id: string
  synthesis_id: string | null
  approval_id: string | null
  title: string
  content: string
  tags?: string[]
  classification: MemoryClassification
  exportable?: boolean
}

// ── Supabase Database Shape (for createClient<Database>()) ───

export interface Database {
  public: {
    Tables: {
      mmcp_sessions:   { Row: MmcpSession;   Insert: Omit<MmcpSession, 'id' | 'created_at' | 'updated_at'>;   Update: Partial<MmcpSession> }
      mission_briefs:  { Row: MissionBrief;  Insert: Omit<MissionBrief, 'id' | 'created_at' | 'updated_at'>;  Update: Partial<MissionBrief> }
      model_outputs:   { Row: ModelOutput;   Insert: Omit<ModelOutput, 'id' | 'created_at'>;                   Update: Partial<ModelOutput> }
      oep_comparisons: { Row: OEPComparison; Insert: Omit<OEPComparison, 'id' | 'created_at' | 'updated_at'>; Update: Partial<OEPComparison> }
      syntheses:       { Row: Synthesis;     Insert: Omit<Synthesis, 'id' | 'created_at' | 'updated_at'>;     Update: Partial<Synthesis> }
      approvals:       { Row: Approval;      Insert: Omit<Approval, 'id'>;                                     Update: Partial<Approval> }
      actions:         { Row: Action;        Insert: Omit<Action, 'id' | 'created_at' | 'updated_at'>;        Update: Partial<Action> }
      memory_items:    { Row: MemoryItem;    Insert: Omit<MemoryItem, 'id' | 'created_at' | 'updated_at'>;    Update: Partial<MemoryItem> }
      audit_logs:      { Row: AuditLog;      Insert: Omit<AuditLog, 'id'>;                                     Update: never }
    }
  }
}
