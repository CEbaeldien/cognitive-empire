// Signal Intelligence synthesis trigger.
// POST: processes 1 mature cluster per call (Vercel Hobby constraint — see gate report).
// All candidates land as status='draft' in signals + review_queue. Nothing auto-publishes.

import { NextRequest, NextResponse } from "next/server";
import { runSynthesisPass } from "@/lib/mesodma/synthesis";

export const dynamic    = "force-dynamic";
export const maxDuration = 10;

export async function POST(req: NextRequest) {
  const apiKey = process.env.MESODMA_API_KEY;
  if (!apiKey || req.headers.get("authorization") !== `Bearer ${apiKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as { trigger_type?: string };
  const triggerType = (["threshold", "cycle", "manual"].includes(body.trigger_type ?? ""))
    ? (body.trigger_type as "threshold" | "cycle" | "manual")
    : "manual";

  try {
    const report = await runSynthesisPass(triggerType);
    return NextResponse.json(report);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[v2/synthesize] unexpected error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
