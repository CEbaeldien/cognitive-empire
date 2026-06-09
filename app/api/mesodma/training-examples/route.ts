import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function GET(req: NextRequest) {
  const sp              = req.nextUrl.searchParams;
  const example_category = sp.get("example_category");
  const limit  = Math.min(200, parseInt(sp.get("limit")  ?? "100", 10));
  const offset =               parseInt(sp.get("offset") ?? "0",   10);

  let q = sb()
    .from("mesodma_training_examples")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (example_category) q = q.eq("example_category", example_category);

  const { data, error, count } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ examples: data ?? [], total: count ?? 0 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.title?.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const { data, error } = await sb()
    .from("mesodma_training_examples")
    .insert({
      title:                    body.title.trim(),
      input_text:               body.input_text?.trim() || null,
      source_type:              body.source_type || null,
      evidence_type:            body.evidence_type || null,
      expected_route:           body.expected_route || null,
      expected_noise_level:     body.expected_noise_level || null,
      expected_signal_potential: body.expected_signal_potential || null,
      expected_reasoning:       body.expected_reasoning?.trim() || null,
      lesson:                   body.lesson?.trim() || null,
      example_category:         body.example_category || null,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
