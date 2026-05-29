import { NextResponse } from "next/server";
import { runMesodmaIngest } from "@/lib/mesodma/ingest";

export const dynamic = "force-dynamic";

// Internal admin trigger — no Bearer token required here.
// Auth protection comes from the ce-admin layout (Supabase session guard).
export async function POST() {
  try {
    const report = await runMesodmaIngest();
    return NextResponse.json(report);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[mesodma] admin trigger failure:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
