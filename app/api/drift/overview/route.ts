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

export async function GET() {
  try {
    const today = new Date().toISOString().split("T")[0];

    const [
      workspaceResult,
      membersResult,
      opportunitiesResult,
      scoresResult,
      completedCountResult,
      overdueFollowupsResult,
      pendingInterventionsResult,
    ] = await Promise.all([
      supabase
        .schema("drift")
        .from("workspaces")
        .select("id, name, type, status")
        .eq("id", workspaceId)
        .single(),

      supabase
        .schema("drift")
        .from("workspace_members")
        .select("id, email, role, status")
        .eq("workspace_id", workspaceId)
        .eq("status", "active"),

      supabase
        .schema("drift")
        .from("opportunities")
        .select(`
          id,
          title,
          value,
          currency,
          stage,
          probability,
          expected_close_date,
          status,
          last_activity_date,
          next_action,
          next_action_due_date,
          accounts (
            name,
            industry,
            contact_name
          )
        `)
        .eq("workspace_id", workspaceId)
        .eq("status", "open")
        .order("value", { ascending: false }),

      supabase
        .schema("drift")
        .from("scores")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("scored_at", { ascending: false }),

      supabase
        .schema("drift")
        .from("interventions")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .eq("status", "completed"),

      supabase
        .schema("drift")
        .from("followups")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .eq("status", "pending")
        .lt("due_date", today),

      supabase
        .schema("drift")
        .from("interventions")
        .select(`
          id,
          workspace_id,
          opportunity_id,
          title,
          reason,
          recommended_action,
          priority,
          status,
          created_at,
          opportunities (
            id,
            title,
            value,
            stage,
            accounts (
              id,
              name
            )
          )
        `)
        .eq("workspace_id", workspaceId)
        .eq("status", "pending")
        .order("created_at", { ascending: false }),
    ]);

    if (workspaceResult.error) {
      return NextResponse.json(
        { error: "Failed to fetch workspace", details: workspaceResult.error },
        { status: 500 }
      );
    }
    if (membersResult.error) {
      return NextResponse.json(
        { error: "Failed to fetch workspace members", details: membersResult.error },
        { status: 500 }
      );
    }
    if (opportunitiesResult.error) {
      return NextResponse.json(
        { error: "Failed to fetch opportunities", details: opportunitiesResult.error },
        { status: 500 }
      );
    }
    if (scoresResult.error) {
      return NextResponse.json(
        { error: "Failed to fetch scores", details: scoresResult.error },
        { status: 500 }
      );
    }
    if (completedCountResult.error) {
      return NextResponse.json(
        { error: "Failed to count completed interventions", details: completedCountResult.error },
        { status: 500 }
      );
    }
    if (overdueFollowupsResult.error) {
      return NextResponse.json(
        { error: "Failed to count overdue followups", details: overdueFollowupsResult.error },
        { status: 500 }
      );
    }
    if (pendingInterventionsResult.error) {
      return NextResponse.json(
        { error: "Failed to fetch interventions", details: pendingInterventionsResult.error },
        { status: 500 }
      );
    }

    const latestScoreByOpportunity = new Map();
    for (const score of scoresResult.data ?? []) {
      if (!latestScoreByOpportunity.has(score.opportunity_id)) {
        latestScoreByOpportunity.set(score.opportunity_id, score);
      }
    }

    const enrichedOpportunities = (opportunitiesResult.data ?? []).map((opportunity) => ({
      ...opportunity,
      score: latestScoreByOpportunity.get(opportunity.id) ?? null,
    }));

    const totalRevenueAtRisk = enrichedOpportunities.reduce(
      (sum, o) => sum + Number(o.score?.revenue_at_risk ?? 0),
      0
    );

    const criticalDrift = enrichedOpportunities.filter(
      (o) => o.score?.drift_level === "critical"
    ).length;

    return NextResponse.json({
      workspace: workspaceResult.data,
      workspace_members: membersResult.data ?? [],
      summary: {
        totalRevenueAtRisk,
        criticalDrift,
        overdueFollowups: overdueFollowupsResult.count ?? 0,
        openOpportunities: enrichedOpportunities.length,
        pendingInterventions: pendingInterventionsResult.data?.length ?? 0,
        completedInterventions: completedCountResult.count ?? 0,
      },
      opportunities: enrichedOpportunities,
      interventions: pendingInterventionsResult.data ?? [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unexpected Drift overview error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
