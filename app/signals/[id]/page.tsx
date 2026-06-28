import { createClient } from "@supabase/supabase-js";
import { Playfair_Display } from "next/font/google";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "600", "700"] });

const GOLD      = "#C9A961";
const GOLD_DIM  = "rgba(201,169,97,0.55)";
const GOLD_FAINT = "rgba(201,169,97,0.15)";
const CE_WHITE  = "#EEF3FA";
const CE_MUTED  = "#7A8DA6";
const BG_DEEP   = "#03050A";

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

type ScoreRow = {
  strength:              number | null;
  weight:                number | null;
  longevity:             number | null;
  convergence_potential: number | null;
  governance_impact:     number | null;
  continuity_pressure:   number | null;
  prosperity_relevance:  number | null;
  structural_relevance:  number | null;
  decay_factor:          number | null;
  confidence:            number | null;
  final_score:           number | null;
  scoring_notes:         string | null;
};

type SignalDetail = {
  id: string;
  title: string;
  summary: string;
  implication: string | null;
  what_changed: string | null;
  why_it_matters: string | null;
  structural_relevance: string | null;
  second_order_effect: string | null;
  impact_layer: unknown;
  category: string;
  subcategory: string | null;
  status: string;
  published_at: string | null;
  signal_scores: ScoreRow | null;
};

async function fetchSignal(id: string): Promise<SignalDetail | null> {
  const { data, error } = await sb()
    .from("signals")
    .select(`
      id, title, summary, implication, what_changed, why_it_matters,
      structural_relevance, second_order_effect, impact_layer,
      category, subcategory, status, published_at,
      signal_scores (
        strength, weight, longevity, convergence_potential,
        governance_impact, continuity_pressure, prosperity_relevance,
        structural_relevance, decay_factor, confidence, final_score,
        scoring_notes
      )
    `)
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as unknown as SignalDetail;
}

const SCORE_DIMS: { key: keyof ScoreRow; label: string; weight: number }[] = [
  { key: "strength",              label: "Strength",              weight: 1.5 },
  { key: "structural_relevance",  label: "Structural Relevance",  weight: 1.4 },
  { key: "convergence_potential", label: "Convergence Potential", weight: 1.3 },
  { key: "weight",                label: "Weight",                weight: 1.2 },
  { key: "continuity_pressure",   label: "Continuity Pressure",   weight: 1.1 },
  { key: "longevity",             label: "Longevity",             weight: 1.0 },
  { key: "governance_impact",     label: "Governance Impact",     weight: 1.0 },
  { key: "prosperity_relevance",  label: "Prosperity Relevance",  weight: 1.0 },
];

function ScoreBar({ value, max = 10 }: { value: number | null; max?: number }) {
  const pct = value != null ? (value / max) * 100 : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ flex: 1, height: 3, background: "rgba(197,162,111,0.12)", borderRadius: 2 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: GOLD, borderRadius: 2, transition: "width 0.3s" }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: GOLD, minWidth: 24, textAlign: "right" }}>
        {value ?? "—"}
      </span>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div style={{ marginBottom: 24 }}>
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.35em", textTransform: "uppercase", color: CE_MUTED, marginBottom: 8 }}>
        {label}
      </p>
      <p style={{ fontSize: 14, lineHeight: 1.75, color: CE_WHITE, margin: 0 }}>{value}</p>
    </div>
  );
}

