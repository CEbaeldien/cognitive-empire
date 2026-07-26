import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const maxDuration = 10; // Vercel Hobby plan max

// Server-to-server ingestion for n8n-sourced feeds that carry real founder
// identity (Product Hunt, Indie Hackers, funding announcements — see
// hunt-sourcing-v3 n8n node instructions). Uses the service-role client and
// bearer auth because n8n has no founder session to carry RLS's
// app_metadata.role='ce_admin' claim; every other /api/hunt/* route stays
// on the anon/RLS-gated client since those are all founder-session calls
// from the /hunt page itself.
//
// This route only validates + inserts. Tier/icp_score/linkedin_search_url
// are computed entirely by the hunt_prospects_gate trigger (supabase/
// migrations/20260719_hunt_tier_gate_v1.sql + 20260719b_hunt_sourcing_v3.sql)
// — nothing here duplicates that logic.

const SIGNAL_TYPES = ["hiring", "content", "launch", "funding", "manual"] as const;
type SignalType = (typeof SIGNAL_TYPES)[number];

type IngestItem = {
  source: string;
  signal_type?: SignalType;
  company_name?: string | null;
  company_size?: number | null;
  person_name?: string | null;
  person_role?: string | null;
  linkedin_url?: string | null;
  signal_text?: string | null;
  signal_url?: string | null;
};

const MAX_ITEMS = 50;

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function POST(req: Request) {
  const apiKey = process.env.HUNT_INGEST_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "HUNT_INGEST_API_KEY not configured" }, { status: 500 });
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${apiKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const items = Array.isArray(body?.items) ? (body.items as IngestItem[]) : null;

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "items array is required" }, { status: 400 });
  }
  if (items.length > MAX_ITEMS) {
    return NextResponse.json({ error: `max ${MAX_ITEMS} items per request` }, { status: 400 });
  }

  const invalidIndex = items.findIndex((it) => !it.source || typeof it.source !== "string");
  if (invalidIndex !== -1) {
    return NextResponse.json({ error: `item ${invalidIndex + 1} is missing source` }, { status: 400 });
  }

  const badTypeIndex = items.findIndex(
    (it) => it.signal_type !== undefined && !SIGNAL_TYPES.includes(it.signal_type)
  );
  if (badTypeIndex !== -1) {
    return NextResponse.json(
      { error: `item ${badTypeIndex + 1} has invalid signal_type (must be one of ${SIGNAL_TYPES.join(", ")})` },
      { status: 400 }
    );
  }

  const client = sb();
  const results: Array<{ ok: boolean; source: string; prospect_id?: string; skipped?: boolean; error?: string }> = [];

  for (const item of items) {
    const { data, error } = await client
      .from("hunt_prospects")
      .insert({
        source: item.source,
        signal_type: item.signal_type,
        status: "queued",
        company_name: item.company_name ?? null,
        company_size: item.company_size ?? null,
        person_name: item.person_name ?? null,
        person_role: item.person_role ?? null,
        linkedin_url: item.linkedin_url ?? null,
        signal_text: item.signal_text ?? null,
        signal_url: item.signal_url ?? null,
      })
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") {
        results.push({ ok: true, source: item.source, skipped: true, error: "duplicate, skipped" });
      } else {
        results.push({ ok: false, source: item.source, error: error.message });
      }
      continue;
    }

    results.push({ ok: true, source: item.source, prospect_id: data.id });
  }

  return NextResponse.json({ results });
}
