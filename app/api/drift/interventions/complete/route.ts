import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Server-side Supabase client.
// Uses service role because this is an internal admin action for now.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
if (!serviceRoleKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
  },
});

// POST /api/drift/interventions/complete
// Marks one intervention as completed with required execution evidence.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      interventionId,
      action_taken,
      summary_note,
      next_action,
      next_action_due_date,
      evidence_strength,
    } = body;

    if (!interventionId) {
      return NextResponse.json(
        { error: "Missing interventionId" },
        { status: 400 }
      );
    }

    if (!action_taken || !summary_note || !next_action || !next_action_due_date || !evidence_strength) {
      return NextResponse.json(
        { error: "All evidence fields are required: action_taken, summary_note, next_action, next_action_due_date, evidence_strength" },
        { status: 400 }
      );
    }

    const validStrengths = ["weak", "moderate", "strong"];
    if (!validStrengths.includes(evidence_strength)) {
      return NextResponse.json(
        { error: "evidence_strength must be one of: weak, moderate, strong" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
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
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        {
          error: "Failed to complete intervention",
          details: error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Intervention completed",
      intervention: data,
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