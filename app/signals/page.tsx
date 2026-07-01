import { createClient } from "@supabase/supabase-js";
import { Playfair_Display } from "next/font/google";
import CENav from "@/app/components/CENav";
import Link from "next/link";
import type { SignalCategory } from "@/types/signals";
import { SignalWithContext } from "@/app/components/SignalJudgmentContext";

export const dynamic = "force-dynamic";

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "600", "700"] });

// ── Supabase ──────────────────────────────────────────────────────────────────

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

// ── V1 types ──────────────────────────────────────────────────────────────────

type VectorRef = { id: string; name: string };

type SignalResult = {
  id: string;
  title: string;
  category: SignalCategory;
  subcategory: string | null;
  summary: string;
  why_it_matters: string | null;
  second_order_effect: string | null;
  impact_layer: unknown;
  published_at: string | null;
  signal_scores: { final_score: number } | null;
  signal_pressure_vectors: Array<{ pressure_vectors: VectorRef | null }>;
  signal_doctrine_vectors: Array<{ doctrine_vectors: VectorRef | null }>;
  raw_items: { url: string | null } | null;
};

type ConvergenceResult = {
  id: string;
  title: string;
  summary: string;
  convergence_score: number | null;
  subcategories: string[] | null;
  second_order_implications: string | null;
  impact_layer: unknown;
  published_at: string | null;
  convergence_doctrine_vectors: Array<{ doctrine_vectors: VectorRef | null }>;
};

// ── V2 types ──────────────────────────────────────────────────────────────────

type V2Signal = {
  id: string;
  title: string;
  summary: string;
  implication: string | null;
  category: SignalCategory;
  subcategory: string | null;
  published_at: string | null;
  signal_state: string | null;
  is_base_signal: boolean | null;
  is_featured: boolean | null;
  directional_thesis: string | null;
  dominant_path: string | null;
  operator_move: string | null;
  directional_weight: number | null;
  signal_scores: { final_score: number } | null;
  signal_pressure_vectors: Array<{ pressure_vectors: VectorRef | null }>;
  signal_doctrine_vectors: Array<{ doctrine_vectors: VectorRef | null }>;
};

// ── V1 helpers ────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<SignalCategory, string> = {
  intelligence:         "Intelligence",
  governance_stability: "Governance & Stability",
  infrastructure:       "Infrastructure",
};

const CATEGORY_ORDER: SignalCategory[] = [
  "intelligence",
  "governance_stability",
  "infrastructure",
];

function fmtCategory(cat: SignalCategory): string {
  return CATEGORY_LABELS[cat] ?? cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

function getImpactLayers(raw: unknown): string[] {
  if (typeof raw !== "string" || !raw) return [];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

function truncateSentences(text: string | null | undefined, max: number): string {
  if (!text) return "";
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [];
  if (sentences.length === 0) return text;
  return sentences.slice(0, max).join("").trim();
}

function getFinalScore(s: SignalResult | V2Signal): number {
  return s.signal_scores?.final_score ?? 0;
}

function scoreBadgeStyle(score: number): { bg: string; text: string; border: string } {
  if (score >= 80) return { bg: "rgba(239,68,68,0.12)",  text: "#f87171",  border: "rgba(239,68,68,0.3)"  };
  if (score >= 60) return { bg: "rgba(201,169,97,0.12)", text: "#C9A961",  border: "rgba(201,169,97,0.3)" };
  if (score >= 40) return { bg: "rgba(201,169,97,0.08)", text: "#C9A961",  border: "rgba(201,169,97,0.2)"  };
  return           { bg: "rgba(100,116,139,0.12)",        text: "#94a3b8",  border: "rgba(100,116,139,0.3)" };
}

// ── V1 data fetching ──────────────────────────────────────────────────────────

async function fetchSignals(): Promise<SignalResult[]> {
  const sb = getServiceClient();
  const { data, error } = await sb
    .from("signals")
    .select(`
      id, title, category, subcategory, summary,
      why_it_matters, second_order_effect, impact_layer, published_at,
      signal_scores ( final_score ),
      signal_pressure_vectors (
        pressure_vectors ( id, name )
      ),
      signal_doctrine_vectors (
        doctrine_vectors ( id, name )
      ),
      raw_items ( url )
    `)
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error) throw new Error(`Signals fetch: ${error.message}`);
  return (data ?? []) as unknown as SignalResult[];
}

async function fetchConvergences(): Promise<ConvergenceResult[]> {
  const sb = getServiceClient();
  const { data, error } = await sb
    .from("convergences")
    .select(`
      id, title, summary, convergence_score,
      subcategories, second_order_implications, impact_layer, published_at,
      convergence_doctrine_vectors (
        doctrine_vectors ( id, name )
      )
    `)
    .eq("status", "published")
    .order("convergence_score", { ascending: false })
    .limit(3);

  if (error) throw new Error(`Convergences fetch: ${error.message}`);
  return (data ?? []) as unknown as ConvergenceResult[];
}

// ── V2 data fetching ──────────────────────────────────────────────────────────

async function fetchV2Signals(): Promise<V2Signal[]> {
  const sb = getServiceClient();
  const { data, error } = await sb
    .from("signals")
    .select(`
      id, title, summary, implication, category, subcategory, published_at,
      signal_state, is_base_signal, is_featured,
      directional_thesis, dominant_path, operator_move, directional_weight,
      signal_scores ( final_score ),
      signal_pressure_vectors ( pressure_vectors ( id, name ) ),
      signal_doctrine_vectors ( doctrine_vectors ( id, name ) )
    `)
    .eq("status", "published")
    .order("is_base_signal", { ascending: false })
    .order("published_at", { ascending: false });

  if (error) throw new Error(`V2 signals fetch: ${error.message}`);
  return (data ?? []) as unknown as V2Signal[];
}

// ── V1 sub-components (kept for ConvergenceCard) ──────────────────────────────

function Tag({ children, accent = false }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span
      className="inline-block rounded px-2 py-0.5 text-xs font-medium"
      style={{
        background: accent ? "rgba(201,169,97,0.08)" : "rgba(255,255,255,0.04)",
        border:     `1px solid ${accent ? "rgba(201,169,97,0.25)" : "rgba(255,255,255,0.08)"}`,
        color:      accent ? "#C9A961" : "#94a3b8",
      }}
    >
      {children}
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold tracking-[0.2em] uppercase" style={{ color: "#475569" }}>
      {children}
    </p>
  );
}

function ScoreBadge({ score, label = "CE Signal Score" }: { score: number; label?: string }) {
  const style = scoreBadgeStyle(score);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-bold tabular-nums"
      style={{ background: style.bg, border: `1px solid ${style.border}`, color: style.text }}
    >
      <span className="opacity-60">{label}</span>
      <span>{score.toFixed(1)}</span>
      <span className="opacity-40">/ 100</span>
    </span>
  );
}

