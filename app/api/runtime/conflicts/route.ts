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
  const type   = searchParams.get("type");
  const limit  = Math.min(200, parseInt(searchParams.get("limit")  ?? "50", 10));
  const offset =              parseInt(searchParams.get("offset") ?? "0",  10);

  let q = sb()
    .from("runtime_conflicts")
    .select("*", { count: "exact" })
    .order("detected_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) q = q.eq("status", status);
  if (type)   q = q.eq("type",   type);

  const { data, error, count } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ conflicts: data ?? [], total: count ?? 0 });
}
