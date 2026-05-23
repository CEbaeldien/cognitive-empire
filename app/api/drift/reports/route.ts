import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const workspaceId = process.env.DRIFT_WORKSPACE_ID;

if (!supabaseUrl) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
if (!serviceRoleKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
if (!workspaceId) throw new Error("Missing DRIFT_WORKSPACE_ID");

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const VALID_REPORT_TYPES = ["daily", "weekly", "client", "workspace"] as const;
const VALID_SCOPE_TYPES = ["workspace", "account", "client"] as const;
type ReportType = (typeof VALID_REPORT_TYPES)[number];

function getPeriodDates(report_type: ReportType, period_start?: string, period_end?: string) {
  const today = new Date();
  const end = period_end ? new Date(period_end) : today;
  const start = period_start
    ? new Date(period_start)
    : report_type === "daily"
    ? today
    : new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  return {
    periodStart: start.toISOString().split("T")[0],
    periodEnd: end.toISOString().split("T")[0],
  };
}

function getDominantPattern(scores: any[]): string | null {
  if (!scores.length) return null;
  const latestByOpportunity = new Map<string, any>();
  for (const score of scores) {
    if (!latestByOpportunity.has(score.opportunity_id)) {
      latestByOpportunity.set(score.opportunity_id, score);
    }
  }
  const active = [...latestByOpportunity.values()];
  const counts = [
    { pattern: "overdue_followups", count: active.filter((s) => s.has_overdue_followup).length },
    { pattern: "missing_next_action", count: active.filter((s) => s.has_missing_next_action).length },
    { pattern: "activity_stagnation", count: active.filter((s) => s.days_since_last_activity >= 14).length },
  ].sort((a, b) => b.count - a.count);
  return counts[0]?.count > 0 ? counts[0].pattern : null;
}

function getNextActionPlan(pattern: string | null): string {
  switch (pattern) {
    case "overdue_followups":
      return "Clear all overdue follow-ups before generating new interventions. Assign specific due dates to every open deal.";
    case "missing_next_action":
      return "Every open opportunity must have a defined next action with a due date before end of week. No undirected deals.";
    case "activity_stagnation":
      return "Re-engage stagnant deals immediately. Prioritize by revenue at risk. A deal with no activity in 14+ days is decaying.";
    default:
      return "No critical drift patterns detected. Maintain current execution cadence and continue logging evidence.";
  }
}

function buildReportBody(params: {
  workspaceName: string;
  periodStart: string;
  periodEnd: string;
  report_type: string;
  openOpportunities: number;
  dealsAtRisk: number;
  revenueAtRisk: number;
  revenueProtected: number;
  completedInterventions: number;
  followupsCompleted: number;
  followupsMissed: number;
  dominantPattern: string | null;
  nextActionPlan: string;
}): string {
  const money = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  return [
    `DRIFT ${params.report_type.toUpperCase()} REPORT`,
    `Workspace: ${params.workspaceName}`,
    `Period: ${params.periodStart} → ${params.periodEnd}`,
    ``,
    `PORTFOLIO STATUS`,
    `Open Opportunities: ${params.openOpportunities}`,
    `Deals at Risk: ${params.dealsAtRisk}`,
    `Revenue at Risk: ${money(params.revenueAtRisk)}`,
    ``,
    `EXECUTION`,
    `Completed Interventions: ${params.completedInterventions}`,
    `Revenue Protected: ${money(params.revenueProtected)}`,
    `Follow-ups Completed: ${params.followupsCompleted}`,
    `Follow-ups Missed: ${params.followupsMissed}`,
    ``,
    `DOMINANT DRIFT PATTERN`,
    params.dominantPattern ?? "None detected",
    ``,
    `NEXT ACTION PLAN`,
    params.nextActionPlan,
  ].join("\n");
}

// GET /api/drift/reports — list existing reports for the workspace
export async function GET() {
  try {
    const { data, error } = await supabase
      .schema("drift")
      .from("reports")
      .select(
        "id, report_type, scope_type, period_start, period_end, generated_by, revenue_protected, revenue_at_risk, deals_at_risk, completed_interventions, followups_completed, followups_missed, dominant_drift_pattern, report_summary, created_at"
      )
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch reports", details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({ reports: data ?? [] });
  } catch (error) {
    return NextResponse.json(
      { error: "Unexpected error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// POST /api/drift/reports — generate a report from current workspace data
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      report_type,
      scope_type = "workspace",
      scope_id,
      period_start,
      period_end,
      generated_by = "manual",
    } = body;

    if (!report_type || !VALID_REPORT_TYPES.includes(report_type)) {
      return NextResponse.json(
        { error: `report_type must be one of: ${VALID_REPORT_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    if (!VALID_SCOPE_TYPES.includes(scope_type)) {
      return NextResponse.json(
        { error: `scope_type must be one of: ${VALID_SCOPE_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    const { periodStart, periodEnd } = getPeriodDates(report_type, period_start, period_end);
    const periodStartTs = `${periodStart}T00:00:00.000Z`;
    const periodEndTs = `${periodEnd}T23:59:59.999Z`;
    const todayStr = new Date().toISOString().split("T")[0];

    // Batch 1: parallel queries
    const [
      workspaceResult,
      scoresResult,
      completedInterventionsResult,
      followupsCompletedResult,
      followupsMissedResult,
    ] = await Promise.all([
      supabase
        .schema("drift")
        .from("workspaces")
        .select("name")
        .eq("id", workspaceId)
        .single(),

      supabase
        .schema("drift")
        .from("scores")
        .select("opportunity_id, drift_level, revenue_at_risk, has_overdue_followup, has_missing_next_action, days_since_last_activity, scored_at")
        .eq("workspace_id", workspaceId)
        .order("scored_at", { ascending: false }),

      supabase
        .schema("drift")
        .from("interventions")
        .select("id, drift_score_id")
        .eq("workspace_id", workspaceId)
        .eq("status", "completed")
        .gte("completed_at", periodStartTs)
        .lte("completed_at", periodEndTs),

      supabase
        .schema("drift")
        .from("followups")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .eq("status", "completed")
        .gte("completed_at", periodStartTs)
        .lte("completed_at", periodEndTs),

      supabase
        .schema("drift")
        .from("followups")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .in("status", ["pending", "overdue"])
        .lt("due_date", todayStr),
    ]);

    if (workspaceResult.error) {
      return NextResponse.json({ error: "Failed to fetch workspace", details: workspaceResult.error }, { status: 500 });
    }
    if (scoresResult.error) {
      return NextResponse.json({ error: "Failed to fetch scores", details: scoresResult.error }, { status: 500 });
    }
    if (completedInterventionsResult.error) {
      return NextResponse.json({ error: "Failed to fetch interventions", details: completedInterventionsResult.error }, { status: 500 });
    }
    if (followupsCompletedResult.error) {
      return NextResponse.json({ error: "Failed to count completed followups", details: followupsCompletedResult.error }, { status: 500 });
    }
    if (followupsMissedResult.error) {
      return NextResponse.json({ error: "Failed to count missed followups", details: followupsMissedResult.error }, { status: 500 });
    }

    // Derive latest score per opportunity
    const latestByOpportunity = new Map<string, any>();
    for (const score of scoresResult.data ?? []) {
      if (!latestByOpportunity.has(score.opportunity_id)) {
        latestByOpportunity.set(score.opportunity_id, score);
      }
    }
    const activeScores = [...latestByOpportunity.values()];

    const revenueAtRisk = activeScores
      .filter((s) => ["watch", "decaying", "critical"].includes(s.drift_level))
      .reduce((sum, s) => sum + Number(s.revenue_at_risk ?? 0), 0);

    const dealsAtRisk = activeScores.filter((s) =>
      ["watch", "decaying", "critical"].includes(s.drift_level)
    ).length;

    const dominantPattern = getDominantPattern(scoresResult.data ?? []);

    // Batch 2: revenue protected requires score IDs from completed interventions
    const scoreIds = (completedInterventionsResult.data ?? [])
      .map((i) => i.drift_score_id)
      .filter(Boolean) as string[];

    let revenueProtected = 0;
    if (scoreIds.length > 0) {
      const { data: protectedScores, error: protectedError } = await supabase
        .schema("drift")
        .from("scores")
        .select("revenue_at_risk")
        .in("id", scoreIds);

      if (protectedError) {
        return NextResponse.json({ error: "Failed to compute revenue protected", details: protectedError }, { status: 500 });
      }

      revenueProtected = (protectedScores ?? []).reduce(
        (sum, s) => sum + Number(s.revenue_at_risk ?? 0),
        0
      );
    }

    const completedInterventions = completedInterventionsResult.data?.length ?? 0;
    const followupsCompleted = followupsCompletedResult.count ?? 0;
    const followupsMissed = followupsMissedResult.count ?? 0;
    const workspaceName = workspaceResult.data.name;
    const nextActionPlan = getNextActionPlan(dominantPattern);

    const reportSummary = [
      `${activeScores.length} open opportunities.`,
      `${dealsAtRisk} at risk.`,
      `$${Math.round(revenueAtRisk).toLocaleString()} in decay.`,
      `${completedInterventions} interventions completed this period.`,
    ].join(" ");

    const reportBody = buildReportBody({
      workspaceName,
      periodStart,
      periodEnd,
      report_type,
      openOpportunities: activeScores.length,
      dealsAtRisk,
      revenueAtRisk,
      revenueProtected,
      completedInterventions,
      followupsCompleted,
      followupsMissed,
      dominantPattern,
      nextActionPlan,
    });

    const { data: report, error: insertError } = await supabase
      .schema("drift")
      .from("reports")
      .insert({
        workspace_id: workspaceId,
        report_type,
        scope_type,
        scope_id: scope_id ?? null,
        period_start: periodStart,
        period_end: periodEnd,
        generated_by,
        revenue_protected: revenueProtected,
        revenue_at_risk: revenueAtRisk,
        followups_completed: followupsCompleted,
        followups_missed: followupsMissed,
        deals_at_risk: dealsAtRisk,
        completed_interventions: completedInterventions,
        dominant_drift_pattern: dominantPattern,
        next_action_plan: nextActionPlan,
        report_summary: reportSummary,
        report_body: reportBody,
      })
      .select("*")
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: "Failed to save report", details: insertError },
        { status: 500 }
      );
    }

    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Unexpected report generation error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
