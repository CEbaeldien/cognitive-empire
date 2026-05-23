import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
if (!serviceRoleKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

export async function GET() {
  try {
    const { data: opportunities, error: opportunitiesError } = await supabase
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
      .eq("status", "open")
      .order("value", { ascending: false });

    if (opportunitiesError) {
      return NextResponse.json(
        {
          error: "Failed to fetch opportunities",
          details: opportunitiesError,
        },
        { status: 500 }
      );
    }

    const { data: scores, error: scoresError } = await supabase
      .schema("drift")
      .from("scores")
      .select("*")
      .order("scored_at", { ascending: false });

    if (scoresError) {
      return NextResponse.json(
        {
          error: "Failed to fetch scores",
          details: scoresError,
        },
        { status: 500 }
      );
    }

        // Count completed interventions separately.
    // This gives the dashboard an execution-progress metric.
    const { count: completedInterventions, error: completedInterventionsError } =
      await supabase
        .schema("drift")
        .from("interventions")
        .select("*", { count: "exact", head: true })
        .eq("status", "completed");

    if (completedInterventionsError) {
      return NextResponse.json(
        {
          error: "Failed to count completed interventions",
          details: completedInterventionsError,
        },
        { status: 500 }
      );
    }
    
    const latestScoreByOpportunity = new Map();

    for (const score of scores ?? []) {
      if (!latestScoreByOpportunity.has(score.opportunity_id)) {
        latestScoreByOpportunity.set(score.opportunity_id, score);
      }
    }

    const enrichedOpportunities = (opportunities ?? []).map((opportunity) => {
      const score = latestScoreByOpportunity.get(opportunity.id) ?? null;

      return {
        ...opportunity,
        score,
      };
    });

    const totalRevenueAtRisk = enrichedOpportunities.reduce(
      (sum, opportunity) =>
        sum + Number(opportunity.score?.revenue_at_risk ?? 0),
      0
    );

    const criticalDrift = enrichedOpportunities.filter(
      (opportunity) => opportunity.score?.drift_level === "critical"
    ).length;

    const overdueFollowups = enrichedOpportunities.filter((opportunity) => {
      if (!opportunity.next_action_due_date) return false;

      const dueDate = new Date(opportunity.next_action_due_date);
      const today = new Date();

      dueDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      return dueDate < today;
    }).length;

    const { data: interventions, error: interventionsError } = await supabase
      .schema("drift")
      .from("interventions")
      .select(`
        id,
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
            name
          )
        )
      `)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (interventionsError) {
      return NextResponse.json(
        {
          error: "Failed to fetch interventions",
          details: interventionsError,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      summary: {
  totalRevenueAtRisk,
  criticalDrift,
  overdueFollowups,
  openOpportunities: enrichedOpportunities.length,
  pendingInterventions: interventions?.length ?? 0,
  completedInterventions: completedInterventions ?? 0,
},
      opportunities: enrichedOpportunities,
      interventions: interventions ?? [],
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