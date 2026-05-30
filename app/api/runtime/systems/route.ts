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
      "id, name, slug, type, status, description, health_status, sync_status, " +
      "cost_type, billing_status, monthly_cost_usd, url, owner, last_health_check_at, created_at, updated_at"
    )
    .order("name", { ascending: true });

  if (type)   q = q.eq("type",          type);
  if (status) q = q.eq("status",        status);
  if (health) q = q.eq("health_status", health);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ systems: data ?? [] });
}

export async function POST(req: Request) {
  const body = await req.json();
  const {
    name, slug, type, status, description,
    health_status, sync_status, data_sensitivity, reversibility_class,
    cost_type, billing_status, payment_provider, monthly_cost_usd,
    url, owner, metadata,
  } = body;

  if (!name || !slug || !type || !status) {
    return NextResponse.json(
      { error: "Missing required fields: name, slug, type, status" },
      { status: 400 }
    );
  }

  const { data, error } = await sb()
    .from("runtime_systems")
    .insert({
      name,
      slug,
      type,
      status,
      description:         description         ?? null,
      health_status:       health_status       ?? "unknown",
      sync_status:         sync_status         ?? "unknown",
      data_sensitivity:    data_sensitivity    ?? "internal",
      reversibility_class: reversibility_class ?? null,
      cost_type:           cost_type           ?? "unknown",
      billing_status:      billing_status      ?? "unknown",
      payment_provider:    payment_provider    ?? "unknown",
      monthly_cost_usd:    monthly_cost_usd    ?? null,
      url:                 url                 ?? null,
      owner:               owner               ?? null,
      metadata:            metadata            ?? {},
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
