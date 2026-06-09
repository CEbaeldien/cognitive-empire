import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import {
  buildNoiseFloodBlockerPrompt,
  buildEvidenceStructurerPrompt,
  buildDoctrineFilterPrompt,
  buildSkepticCheckPrompt,
} from "@/lib/mesodma/prompts";

export const dynamic = "force-dynamic";

// ANTHROPIC_API_KEY must be set in Vercel environment variables and .env.local
const ANTHROPIC_MODEL = "claude-sonnet-4-6-20251022";
const OPENAI_MODEL    = "gpt-4o-mini";

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

// ── Validation helpers ────────────────────────────────────────────────────────

const VALID_DOMAINS           = ["intelligence", "infrastructure", "governance_stability"] as const;
const VALID_SOURCE_TYPES      = ["research", "technical_docs", "api_changelog", "policy", "infrastructure", "funding", "deployment", "market", "news", "commentary"] as const;
const VALID_EVIDENCE_TYPES    = ["research_evidence", "technical_documentation", "api_change", "infrastructure_investment", "governance_update", "policy_shift", "deployment_evidence", "funding_pattern", "market_movement", "incident_or_failure", "commentary"] as const;
const VALID_VERIFICATION      = ["unverified", "partially_verified", "verified", "disputed"] as const;
const VALID_VISIBILITY        = ["upstream", "early_distribution", "mainstream_distribution", "saturated_noise", "unknown"] as const;
const VALID_RISK              = ["low", "medium", "high"] as const;
const VALID_SIGNAL_POTENTIALS = ["low", "medium", "high", "critical"] as const;

function clamp<T extends string>(val: unknown, valid: readonly T[], fallback: T): T {
  return valid.includes(val as T) ? (val as T) : fallback;
}

function safeNum(val: unknown): number | null {
  if (typeof val !== "number" || isNaN(val)) return null;
  return Math.min(1, Math.max(0, val));
}

// ── Log a module run (non-throwing) ──────────────────────────────────────────

async function logRun(params: {
  raw_item_id: string;
  candidate_evidence_id?: string | null;
  module_name: string;
  model_used: string;
  input_snapshot: Record<string, unknown>;
  output_json: Record<string, unknown>;
  route?: string | null;
  confidence?: number | null;
  error_flag: boolean;
}) {
  await sb().from("mesodma_runs").insert({
    raw_item_id:           params.raw_item_id,
    candidate_evidence_id: params.candidate_evidence_id ?? null,
    module_name:           params.module_name,
    model_used:            params.model_used,
    input_snapshot:        params.input_snapshot,
    output_json:           params.output_json,
    route:                 params.route ?? null,
    confidence:            params.confidence ?? null,
    error_flag:            params.error_flag,
  }).then(({ error }) => {
    if (error) console.error("[mesodma] logRun failed:", error.message);
  });
}

// ── OpenAI call ───────────────────────────────────────────────────────────────

async function callOpenAI(
  systemPrompt: string,
  userContent: string
): Promise<Record<string, unknown>> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  const res = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user",   content: userContent },
    ],
  });
  const raw = res.choices[0]?.message?.content;
  if (!raw) throw new Error("OpenAI returned empty content");
  return JSON.parse(raw) as Record<string, unknown>;
}

// ── Anthropic call (raw fetch per spec) ───────────────────────────────────────

async function callAnthropic(
  systemPrompt: string,
  userContent: string
): Promise<Record<string, unknown>> {
  // ANTHROPIC_API_KEY must be set in Vercel environment variables and .env.local
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model:      ANTHROPIC_MODEL,
      max_tokens: 2048,
      messages:   [{ role: "user", content: userContent }],
      system:     systemPrompt,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as Record<string, unknown>;
    throw new Error(`Anthropic ${res.status}: ${JSON.stringify(err)}`);
  }

  type AnthropicResponse = { content?: Array<{ type: string; text: string }> };
  const data = await res.json() as AnthropicResponse;
  const text = data.content?.[0]?.text;
  if (!text) throw new Error("Anthropic returned empty content");

  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error(`Anthropic response missing JSON. Got: ${text.slice(0, 200)}`);
  return JSON.parse(match[0]) as Record<string, unknown>;
}

