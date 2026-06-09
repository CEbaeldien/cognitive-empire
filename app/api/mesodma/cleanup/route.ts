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

export async function POST(req: NextRequest) {
  const apiKey = process.env.MESODMA_API_KEY;
  if (!apiKey || req.headers.get("authorization") !== `Bearer ${apiKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const client = sb();

  const [rawResult, candidateResult] = await Promise.all([
    client
      .from("raw_items")
      .delete()
      .eq("signal_processing_status", "rejected_noise")
      .lt("created_at", cutoff)
      .select("id"),
    client
      .from("candidate_evidence")
      .delete()
      .eq("route", "reject_noise")
      .lt("created_at", cutoff)
      .select("id"),
  ]);

  return NextResponse.json({
    deleted_raw_items:   rawResult.data?.length        ?? 0,
    deleted_candidates:  candidateResult.data?.length  ?? 0,
    ...(rawResult.error      ? { raw_items_error:    rawResult.error.message     } : {}),
    ...(candidateResult.error ? { candidates_error:  candidateResult.error.message } : {}),
  });
}