export default async function SignalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const signal = await fetchSignal(id);
  if (!signal) notFound();

  const score     = signal.signal_scores;
  const finalScore = score?.final_score ?? null;

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(180deg, ${BG_DEEP} 0%, #07111F 100%)`, color: CE_WHITE }}>

      {/* Nav */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50, background: BG_DEEP,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 40px", height: 52,
      }}>
        <Link href="/signals" style={{ textDecoration: "none" }}>
          <span style={{ fontFamily: playfair.style.fontFamily, fontSize: 15, fontWeight: 600, letterSpacing: "0.08em", color: CE_WHITE }}>
            CE SIGNALS.
          </span>
        </Link>
        <Link href="/signals" style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.18em", color: CE_MUTED, textDecoration: "none" }}>
          ← Back
        </Link>
      </nav>

      <main style={{ maxWidth: 840, margin: "0 auto", padding: "52px 40px 80px" }}>

        {/* Eyebrow */}
        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.45em", textTransform: "uppercase", color: GOLD, marginBottom: 20 }}>
          {signal.category.replace(/_/g, " ").toUpperCase()}
          {signal.subcategory ? `  ·  ${signal.subcategory.toUpperCase()}` : ""}
          {"  ·  "}
          {signal.status.replace(/_/g, " ").toUpperCase()}
        </p>

        {/* Title */}
        <h1 style={{
          fontFamily: playfair.style.fontFamily,
          fontSize: 30, fontWeight: 600, lineHeight: 1.3,
          color: CE_WHITE, margin: "0 0 32px", maxWidth: 700,
        }}>
          {signal.title}
        </h1>

        {/* Final score callout */}
        {finalScore !== null && (
          <div style={{
            display: "inline-flex", alignItems: "baseline", gap: 4,
            border: `1px solid ${GOLD_DIM}`, borderRadius: 8,
            background: GOLD_FAINT, padding: "10px 22px", marginBottom: 40,
          }}>
            <span style={{ fontFamily: playfair.style.fontFamily, fontSize: 40, fontWeight: 700, color: CE_WHITE, lineHeight: 1 }}>
              {Math.round(finalScore)}
            </span>
            <span style={{ fontSize: 14, color: CE_MUTED }}>/100</span>
            <span style={{ fontSize: 10, color: GOLD, marginLeft: 14, letterSpacing: "0.2em", textTransform: "uppercase" }}>
              CE Signal Score
            </span>
          </div>
        )}

        {/* Signal body */}
        <div style={{ borderTop: `1px solid rgba(197,162,111,0.2)`, paddingTop: 32, marginBottom: 40 }}>
          <Field label="Summary"             value={signal.summary} />
          <Field label="Implication"         value={signal.implication} />
          <Field label="What Changed"        value={signal.what_changed} />
          <Field label="Why It Matters"      value={signal.why_it_matters} />
          <Field label="Structural Relevance" value={signal.structural_relevance} />
          <Field label="Second-Order Effect" value={signal.second_order_effect} />
        </div>

        {/* Score breakdown */}
        {score && (
          <div style={{ borderTop: `1px solid rgba(197,162,111,0.2)`, paddingTop: 32 }}>
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.45em", textTransform: "uppercase", color: CE_MUTED, marginBottom: 24 }}>
              Score Breakdown
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {SCORE_DIMS.map(({ key, label, weight }) => (
                <div key={key} style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 16, alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: 12, color: CE_MUTED }}>{label}</span>
                    <span style={{ fontSize: 10, color: "rgba(139,154,179,0.5)", marginLeft: 6 }}>×{weight}</span>
                  </div>
                  <ScoreBar value={score[key] as number | null} />
                </div>
              ))}
            </div>

            <div style={{
              display: "grid", gridTemplateColumns: "180px 1fr", gap: 16, alignItems: "center",
              marginTop: 18, paddingTop: 14, borderTop: `1px solid rgba(197,162,111,0.15)`,
            }}>
              <span style={{ fontSize: 12, color: CE_MUTED }}>Confidence</span>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1, height: 3, background: "rgba(197,162,111,0.12)", borderRadius: 2 }}>
                  <div style={{ height: "100%", width: `${(score.confidence ?? 0) * 100}%`, background: GOLD, borderRadius: 2 }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: GOLD, minWidth: 24, textAlign: "right" }}>
                  {score.confidence != null ? (score.confidence * 100).toFixed(0) + "%" : "—"}
                </span>
              </div>
            </div>

            <div style={{
              display: "grid", gridTemplateColumns: "180px 1fr", gap: 16, alignItems: "center", marginTop: 10,
            }}>
              <span style={{ fontSize: 12, color: CE_MUTED }}>Decay Factor</span>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1, height: 3, background: "rgba(197,162,111,0.12)", borderRadius: 2 }}>
                  <div style={{ height: "100%", width: `${((score.decay_factor ?? 0) / 10) * 100}%`, background: GOLD, borderRadius: 2 }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: GOLD, minWidth: 24, textAlign: "right" }}>
                  {score.decay_factor ?? "—"}
                </span>
              </div>
            </div>

            {score.scoring_notes && (
              <p style={{ marginTop: 24, fontSize: 11, color: CE_MUTED, fontStyle: "italic" }}>
                {score.scoring_notes}
              </p>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
