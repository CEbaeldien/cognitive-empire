import { NextResponse } from "next/server";
import { runBatch } from "@/lib/mesodma/batch";

export const dynamic = "force-dynamic";
export const maxDuration = 10;

// Internal admin trigger — no Bearer token required.
// Auth protection comes from the ce-admin layout (Supabase session guard).
export async function POST() {
  try {
    const result = await runBatch();
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[mesodma] batch trigger failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
