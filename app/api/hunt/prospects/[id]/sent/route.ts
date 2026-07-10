import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { draftId } = body;

  if (!draftId) {
    return NextResponse.json({ error: "draftId is required" }, { status: 400 });
  }

  const client = await createClient();
  const nowIso = new Date().toISOString();
  const followupIso = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();

  const { data: prospect, error: prospectError } = await client
    .from("hunt_prospects")
    .update({
      status: "sent",
      last_action_at: nowIso,
      next_followup_at: followupIso,
    })
    .eq("id", id)
    .select()
    .single();

  if (prospectError) return NextResponse.json({ error: prospectError.message }, { status: 500 });

  const { error: draftError } = await client
    .from("hunt_drafts")
    .update({ status: "sent", sent_at: nowIso })
    .eq("id", draftId);

  if (draftError) return NextResponse.json({ error: draftError.message }, { status: 500 });

  const { error: eventError } = await client
    .from("hunt_events")
    .insert({ prospect_id: id, event_type: "sent", payload: { draft_id: draftId } });

  if (eventError) return NextResponse.json({ error: eventError.message }, { status: 500 });

  return NextResponse.json(prospect);
}