function SignalCard({ signal }: { signal: SignalResult }) {
  const score     = getFinalScore(signal);
  const pressures = signal.signal_pressure_vectors
    .map((r) => r.pressure_vectors).filter((v): v is VectorRef => v !== null).slice(0, 4);
  const doctrines = signal.signal_doctrine_vectors
    .map((r) => r.doctrine_vectors).filter((v): v is VectorRef => v !== null).slice(0, 3);
  const impacts   = getImpactLayers(signal.impact_layer).slice(0, 3);
  const sourceUrl = signal.raw_items?.url ?? null;

  return (
    <article className="rounded-xl p-6 flex flex-col gap-5"
      style={{ background: "#0d0d1a", border: "1px solid #1c1a35" }}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {signal.subcategory && <Tag>{signal.subcategory}</Tag>}
          {score > 0 && <ScoreBadge score={score} />}
        </div>
        {sourceUrl && (
          <a href={sourceUrl} target="_blank" rel="noreferrer"
            className="text-xs font-medium transition-colors hover:text-[#00E0FF]"
            style={{ color: "#475569" }}>
            Source ↗
          </a>
        )}
      </div>
      <h3 className="text-base font-semibold leading-snug" style={{ color: "#f1f5f9" }}>
        {signal.title}
      </h3>
      <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>{signal.summary}</p>
      {signal.why_it_matters && (
        <div>
          <SectionLabel>Why it matters</SectionLabel>
          <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "#64748b" }}>
            {truncateSentences(signal.why_it_matters, 2)}
          </p>
        </div>
      )}
      {(pressures.length > 0 || doctrines.length > 0 || impacts.length > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {pressures.map((v) => <Tag key={v.id}>{v.name}</Tag>)}
          {doctrines.map((v) => <Tag key={v.id} accent>{v.name}</Tag>)}
          {impacts.map((layer) => <Tag key={layer}>{layer}</Tag>)}
        </div>
      )}
      {signal.published_at && (
        <p className="text-xs" style={{ color: "#334155" }}>Published {fmtDate(signal.published_at)}</p>
      )}
    </article>
  );
}

function ConvergenceCard({ c }: { c: ConvergenceResult }) {
  const doctrines    = c.convergence_doctrine_vectors
    .map((r) => r.doctrine_vectors).filter((v): v is VectorRef => v !== null).slice(0, 3);
  const categories   = (c.subcategories ?? []).slice(0, 4);
  const implications = truncateSentences(c.second_order_implications, 2);

  return (
    <article className="rounded-xl p-6 flex flex-col gap-5"
      style={{ background: "rgba(201,169,97,0.02)", border: "1px solid rgba(201,169,97,0.14)" }}>
      <div className="flex flex-wrap items-center gap-2">
        {c.convergence_score !== null && <ScoreBadge score={c.convergence_score} label="Convergence Score" />}
        {categories.map((cat) => (
          <Tag key={cat} accent>
            {cat.replace(/_/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase())}
          </Tag>
        ))}
      </div>
      <h3 className="text-base font-semibold leading-snug" style={{ color: "#f1f5f9" }}>{c.title}</h3>
      <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>{c.summary}</p>
      {implications && (
        <div>
          <SectionLabel>Second-order implications</SectionLabel>
          <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "#64748b" }}>{implications}</p>
        </div>
      )}
      {doctrines.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {doctrines.map((v) => <Tag key={v.id} accent>{v.name}</Tag>)}
        </div>
      )}
      {c.published_at
        ? <p className="text-xs" style={{ color: "#334155" }}>Published {fmtDate(c.published_at)}</p>
        : <p className="text-xs" style={{ color: "#334155" }}>Research state: Base Set</p>}
    </article>
  );
}

// ── V2 design tokens ──────────────────────────────────────────────────────────

const GOLD       = "#C9A961";
const GOLD_DIM   = "rgba(201,169,97,0.33)";
const GOLD_FAINT = "rgba(201,169,97,0.07)";
const GOLD_RULE  = "rgba(201,169,97,0.16)";
const CE_WHITE   = "#EEF3FA";
const CE_MUTED   = "#7A8DA6";
const CE_DIM     = "#46566A";
const CE_FAINT   = "#0F1A28";
const BG_DEEP    = "#020609";
const NAVY_CARD  = "rgba(3, 7, 16, 0.90)";
const CHIP_BG    = "rgba(8, 16, 34, 0.82)";
const CHIP_BD    = "rgba(55, 85, 125, 0.22)";
const CHIP_TEXT  = "#546482";
const NOISE_URI  = "data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='220'%20height='220'%3E%3Cfilter%20id='n'%3E%3CfeTurbulence%20type='fractalNoise'%20baseFrequency='0.82'%20numOctaves='4'%20stitchTiles='stitch'/%3E%3CfeColorMatrix%20type='matrix'%20values='0%200%200%200%200%200%200%200%200%200%200%200%200%200%200%200%200%200%200.018%200'/%3E%3C/filter%3E%3Crect%20width='220'%20height='220'%20filter='url(%23n)'/%3E%3C%2Fsvg%3E";

// ── Tag / vector system ───────────────────────────────────────────────────────

type TagIcon = "shield" | "pillars" | "target" | "scales";
type V2Tag   = { label: string; icon: TagIcon };

const VECTOR_TAGS: { keywords: string[]; label: string; icon: TagIcon }[] = [
  {
    keywords: ["trust", "verification", "auditability", "liability", "systemic fragility",
               "optimization fragility", "output inflation", "signal vs noise", "intelligence abundance"],
    label: "STRUCTURAL", icon: "shield",
  },
  {
    keywords: ["governance", "institutional", "regulatory", "coordination",
               "responsibility migration", "ownership ambiguity"],
    label: "INSTITUTIONAL", icon: "pillars",
  },
  {
    keywords: ["capital", "prosperity", "labor", "cost compression", "knowledge",
               "capability expansion", "human differentiation", "market"],
    label: "CROSS-MARKET", icon: "target",
  },
  {
    keywords: ["continuity", "escalation", "infrastructure", "resource", "supply chain",
               "compute", "energy", "synchronization", "bottleneck", "decision half"],
    label: "LONG HORIZON", icon: "scales",
  },
];

function vectorToTag(name: string): V2Tag | null {
  const low = name.toLowerCase();
  for (const group of VECTOR_TAGS) {
    if (group.keywords.some((k) => low.includes(k))) {
      return { label: group.label, icon: group.icon };
    }
  }
  return null;
}

