// GET factual_atoms with filters — supports Noise Corner V2 data source swap.

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
  const status = sp.get("status");
  const limit  = Math.min(200, parseInt(sp.get("limit")  ?? "50", 10));
  const offset =               parseInt(sp.get("offset") ?? "0",  10);

  let q = sb()
    .from("factual_atoms")
    .select("id, atom_summary, status, evidence_type, distribution_stage, false_signal_risk, extraction_confidence, extracted_by_model, doctrine_version, created_at, sources(name)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) q = q.eq("status", status);

  const { data, error, count } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ atoms: data ?? [], total: count ?? 0 });
}
