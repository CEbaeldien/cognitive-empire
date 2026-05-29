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
  const status   = searchParams.get("status");
  const category = searchParams.get("category");
  const limit    = Math.min(200, parseInt(searchParams.get("limit")  ?? "50",  10));
  const offset   =              parseInt(searchParams.get("offset") ?? "0",   10);

  let q = sb()
    .from("signals")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status)   q = q.eq("status",   status);
  if (category) q = q.eq("category", category);

  const { data, error, count } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ signals: data ?? [], total: count ?? 0 });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { category, title, summary, implication, raw_item_id, metadata } = body;

  if (!category || !title || !summary || !implication) {
    return NextResponse.json(
      { error: "Missing required fields: category, title, summary, implication" },
      { status: 400 }
    );
  }

  const { data, error } = await sb()
    .from("signals")
    .insert({
      category,
      title,
      summary,
      implication,
      raw_item_id: raw_item_id ?? null,
      metadata:    metadata ?? {},
      status:      "draft",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
