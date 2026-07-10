// Shared render pipeline used by both scripts/render-brief.mjs (single brief)
// and scripts/render-queue.js (batch). Fetch/parse/TTS/duration/bundle+render
// logic lives here exactly once.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { parseFile } from "music-metadata";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(__dirname, "..", "..");

export function loadEnvLocal() {
  const envPath = path.join(ROOT, ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const BEAT_GAP_FRAMES = Math.round(0.4 * FPS); // 400ms breathing gap after each beat
export const CLOSE_HOLD_FRAMES = 24; // extra hold on the doctrine close beat
export const MAX_CARD_WORDS = 28; // beats longer than this split into rhythm cards

export const BEAT_ORDER = ["hook", "claim", "example", "move", "close"];
const BAND_SECONDS = [3, 12, 30, 30, 15]; // widths of SECOND 0-3/3-15/15-45/45-75/75-90

export const TTS_VOICE = "onyx";
export const TTS_MODEL = "gpt-4o-mini-tts";
export const TTS_INSTRUCTIONS =
  "Calm, direct, measured delivery. Grounded and structural, like an operator briefing another operator. Not an announcer, not hype, no artificial excitement or upspeak.";

export function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

export function assertRenderable(row) {
  if (row.format !== "short") {
    throw new Error(`Brief ${row.id} is format "${row.format}", expected "short"`);
  }
  if (!row.output || !row.output.trim()) {
    throw new Error(`Brief ${row.id} has no generated output yet`);
  }
}

export async function fetchBriefById(id) {
  const sb = getServiceClient();
  const { data, error } = await sb.from("content_briefs").select("*").eq("id", id).single();
  if (error || !data) throw new Error(`Brief ${id} not found: ${error?.message ?? "no row"}`);
  assertRenderable(data);
  return data;
}

// Splits the script into its five beats. Prefers the [bracket] shot-direction
// markers the generator writes as segment boundaries; falls back to a
// proportional split over the SECOND 0-3/3-15/15-45/45-75/75-90 timing bands
// when the bracket count doesn't cleanly produce five chunks.
export function parseSegments(raw) {
  const bracketLine = /^\s*\[([^\]]+)\]\s*$/;
  const lines = raw.split("\n");
  const chunks = [];
  let current = null;

  for (const line of lines) {
    const m = line.match(bracketLine);
    if (m) {
      if (current) chunks.push(current);
      current = { text: "" };
    } else if (current) {
      current.text += (current.text ? "\n" : "") + line;
    } else if (line.trim()) {
      current = { text: line };
    }
  }
  if (current) chunks.push(current);

  const withText = chunks.map((c) => c.text.trim()).filter((t) => t.length > 0);

  if (withText.length === 5) {
    return withText.map((text, i) => ({ type: BEAT_ORDER[i], text }));
  }

  const narration = withText.length ? withText.join(" ") : raw.replace(bracketLine, " ").trim();
  const words = narration.split(/\s+/).filter(Boolean);
  const totalSeconds = BAND_SECONDS.reduce((a, b) => a + b, 0);

  let cursor = 0;
  const segments = BAND_SECONDS.map((secs, i) => {
    const isLast = i === BAND_SECONDS.length - 1;
    const count = isLast ? words.length - cursor : Math.round((secs / totalSeconds) * words.length);
    const slice = words.slice(cursor, cursor + count);
    cursor += count;
    return { type: BEAT_ORDER[i], text: slice.join(" ") };
  });

  return segments.filter((s) => s.text.length > 0);
}

function splitSentences(text) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// Splits a beat's text into 2-3 sequential "rhythm cards" at sentence
// boundaries when it's too long for one dense screen. Never shrinks text to
// fit — splitting into beats of its own is the fix, per the visual doctrine.
export function splitIntoCards(text, maxWords = MAX_CARD_WORDS) {
  const totalWords = text.split(/\s+/).filter(Boolean).length;
  if (totalWords <= maxWords) return [text];

  const sentences = splitSentences(text);
  if (sentences.length <= 1) return [text];

  const targetChunks = totalWords > maxWords * 2 ? 3 : 2;
  const wordsPerChunk = totalWords / targetChunks;

  const chunks = [];
  let current = [];
  let currentWords = 0;
  for (const sentence of sentences) {
    const sWords = sentence.split(/\s+/).filter(Boolean).length;
    if (currentWords > 0 && currentWords + sWords > wordsPerChunk * 1.15 && chunks.length < targetChunks - 1) {
      chunks.push(current.join(" "));
      current = [];
      currentWords = 0;
    }
    current.push(sentence);
    currentWords += sWords;
  }
  if (current.length) chunks.push(current.join(" "));
  return chunks.filter((c) => c.trim().length > 0);
}

// Allocates each card a slice of the beat's audio frames proportional to its
// word count; the last card absorbs rounding remainder plus the trailing gap.
function allocateCardDurations(cardTexts, audioFrames, gapFrames) {
  const wordCounts = cardTexts.map((t) => t.split(/\s+/).filter(Boolean).length);
  const totalWords = wordCounts.reduce((a, b) => a + b, 0);
  const durations = wordCounts.map((w) => Math.max(1, Math.round((w / totalWords) * audioFrames)));
  const allocated = durations.slice(0, -1).reduce((a, b) => a + b, 0);
  durations[durations.length - 1] = Math.max(1, audioFrames - allocated) + gapFrames;
  return durations;
}

async function synthesizeSegment(openai, text, outDir, index) {
  const response = await openai.audio.speech.create({
    model: TTS_MODEL,
    voice: TTS_VOICE,
    input: text,
    instructions: TTS_INSTRUCTIONS,
    response_format: "mp3",
  });
  const buffer = Buffer.from(await response.arrayBuffer());
  const filePath = path.join(outDir, `segment-${index}.mp3`);
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

async function getMp3DurationSeconds(filePath) {
  const meta = await parseFile(filePath);
  return meta.format.duration ?? 0;
}

// Synthesizes TTS per beat and builds the card timeline consumed by the
// Remotion composition: one audio file per beat, 1-3 text cards per beat.
export async function buildBeats(rawOutput, audioDir) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const segments = parseSegments(rawOutput);
  if (segments.length === 0) {
    throw new Error("Could not parse any segments from this brief's output.");
  }

  const built = [];
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const filePath = await synthesizeSegment(openai, seg.text, audioDir, i);
    const durationSeconds = await getMp3DurationSeconds(filePath);
    const audioFrames = Math.round(durationSeconds * FPS);
    const gapFrames = seg.type === "close" ? BEAT_GAP_FRAMES + CLOSE_HOLD_FRAMES : BEAT_GAP_FRAMES;

    const cardTexts = splitIntoCards(seg.text);
    const cardDurations = allocateCardDurations(cardTexts, audioFrames, gapFrames);
    const cards = cardTexts.map((text, idx) => ({ text, durationInFrames: cardDurations[idx] }));

    built.push({
      type: seg.type,
      audioFile: path.basename(filePath),
      durationInFrames: audioFrames + gapFrames,
      cards,
    });
  }
  return built;
}

export function slugify(title, id) {
  const base = (title || id)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${base}-${id.slice(0, 8)}`;
}

// Full pipeline for one brief: TTS -> card timeline -> Remotion bundle+render.
// Returns the absolute path of the rendered MP4.
export async function renderBrief(brief) {
  const audioDir = path.join(ROOT, "outputs", "audio", brief.id);
  fs.mkdirSync(audioDir, { recursive: true });

  const beats = await buildBeats(brief.output, audioDir);
  const totalFrames = beats.reduce((sum, b) => sum + b.durationInFrames, 0);

  const bundleLocation = await bundle({
    entryPoint: path.join(ROOT, "remotion", "index.ts"),
    publicDir: audioDir,
  });

  const inputProps = { segments: beats, fps: FPS, width: WIDTH, height: HEIGHT };

  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: "BriefVideo",
    inputProps,
  });

  const videoDir = path.join(ROOT, "outputs", "videos");
  fs.mkdirSync(videoDir, { recursive: true });
  const outputLocation = path.join(videoDir, `${slugify(brief.title, brief.id)}.mp4`);

  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: "h264",
    outputLocation,
    inputProps,
  });

  return { outputLocation, totalFrames, totalSeconds: totalFrames / FPS };
}
