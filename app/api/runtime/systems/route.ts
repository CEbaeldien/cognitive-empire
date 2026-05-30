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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type   = searchParams.get("type");
  const status = searchParams.get("status");
  const health = searchParams.get("health_status");

  let q = sb()
    .from("runtime_systems")
    .select(
      "id, name, system_slug, system_type, status, description, health_status, sync_status, " +
      "priority, risk_level, cost_type, billing_status, cost_monthly, public_url, admin_url, " +
      "owner, last_health_check, current_phase, next_action, created_at, updated_at"
    )
    .order("name", { ascending: true });

  if (type)   q = q.eq("system_type",  type);
  if (status) q = q.eq("status",       status);
  if (health) q = q.eq("health_status", health);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ systems: data ?? [] });
}

export async function POST(req: Request) {
  const body = await req.json();
  const {
    name, system_slug, system_type, status, description,
    health_status, sync_status, data_sensitivity, risk_level,
    cost_type, billing_status, payment_provider, cost_monthly,
    public_url, admin_url, owner, notes, priority, owner_role, environment,
  } = body;

  if (!name || !system_slug || !system_type || !status) {
    return NextResponse.json(
      { error: "Missing required fields: name, system_slug, system_type, status" },
      { status: 400 }
    );
  }

  const { data, error } = await sb()
    .from("runtime_systems")
    .insert({
      name,
      system_slug,
      system_type,
      status,
      description:      description      ?? null,
      health_status:    health_status    ?? "unknown",
      sync_status:      sync_status      ?? "unknown",
      data_sensitivity: data_sensitivity ?? "internal",
      risk_level:       risk_level       ?? null,
      cost_type:        cost_type        ?? "unknown",
      billing_status:   billing_status   ?? "unknown",
      payment_provider: payment_provider ?? "none",
      cost_monthly:     cost_monthly     ?? null,
      public_url:       public_url       ?? null,
      admin_url:        admin_url        ?? null,
      owner:            owner            ?? null,
      notes:            notes            ?? null,
      priority:         priority         ?? null,
      owner_role:       owner_role       ?? null,
      environment:      environment      ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