function getSignalTags(signal: V2Signal): V2Tag[] {
  const seen  = new Set<string>();
  const tags: V2Tag[] = [];
  const allVectors = [
    ...signal.signal_pressure_vectors.map((r) => r.pressure_vectors),
    ...signal.signal_doctrine_vectors.map((r) => r.doctrine_vectors),
  ].filter((v): v is VectorRef => v !== null);

  for (const v of allVectors) {
    const tag = vectorToTag(v.name);
    if (tag && !seen.has(tag.label)) {
      seen.add(tag.label);
      tags.push(tag);
      if (tags.length === 4) break;
    }
  }
  return tags;
}

// ── Operational helpers ───────────────────────────────────────────────────────

type ForceUrgency = "Critical" | "High" | "Medium" | "Low" | "Watch";

function getUrgency(signal: V2Signal): ForceUrgency | null {
  switch (signal.signal_state) {
    case "act_now":     return "High";
    case "directional": return "Medium";
    case "growing":     return "Low";
    case "watch":       return "Watch";
    default:            return null;
  }
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function ShieldIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2L4 5.5v6.5c0 5.25 3.5 10.15 8 11.5 4.5-1.35 8-6.25 8-11.5V5.5L12 2z" />
    </svg>
  );
}
function PillarsIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M3 20h18v2H3v-2zm1-2V9h2v9H4zm5 0V9h2v9H9zm5 0V9h2v9h-2zm5 0V9h2v9h-2zM12 2L3 7h18L12 2z" />
    </svg>
  );
}
function CrosshairIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" />
      <line x1="12" y1="3" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="21" />
      <line x1="3" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="21" y2="12" />
    </svg>
  );
}
function ScalesIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <line x1="12" y1="3" x2="12" y2="21" /><path d="M7 20h10" /><path d="M3 8l9-5 9 5" />
      <path d="M5 8L3 16h4L5 8z" /><path d="M19 8l2 8h-4l2-8z" />
    </svg>
  );
}
function TagIcon({ icon }: { icon: TagIcon }) {
  if (icon === "shield")  return <ShieldIcon />;
  if (icon === "pillars") return <PillarsIcon />;
  if (icon === "target")  return <CrosshairIcon />;
  return <ScalesIcon />;
}

// ── V2 chip ───────────────────────────────────────────────────────────────────

function V2TagChip({ tag }: { tag: V2Tag }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 4,
      background: CHIP_BG, border: `1px solid ${CHIP_BD}`,
      color: CHIP_TEXT, fontSize: 10, fontWeight: 600, letterSpacing: "0.10em",
    }}>
      <TagIcon icon={tag.icon} />
      {tag.label}
    </span>
  );
}

// ── State badges ──────────────────────────────────────────────────────────────

type StateConfig = { bg: string; color: string; border: string; label: string; pulse?: boolean };

const STATE_MAP: Record<string, StateConfig> = {
  act_now:     { bg: "rgba(201,169,97,0.13)", color: "#D4AF6A", border: "rgba(201,169,97,0.32)", label: "ACT NOW",     pulse: true },
  directional: { bg: "rgba(56,139,253,0.10)", color: "#7AAEE0", border: "rgba(56,139,253,0.22)", label: "DIRECTIONAL" },
  growing:     { bg: "rgba(56,189,248,0.09)", color: "#5BBFD8", border: "rgba(56,189,248,0.18)", label: "GROWING"     },
  watch:       { bg: "rgba(80,100,125,0.10)", color: "#5C6E84", border: "rgba(80,100,125,0.18)", label: "WATCH"       },
};

function StateBadge({ state }: { state: string }) {
  const s: StateConfig = STATE_MAP[state] ?? {
    bg: "rgba(80,100,125,0.08)", color: "#5C6E84", border: "rgba(80,100,125,0.15)",
    label: state.replace(/_/g, " ").toUpperCase(),
  };
  return (
    <span style={{
      fontSize: 9, fontWeight: 800, letterSpacing: "0.14em",
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      padding: "3px 9px", borderRadius: 4,
      ...(s.pulse ? { animationName: "sgPulseAct", animationDuration: "3s", animationTimingFunction: "ease-in-out", animationIterationCount: "infinite" } : {}),
    }}>
      {s.label}
    </span>
  );
}

function UrgencyBadge({ urgency }: { urgency: ForceUrgency }) {
  const map: Record<ForceUrgency, { bg: string; color: string; border: string }> = {
    Critical: { bg: "rgba(239,68,68,0.11)",   color: "#e87070", border: "rgba(239,68,68,0.24)" },
    High:     { bg: "rgba(201,169,97,0.11)",  color: "#C9A961", border: "rgba(201,169,97,0.24)" },
    Medium:   { bg: "rgba(56,139,253,0.09)",  color: "#7AAEE0", border: "rgba(56,139,253,0.20)" },
    Low:      { bg: "rgba(80,100,125,0.08)",  color: "#5C6E84", border: "rgba(80,100,125,0.16)" },
    Watch:    { bg: "rgba(60,80,105,0.08)",   color: "#4D6070", border: "rgba(60,80,105,0.14)" },
  };
  const s = map[urgency];
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      padding: "3px 8px", borderRadius: 4,
    }}>
      {urgency}
    </span>
  );
}

// ── Star field ────────────────────────────────────────────────────────────────

// Positions: [cx%, cy%, radius, base-opacity]
const W_STARS: [number, number, number, number][] = [
  [4.1,13.2,0.7,0.48],[17.3,6.4,0.6,0.40],[28.9,21.1,0.5,0.50],[42.7,8.3,0.7,0.36],
  [53.4,17.8,0.6,0.46],[67.2,3.9,0.5,0.38],[78.9,14.4,0.7,0.43],[89.1,24.7,0.6,0.32],
  [5.7,34.1,0.5,0.48],[19.4,42.6,0.7,0.41],[31.2,38.9,0.6,0.36],[44.8,47.3,0.5,0.50],
  [57.3,31.4,0.7,0.34],[69.7,44.8,0.6,0.46],[82.1,39.2,0.5,0.38],[92.4,48.6,0.7,0.43],
  [8.3,62.4,0.6,0.36],[22.7,57.8,0.5,0.48],[36.4,68.1,0.7,0.41],[48.9,61.2,0.6,0.34],
  [62.3,74.7,0.5,0.46],[74.8,63.9,0.7,0.38],[86.7,71.3,0.6,0.43],[95.2,58.4,0.5,0.32],
  [11.4,79.6,0.7,0.48],[24.9,84.3,0.6,0.41],[38.7,91.2,0.5,0.36],[52.1,87.6,0.7,0.50],
  [65.8,78.4,0.6,0.34],[79.3,89.7,0.5,0.46],[91.6,82.3,0.7,0.38],[3.4,51.7,0.6,0.43],
  [14.7,26.3,0.5,0.32],[26.1,73.8,0.7,0.48],[39.4,16.7,0.6,0.41],
];
const B_STARS: [number, number, number, number][] = [
  [12.3,18.7,1.0,0.18],[33.7,44.2,0.9,0.14],[56.4,9.8,1.1,0.16],[71.8,31.4,0.8,0.20],
  [88.3,52.7,1.0,0.15],[15.9,67.3,0.9,0.18],[41.2,78.9,1.1,0.13],[64.7,56.3,0.8,0.20],
  [83.4,74.8,1.0,0.16],[29.1,23.4,0.9,0.14],[48.6,34.7,1.1,0.18],[73.4,81.2,0.8,0.13],
  [95.7,19.3,1.0,0.20],[21.3,91.4,0.9,0.15],[58.9,67.8,1.1,0.18],
];
const P_STARS: [number, number, number, number][] = [
  [22.4,11.3,1.0,0.65],[47.8,29.4,0.9,0.60],[71.2,7.8,1.1,0.62],
  [6.7,44.8,0.8,0.68],[58.3,61.4,1.0,0.58],[84.6,36.7,0.9,0.63],
  [34.1,76.2,1.1,0.60],[79.7,82.4,0.8,0.65],[13.8,58.9,1.0,0.68],[91.3,68.4,0.9,0.58],
];

