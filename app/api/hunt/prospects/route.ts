import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json();
  const { linkedin_url, person_name, person_role, company_name, signal_text, signal_url } = body;

  if (!linkedin_url || typeof linkedin_url !== "string" || !linkedin_url.trim()) {
    return NextResponse.json({ error: "linkedin_url is required" }, { status: 400 });
  }

  const client = await createClient();

  const { data, error } = await client
    .from("hunt_prospects")
    .insert({
      source: "manual",
      status: "queued",
      icp_score: null,
      linkedin_url: linkedin_url.trim(),
      person_name: person_name?.trim() || null,
      person_role: person_role?.trim() || null,
      company_name: company_name?.trim() || null,
      signal_text: signal_text?.trim() || null,
      signal_url: signal_url?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "already in pipeline" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
