export type DriftOpportunityInput = {
  id: string;
  value: number | null;
  probability: number | null;
  stage: string | null;
  last_activity_date: string | null;
  next_action: string | null;
  next_action_due_date: string | null;
};

export type DriftScoreResult = {
  opportunity_id: string;
  drift_score: number;
  drift_level: "healthy" | "watch" | "decaying" | "critical";
  revenue_at_risk: number;
  days_since_last_activity: number;
  has_missing_next_action: boolean;
  has_overdue_followup: boolean;
  stage_age_days: number;
  ignored_followups_count: number;
  scoring_notes: string;
};

function daysBetween(dateString: string | null): number {
  if (!dateString) return 999;

  const date = new Date(dateString);
  const now = new Date();

  const diffMs = now.getTime() - date.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

function isOverdue(dateString: string | null): boolean {
  if (!dateString) return false;

  const dueDate = new Date(dateString);
  const today = new Date();

  dueDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  return dueDate < today;
}

function getDriftLevel(score: number): DriftScoreResult["drift_level"] {
  if (score >= 80) return "critical";
  if (score >= 60) return "decaying";
  if (score >= 35) return "watch";
  return "healthy";
}

function getDriftMultiplier(level: DriftScoreResult["drift_level"]): number {
  switch (level) {
    case "critical":
      return 0.85;
    case "decaying":
      return 0.65;
    case "watch":
      return 0.35;
    case "healthy":
    default:
      return 0.15;
  }
}

export function calculateDriftScore(
  opportunity: DriftOpportunityInput
): DriftScoreResult {
  const daysSinceLastActivity = daysBetween(opportunity.last_activity_date);
  const hasMissingNextAction = !opportunity.next_action;
  const hasOverdueFollowup = isOverdue(opportunity.next_action_due_date);

  let score = 0;
  const notes: string[] = [];

  if (daysSinceLastActivity >= 14) {
    score += 35;
    notes.push("No meaningful activity for 14+ days.");
  } else if (daysSinceLastActivity >= 7) {
    score += 25;
    notes.push("No meaningful activity for 7+ days.");
  } else if (daysSinceLastActivity >= 4) {
    score += 12;
    notes.push("Activity is slowing.");
  }

  if (hasMissingNextAction) {
    score += 25;
    notes.push("No next action is defined.");
  }

  if (hasOverdueFollowup) {
    score += 25;
    notes.push("Follow-up is overdue.");
  }

  if (
    opportunity.stage === "Proposal" ||
    opportunity.stage === "Negotiation"
  ) {
    score += 10;
    notes.push("Opportunity is in a high-risk late stage.");
  }

  const dealValue = Number(opportunity.value ?? 0);
  if (dealValue >= 50000) {
    score += 10;
    notes.push("High-value opportunity.");
  }

  score = Math.min(100, score);

  const driftLevel = getDriftLevel(score);
  const probability = Number(opportunity.probability ?? 0) / 100;
  const multiplier = getDriftMultiplier(driftLevel);

  const revenueAtRisk = Math.round(dealValue * probability * multiplier);

  return {
    opportunity_id: opportunity.id,
    drift_score: score,
    drift_level: driftLevel,
    revenue_at_risk: revenueAtRisk,
    days_since_last_activity: daysSinceLastActivity,
    has_missing_next_action: hasMissingNextAction,
    has_overdue_followup: hasOverdueFollowup,
    stage_age_days: daysSinceLastActivity,
    ignored_followups_count: hasOverdueFollowup ? 1 : 0,
    scoring_notes: notes.join(" "),
  };
}