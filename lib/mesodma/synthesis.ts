// Signal Intelligence V2 — synthesis module.
// The ONE expensive model call in the system.
// Triggered on mature clusters (mass >= 60). Called only when threshold crossed or weekly cycle.
// All candidates land as status='draft'. Nothing auto-publishes. (Governance Rule 7)
// No prediction language. Forbidden phrases enforced before any DB write.

import Anthropic from "@anthropic-ai/sdk";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type {
  EvidenceClusterRow,
  FactualAtomRow,
  SynthesisOutput,
  SynthesisPassReport,
  StructuralInvariant,
} from "./v2-types";

// ── Config ─────────────────────────────────────────────────────────────────────

const SYNTHESIS_MODEL   = "claude-opus-4-8";
const PROMPT_VERSION    = "v2.0";
const MAX_CLUSTERS      = 1;   // Vercel Hobby constraint: 1 cluster per call, max 10s
const MAX_TOKENS        = 4096;

const VALID_CATEGORIES = [
  "intelligence", "physical_systems", "infrastructure", "energy",
  "science_frontier", "governance_stability", "markets_human_prosperity",
  "resources_continuity",
] as const;

const VALID_ROUTING = ["internal", "human_review", "needs_more_evidence", "reject"] as const;

// Prediction language — FORBIDDEN per spec governance rule 5.
// Any synthesis output containing these exact phrases is rejected → re-run flagged.
const FORBIDDEN_PHRASES = [
  "will happen",
  "will occur",
  "is guaranteed",
  "guaranteed to",
  "is inevitable",
  "inevitably will",
  "certain to",
  "certainly will",
  "forecast:",
  "our forecast",
  "this is a prediction",
  "we predict",
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function sb(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

function containsForbiddenLanguage(output: SynthesisOutput): string | null {
  const allText = [
    output.title, output.summary, output.implication,
    output.what_changed, output.why_it_matters, output.structural_relevance,
    output.second_order_effect, output.doctrine_basis,
    output.governance_pressure_note, output.maintenance_gravity_note,
    output.continuity_note, output.physical_constraint_note,
    output.contradiction_note,
  ].join(" ").toLowerCase();

  for (const phrase of FORBIDDEN_PHRASES) {
    if (allText.includes(phrase)) return phrase;
  }
  return null;
}

// ── Synthesis prompt (10-step anatomy) ────────────────────────────────────────

function buildSynthesisSystemPrompt(): string {
  return `You are the Signal Intelligence synthesis layer of Cognitive Empire Signals.
You receive a cluster of factual atoms and produce a signal candidate for human governance review.

GOVERNANCE RULES — NEVER VIOLATE:
1. You do not score. Evidence mass is computed deterministically before you see this data.
2. You do not predict. Forbidden: "will happen", "guaranteed", "inevitable", "certain to", "forecast", "prediction". Allowed: "indicates pressure", "suggests movement", "supports the cluster", "raises watch priority", "points toward", "is consistent with".
3. No single atom births a signal. You synthesize from accumulated evidence.
4. Output language must be CE-voice: direct, structural, non-promotional, non-sensational.
5. Your output is a draft candidate. It goes to human review before any publication decision.

CE SIGNALS CATEGORIES (choose one):
intelligence | physical_systems | infrastructure | energy | science_frontier | governance_stability | markets_human_prosperity | resources_continuity

ROUTING OPTIONS:
- human_review: strong candidate, well-supported, ready for founder review
- internal: valid signal but anchored to internal-visibility vector, do not route for publication
- needs_more_evidence: evidence present but insufficient for signal quality
- reject: does not meet signal threshold (spurious cluster, false signal patterns dominate, no structural pressure)

APPLY THE 10-STEP SYNTHESIS ANATOMY IN ORDER:
1. CLUSTER INTAKE — Restate the accumulated evidence factually. No interpretation yet.
2. INVARIANT ALIGNMENT — Which structural invariant(s) does this evidence support, and how directly?
3. DOCTRINE WEIGHTING — Apply the Eight Laws. What chain of laws is activated?
4. PRESSURE VECTOR INTERPRETATION — What named pressure is manifesting? How?
5. CONTRADICTION / ADVERSARIAL CHECK — What rival explanations exist? Does hype outweigh substance?
6. SECOND-ORDER ANALYSIS — Where does cost, responsibility, power, fragility, or dependency relocate?
7. MAINTENANCE GRAVITY / CONTINUITY CHECK — What operational burden or continuity risk is created?
8. GOVERNANCE / RESPONSIBILITY CHECK — What accountability, escalation, or auditability gaps emerge?
9. SIGNAL SYNTHESIS — Write the signal: title, summary (2-3 CE-voice sentences), implication, confidence.
10. ROUTING — Choose routing_recommendation based on evidence quality and vector visibility.

OUTPUT FORMAT: Respond with a single JSON object only. No prose, no markdown, no explanation outside the JSON.

JSON SCHEMA:
{
  "title": "string — signal title, factual and structural",
  "summary": "string — 2-3 CE-voice sentences. No prediction language.",
  "implication": "string — so-what for the CE reader. What does this mean for operators and founders?",
  "what_changed": "string — the factual structural change in one sentence",
  "why_it_matters": "string — doctrine explanation, 1-2 sentences",
  "structural_relevance": "string — what structural force this represents",
  "second_order_effect": "string — where cost/responsibility/power/fragility/dependency relocates",
  "doctrine_basis": "string — which invariant(s) and Eight Laws ground this signal",
  "governance_pressure_note": "string — governance angle, or empty string",
  "maintenance_gravity_note": "string — maintenance burden angle, or empty string",
  "continuity_note": "string — continuity risk angle, or empty string",
  "physical_constraint_note": "string — physical constraint angle, or empty string",
  "contradiction_note": "string — strongest rival explanation or contradiction, or empty string",
  "routing_recommendation": "human_review | internal | needs_more_evidence | reject",
  "confidence": number (0.0–1.0),
  "category": "one of the valid categories above",
  "supporting_atom_ids": [array of integer atom IDs used in synthesis],
  "source_count": integer
}`;
}

function buildSynthesisUserContent(
  cluster: EvidenceClusterRow,
  atoms: FactualAtomRow[],
  invariant: StructuralInvariant | null,
  vectorName: string | null,
  doctrineVersion: string
): string {
  const atomSummaries = atoms.map((a, i) =>
    `ATOM ${a.id}: ${a.atom_summary}` +
    (a.who ? ` | WHO: ${a.who}` : "") +
    (a.what_changed ? ` | WHAT: ${a.what_changed}` : "") +
    (a.when_date ? ` | WHEN: ${a.when_date}` : "") +
    (a.where_location ? ` | WHERE: ${a.where_location}` : "") +
    ` | EVIDENCE_TYPE: ${a.evidence_type ?? "unknown"}` +
    ` | SOURCE_WEIGHT: ${a.source_weight}` +
    ` | FALSE_SIGNAL_RISK: ${a.false_signal_risk}` +
    ` | DIST_STAGE: ${a.distribution_stage ?? "unknown"}` +
    (a.false_signal_risk > 0.5 ? " [HIGH FALSE-SIGNAL RISK]" : "")
  ).join("\n");

  return `DOCTRINE VERSION: ${doctrineVersion}
CLUSTER ID: ${cluster.id}
CLUSTER EVIDENCE MASS: ${cluster.evidence_mass.toFixed(1)} / 100
CLUSTER ATOM COUNT: ${cluster.atom_count}
CLUSTER SOURCE COUNT: ${cluster.source_count}
CLUSTER STATUS: ${cluster.status}
INVARIANT: ${invariant ? `${invariant.code} — ${invariant.name}: ${invariant.statement}` : "unknown"}
PRIMARY VECTOR: ${vectorName ?? "none"}

ACCUMULATED ATOMS (${atoms.length}):
${atomSummaries}

ENTITY KEYS: ${cluster.entity_keys?.join(", ") || "none"}
GEOGRAPHY KEYS: ${cluster.geography_keys?.join(", ") || "none"}
TECHNOLOGY KEYS: ${cluster.technology_keys?.join(", ") || "none"}

Apply the 10-step synthesis anatomy and output the JSON signal candidate.`;
}

// ── Load cluster synthesis package ────────────────────────────────────────────

async function loadSynthesisPackage(
  client: SupabaseClient,
  cluster: EvidenceClusterRow
): Promise<{
  atoms: FactualAtomRow[];
  invariant: StructuralInvariant | null;
  vectorName: string | null;
  vectorVisibility: string | null;
  doctrineVersion: string;
}> {
  const [atomsRes, invariantRes, vectorRes, versionRes] = await Promise.all([
    client
      .from("cluster_atoms")
      .select("atom_id")
      .eq("cluster_id", cluster.id)
      .then(async ({ data }) => {
        if (!data?.length) return { data: [], error: null };
        const ids = data.map((r: { atom_id: number }) => r.atom_id);
        return client.from("factual_atoms").select("*").in("id", ids);
      }),
    cluster.invariant_id
      ? client.from("structural_invariants").select("*").eq("id", cluster.invariant_id).single()
      : Promise.resolve({ data: null, error: null }),
    cluster.vector_id
      ? client.from("pressure_vectors").select("name, visibility").eq("id", cluster.vector_id).single()
      : Promise.resolve({ data: null, error: null }),
    client.from("doctrine_versions").select("version_tag").eq("active", true).single(),
  ]);

  return {
    atoms:            (atomsRes.data ?? []) as FactualAtomRow[],
    invariant:        invariantRes.data as StructuralInvariant | null,
    vectorName:       vectorRes.data?.name ?? null,
    vectorVisibility: vectorRes.data?.visibility ?? "public",
    doctrineVersion:  versionRes.data?.version_tag ?? "unknown",
  };
}

// ── Validate synthesis output ──────────────────────────────────────────────────

function validateOutput(
  output: SynthesisOutput,
  atoms: FactualAtomRow[]
): { valid: boolean; reason: string } {
  const forbidden = containsForbiddenLanguage(output);
  if (forbidden) return { valid: false, reason: `Forbidden prediction language: "${forbidden}"` };

  if (output.supporting_atom_ids.length < 2) {
    return { valid: false, reason: "supporting_atom_ids < 2 (spec minimum)" };
  }
  if (output.source_count < 2) {
    return { valid: false, reason: "source_count < 2 (spec minimum)" };
  }
  if (!VALID_CATEGORIES.includes(output.category as typeof VALID_CATEGORIES[number])) {
    return { valid: false, reason: `Invalid category: ${output.category}` };
  }
  if (!VALID_ROUTING.includes(output.routing_recommendation as typeof VALID_ROUTING[number])) {
    return { valid: false, reason: `Invalid routing: ${output.routing_recommendation}` };
  }

  return { valid: true, reason: "" };
}

// ── Create signal candidate in DB ─────────────────────────────────────────────

async function createSignalCandidate(
  client: SupabaseClient,
  cluster: EvidenceClusterRow,
  output: SynthesisOutput,
  runId: number,
  routingRecommendation: string,
  evidenceSnapshot: Record<string, unknown>
): Promise<string | null> {
  // Insert signal as draft
  const { data: signalData, error: signalErr } = await client
    .from("signals")
    .insert({
      category:                  output.category,
      title:                     output.title,
      summary:                   output.summary,
      implication:               output.implication,
      what_changed:              output.what_changed,
      why_it_matters:            output.why_it_matters,
      structural_relevance:      output.structural_relevance,
      second_order_effect:       output.second_order_effect,
      status:                    "draft",
      is_featured:               false,
      cluster_id:                cluster.id,
      invariant_id:              cluster.invariant_id,
      birth_type:                "threshold",
      evidence_mass_at_birth:    cluster.evidence_mass,
      evidence_snapshot:         evidenceSnapshot,
      doctrine_basis:            output.doctrine_basis,
      governance_pressure_note:  output.governance_pressure_note || null,
      maintenance_gravity_note:  output.maintenance_gravity_note || null,
      continuity_note:           output.continuity_note || null,
      physical_constraint_note:  output.physical_constraint_note || null,
      contradiction_note:        output.contradiction_note || null,
      lifecycle_status:          "emerging",
      legacy_signal:             false,
      created_by_run_id:         runId,
      metadata:                  { synthesis_model: SYNTHESIS_MODEL, routing: routingRecommendation },
    })
    .select("id")
    .single();

  if (signalErr || !signalData) {
    console.error("[synthesis] signal insert failed:", signalErr?.message);
    return null;
  }

  const signalId = signalData.id as string;

  // Insert into review_queue
  await client.from("review_queue").insert({
    entity_type:  "signal",
    entity_id:    signalId,
    priority:     routingRecommendation === "human_review" ? 2 : 4,
    is_resolved:  false,
    notes:        `Auto-created by Signal Intelligence V2 synthesis. Routing: ${routingRecommendation}. Confidence: ${output.confidence.toFixed(2)}.`,
  });

  // Log governance action
  await client.from("human_governance_actions").insert({
    signal_id:   signalId,
    action_type: "escalate_to_internal",
    notes:       `Synthesis run ${runId} created this draft. Awaiting founder review.`,
    acted_by:    "synthesis_engine_v2",
  });

  return signalId;
}

// ── Main synthesis pass ────────────────────────────────────────────────────────

export async function runSynthesisPass(triggerType: "threshold" | "cycle" | "manual" = "manual"): Promise<SynthesisPassReport> {
  const started_at = new Date().toISOString();
  const client = sb();
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  let clustersEvaluated = 0;
  let candidatesCreated = 0;
  let rejectedCount     = 0;
  let errorCount        = 0;

  // Open run log
  const { data: runRow, error: runErr } = await client
    .from("signal_intelligence_runs")
    .insert({
      trigger_type:     triggerType,
      model_used:       SYNTHESIS_MODEL,
      prompt_version:   PROMPT_VERSION,
      status:           "running",
    })
    .select("id")
    .single();

  if (runErr || !runRow) {
    return {
      started_at,
      completed_at: new Date().toISOString(),
      run_id: null,
      clusters_evaluated: 0,
      candidates_created: 0,
      rejected_count: 0,
      error_count: 1,
    };
  }

  const runId: number = runRow.id;

  // Load mature clusters not yet converted and with no existing draft signal
  const { data: clusterData, error: clusterErr } = await client
    .from("evidence_clusters")
    .select("*")
    .in("status", ["mature", "signal_candidate"])
    .not("id", "in", `(SELECT DISTINCT cluster_id FROM signals WHERE cluster_id IS NOT NULL AND status IN ('draft','in_review','approved','published'))`)
    .order("evidence_mass", { ascending: false })
    .limit(MAX_CLUSTERS);

  if (clusterErr || !clusterData?.length) {
    await client.from("signal_intelligence_runs").update({
      clusters_evaluated: 0,
      candidates_created: 0,
      error_count:        clusterErr ? 1 : 0,
      status:             clusterErr ? "failed" : "completed",
      completed_at:       new Date().toISOString(),
    }).eq("id", runId);

    return {
      started_at,
      completed_at: new Date().toISOString(),
      run_id: runId,
      clusters_evaluated: 0,
      candidates_created: 0,
      rejected_count: 0,
      error_count: clusterErr ? 1 : 0,
    };
  }

  const clusters = clusterData as EvidenceClusterRow[];

  for (const cluster of clusters) {
    clustersEvaluated++;

    try {
      const pkg = await loadSynthesisPackage(client, cluster);

      if (pkg.atoms.length < 2) {
        rejectedCount++;
        continue;
      }

      const systemPrompt = buildSynthesisSystemPrompt();
      const userContent  = buildSynthesisUserContent(
        cluster, pkg.atoms, pkg.invariant, pkg.vectorName, pkg.doctrineVersion
      );

      const message = await anthropic.messages.create({
        model:      SYNTHESIS_MODEL,
        max_tokens: MAX_TOKENS,
        system:     systemPrompt,
        messages:   [{ role: "user", content: userContent }],
      });

      const rawText = message.content.find((b) => b.type === "text")?.text ?? "";

      // Extract JSON from response
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON in synthesis response");

      const output = JSON.parse(jsonMatch[0]) as SynthesisOutput;

      // Validate output (governance rule 5 + spec D3)
      const { valid, reason } = validateOutput(output, pkg.atoms);
      if (!valid) {
        console.warn(`[synthesis] cluster ${cluster.id} output rejected: ${reason}`);
        rejectedCount++;
        continue;
      }

      if (output.routing_recommendation === "reject") {
        rejectedCount++;
        continue;
      }

      // Internal-visibility check (amendment 2026-06-10):
      // If cluster vector has visibility='internal', force routing to 'internal'
      const effectiveRouting = pkg.vectorVisibility === "internal"
        ? "internal"
        : output.routing_recommendation;

      const evidenceSnapshot = {
        atom_count:         pkg.atoms.length,
        source_count:       output.source_count,
        evidence_mass:      cluster.evidence_mass,
        supporting_atom_ids: output.supporting_atom_ids,
        doctrine_version:   pkg.doctrineVersion,
      };

      const signalId = await createSignalCandidate(
        client, cluster, output, runId, effectiveRouting, evidenceSnapshot
      );

      if (signalId) {
        candidatesCreated++;
        // Mark cluster as converted
        await client
          .from("evidence_clusters")
          .update({ status: "converted" })
          .eq("id", cluster.id);
      }

    } catch (err) {
      errorCount++;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[synthesis] cluster ${cluster.id} failed:`, msg);
    }
  }

  const finalStatus = errorCount > 0 && candidatesCreated === 0
    ? "completed_with_errors"
    : "completed";

  await client.from("signal_intelligence_runs").update({
    clusters_evaluated: clustersEvaluated,
    candidates_created: candidatesCreated,
    error_count:        errorCount,
    status:             finalStatus,
    completed_at:       new Date().toISOString(),
  }).eq("id", runId);

  return {
    started_at,
    completed_at: new Date().toISOString(),
    run_id: runId,
    clusters_evaluated: clustersEvaluated,
    candidates_created: candidatesCreated,
    rejected_count:     rejectedCount,
    error_count:        errorCount,
  };
}
