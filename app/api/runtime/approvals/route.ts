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
  const status = searchParams.get("status");
  const limit  = Math.min(200, parseInt(searchParams.get("limit")  ?? "50", 10));
  const offset =              parseInt(searchParams.get("offset") ?? "0",  10);

  let q = sb()
    .from("runtime_approvals")
    .select("*", { count: "exact" })
    .order("requested_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) q = q.eq("status", status);

  const { data, error, count } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ approvals: data ?? [], total: count ?? 0 });
}

export async function POST(req: Request) {
  const body = await req.json();
  const {
    entity_type, entity_id, reversibility_class, impact_level, title,
    description, requested_by, expires_at, metadata,
  } = body;

  if (!entity_type || !entity_id || !reversibility_class || !impact_level || !title) {
    return NextResponse.json(
      { error: "Missing required fields: entity_type, entity_id, reversibility_class, impact_level, title" },
      { status: 400 }
    );
  }

  const { data, error } = await sb()
    .from("runtime_approvals")
    .insert({
      entity_type,
      entity_id,
      reversibility_class,
      impact_level,
      title,
      status:       "pending",
      description:  description  ?? null,
      requested_by: requested_by ?? null,
      reviewed_by:  null,
      reviewed_at:  null,
      notes:        null,
      expires_at:   expires_at   ?? null,
      metadata:     metadata     ?? {},
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
