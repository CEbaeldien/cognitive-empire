// Mesodma V2 batch extraction endpoint.
// POST: pulls ready_for_mesodma items → runs V2 atom extraction → logs mesodma_batch_run.
// GET:  returns V2 pipeline stats (factual_atoms counts by status).
// Rule 9: separate from /api/mesodma/batch to preserve V1 n8n workflow compatibility.

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { runAtomBatch } from "@/lib/mesodma/atom-extractor";

export const dynamic    = "force-dynamic";
export const maxDuration = 10; // Vercel Hobby hard limit

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function GET() {
  const client = sb();

  const [atom, noise, clustered, runs] = await Promise.all([
    client.from("factual_atoms").select("*", { count: "exact", head: true }).eq("status", "atom"),
    client.from("factual_atoms").select("*", { count: "exact", head: true }).eq("status", "noise"),
    client.from("cluster_atoms").select("atom_id", { count: "exact", head: true }),
    client.from("mesodma_batch_runs").select("id, status, output_count, noise_count, completed_at")
          .order("completed_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  return NextResponse.json({
    atoms_total:    (atom.count ?? 0) + (noise.count ?? 0),
    atoms_live:     atom.count ?? 0,
    noise_count:    noise.count ?? 0,
    clustered:      clustered.count ?? 0,
    last_batch_run: runs.data ?? null,
  });
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.MESODMA_API_KEY;
  if (!apiKey || req.headers.get("authorization") !== `Bearer ${apiKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const report = await runAtomBatch();
    return NextResponse.json(report);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[v2/batch] unexpected error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
