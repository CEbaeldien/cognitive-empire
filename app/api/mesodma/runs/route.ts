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
  const sp          = req.nextUrl.searchParams;
  const module_name = sp.get("module_name");
  const error_flag  = sp.get("error_flag");
  const limit  = Math.min(200, parseInt(sp.get("limit")  ?? "50", 10));
  const offset =               parseInt(sp.get("offset") ?? "0",  10);

  let q = sb()
    .from("mesodma_runs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (module_name) q = q.eq("module_name", module_name);
  if (error_flag === "true")  q = q.eq("error_flag", true);
  if (error_flag === "false") q = q.eq("error_flag", false);

  const { data, error, count } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ runs: data ?? [], total: count ?? 0 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { data, error } = await sb()
    .from("mesodma_runs")
    .insert(body)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
