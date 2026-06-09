import { NextResponse } from "next/server";
import { runMesodmaIngest } from "@/lib/mesodma/ingest";

export const maxDuration = 10; // Vercel Hobby plan max

export async function POST(req: Request) {
  // Require Bearer token matching MESODMA_API_KEY
  const apiKey = process.env.MESODMA_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "MESODMA_API_KEY not configured" },
      { status: 500 }
    );
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${apiKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const report = await runMesodmaIngest();
    return NextResponse.json(report);
  } catch (err) {
    // runMesodmaIngest should never throw, but guard anyway
    const message = err instanceof Error ? err.message : String(err);
    console.error("[mesodma] unexpected ingest failure:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
