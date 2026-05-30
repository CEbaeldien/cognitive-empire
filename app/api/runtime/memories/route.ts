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
  const type             = searchParams.get("type");
  const confidence       = searchParams.get("confidence");
  const lifecycle_status = searchParams.get("lifecycle_status");
  const limit            = Math.min(200, parseInt(searchParams.get("limit")  ?? "50", 10));
  const offset           =              parseInt(searchParams.get("offset") ?? "0",  10);

  let q = sb()
    .from("runtime_memories")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (type)             q = q.eq("type",             type);
  if (confidence)       q = q.eq("confidence",       confidence);
  if (lifecycle_status) q = q.eq("lifecycle_status", lifecycle_status);

  const { data, error, count } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ memories: data ?? [], total: count ?? 0 });
}

export async function POST(req: Request) {
  const body = await req.json();
  const {
    type, confidence, lifecycle_status, source_type,
    title, content, tags, source_ref,
    entity_type, entity_id, expires_at, metadata, created_by,
  } = body;

  if (!type || !confidence || !lifecycle_status || !source_type || !title || !content) {
    return NextResponse.json(
      { error: "Missing required fields: type, confidence, lifecycle_status, source_type, title, content" },
      { status: 400 }
    );
  }

  const { data, error } = await sb()
    .from("runtime_memories")
    .insert({
      type,
      confidence,
      lifecycle_status,
      source_type,
      title,
      content,
      tags:        tags        ?? null,
      source_ref:  source_ref  ?? null,
      entity_type: entity_type ?? null,
      entity_id:   entity_id   ?? null,
      expires_at:  expires_at  ?? null,
      metadata:    metadata    ?? {},
      created_by:  created_by  ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
