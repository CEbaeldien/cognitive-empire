import OpenAI from "openai";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SYSTEM_PROMPT =
  "You are a CE Signal analyst. CE Signals are doctrine-governed structural intelligence — not news summaries. Generate two fields:\n\n" +
  "SUMMARY: 2-3 sentences. What happened, stated plainly and structurally. No marketing language. No hype. State the development as fact.\n\n" +
  "STRUCTURAL IMPLICATION: 2-3 sentences. The structural implication of this development for intelligence abundance, human judgment, or operational continuity. Connect to CE doctrine where relevant. No fluff.";

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY not configured" }, { status: 500 });
  }

  let title: string, content: string;
  try {
    const body = await req.json();
    title   = String(body.title   ?? "").trim();
    content = String(body.content ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const userMessage =
    `Raw item title: ${title}\n\nContent: ${content || "(no content available)"}\n\n` +
    `Respond with JSON only, no markdown, no backticks: {"summary": "...", "implication": "..."}`;

  try {
    const openai = new OpenAI();
    const completion = await openai.chat.completions.create({
      model:       "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user",   content: userMessage },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    let parsed: { summary?: string; implication?: string };
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { error: "Model returned non-JSON response", raw },
        { status: 502 }
      );
    }

    const summary    = String(parsed.summary    ?? "").trim();
    const implication = String(parsed.implication ?? "").trim();

    if (!summary || !implication) {
      return NextResponse.json(
        { error: "Model returned incomplete fields", raw },
        { status: 502 }
      );
    }

    return NextResponse.json({ summary, implication });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
