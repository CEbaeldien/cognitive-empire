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
  const sp     = req.nextUrl.searchParams;
  const domain           = sp.get("domain");
  const route            = sp.get("route");
  const visibility_stage = sp.get("visibility_stage");
  const limit  = Math.min(200, parseInt(sp.get("limit")  ?? "50", 10));
  const offset =               parseInt(sp.get("offset") ?? "0",  10);

  let q = sb()
    .from("candidate_evidence")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (domain)           q = q.eq("domain",           domain);
  if (route)            q = q.eq("route",             route);
  if (visibility_stage) q = q.eq("visibility_stage",  visibility_stage);

  const { data, error, count } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ candidates: data ?? [], total: count ?? 0 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { data, error } = await sb()
    .from("candidate_evidence")
    .insert(body)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
