import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { person_name, person_role, linkedin_url } = body;

  const update: Record<string, string | null> = {};
  if (typeof person_name === "string") update.person_name = person_name.trim() || null;
  if (typeof person_role === "string") update.person_role = person_role.trim() || null;
  if (typeof linkedin_url === "string") update.linkedin_url = linkedin_url.trim() || null;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "no fields to update" }, { status: 400 });
  }

  const client = await createClient();

  const { data, error } = await client
    .from("hunt_prospects")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
