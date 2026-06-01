// Minimum role: service_role (bypasses RLS on dre_inbox)
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
  const category       = searchParams.get("category");
  const urgency        = searchParams.get("urgency");
  const approval_state = searchParams.get("approval_state");
  const limit          = Math.min(200, parseInt(searchParams.get("limit")  ?? "50", 10));
  const offset         =              parseInt(searchParams.get("offset") ?? "0",  10);

  let q = sb()
    .from("dre_inbox")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (category)       q = q.eq("category",       category);
  if (urgency)        q = q.eq("urgency",         urgency);
  if (approval_state) q = q.eq("approval_state",  approval_state);

  const { data, error, count } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ items: data ?? [], total: count ?? 0 });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { sender, source_alias, subject, body: msgBody, category, urgency, suggested_route, recommended_response, approval_state, fit_score } = body;

  const { data, error } = await sb()
    .from("dre_inbox")
    .insert({
      sender:               sender               ?? null,
      source_alias:         source_alias         ?? null,
      subject:              subject              ?? null,
      body:                 msgBody              ?? null,
      category:             category             ?? null,
      urgency:              urgency              ?? "medium",
      suggested_route:      suggested_route      ?? null,
      recommended_response: recommended_response ?? null,
      approval_state:       approval_state       ?? "needs_review",
      fit_score:            fit_score            ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
