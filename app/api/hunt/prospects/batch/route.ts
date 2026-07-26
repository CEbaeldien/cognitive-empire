import { createClient } from "@/utils/supabase/server";
import { enrichPerson } from "@/lib/hunt/enrich";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MAX_ENTRIES = 10;

type BatchEntry = {
  linkedin_url?: string;
  person_name?: string;
  person_role?: string;
  company_name?: string;
  pasted_text?: string;
};

export async function POST(req: Request) {
  const body = await req.json();
  const entries = Array.isArray(body.entries) ? (body.entries as BatchEntry[]) : [];

  if (entries.length === 0) {
    return NextResponse.json({ error: "no entries provided" }, { status: 400 });
  }
  if (entries.length > MAX_ENTRIES) {
    return NextResponse.json({ error: `max ${MAX_ENTRIES} entries per batch` }, { status: 400 });
  }

  const invalidIndex = entries.findIndex((e) => !e.linkedin_url || !e.linkedin_url.trim());
  if (invalidIndex !== -1) {
    return NextResponse.json({ error: `entry ${invalidIndex + 1} is missing linkedin_url` }, { status: 400 });
  }

  const client = await createClient();
  const results: Array<{ ok: boolean; linkedin_url: string; prospect?: unknown; error?: string }> = [];

  for (const entry of entries) {
    const linkedin_url = entry.linkedin_url!.trim();
    let person_name = entry.person_name?.trim() || null;
    let person_role = entry.person_role?.trim() || null;
    let company_name = entry.company_name?.trim() || null;
    let signal_text = entry.pasted_text?.trim() || null;
    let enrichError: string | null = null;

    if (entry.pasted_text?.trim()) {
      try {
        const enriched = await enrichPerson(entry.pasted_text.trim());
        person_name = person_name ?? enriched.person_name;
        person_role = person_role ?? enriched.person_role;
        company_name = company_name ?? enriched.company_name;
        signal_text = enriched.signal_summary ?? signal_text;
      } catch (err) {
        enrichError = err instanceof Error ? err.message : String(err);
      }
    }

    const { data: prospect, error } = await client
      .from("hunt_prospects")
      .insert({
        source: "manual_batch",
        signal_type: "manual",
        status: "queued",
        linkedin_url,
        person_name,
        person_role,
        company_name,
        signal_text,
      })
      .select()
      .single();

    if (error) {
      results.push({
        ok: false,
        linkedin_url,
        error: error.code === "23505" ? "already in pipeline" : error.message,
      });
      continue;
    }

    if (enrichError) {
      await client.from("hunt_events").insert({
        prospect_id: prospect.id,
        event_type: "enrich_failed",
        payload: { error: enrichError },
      });
    }

    results.push({ ok: true, linkedin_url, prospect });
  }

  return NextResponse.json({ results });
}
