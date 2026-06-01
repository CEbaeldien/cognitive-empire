export type DreInboxCategory = "drift" | "work" | "signals" | "research" | "partnership" | "general" | "noise";
export type DreUrgency = "high" | "medium" | "low";
export type DreApprovalState = "needs_review" | "draft_prepared" | "routed_internally" | "founder_approval_required" | "archived";

export type DreProjectStatus = "active" | "paused" | "planned" | "complete" | "decaying";
export type DreProjectPriority = "critical" | "high" | "medium" | "low";
export type DreDecayRisk = "high" | "medium" | "low" | "none";

export type DreThreadType = "doctrine" | "market" | "pricing" | "signals" | "foundry" | "investigation" | "hypothesis";
export type DreResearchStatus = "active" | "paused" | "complete" | "decayed";
export type DreDecayStatus = "fresh" | "aging" | "stale" | "decayed";

export type DreActionType = "draft_email" | "route_inquiry" | "prepare_prompt" | "create_task" | "update_record" | "summarize_workflow" | "review_signal" | "prepare_proposal" | "generate_note" | "trigger_workflow";
export type DreRiskLevel = "safe" | "medium" | "high" | "forbidden";
export type DreActionStatus = "suggested" | "drafted" | "pending_approval" | "approved" | "executed" | "failed" | "blocked" | "archived";

export type DreRuleType = "autonomous" | "requires_approval" | "forbidden";

export interface DreInboxItem {
  id: string;
  sender: string | null;
  source_alias: string | null;
  subject: string | null;
  body: string | null;
  category: DreInboxCategory | null;
  urgency: DreUrgency;
  suggested_route: string | null;
  recommended_response: string | null;
  approval_state: DreApprovalState;
  fit_score: number | null;
  created_at: string;
  updated_at: string;
}

export interface DreProject {
  id: string;
  project_name: string;
  status: DreProjectStatus;
  priority: DreProjectPriority;
  current_phase: string | null;
  next_action: string | null;
  blocker: string | null;
  owner: string;
  decay_risk: DreDecayRisk;
  linked_actions: unknown[];
  last_updated: string;
  created_at: string;
}

export interface DreResearchThread {
  id: string;
  title: string;
  thread_type: DreThreadType;
  status: DreResearchStatus;
  decay_status: DreDecayStatus;
  summary: string | null;
  evidence_links: unknown[];
  related_signals: unknown[];
  related_projects: unknown[];
  next_action: string | null;
  created_at: string;
  updated_at: string;
}

export interface DreAction {
  id: string;
  title: string;
  action_type: DreActionType | null;
  source_module: string | null;
  risk_level: DreRiskLevel;
  status: DreActionStatus;
  requires_approval: boolean;
  payload: Record<string, unknown>;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DreGovernanceRule {
  id: string;
  rule_name: string;
  rule_type: DreRuleType | null;
  action_category: string | null;
  description: string | null;
  active: boolean;
  created_at: string;
}
