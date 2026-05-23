import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { calculateDriftScore } from "@/lib/drift/scoring";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
if (!serviceRoleKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

export async function POST() {
  try {
    const { data: opportunities, error: opportunitiesError } = await supabase
      .schema("drift")
      .from("opportunities")
      .select(
        "id, workspace_id, value, probability, stage, last_activity_date, next_action, next_action_due_date"
      )
      .eq("status", "open");

    if (opportunitiesError) {
      return NextResponse.json(
        { error: "Failed to fetch opportunities", details: opportunitiesError },
        { status: 500 }
      );
    }

    if (!opportunities || opportunities.length === 0) {
      return NextResponse.json({
        message: "No open opportunities found",
        scored: 0,
      });
    }

    const scoreRows = opportunities.map((opportunity) => {
      const score = calculateDriftScore(opportunity);

      return {
        workspace_id: opportunity.workspace_id,
        opportunity_id: opportunity.id,
        drift_score: score.drift_score,
        drift_level: score.drift_level,
        revenue_at_risk: score.revenue_at_risk,
        days_since_last_activity: score.days_since_last_activity,
        has_missing_next_action: score.has_missing_next_action,
        has_overdue_followup: score.has_overdue_followup,
        stage_age_days: score.stage_age_days,
        ignored_followups_count: score.ignored_followups_count,
        scoring_notes: score.scoring_notes,
      };
    });

    const { error: insertError } = await supabase
      .schema("drift")
      .from("scores")
      .insert(scoreRows);

    if (insertError) {
      return NextResponse.json(
        { error: "Failed to insert drift scores", details: insertError },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Drift scores generated",
      scored: scoreRows.length,
      scores: scoreRows,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unexpected Drift scoring error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}