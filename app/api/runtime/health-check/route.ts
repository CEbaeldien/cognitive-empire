import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function POST(req: Request) {
  const body = await req.json();
  // Accept health_status or status as the health field name
  const { system_id, health_status: hs, status, sync_status, issues_found, notes } = body;
  const health = hs ?? status;

  if (!system_id || !health) {
    return NextResponse.json(
      { error: "Missing required fields: system_id, status" },
      { status: 400 }
    );
  }

  const client = sb();
  const now    = new Date().toISOString();

  const { data, error } = await client
    .from("runtime_health_checks")
    .insert({
      system_id,
      health_status: health,
      sync_status:   sync_status ?? "unknown",
      notes:         notes       ?? null,
      checked_by:    null,
      metadata:      issues_found ? { issues_found } : {},
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { error: sysErr } = await client
    .from("runtime_systems")
    .update({ health_status: health, last_health_check: now })
    .eq("id", system_id);

  if (sysErr) return NextResponse.json({ error: sysErr.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
