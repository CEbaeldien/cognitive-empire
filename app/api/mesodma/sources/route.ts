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
  const category         = searchParams.get("category");
  const trust_tier       = searchParams.get("trust_tier");
  const ingestion_status = searchParams.get("ingestion_status");

  let q = sb()
    .from("sources")
    .select("*")
    .order("priority", { ascending: false, nullsFirst: false })
    .order("name", { ascending: true });

  if (category)         q = q.eq("category", category);
  if (trust_tier)       q = q.eq("trust_tier", parseInt(trust_tier, 10));
  if (ingestion_status) q = q.eq("ingestion_status", ingestion_status);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ sources: data ?? [] });
}

export async function POST(req: Request) {
  const body = await req.json() as Record<string, string | number | null | undefined>;
  const { name, category, subcategory, source_type, endpoint_url,
          trust_tier, ingestion_mode, use_case, priority, notes } = body;

  if (!name || !category || !source_type) {
    return NextResponse.json(
      { error: "Missing required fields: name, category, source_type" },
      { status: 400 }
    );
  }

  const slug = String(name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  const { data, error } = await sb()
    .from("sources")
    .insert({
      name:             String(name),
      slug,
      category,
      source_type,
      endpoint_url:     endpoint_url ? String(endpoint_url).trim() || null : null,
      subcategory:      subcategory  ? String(subcategory).trim()  || null : null,
      trust_tier:       trust_tier   ? Number(trust_tier)  : null,
      ingestion_mode:   ingestion_mode ? String(ingestion_mode).trim() || null : null,
      ingestion_status: "active",
      use_case:         use_case ? String(use_case).trim() || null : null,
      priority:         priority  ? Number(priority) : 0,
      notes:            notes     ? String(notes).trim() || null : null,
      is_active:        true,
      fetch_interval:   3600,
      auth_config:      {},
      metadata:         {},
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
