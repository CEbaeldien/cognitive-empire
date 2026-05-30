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

  // Insert health check record using actual DB columns
  const { data, error } = await client
    .from("runtime_health_checks")
    .insert({
      system_id,
      status:       health,
      check_type:   "manual",
      checked_by:   "founder",
      issues_found: issues_found ?? null,
      notes:        notes        ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Update the system's health and sync status + last check timestamp
  const systemPatch: Record<string, unknown> = { health_status: health, last_health_check: now };
  if (sync_status) systemPatch.sync_status = sync_status;

  const { error: sysErr } = await client
    .from("runtime_systems")
    .update(systemPatch)
    .eq("id", system_id);

  if (sysErr) return NextResponse.json({ error: sysErr.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
