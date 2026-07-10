import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { edited_text } = body;

  if (typeof edited_text !== "string") {
    return NextResponse.json({ error: "edited_text is required" }, { status: 400 });
  }

  const client = await createClient();

  const { data, error } = await client
    .from("hunt_drafts")
    .update({ edited_text })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