// ── POST /api/mesodma/process ─────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as { raw_item_id?: string };
  const { raw_item_id } = body;

  if (!raw_item_id) {
    return NextResponse.json({ error: "raw_item_id is required" }, { status: 400 });
  }
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY not configured" }, { status: 500 });
  }
  // ANTHROPIC_API_KEY must be set in Vercel environment variables and .env.local
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

  const client = sb();

  type SourceJoin = { name: string; category: string; source_type: string } | null;
  type RawItemFull = {
    id: string;
    source_id: string;
    title: string;
    body: string | null;
    url: string | null;
    extracted_fields: Record<string, unknown> | null;
    sources: SourceJoin;
  };

  const { data: rawItem, error: itemErr } = await client
    .from("raw_items")
    .select("id, source_id, title, body, url, extracted_fields, sources(name, category, source_type)")
    .eq("id", raw_item_id)
    .single();

  if (itemErr || !rawItem) {
    return NextResponse.json({ error: "Raw item not found" }, { status: 404 });
  }

  const ri     = rawItem as unknown as RawItemFull;
  const exf    = (ri.extracted_fields ?? {}) as Record<string, unknown>;
  const source = ri.sources;

  const inputContent = [
    `Title: ${ri.title}`,
    ri.body    ? `Content: ${String(ri.body).slice(0, 4000)}` : "",
    exf.clean_summary ? `Extracted Summary: ${exf.clean_summary}` : "",
    ri.url     ? `URL: ${ri.url}` : "",
    source     ? `Source: ${source.name} (${source.category})` : "",
  ].filter(Boolean).join("\n\n");

  // === MODULE 1: NOISE FLOOD BLOCKER ========================================

  let noiseResult: Record<string, unknown>;
  try {
    noiseResult = await callOpenAI(buildNoiseFloodBlockerPrompt(), inputContent);
  } catch (e) {
    await logRun({ raw_item_id, module_name: "noise_flood_blocker", model_used: OPENAI_MODEL,
      input_snapshot: { title: ri.title }, output_json: { error: String(e) }, error_flag: true });
    await client.from("raw_items").update({ signal_processing_status: "mesodma_pending" }).eq("id", raw_item_id);
    return NextResponse.json({ error: `Noise Flood Blocker failed: ${e}` }, { status: 500 });
  }

  await logRun({ raw_item_id, module_name: "noise_flood_blocker", model_used: OPENAI_MODEL,
    input_snapshot: { title: ri.title, url: ri.url },
    output_json: noiseResult,
    route: noiseResult.route as string,
    confidence: safeNum(noiseResult.confidence),
    error_flag: false });

  const noiseRoute = noiseResult.route as string;

  if (noiseRoute === "reject_noise") {
    await client.from("raw_items").update({ signal_processing_status: "rejected_noise" }).eq("id", raw_item_id);
    return NextResponse.json({ route_taken: "rejected_noise",
      noise_level: noiseResult.noise_level,
      rejection_reason: noiseResult.rejection_reason,
      confidence: noiseResult.confidence });
  }
  if (noiseRoute === "needs_enrichment") {
    await client.from("raw_items").update({ signal_processing_status: "needs_enrichment" }).eq("id", raw_item_id);
    return NextResponse.json({ route_taken: "needs_enrichment",
      noise_level: noiseResult.noise_level,
      confidence: noiseResult.confidence });
  }

  // === MODULE 2: EVIDENCE STRUCTURER ========================================

  let evidenceResult: Record<string, unknown>;
  try {
    evidenceResult = await callOpenAI(buildEvidenceStructurerPrompt(), inputContent);
  } catch (e) {
    await logRun({ raw_item_id, module_name: "evidence_structurer", model_used: OPENAI_MODEL,
      input_snapshot: { title: ri.title }, output_json: { error: String(e) }, error_flag: true });
    await client.from("raw_items").update({ signal_processing_status: "mesodma_pending" }).eq("id", raw_item_id);
    return NextResponse.json({ error: `Evidence Structurer failed: ${e}` }, { status: 500 });
  }

  await logRun({ raw_item_id, module_name: "evidence_structurer", model_used: OPENAI_MODEL,
    input_snapshot: { title: ri.title },
    output_json: evidenceResult,
    confidence: safeNum(evidenceResult.confidence),
    error_flag: false });

  const { data: candidateRow, error: candErr } = await client
    .from("candidate_evidence")
    .insert({
      raw_item_id,
      source_id:           ri.source_id,
      domain:              clamp(evidenceResult.domain,              VALID_DOMAINS,        "intelligence"),
      subcategory:         (evidenceResult.subcategory as string)  || null,
      clean_summary:       (evidenceResult.clean_summary as string) || null,
      source_provenance:   (evidenceResult.source_provenance as string) || null,
      source_type:         clamp(evidenceResult.source_type,         VALID_SOURCE_TYPES,   "news"),
      evidence_type:       clamp(evidenceResult.evidence_type,       VALID_EVIDENCE_TYPES, "commentary"),
      entities_detected:   Array.isArray(evidenceResult.entities_detected)  ? evidenceResult.entities_detected  : [],
      numbers_extracted:   Array.isArray(evidenceResult.numbers_extracted)  ? evidenceResult.numbers_extracted  : [],
      claims_detected:     Array.isArray(evidenceResult.claims_detected)    ? evidenceResult.claims_detected    : [],
      verification_status: clamp(evidenceResult.verification_status, VALID_VERIFICATION,   "unverified"),
      visibility_stage:    clamp(evidenceResult.visibility_stage,    VALID_VISIBILITY,     "unknown"),
      duplicate_risk:      clamp(evidenceResult.duplicate_risk,      VALID_RISK,           "medium"),
      noise_level:         clamp(evidenceResult.noise_level,         VALID_RISK,           "medium"),
      route:               "candidate_evidence",
      confidence:          safeNum(evidenceResult.confidence),
    })
    .select("id")
    .single();

  if (candErr || !candidateRow) {
    return NextResponse.json({ error: `candidate_evidence insert failed: ${candErr?.message}` }, { status: 500 });
  }

  const candidateId = (candidateRow as { id: string }).id;

  // === MODULE 3: DOCTRINE FILTER ============================================

  const doctrineUserContent = JSON.stringify({
    raw_title: ri.title, raw_url: ri.url ?? null,
    source_name: source?.name ?? null, source_category: source?.category ?? null,
    ...evidenceResult,
  });

  let doctrineResult: Record<string, unknown>;
  try {
    doctrineResult = await callAnthropic(buildDoctrineFilterPrompt(), doctrineUserContent);
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    await logRun({ raw_item_id, candidate_evidence_id: candidateId,
      module_name: "doctrine_filter", model_used: ANTHROPIC_MODEL,
      input_snapshot: { raw_title: ri.title },
      output_json: { error: errMsg }, error_flag: true });
    await client.from("raw_items").update({ signal_processing_status: "mesodma_processed" }).eq("id", raw_item_id);
    return NextResponse.json({ route_taken: "candidate_evidence_stored",
      candidate_evidence_id: candidateId, error: `Doctrine Filter failed: ${errMsg}` });
  }

  await logRun({ raw_item_id, candidate_evidence_id: candidateId,
    module_name: "doctrine_filter", model_used: ANTHROPIC_MODEL,
    input_snapshot: { raw_title: ri.title, clean_summary: evidenceResult.clean_summary },
    output_json: doctrineResult,
    route: doctrineResult.recommended_route as string,
    confidence: safeNum(doctrineResult.confidence),
    error_flag: false });

  const signalPotential    = doctrineResult.signal_potential as string;
  const recommendedRoute   = doctrineResult.recommended_route as string;
  const doctrineConfidence = safeNum(doctrineResult.confidence) ?? 0.5;
  const shouldRunSkeptic   = ["medium", "high", "critical"].includes(signalPotential)
                              && recommendedRoute !== "reject_noise";

  let finalRoute      = recommendedRoute;
  let finalConfidence = doctrineConfidence;
  let skepticResult: Record<string, unknown> | null = null;

  // === MODULE 4: SKEPTIC CHECK =============================================

  if (shouldRunSkeptic) {
    try {
      skepticResult = await callAnthropic(
        buildSkepticCheckPrompt(doctrineResult),
        doctrineUserContent
      );
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      await logRun({ raw_item_id, candidate_evidence_id: candidateId,
        module_name: "skeptic_check", model_used: ANTHROPIC_MODEL,
        input_snapshot: { signal_potential: signalPotential },
        output_json: { error: errMsg }, error_flag: true });
    }

    if (skepticResult) {
      const adj = typeof skepticResult.confidence_adjustment === "number"
        ? Math.min(0.1, Math.max(-0.3, skepticResult.confidence_adjustment)) : 0;
      finalConfidence = Math.min(1, Math.max(0, doctrineConfidence + adj));

      await logRun({ raw_item_id, candidate_evidence_id: candidateId,
        module_name: "skeptic_check", model_used: ANTHROPIC_MODEL,
        input_snapshot: { signal_potential: signalPotential, first_pass_signal: doctrineResult.first_pass_signal },
        output_json: skepticResult,
        route: skepticResult.route_correction as string,
        confidence: finalConfidence,
        error_flag: false });

      const correction = skepticResult.route_correction as string;
      if (correction && correction !== "none") {
        finalRoute = correction === "downgrade_to_candidate_evidence"
          ? "store_candidate_evidence"
          : correction;
      }
    }
  }

  // === FINAL ROUTING ========================================================

  if (finalRoute === "promote_first_pass_signal" && finalConfidence > 0.3) {
    const { data: fpRow, error: fpErr } = await client
      .from("first_pass_signals")
      .insert({
        raw_item_id,
        candidate_evidence_id:         candidateId,
        source_id:                     ri.source_id,
        domain:                        clamp(evidenceResult.domain,       VALID_DOMAINS,          "intelligence"),
        subcategory:                   (evidenceResult.subcategory as string) || null,
        first_pass_signal:             (doctrineResult.first_pass_signal as string) || null,
        clean_summary:                 (evidenceResult.clean_summary as string) || null,
        source_provenance:             (evidenceResult.source_provenance as string) || null,
        evidence_type:                 (evidenceResult.evidence_type as string) || null,
        visibility_stage:              clamp(evidenceResult.visibility_stage, VALID_VISIBILITY, "unknown"),
        signal_potential:              clamp(signalPotential,                 VALID_SIGNAL_POTENTIALS, "low"),
        possible_constraint_shift:     (doctrineResult.possible_constraint_shift as string) || null,
        possible_bottleneck_migration: (doctrineResult.possible_bottleneck_migration as string) || null,
        possible_maintenance_gravity:  (doctrineResult.possible_maintenance_gravity as string) || null,
        possible_continuity_pressure:  (doctrineResult.possible_continuity_pressure as string) || null,
        candidate_pressure_vectors:    Array.isArray(doctrineResult.candidate_pressure_vectors) ? doctrineResult.candidate_pressure_vectors : [],
        active_laws_candidate:         Array.isArray(doctrineResult.active_laws_candidate) ? doctrineResult.active_laws_candidate : [],
        skeptic_note:                  (skepticResult?.skeptic_note as string) || null,
        evidence_limitations:          (skepticResult?.evidence_limitations as string) || null,
        confidence:                    finalConfidence,
        reason_for_signal_candidate:   (doctrineResult.reason_for_signal_candidate as string) || null,
        status:                        "ready_for_signal_intelligence",
      })
      .select("id")
      .single();

    if (fpErr || !fpRow) {
      await client.from("raw_items").update({ signal_processing_status: "mesodma_processed" }).eq("id", raw_item_id);
      return NextResponse.json({ route_taken: "candidate_evidence_stored",
        candidate_evidence_id: candidateId, error: `first_pass_signals insert failed: ${fpErr?.message}` });
    }

    await client.from("raw_items").update({ signal_processing_status: "mesodma_processed" }).eq("id", raw_item_id);
    return NextResponse.json({
      route_taken:           "promoted_to_first_pass_signal",
      candidate_evidence_id: candidateId,
      first_pass_signal_id:  (fpRow as { id: string }).id,
      signal_potential:      signalPotential,
      confidence:            finalConfidence,
      first_pass_signal:     doctrineResult.first_pass_signal,
    });

  } else {
    const newStatus = finalRoute === "needs_more_sources" ? "needs_enrichment" : "mesodma_processed";
    await client.from("raw_items").update({ signal_processing_status: newStatus }).eq("id", raw_item_id);
    return NextResponse.json({
      route_taken:           finalRoute === "reject_noise" ? "rejected_at_doctrine_filter" : "stored_as_candidate_evidence",
      candidate_evidence_id: candidateId,
      signal_potential:      signalPotential,
      confidence:            finalConfidence,
      doctrine_route:        finalRoute,
    });
  }
}