function StarField() {
  return (
    <svg
      aria-hidden="true"
      style={{
        position: "fixed", inset: 0, width: "100%", height: "100%",
        pointerEvents: "none", zIndex: 0, overflow: "visible",
      }}
    >
      <g className="sg-layer-w">
        {W_STARS.map(([cx, cy, r, o], i) => (
          <circle key={`w${i}`} cx={`${cx}%`} cy={`${cy}%`} r={r}
            fill={`rgba(228,238,252,${o})`}
            className="sg-star-w"
            style={{ animationDelay: `${((i * 1.37) % 11).toFixed(1)}s` }}
          />
        ))}
      </g>
      <g className="sg-layer-b">
        {B_STARS.map(([cx, cy, r, o], i) => (
          <circle key={`b${i}`} cx={`${cx}%`} cy={`${cy}%`} r={r}
            fill={`rgba(120,175,240,${o})`}
            className="sg-star-b"
            style={{ animationDelay: `${((i * 2.13) % 16).toFixed(1)}s` }}
          />
        ))}
      </g>
      <g className="sg-layer-p">
        {P_STARS.map(([cx, cy, r, o], i) => (
          <circle key={`p${i}`} cx={`${cx}%`} cy={`${cy}%`} r={r}
            fill={`rgba(255,255,255,${o})`}
            className="sg-star-p"
            style={{ animationDelay: `${((i * 0.91) % 7).toFixed(1)}s` }}
          />
        ))}
      </g>
    </svg>
  );
}

// ── Nav ───────────────────────────────────────────────────────────────────────

function V2Nav() {
  return (
    <nav className="sg-nav" style={{
      position: "sticky", top: 0, zIndex: 50,
      background: "rgba(2,6,9,0.84)",
      backdropFilter: "blur(14px)",
      WebkitBackdropFilter: "blur(14px)",
      borderBottom: "1px solid rgba(40,70,110,0.18)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 40px", height: 54,
    }}>
      <Link href="/signals" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 9 }}>
        <span style={{
          display: "inline-block", width: 5, height: 5, borderRadius: "50%",
          background: GOLD, boxShadow: `0 0 7px ${GOLD}55`,
        }} />
        <span style={{
          fontFamily: playfair.style.fontFamily,
          fontSize: 14, fontWeight: 600, letterSpacing: "0.10em",
          color: CE_WHITE,
        }}>
          CE SIGNALS
        </span>
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
        <Link href="/" style={{
          fontSize: 10, fontWeight: 600, letterSpacing: "0.18em",
          color: CE_DIM, textDecoration: "none",
        }}>
          COGNITIVE EMPIRE
        </Link>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", color: CE_WHITE,
          }}>
            SIGNALS
          </span>
          <div style={{ width: 4, height: 4, borderRadius: "50%", background: GOLD }} />
        </div>
      </div>
    </nav>
  );
}

// ── Score helper ──────────────────────────────────────────────────────────────

function getV2Score(signal: V2Signal): number {
  return Math.round(getFinalScore(signal));
}

// ── Act Now Cards ─────────────────────────────────────────────────────────────

type ActNowCardData = {
  title: string;
  dominant_path: string;
  operator_move: string;
  urgency: ForceUrgency;
  directional_weight: number;
};

function ActNowCard({ data }: { data: ActNowCardData }) {
  const isCritical = data.urgency === "Critical";
  const leftBorder = isCritical ? "rgba(239,68,68,0.55)" : GOLD;
  return (
    <div className="sg-act-card" style={{
      padding: "22px 24px 22px 26px",
      borderRadius: 8,
      background: NAVY_CARD,
      border: `1px solid ${isCritical ? "rgba(239,68,68,0.18)" : "rgba(201,169,97,0.16)"}`,
      borderLeft: `3px solid ${leftBorder}`,
      display: "flex", flexDirection: "column", gap: 14,
      position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: 0, left: 3, right: 0, height: 48,
        background: "linear-gradient(180deg, rgba(201,169,97,0.025) 0%, transparent 100%)",
        pointerEvents: "none",
      }} />

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <StateBadge state="act_now" />
        <UrgencyBadge urgency={data.urgency} />
        <span style={{ fontSize: 11, color: CE_WHITE, marginLeft: "auto", fontWeight: 700 }}>
          {data.directional_weight}
          <span style={{ fontSize: 9, fontWeight: 500, color: CE_MUTED }}>%</span>
        </span>
      </div>

      <p style={{
        fontFamily: playfair.style.fontFamily,
        fontSize: 17, fontWeight: 600, color: CE_WHITE,
        margin: 0, lineHeight: 1.3,
      }}>
        {data.title}
      </p>

      <div>
        <p style={{
          fontSize: 9, fontWeight: 700, letterSpacing: "0.35em", textTransform: "uppercase",
          color: CE_DIM, margin: "0 0 5px",
        }}>
          Dominant Path
        </p>
        <p style={{ fontSize: 12, color: CE_MUTED, margin: 0, lineHeight: 1.55 }}>
          {data.dominant_path}
        </p>
      </div>

      <div style={{
        borderTop: "1px solid rgba(201,169,97,0.09)", paddingTop: 12,
        display: "flex", alignItems: "flex-start", gap: 8,
      }}>
        <span style={{
          fontSize: 9, fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase",
          color: GOLD, flexShrink: 0, paddingTop: 2,
        }}>
          MOVE →
        </span>
        <p style={{ fontSize: 12, color: CE_WHITE, margin: 0, lineHeight: 1.55, opacity: 0.88 }}>
          {data.operator_move}
        </p>
      </div>
    </div>
  );
}

