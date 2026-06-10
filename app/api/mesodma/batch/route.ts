import { NextRequest, NextResponse } from "next/server";
import { getPendingBatch, getBatchStats } from "@/lib/mesodma/batch";

export const dynamic = "force-dynamic";
export const maxDuration = 10;

export async function GET() {
  try {
    const stats = await getBatchStats();
    return NextResponse.json(stats);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[mesodma] batch stats failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.MESODMA_API_KEY;
    if (!apiKey || req.headers.get("authorization") !== `Bearer ${apiKey}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const batch = await getPendingBatch();
    return NextResponse.json(batch);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[mesodma] batch failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
