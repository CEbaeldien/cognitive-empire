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
  const {
    category,
    title,
    summary,
    implication,
    raw_item_id,
    metadata,
    subcategory,
    what_changed,
    why_it_matters,
    structural_relevance,
    second_order_effect,
    impact_layer,
    pressure_vector_ids,
    doctrine_vector_ids,
  } = body;

  if (!category || !title || !summary || !implication) {
    return NextResponse.json(
      { error: "Missing required fields: category, title, summary, implication" },
      { status: 400 }
    );
  }

  const client = sb();

  const { data, error } = await client
    .from("signals")
    .insert({
      category,
      title,
      summary,
      implication,
      raw_item_id:          raw_item_id ?? null,
      metadata:             metadata ?? {},
      status:               "draft",
      subcategory:          subcategory?.trim() || null,
      what_changed:         what_changed?.trim() || null,
      why_it_matters:       why_it_matters?.trim() || null,
      structural_relevance: structural_relevance?.trim() || null,
      second_order_effect:  second_order_effect?.trim() || null,
      impact_layer:         impact_layer?.trim() || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const signalId = data.id;

  const junctionInserts: PromiseLike<unknown>[] = [];

  if (Array.isArray(pressure_vector_ids) && pressure_vector_ids.length > 0) {
    junctionInserts.push(
      client.from("signal_pressure_vectors").insert(
        pressure_vector_ids.map((vid: string) => ({ signal_id: signalId, vector_id: vid }))
      )
    );
  }

  if (Array.isArray(doctrine_vector_ids) && doctrine_vector_ids.length > 0) {
    junctionInserts.push(
      client.from("signal_doctrine_vectors").insert(
        doctrine_vector_ids.map((did: string) => ({ signal_id: signalId, doctrine_vector_id: did }))
      )
    );
  }

  if (junctionInserts.length > 0) await Promise.all(junctionInserts);

  return NextResponse.json(data, { status: 201 });
}
