export const runtime    = "edge";
export const maxDuration = 30;

import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { buildPrompt, parseTitleAndOutput, TOKEN_LIMITS, type Format } from "@/lib/content/prompts";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

async function patchBrief(id: string, fields: Record<string, string | null>) {
  const url  = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/content_briefs?id=eq.${id}`;
  const key  = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const resp = await fetch(url, {
    method:  "PATCH",
    headers: {
      "Content-Type":  "application/json",
      "apikey":        key,
      "Authorization": `Bearer ${key}`,
      "Prefer":        "return=minimal",
    },
    body: JSON.stringify(fields),
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`PATCH ${resp.status}: ${txt.slice(0, 200)}`);
  }
}

async function callClaude(systemPrompt: string, maxTokens: number): Promise<string> {
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method:  "POST",
    headers: {
      "content-type":    "application/json",
      "x-api-key":       process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model:      "claude-sonnet-4-6",
      max_tokens: maxTokens,
      system:     systemPrompt,
      messages:   [{ role: "user", content: "Generate." }],
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Anthropic API ${resp.status}: ${errText.slice(0, 300)}`);
  }

  const json = await resp.json() as { content: { type: string; text: string }[] };
  return json.content?.[0]?.text ?? "";
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

  // Respond immediately — Claude generation runs in after() within the 30s Edge window.
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
      const raw = await callClaude(
        buildPrompt(format, topic, notes ?? ""),
        TOKEN_LIMITS[format]
      );
      const { title, output } = parseTitleAndOutput(raw);
      await patchBrief(id, { title, output });
    } catch (err) {
      console.error(`Worker [${id}]: generation error`, (err as Error).message);
      await patchBrief(id, { output: `ERROR: ${(err as Error).message}` }).catch(() => {});
    }
  });

  return NextResponse.json({ queued: true }, { status: 202 });
}
