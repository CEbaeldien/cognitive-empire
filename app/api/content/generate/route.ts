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
  THE SYMPTOM: name a pain the operator feels but hasn't named. ('Your systems work. Nothing is owned. That's not stability — that's gravity.')
  THE RECEIPT: open with a real artifact — a session output, a convergence result, a state change.
SECOND 3-15 — The structural claim. Plain language.
SECOND 15-45 — Example or consequence. Concrete.
SECOND 45-75 — The operator move. Specific, executable today. Never 'start thinking about.'
SECOND 75-90 — Close: one doctrine line. No 'follow for more.' No 'link in bio' begging.

BANNED REGISTERS — automatic failure if present:
1. Hype ('this new AI is INSANE', 'game-changer')
2. Productivity porn ('10 prompts to 10x your output')
3. Doom ('AI will take every job')
Also banned: 'In today's world of AI', motivational fluff, fake urgency, invented statistics, fabricated case studies. Use only real CE data if citing numbers.

TONE: sharp, declarative, structural. A founder with a knife and a system. Deep enough to respect, simple enough to repeat.

Write the script word-for-word with [shot direction] notes in brackets where useful. Output the script only. No preamble.`,

  longform: `You outline YouTube long-form videos (8-14 min) for Cognitive Empire — doctrine-governed operational intelligence. Positioning: 'Cognitive Empire prevents intelligent systems from collapsing under their own complexity.'

Topic: {topic}
Additional context: {notes}

Pick the best-fit Show template (SIGNAL BRIEF / OPERATOR LAW / MAINTENANCE GRAVITY CLINIC / BUILD THE EMPIRE / MMCP SESSIONS — definitions as in the Short format) and structure the outline through it.

STRUCTURE:
Cold open (0:00-0:20) — hook using Score / Contrast / Symptom / Receipt pattern. Write this line verbatim.
Doctrine claim (0:20-1:30) — the structural thesis.
Real-world example (1:30-4:00) — concrete, current, verifiable.
Framework (4:00-9:00) — the CE concept in full. Formula, states, or protocol as applicable.
Operator move (9:00-11:00) — the week-one action sequence.
CE tie-in + close (11:00-13:00) — which live CE surface extends this (Signals / Maintenance Gravity tool / Orchestrator / Operator Kernel), one doctrine line to close.

For each section: bullet talking points + one verbatim opening line.

BANNED REGISTERS: hype / productivity porn / doom. No invented data. Real CE scores, sessions, and convergence results only.

Output the outline only. No preamble.`,

  thumbnail_brief: `You write YouTube thumbnail briefs for Cognitive Empire — doctrine-governed operational intelligence.

Topic: {topic}
Additional context: {notes}

A thumbnail brief is a visual design specification. Output exactly these four fields:

MAIN TEXT (≤5 words, all caps, readable at 360px thumbnail size):
VISUAL CONCEPT (what the camera or design surface shows — one concrete sentence):
EMOTION TARGET (one word: the feeling that makes the viewer click):
HOOK RATIONALE (one sentence: why this specific combination stops the scroll):

Visual style is fixed: near-black ground (#03050A), muted gold accent (#C9A961), white text 5 words maximum, no clutter, no stock-photo AI faces.

Output the brief only. No preamble.`,

  linkedin: `You write LinkedIn posts for Dr. E, founder of Cognitive Empire Systems Ltd — doctrine-governed operational intelligence. Voice: operator-to-operator. Clear, sharp, non-hype, high-conviction.

Topic: {topic}
Additional context: {notes}

Pick the best-fit Show template (definitions as in the Short format). BUILD THE EMPIRE posts follow: what was built → what broke → what decision changed → what ships next. Never include personal-life or personal-vision material — build logs only.

STRUCTURE:
Line 1 — hook (Score / Contrast / Symptom / Receipt pattern). This line decides everything. No throat-clearing.
Body — short lines, white space between thought units, scannable on mobile. ≤1,300 characters total preferred.
End — one operator move, then one doctrine line. No engagement-bait questions ('Agree?'), no 'follow for more.'
Hashtags — 3-5 from this set only: #MaintenanceGravity #OperationalIntelligence #CognitiveEmpire #AIGovernance #JudgmentIsPower #SystemsThinking #AIOperations

BANNED REGISTERS: hype / productivity porn / doom / motivational fluff / broetry escalation. No invented numbers — real CE data only.

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

  const generated = await (async () => {
    {
      const systemContent = PROMPTS[format as Format]
        .replace("{topic}", topicText)
        .replace("{notes}", notesText)
        + TITLE_INSTRUCTION;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.7,
        max_tokens: 250,
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
      // Skip blank lines between title and body.
      while (outputStart < lines.length && lines[outputStart].trim() === "") outputStart++;

      const output = lines.slice(outputStart).join("\n").trim();
      return { format: format as Format, title: title || null, output };
    }
  })();

  const { data, error } = await sb
    .from("content_briefs")
    .insert({
      topic:  topicText,
      notes:  notesText !== "none provided" ? notesText : null,
      format: generated.format,
      title:  generated.title,
      output: generated.output,
      status: "draft",
    })
    .select("id, topic, format, title, status, created_at")
    .single();

  if (error) {
    console.error("content_briefs insert:", error);
    return NextResponse.json({ error: "db write failed", detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ brief: data }, { status: 201 });
}