function DirectionalCommandLayer({ signals }: { signals: V2Signal[] }) {
  const featured: ActNowCardData[] = signals
    .filter((s) => s.is_featured)
    .map((s) => ({
      title:              s.title,
      dominant_path:      s.dominant_path ?? s.directional_thesis ?? "",
      operator_move:      s.operator_move ?? "",
      urgency:            getUrgency(s) ?? "High",
      directional_weight: s.directional_weight ?? 0,
    }))
    .filter((d) => d.dominant_path || d.operator_move)
    .slice(0, 3);

  return (
    <section style={{ marginBottom: 58 }}>
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 9 }}>
          <p style={{
            fontSize: 9, fontWeight: 700, letterSpacing: "0.45em", textTransform: "uppercase",
            color: CE_DIM, margin: 0, flexShrink: 0,
          }}>
            Directional Intelligence
          </p>
          <div style={{ flex: 1, height: 1, background: "rgba(239,68,68,0.10)" }} />
        </div>
        <p style={{
          fontFamily: playfair.style.fontFamily,
          fontSize: 21, fontWeight: 600, color: CE_WHITE, margin: 0,
        }}>
          Dominant Signals
        </p>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: 14,
      }}>
        {featured.map((d) => <ActNowCard key={d.title} data={d} />)}
      </div>
    </section>
  );
}

// ── Force Matrix ──────────────────────────────────────────────────────────────

