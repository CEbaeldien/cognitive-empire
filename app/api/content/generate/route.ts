import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

export const maxDuration = 10;

type Format = "short" | "longform" | "thumbnail_brief" | "linkedin";

const VALID_FORMATS = new Set<Format>(["short", "longform", "thumbnail_brief", "linkedin"]);

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

// ── System prompts ────────────────────────────────────────────────────────────

const PROMPTS: Record<Format, string> = {

  short: `You write YouTube Short scripts for Cognitive Empire — a doctrine-governed operational intelligence firm. Positioning: 'Cognitive Empire prevents intelligent systems from collapsing under their own complexity.'

Topic: {topic}
Additional context: {notes}

FORMAT — pick whichever of these five Show templates fits the topic best, and follow its structure exactly:

SIGNAL BRIEF: one structural force → the dominant path winning within it → one operator move.
OPERATOR LAW: state the law → show the violation → show the consequence → give the move.
MAINTENANCE GRAVITY CLINIC: show a system mistake → name the gravity it creates → give the reduction move.
BUILD THE EMPIRE: what was built → what broke → what decision changed → what ships next.
MMCP SESSIONS: messy mission → reasoning → challenge → synthesis → approved move.

SCRIPT STRUCTURE (60-90 seconds):
SECOND 0-3 — Hook. Must use ONE of these four patterns:
  THE SCORE: open with a real number and what it means.
  THE CONTRAST: 'Everyone's talking about X. Nobody's talking about the thing underneath it.'
  THE SYMPTOM: name a pain the operator feels but hasn't named.
  THE RECEIPT: open with a real artifact — a session output, a convergence result, a state change.
SECOND 3-15 — The structural claim. Plain language.
SECOND 15-45 — Example or consequence. Concrete.
SECOND 45-75 — The operator move. Specific, executable today.
SECOND 75-90 — Close: one doctrine line. No 'follow for more.'

BANNED REGISTERS — automatic failure if present:
1. Hype ('this new AI is INSANE', 'game-changer')
2. Productivity porn ('10 prompts to 10x your output')
3. Doom ('AI will take every job')
Also banned: 'In today's world of AI', motivational fluff, fake urgency, invented statistics, fabricated case studies, generic corporate stock imagery language, brain/gears/circuit clipart concepts.

TONE: sharp, declarative, structural.

Write the script word-for-word with [shot direction] notes in brackets where useful. Output the script only. No preamble.`,

  longform: `You outline YouTube long-form videos (8-14 min) for Cognitive Empire. Positioning: 'Cognitive Empire prevents intelligent systems from collapsing under their own complexity.'

Topic: {topic}
Additional context: {notes}

Pick the best-fit Show template (SIGNAL BRIEF / OPERATOR LAW / MAINTENANCE GRAVITY CLINIC / BUILD THE EMPIRE / MMCP SESSIONS — same definitions as Short format) and structure through it.

STRUCTURE:
Cold open (0:00-0:20) — hook, Score/Contrast/Symptom/Receipt pattern, verbatim line.
Doctrine claim (0:20-1:30)
Real-world example (1:30-4:00)
Framework (4:00-9:00)
Operator move (9:00-11:00)
CE tie-in + close (11:00-13:00)

For each section: bullet talking points + one verbatim opening line.

BANNED REGISTERS: hype / productivity porn / doom. No invented data.

Output the outline only. No preamble.`,

  thumbnail_brief: `You write thumbnail design briefs for Cognitive Empire YouTube content.

Topic: {topic}
Additional context: {notes}

Visual style is FIXED and non-negotiable:
- Background: near-black (#03050A)
- Accent: muted gold (#C9A961)
- Text overlay: white, 5 words MAXIMUM
- NO clutter, NO stock-photo AI faces, NO generic clipart concepts (no brains, no gears, no circuits, no lightbulbs, no generic 'tech' imagery)
- The visual must relate directly and specifically to the topic's actual content, not a generic abstraction of 'technology' or 'intelligence'

Give exactly:
1. Text overlay (5 words max, all caps)
2. Visual concept — one concrete sentence describing what appears on screen, specific to this topic, using the color constraints above
3. What NOT to include (be specific to this topic)

Output only the brief. No preamble.`,

  linkedin: `You write LinkedIn posts for Dr. E, founder of Cognitive Empire Systems Ltd. Voice: operator-to-operator. Clear, sharp, non-hype, high-conviction.

Topic: {topic}
Additional context: {notes}

Pick the best-fit Show template. BUILD THE EMPIRE posts: what was built → what broke → what decision changed → what ships next. Never personal-life or personal-vision material.

STRUCTURE:
Line 1 — hook (Score/Contrast/Symptom/Receipt). Decides everything.
Body — short lines, white space, scannable, ≤1300 chars preferred.
End — one operator move, then one doctrine line. No engagement-bait questions, no 'follow for more.'
Hashtags — 3-5 from: #MaintenanceGravity #OperationalIntelligence #CognitiveEmpire #AIGovernance #JudgmentIsPower #SystemsThinking #AIOperations

BANNED: hype / productivity porn / doom / motivational fluff / broetry. No invented numbers.

Output the post only. No preamble.`,
};

// Title instruction appended to every prompt.
const TITLE_INSTRUCTION = `

Before writing the content, output exactly one header line:
TITLE: [a specific, structural title, max 60 characters — no hype words (insane, game-changer, shocking), structural and specific beats loud]

Then write the content starting on the very next line.`;

// ── POST handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: { topic?: string; notes?: string; format?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const { topic, notes, format } = body;

  if (!topic?.trim()) {
    return NextResponse.json({ error: "topic is required" }, { status: 400 });
  }
  if (!format || !VALID_FORMATS.has(format as Format)) {
    return NextResponse.json({ error: "valid format required (short|longform|thumbnail_brief|linkedin)" }, { status: 400 });
  }

  const openai    = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const sb        = getServiceClient();
  const notesText = notes?.trim() || "none provided";
  const topicText = topic.trim();

  const systemContent = PROMPTS[format as Format]
    .replace("{topic}", topicText)
    .replace("{notes}", notesText)
    + TITLE_INSTRUCTION;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.7,
    // 150 tokens: at worst-case 25 tok/sec = 6s + ~1.5s overhead = 7.5s, under Vercel 10s wall.
    max_tokens: 150,
    messages: [{ role: "system", content: systemContent }],
  });

  const raw = completion.choices[0]?.message?.content ?? "";

  // Parse TITLE: header from first non-blank line.
  const lines = raw.split("\n");
  let title       = "";
  let outputStart = 0;
  for (let i = 0; i < Math.min(lines.length, 4); i++) {
    const line = lines[i].trim();
    if (line.toUpperCase().startsWith("TITLE:")) {
      title       = line.slice(line.indexOf(":") + 1).trim();
      outputStart = i + 1;
      break;
    }
  }
  while (outputStart < lines.length && lines[outputStart].trim() === "") outputStart++;
  const output = lines.slice(outputStart).join("\n").trim();

  const { data, error } = await sb.rpc("insert_content_brief", {
    p_topic:  topicText,
    p_notes:  notesText !== "none provided" ? notesText : null,
    p_format: format,
    p_title:  title || null,
    p_output: output,
  });

  if (error) {
    console.error("content_briefs insert:", error);
    return NextResponse.json({ error: "db write failed", detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ brief: data }, { status: 201 });
}
