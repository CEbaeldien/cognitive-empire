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

const VALID_STRENGTHS = ["weak", "moderate", "strong"];
const VALID_ACTIVITY_TYPES = [
  "call_completed",
  "email_sent",
  "meeting_scheduled",
  "proposal_sent",
  "proposal_resent",
  "decision_maker_contacted",
  "next_action_updated",
  "internal_review_completed",
  "note_added",
  "other",
];

// POST /api/drift/interventions/complete
// Marks an intervention completed and writes the execution evidence to drift.activities.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      interventionId,
      workspace_id,
      opportunity_id,
      account_id,
      activity_type,
      action_taken,
      summary_note,
      next_action,
      next_action_due_date,
      evidence_strength,
    } = body;

    if (!interventionId || !workspace_id || !opportunity_id || !account_id) {
      return NextResponse.json(
        { error: "Missing required fields: interventionId, workspace_id, opportunity_id, account_id" },
        { status: 400 }
      );
    }

    if (!action_taken || !summary_note || !next_action || !next_action_due_date || !evidence_strength || !activity_type) {
      return NextResponse.json(
        { error: "All evidence fields are required: activity_type, action_taken, summary_note, next_action, next_action_due_date, evidence_strength" },
        { status: 400 }
      );
    }

    if (!VALID_STRENGTHS.includes(evidence_strength)) {
      return NextResponse.json(
        { error: "evidence_strength must be one of: weak, moderate, strong" },
        { status: 400 }
      );
    }

    if (!VALID_ACTIVITY_TYPES.includes(activity_type)) {
      return NextResponse.json(
        { error: "Invalid activity_type" },
        { status: 400 }
      );
    }

    const { data: intervention, error: interventionError } = await supabase
      .schema("drift")
      .from("interventions")
      .update({
        status: "completed",
        action_taken,
        summary_note,
        next_action,
        next_action_due_date,
        evidence_strength,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", interventionId)
      .select("id")
      .single();

    if (interventionError) {
      return NextResponse.json(
        { error: "Failed to complete intervention", details: interventionError },
        { status: 500 }
      );
    }

    const { error: activityError } = await supabase
      .schema("drift")
      .from("activities")
      .insert({
        workspace_id,
        opportunity_id,
        account_id,
        activity_type,
        summary: action_taken,
        outcome: summary_note,
        next_action,
        next_action_due_date,
        evidence_strength,
        created_by: "founder",
      });

    if (activityError) {
      return NextResponse.json(
        { error: "Intervention completed but activity log failed", details: activityError },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Intervention completed and activity logged",
      intervention_id: intervention.id,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unexpected intervention completion error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
