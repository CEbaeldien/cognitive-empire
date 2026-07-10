import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const client = await createClient();

  const { data: prospect, error: prospectError } = await client
    .from("hunt_prospects")
    .update({
      status: "closed_dead",
      rejected_reason: "principal_kill",
    })
    .eq("id", id)
    .select()
    .single();

  if (prospectError) return NextResponse.json({ error: prospectError.message }, { status: 500 });

  const { error: eventError } = await client
    .from("hunt_events")
    .insert({ prospect_id: id, event_type: "killed", payload: null });

  if (eventError) return NextResponse.json({ error: eventError.message }, { status: 500 });

  return NextResponse.json(prospect);
}
