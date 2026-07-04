export const runtime    = "edge";
export const maxDuration = 30;

import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { buildPrompt, parseTitleAndOutput, TOKEN_LIMITS, type Format } from "@/lib/content/prompts";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  let body: { id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const { id } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  // Respond immediately so the calling after() in /generate can complete quickly.
  // The actual OpenAI call runs in this route's own after() — up to 30s on Edge.
  after(async () => {
    const sb = getServiceClient();

    const { data: row, error: fetchErr } = await sb
      .from("content_briefs")
      .select("id, format, topic, notes")
      .eq("id", id)
      .single();

    if (fetchErr || !row) {
      console.error(`Worker [${id}]: row fetch failed`, fetchErr?.message);
      return;
    }

    const { format, topic, notes } = row as { format: Format; topic: string; notes: string | null };

    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await openai.chat.completions.create({
        model:      "gpt-4o-mini",
        temperature: 0.7,
        max_tokens:  TOKEN_LIMITS[format],
        messages:   [{ role: "system", content: buildPrompt(format, topic, notes ?? "") }],
      });

      const raw = completion.choices[0]?.message?.content ?? "";
      const { title, output } = parseTitleAndOutput(raw);

      await sb.rpc("update_content_brief", {
        p_id:     id,
        p_title:  title,
        p_output: output,
        p_status: "draft",
      });
    } catch (err) {
      console.error(`Worker [${id}]: generation error`, (err as Error).message);
      const updateErr = await sb.rpc("update_content_brief", {
        p_id:     id,
        p_title:  null,
        p_output: `Error: ${(err as Error).message}`,
        p_status: "error",
      });
      if (updateErr.error) console.error(`Worker [${id}]: status update failed`, updateErr.error.message);
    }
  });

  return NextResponse.json({ queued: true }, { status: 202 });
}
