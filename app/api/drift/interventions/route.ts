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

function getPriority(level: string | null) {
  if (level === "critical") return "high";
  if (level === "decaying") return "high";
  if (level === "watch") return "medium";
  return "low";
}

function getRecommendedAction(score: any) {
  if (score.has_overdue_followup) {
    return "Complete the overdue follow-up today and restore deal momentum.";
  }

  if (score.has_missing_next_action) {
    return "Define the next action immediately and assign a due date.";
  }

  if (score.days_since_last_activity >= 7) {
    return "Re-engage the opportunity with a direct check-in or decision request.";
  }

  return "Review opportunity state and confirm the next execution step.";
}

export async function POST() {
  try {
    const { data: scores, error: scoresError } = await supabase
      .schema("drift")
      .from("scores")
      .select(`
        id,
        workspace_id,
        opportunity_id,
        drift_score,
        drift_level,
        revenue_at_risk,
        has_missing_next_action,
        has_overdue_followup,
        days_since_last_activity,
        scoring_notes,
        opportunities (
          title
        )
      `)
      .eq("workspace_id", workspaceId)
      .in("drift_level", ["watch", "decaying", "critical"])
      .order("scored_at", { ascending: false });

    if (scoresError) {
      return NextResponse.json(
        { error: "Failed to fetch scores", details: scoresError },
        { status: 500 }
      );
    }

    if (!scores || scores.length === 0) {
      return NextResponse.json({
        message: "No qualifying scores found",
        created: 0,
      });
    }

    const seen = new Set<string>();
    const latestScores = scores.filter((score) => {
      if (seen.has(score.opportunity_id)) return false;
      seen.add(score.opportunity_id);
      return true;
    });

    const interventions = latestScores.map((score: any) => ({
      workspace_id: score.workspace_id,
      opportunity_id: score.opportunity_id,
      drift_score_id: score.id,
      title: `Intervene: ${score.opportunities?.title ?? "Opportunity"}`,
      reason: score.scoring_notes,
      recommended_action: getRecommendedAction(score),
      priority: getPriority(score.drift_level),
      status: "pending",
    }));

    const { error: insertError } = await supabase
      .schema("drift")
      .from("interventions")
      .insert(interventions);

    if (insertError) {
      return NextResponse.json(
        { error: "Failed to create interventions", details: insertError },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Drift interventions created",
      created: interventions.length,
      interventions,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unexpected Drift intervention error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}