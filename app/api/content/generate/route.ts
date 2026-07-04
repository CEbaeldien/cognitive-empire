import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { VALID_FORMATS, type Format } from "@/lib/content/prompts";

export const maxDuration = 10;

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  let body: { topic?: string; notes?: string; formats?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const { topic, notes, formats } = body;

  if (!topic?.trim()) {
    return NextResponse.json({ error: "topic is required" }, { status: 400 });
  }

  const validFormats = (formats ?? []).filter((f): f is Format => VALID_FORMATS.has(f as Format));
  if (validFormats.length === 0) {
    return NextResponse.json(
      { error: "at least one valid format required (short|longform|thumbnail_brief|linkedin)" },
      { status: 400 }
    );
  }

  const sb        = getServiceClient();
  const topicText = topic.trim();
  const notesText = notes?.trim() || null;

  // Insert all rows immediately with status='generating'
  const insertResults = await Promise.all(
    validFormats.map(fmt =>
      sb.rpc("insert_content_brief", {
        p_topic:  topicText,
        p_notes:  notesText,
        p_format: fmt,
        p_title:  null,
        p_output: null,
        p_status: "generating",
      })
    )
  );

  const rows: { id: string; format: Format; status: string }[] = [];
  const workerIds: string[] = [];

  for (let i = 0; i < insertResults.length; i++) {
    const { data, error } = insertResults[i];
    if (error || !data) {
      console.error(`Insert failed for ${validFormats[i]}:`, error?.message);
      continue;
    }
    const row = data as { id: string };
    rows.push({ id: row.id, format: validFormats[i], status: "generating" });
    workerIds.push(row.id);
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: "all inserts failed" }, { status: 500 });
  }

  // Fire workers after the response is sent — each worker responds immediately and
  // does the OpenAI call in its own after() so this after() completes in ~300ms.
  const workerUrl = new URL("/api/content/worker", new URL(req.url).origin).toString();

  after(async () => {
    await Promise.all(
      workerIds.map(id =>
        fetch(workerUrl, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ id }),
        }).catch(e => console.error(`Worker fire failed for ${id}:`, (e as Error).message))
      )
    );
  });

  return NextResponse.json({ rows }, { status: 202 });
}