function ForceMatrixTable({ signals }: { signals: V2Signal[] }) {
  const rows = signals.filter((s) => s.is_base_signal);
  return (
    <section style={{ marginBottom: 58 }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 9 }}>
          <p style={{
            fontSize: 9, fontWeight: 700, letterSpacing: "0.45em", textTransform: "uppercase",
            color: CE_DIM, margin: 0, flexShrink: 0,
          }}>
            Force Register
          </p>
          <div style={{ flex: 1, height: 1, background: CE_FAINT }} />
        </div>
        <p style={{
          fontFamily: playfair.style.fontFamily,
          fontSize: 21, fontWeight: 600, color: CE_WHITE, margin: 0,
        }}>
          Seven Base Forces
        </p>
      </div>

      <div style={{
        borderRadius: 10,
        border: `1px solid ${CE_FAINT}`,
        overflow: "hidden",
        overflowX: "auto",
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 720 }}>
          <thead>
            <tr style={{
              background: "rgba(2,5,10,0.92)",
              borderBottom: "1px solid rgba(35,60,95,0.30)",
            }}>
              {["Force", "State", "Dominant Path", "Weight", "Urgency", "Operator Move"].map((h) => (
                <th key={h} style={{
                  padding: "12px 16px", textAlign: "left",
                  fontSize: 9, fontWeight: 700, letterSpacing: "0.30em", textTransform: "uppercase",
                  color: CE_DIM, whiteSpace: "nowrap",
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((s, i) => {
              const urgency = getUrgency(s);
              return (
                <tr key={s.id} className="sg-table-row" style={{
                  borderBottom: i < rows.length - 1 ? `1px solid rgba(15,26,40,0.95)` : "none",
                }}>
                  <td style={{
                    padding: "14px 16px", color: CE_WHITE,
                    fontWeight: 600, whiteSpace: "nowrap", fontSize: 13,
                  }}>
                    {s.title}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    {s.signal_state
                      ? <StateBadge state={s.signal_state} />
                      : <span style={{ color: CE_DIM, fontSize: 11 }}>—</span>}
                  </td>
                  <td style={{ padding: "14px 16px", color: CE_MUTED, maxWidth: 220, fontSize: 12, lineHeight: 1.5 }}>
                    {s.dominant_path ?? s.directional_thesis ?? "—"}
                  </td>
                  <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                    {s.directional_weight != null ? (
                      <span style={{ display: "inline-flex", alignItems: "baseline", gap: 1 }}>
                        <span style={{ fontSize: 17, fontWeight: 700, color: CE_WHITE, letterSpacing: "-0.01em" }}>
                          {s.directional_weight}
                        </span>
                        <span style={{ fontSize: 10, color: CE_MUTED }}>%</span>
                      </span>
                    ) : <span style={{ color: CE_DIM }}>—</span>}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    {urgency ? <UrgencyBadge urgency={urgency} /> : <span style={{ color: CE_DIM }}>—</span>}
                  </td>
                  <td style={{ padding: "14px 16px", color: CE_MUTED, fontSize: 12, lineHeight: 1.5 }}>
                    {s.operator_move ?? "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ── Primary Signal Card ───────────────────────────────────────────────────────

function PrimarySignalCard({ signal }: { signal: V2Signal }) {
  const score        = getV2Score(signal);
  const tags         = getSignalTags(signal);
  const urgency      = getUrgency(signal);
  const dominantPath = signal.dominant_path ?? signal.directional_thesis ?? null;
  const operatorMove = signal.operator_move ?? null;
  const directionalW = signal.directional_weight ?? null;

  return (
    <div className="ce-primary-card ce-primary-card-grid" style={{
      border: `1px solid ${GOLD_DIM}`,
      borderRadius: 10,
      background: "rgba(3,7,16,0.78)",
      display: "grid", gridTemplateColumns: "65fr 35fr",
      overflow: "hidden", position: "relative",
    }}>
      {/* Gold top-edge accent */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${GOLD} 0%, rgba(201,169,97,0.28) 45%, transparent 100%)`,
        pointerEvents: "none",
      }} />

      {/* Left column */}
      <div style={{ padding: "30px 32px", display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {signal.signal_state && <StateBadge state={signal.signal_state} />}
          {urgency && <UrgencyBadge urgency={urgency} />}
        </div>

        <p style={{
          fontSize: 9, fontWeight: 700, letterSpacing: "0.45em",
          textTransform: "uppercase", color: CE_DIM, margin: 0,
        }}>
          Primary Signal
        </p>

        <h2 style={{
          fontFamily: playfair.style.fontFamily,
          fontSize: 24, fontWeight: 600, lineHeight: 1.28,
          color: CE_WHITE, margin: 0,
        }}>
          {signal.title}
        </h2>

        {dominantPath && (
          <div>
            <p style={{
              fontSize: 9, fontWeight: 700, letterSpacing: "0.35em", textTransform: "uppercase",
              color: CE_DIM, margin: "0 0 6px",
            }}>
              Dominant Path
            </p>
            <p style={{ fontSize: 13, lineHeight: 1.65, color: CE_MUTED, margin: 0 }}>
              {dominantPath}
            </p>
          </div>
        )}

        {operatorMove && (
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 10,
            borderTop: `1px solid rgba(22,36,58,0.9)`, paddingTop: 14,
          }}>
            <span style={{
              fontSize: 9, fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase",
              color: GOLD, flexShrink: 0, paddingTop: 2,
            }}>
              MOVE →
            </span>
            <p style={{ fontSize: 13, color: CE_WHITE, margin: 0, lineHeight: 1.6, opacity: 0.90 }}>
              {operatorMove}
            </p>
          </div>
        )}

        <p style={{ fontSize: 13, lineHeight: 1.75, color: CE_MUTED, margin: 0 }}>
          {signal.summary}
        </p>

        {tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {tags.map((t) => <V2TagChip key={t.label} tag={t} />)}
          </div>
        )}
      </div>

      {/* Right column */}
      <div className="ce-primary-card-right" style={{
        borderLeft: "1px solid rgba(201,169,97,0.09)",
        background: "rgba(2,5,12,0.55)",
        display: "flex",
      }}>
        <div style={{
          flex: 1, padding: "30px 28px",
          display: "flex", flexDirection: "column", justifyContent: "center", gap: 18,
        }}>
          <p style={{
            fontSize: 9, fontWeight: 700, letterSpacing: "0.45em",
            textTransform: "uppercase", color: CE_DIM, margin: 0,
          }}>
            {score > 0 ? "Confidence" : "Status"}
          </p>

          {score > 0 ? (
            <>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{
                  fontFamily: playfair.style.fontFamily,
                  fontSize: 70, fontWeight: 700, lineHeight: 1,
                  color: CE_WHITE, letterSpacing: "-0.03em",
                }}>
                  {score}
                </span>
                <span style={{ fontSize: 16, color: CE_DIM, fontWeight: 400 }}>/100</span>
              </div>

              <div style={{ height: 2, background: GOLD_FAINT, borderRadius: 2, overflow: "hidden" }}>
                <div
                  className="ce-bar-fill"
                  style={{ "--target-width": `${Math.min(score, 100)}%` } as React.CSSProperties}
                />
              </div>
            </>
          ) : (
            <span style={{
              fontSize: 11, color: CE_MUTED, fontWeight: 500,
              background: "rgba(100,116,139,0.08)",
              border: "1px solid rgba(100,116,139,0.15)",
              padding: "6px 12px", borderRadius: 6, alignSelf: "flex-start",
            }}>
              Score pending
            </span>
          )}

          {directionalW && (
            <div>
              <p style={{
                fontSize: 9, fontWeight: 700, letterSpacing: "0.35em", textTransform: "uppercase",
                color: CE_DIM, margin: "0 0 5px",
              }}>
                Directional Weight
              </p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
                <span style={{ fontSize: 32, fontWeight: 700, color: CE_WHITE, letterSpacing: "-0.01em" }}>
                  {directionalW}
                </span>
                <span style={{ fontSize: 14, color: CE_MUTED }}>%</span>
              </div>
            </div>
          )}

          <p style={{
            fontSize: 10, color: CE_DIM, margin: 0,
            display: "flex", alignItems: "center", gap: 5,
          }}>
            <span style={{ color: GOLD }}>✓</span>
            human-reviewed · doctrine-governed
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Signal list row ───────────────────────────────────────────────────────────

function SignalListRow({ signal }: { signal: V2Signal }) {
  const score        = getV2Score(signal);
  const tags         = getSignalTags(signal).slice(0, 2);
  const blurb        = signal.implication ?? signal.directional_thesis ?? truncateSentences(signal.summary, 1);
  const operatorMove = signal.operator_move ?? null;
  const isActNow     = signal.signal_state === "act_now";

  return (
    <Link href={`/signals/${signal.id}`} style={{ textDecoration: "none", display: "block" }}>
      <div className="sg-list-row" style={{
        display: "grid",
        gridTemplateColumns: "18px 1fr auto auto auto",
        alignItems: "center",
        gap: 16,
        padding: "16px 8px",
        cursor: "pointer",
        borderRadius: 6,
      }}>
        <div style={{
          width: 7, height: 7, borderRadius: "50%",
          background: isActNow ? GOLD : CE_FAINT,
          flexShrink: 0, justifySelf: "center",
          boxShadow: isActNow ? `0 0 7px ${GOLD}88` : "none",
        }} />

        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <p style={{
              fontFamily: playfair.style.fontFamily,
              fontSize: 14, fontWeight: 600, color: CE_WHITE,
              margin: 0, lineHeight: 1.35,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {signal.title}
            </p>
            {signal.signal_state && signal.signal_state !== "watch" && (
              <span style={{ flexShrink: 0 }}>
                <StateBadge state={signal.signal_state} />
              </span>
            )}
          </div>
          {blurb && (
            <p style={{
              fontSize: 12, color: CE_MUTED, margin: 0, lineHeight: 1.5,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {blurb}
            </p>
          )}
          {operatorMove && (
            <p style={{ fontSize: 11, margin: "4px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              <span style={{
                color: GOLD, fontWeight: 700, fontSize: 9,
                letterSpacing: "0.20em", textTransform: "uppercase", marginRight: 6,
              }}>MOVE</span>
              <span style={{ color: CE_MUTED }}>{operatorMove}</span>
            </p>
          )}
        </div>

        <div className="ce-list-row-tags" style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          {tags.map((t) => <V2TagChip key={t.label} tag={t} />)}
        </div>

        {score > 0 ? (
          <span style={{
            fontSize: 14, fontWeight: 700, color: CE_WHITE,
            letterSpacing: "0.02em", flexShrink: 0,
          }}>
            {score}
            <span style={{ fontSize: 10, fontWeight: 400, color: CE_DIM }}>/100</span>
          </span>
        ) : (
          <span style={{ fontSize: 10, color: CE_DIM, flexShrink: 0 }}>pending</span>
        )}

        <span style={{ fontSize: 14, color: GOLD, flexShrink: 0 }}>→</span>
      </div>
    </Link>
  );
}

// ── Main layout ───────────────────────────────────────────────────────────────

function SignalIntelligenceLayout({
  signals,
  convergences,
}: {
  signals: V2Signal[];
  convergences: ConvergenceResult[];
}) {
  const eligible = signals.filter((s) => s.is_base_signal || getFinalScore(s) > 0);
  const sorted   = [...eligible].sort((a, b) => {
    if (a.is_base_signal && !b.is_base_signal) return -1;
    if (!a.is_base_signal && b.is_base_signal) return 1;
    if (a.is_base_signal && b.is_base_signal) return (b.directional_weight ?? 0) - (a.directional_weight ?? 0);
    return getFinalScore(b) - getFinalScore(a);
  });
  const primary   = sorted[0] ?? null;
  const remaining = sorted.slice(1);
  const isEmpty   = eligible.length === 0;

  return (
    <div style={{
      minHeight: "100vh", position: "relative",
      background: `url("${NOISE_URI}") repeat, linear-gradient(168deg, #02060F 0%, #030B1A 32%, #020810 65%, #010406 100%)`,
      color: CE_WHITE,
    }}>

      <StarField />

      <style>{`
        /* ── Keyframes ── */
        @keyframes ceEaseUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ceBorderPulse {
          0%, 100% { border-color: rgba(201,169,97,0.33); }
          50%       { border-color: rgba(201,169,97,0.62); }
        }
        @keyframes ceFillBar {
          from { width: 0; }
          to   { width: var(--target-width, 0%); }
        }
        @keyframes sgPulseAct {
          0%, 100% { box-shadow: none; }
          50%       { box-shadow: 0 0 10px rgba(201,169,97,0.38); }
        }
        @keyframes sgStarW {
          0%, 100% { opacity: 0.55; }
          50%       { opacity: 1; }
        }
        @keyframes sgStarB {
          0%, 100% { opacity: 0.5; }
          42%       { opacity: 0.9; }
          72%       { opacity: 0.4; }
        }
        @keyframes sgStarP {
          0%, 100% { opacity: 0.62; }
          50%       { opacity: 1; }
        }
        @keyframes sgDriftW {
          0%   { transform: translate(0, 0); }
          33%  { transform: translate(3px, 5px); }
          66%  { transform: translate(-2px, 2px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes sgDriftB {
          0%   { transform: translate(0, 0); }
          40%  { transform: translate(-4px, 3px); }
          75%  { transform: translate(3px, -3px); }
          100% { transform: translate(0, 0); }
        }

        /* ── Star layers ── */
        .sg-star-w { animation: sgStarW 12s ease-in-out infinite; }
        .sg-star-b { animation: sgStarB 18s ease-in-out infinite; }
        .sg-star-p { animation: sgStarP 8s  ease-in-out infinite; }
        .sg-layer-w { animation: sgDriftW 110s ease-in-out infinite; }
        .sg-layer-b { animation: sgDriftB 145s ease-in-out infinite; }

        /* ── Entry stagger ── */
        .ce-el-1 { opacity: 0; animation: ceEaseUp 320ms ease-out   0ms forwards; }
        .ce-el-2 { opacity: 0; animation: ceEaseUp 320ms ease-out  70ms forwards; }
        .ce-el-3 { opacity: 0; animation: ceEaseUp 320ms ease-out 140ms forwards; }
        .ce-el-4 { opacity: 0; animation: ceEaseUp 320ms ease-out 210ms forwards; }
        .ce-el-5 { opacity: 0; animation: ceEaseUp 320ms ease-out 280ms forwards; }
        .ce-el-6 { opacity: 0; animation: ceEaseUp 320ms ease-out 350ms forwards; }

        /* ── Primary card ── */
        .ce-primary-card {
          animation: ceBorderPulse 4.5s ease-in-out infinite;
          transition: transform 220ms ease-out, box-shadow 220ms ease-out;
          will-change: transform;
        }
        .ce-primary-card:hover {
          transform: translateY(-2px) scale(1.003);
          border-color: rgba(201,169,97,0.70) !important;
          box-shadow: 0 10px 40px rgba(1,3,9,0.55);
        }

        /* ── Progress bar ── */
        .ce-bar-fill {
          height: 100%;
          width: var(--target-width, 0%);
          background: linear-gradient(90deg, rgba(201,169,97,0.65) 0%, #C9A961 100%);
          border-radius: 2px;
          animation: ceFillBar 900ms ease-out forwards;
        }

        /* ── Act Now card ── */
        .sg-act-card {
          transition: transform 200ms ease-out, box-shadow 200ms ease-out;
        }
        .sg-act-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 28px rgba(1,3,8,0.5);
        }

        /* ── Table row ── */
        .sg-table-row {
          background: rgba(2,5,10,0.45);
          transition: background 150ms ease;
        }
        .sg-table-row:hover { background: rgba(5,13,26,0.82); }

        /* ── List row ── */
        .sg-list-row { transition: background 140ms ease; }
        .sg-list-row:hover { background: rgba(5,13,26,0.65); }

        /* ── Judgment strip ── */
        .ce-judgment-strip {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          border: 1px solid rgba(35,60,95,0.22);
          border-radius: 7px;
          overflow: hidden;
          margin-bottom: 1rem;
        }
        .ce-judgment-stage {
          padding: 1rem 1.15rem;
          border-right: 1px solid rgba(35,60,95,0.18);
          background: rgba(2,5,12,0.72);
          transition: background 180ms ease;
        }
        .ce-judgment-stage:last-child { border-right: none; }
        .ce-judgment-stage:hover { background: rgba(4,10,22,0.92); }

        .ce-judgment-eyebrow {
          font-family: ui-monospace, monospace;
          font-size: 9.5px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #384A5C;
          margin: 0 0 0.5rem;
        }
        .ce-judgment-eyebrow--gold { color: rgba(201,169,97,0.68); }

        .ce-stage-copy {
          font-size: 11.5px;
          line-height: 1.65;
          color: #314053;
          margin: 0;
        }

        .ce-signal-row {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1px;
          background: rgba(255,255,255,0.04);
          border-radius: 10px;
          overflow: hidden;
        }
        @media (min-width: 900px) {
          .ce-signal-row { grid-template-columns: 1fr 1.8fr 1fr; }
        }

        .ce-context-panel {
          padding: 1.35rem 1.25rem;
          background: rgba(3,7,14,0.86);
          transition: transform 220ms ease, background 180ms ease;
        }
        .ce-context-panel:hover {
          transform: translateY(-2px);
          background: rgba(4,10,22,0.95);
        }
        .ce-context-panel--left  { border-left:  2px solid rgba(201,169,97,0.38); }
        .ce-context-panel--right { border-right: 2px solid rgba(201,169,97,0.38); }
        .ce-context-panel--left:hover  { border-left-color:  rgba(201,169,97,0.72); }
        .ce-context-panel--right:hover { border-right-color: rgba(201,169,97,0.72); }

        .ce-context-body { font-size: 12.5px; line-height: 1.72; color: #B8C8DA; }
        .ce-context-body p           { margin: 0 0 0.65rem; }
        .ce-context-body p:last-child { margin-bottom: 0; }
        .ce-context-meta { font-size: 10.5px; color: #344558; margin: 0; font-style: italic; }

        .ce-primary-slot { background: #02050C; }
        .ce-under-review { transition: opacity 200ms ease-out; }
        .ce-under-review:hover { opacity: 0.75; }

        /* ── Mobile ── */
        @media (max-width: 768px) {
          .sg-nav          { padding: 0 20px !important; }
          .ce-v2-main      { padding: 32px 20px 60px !important; }
          .ce-primary-card-grid  { grid-template-columns: 1fr !important; }
          .ce-primary-card-right { border-left: none !important; border-top: 1px solid rgba(201,169,97,0.09) !important; }
          .ce-list-row-tags      { display: none !important; }
          .ce-judgment-strip     { grid-template-columns: 1fr 1fr !important; }
          .ce-judgment-stage:nth-child(odd)  { border-right: 1px solid rgba(35,60,95,0.18); }
          .ce-judgment-stage:nth-child(even) { border-right: none !important; }
          .ce-judgment-stage { border-bottom: 1px solid rgba(35,60,95,0.12); }
        }

        /* ── Reduced motion ── */
        @media (prefers-reduced-motion: reduce) {
          .ce-el-1, .ce-el-2, .ce-el-3, .ce-el-4, .ce-el-5, .ce-el-6 {
            opacity: 1; animation: none; transform: none;
          }
          .ce-primary-card  { animation: none; }
          .ce-bar-fill      { animation: none; }
          .sg-star-w, .sg-star-b, .sg-star-p { animation: none !important; opacity: 0.45; }
          .sg-layer-w, .sg-layer-b            { animation: none; }
          .ce-context-panel:hover { transform: none; }
          .sg-act-card:hover { transform: none; }
        }
      `}</style>

      <div style={{ position: "relative", zIndex: 1 }}>
        <V2Nav />

        <main className="ce-v2-main" style={{ maxWidth: 980, margin: "0 auto", padding: "58px 40px 80px" }}>

          {/* Hero eyebrow — stagger 1 */}
          <div className="ce-el-1" style={{ marginBottom: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
              <p style={{
                fontSize: 9, fontWeight: 600, letterSpacing: "0.42em",
                textTransform: "uppercase", color: "rgba(201,169,97,0.52)", margin: 0,
              }}>
                Signal Intelligence &nbsp;·&nbsp; Cycle 001
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{
                  width: 5, height: 5, borderRadius: "50%",
                  background: "#4ADE80",
                  boxShadow: "0 0 7px rgba(74,222,128,0.65)",
                }} />
                <span style={{
                  fontSize: 9, fontWeight: 700, color: "#4ADE80",
                  letterSpacing: "0.14em", textTransform: "uppercase",
                }}>
                  LIVE
                </span>
              </div>
            </div>
            <div style={{ height: 1, background: GOLD_RULE }} />
          </div>

          {/* Headline — stagger 2 */}
          <h1 className="ce-el-2" style={{
            fontFamily: playfair.style.fontFamily,
            fontSize: 38, fontWeight: 400, lineHeight: 1.22,
            color: CE_WHITE, margin: "0 0 14px", maxWidth: 700,
          }}>
            Structural clarity is earned through disciplined filtration.
          </h1>

          <p className="ce-el-2" style={{
            fontSize: 14, lineHeight: 1.68, color: CE_MUTED,
            margin: "0 0 52px", maxWidth: 540,
          }}>
            Human-reviewed, doctrine-governed signal intelligence for operators who move on structural truth.
          </p>

          {isEmpty ? (
            <div style={{
              padding: "48px 0", borderTop: `1px solid ${CE_FAINT}`,
              fontSize: 13, color: CE_MUTED,
            }}>
              No signals published in this cycle.
            </div>
          ) : (
            <>
              {/* Dominant signals — stagger 3 */}
              <div className="ce-el-3">
                <DirectionalCommandLayer signals={eligible} />
              </div>

              {/* Force matrix — stagger 4 */}
              <div className="ce-el-4">
                <ForceMatrixTable signals={eligible} />
              </div>

              {/* Primary signal — stagger 5 */}
              {primary && (
                <div className="ce-el-5" style={{ marginBottom: 50 }}>
                  <SignalWithContext
                    primarySignal={<PrimarySignalCard signal={primary} />}
                    structuralBasis={primary.directional_thesis}
                    watchNote={primary.dominant_path}
                  />
                </div>
              )}

              {/* Signal list — stagger 6 */}
              <div className="ce-el-6">
                {remaining.length > 0 ? (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                      <p style={{
                        fontSize: 9, fontWeight: 700, letterSpacing: "0.45em",
                        textTransform: "uppercase", color: CE_DIM, margin: 0, flexShrink: 0,
                      }}>
                        Published Signals
                      </p>
                      <div style={{ flex: 1, height: 1, background: CE_FAINT }} />
                    </div>
                    {remaining.map((s, i) => (
                      <div key={s.id}>
                        <SignalListRow signal={s} />
                        {i < remaining.length - 1 && (
                          <div style={{ height: 1, background: "rgba(15,26,40,0.70)", margin: "0 8px" }} />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="ce-under-review" style={{
                    fontSize: 12, color: CE_MUTED, margin: 0,
                    letterSpacing: "0.01em", lineHeight: 1.6,
                    borderTop: `1px solid ${CE_FAINT}`, paddingTop: 20,
                  }}>
                    More signals are under review. The gate decides when they are ready.
                  </p>
                )}
              </div>

              {/* Active convergences */}
              {convergences.length > 0 && (
                <div style={{ marginTop: 74 }}>
                  <div style={{ marginBottom: 18 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 9 }}>
                      <span style={{
                        fontSize: 9, fontWeight: 700, letterSpacing: "0.45em", textTransform: "uppercase",
                        color: CE_DIM, flexShrink: 0,
                      }}>
                        Convergence Intelligence
                      </span>
                      <div style={{ flex: 1, height: 1, background: GOLD_RULE }} />
                    </div>
                    <p style={{
                      fontFamily: playfair.style.fontFamily,
                      fontSize: 21, fontWeight: 600, color: CE_WHITE, margin: 0,
                    }}>
                      Active Convergences
                    </p>
                  </div>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: 16,
                  }}>
                    {convergences.map((c) => <ConvergenceCard key={c.id} c={c} />)}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function SignalsPage() {
  let v2Signals: V2Signal[]               = [];
  let v2Convergences: ConvergenceResult[] = [];
  try {
    [v2Signals, v2Convergences] = await Promise.all([
      fetchV2Signals(),
      fetchConvergences(),
    ]);
  } catch {
    // render empty state on error
  }
  return <SignalIntelligenceLayout signals={v2Signals} convergences={v2Convergences} />;
}
