import { createClient } from "@supabase/supabase-js";
import { Playfair_Display } from "next/font/google";
import Link from "next/link";
import type { SignalCategory } from "@/types/signals";
import { GridOverlay } from "./_components/GridOverlay";

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

void CATEGORY_ORDER;

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

// ── V1 sub-components ─────────────────────────────────────────────────────────

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

const GOLD      = "#C5A46E";
const GOLD_DIM  = "rgba(197,164,110,0.28)";
const CE_WHITE  = "#EEF3FA";
const CE_MUTED  = "#7A8DA6";
const CE_DIM    = "#46566A";
const CYAN      = "#00E5FF";
const PANEL_BG  = "rgba(3,7,16,0.85)";
const PANEL_BD  = "rgba(14,26,46,0.90)";
const CHIP_BG   = "rgba(8, 16, 34, 0.82)";
const CHIP_BD   = "rgba(55, 85, 125, 0.22)";
const CHIP_TEXT = "#546482";
const NOISE_URI = "data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='220'%20height='220'%3E%3Cfilter%20id='n'%3E%3CfeTurbulence%20type='fractalNoise'%20baseFrequency='0.82'%20numOctaves='4'%20stitchTiles='stitch'/%3E%3CfeColorMatrix%20type='matrix'%20values='0%200%200%200%200%200%200%200%200%200%200%200%200%200%200%200%200%200%200.018%200'/%3E%3C/filter%3E%3Crect%20width='220'%20height='220'%20filter='url(%23n)'/%3E%3C%2Fsvg%3E";

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
  act_now:     { bg: "rgba(197,164,110,0.14)", color: "#C5A46E", border: "rgba(197,164,110,0.36)", label: "ACT NOW",     pulse: true },
  directional: { bg: "rgba(0,229,255,0.07)",  color: "#00E5FF", border: "rgba(0,229,255,0.22)",  label: "DIRECTIONAL" },
  growing:     { bg: "rgba(0,229,255,0.05)",  color: "rgba(0,229,255,0.72)", border: "rgba(0,229,255,0.15)", label: "GROWING" },
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
      fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      padding: "3px 8px", borderRadius: 4,
    }}>
      {urgency}
    </span>
  );
}

// ── Star field ────────────────────────────────────────────────────────────────

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
      <g>
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

// ── Sidebar icons ─────────────────────────────────────────────────────────────

function SidebarIcon({ type }: { type: string }) {
  const s = { width: 14, height: 14, flexShrink: 0 as const };
  if (type === "grid") return (
    <svg {...s} viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
      <rect x="0" y="0" width="5.5" height="5.5" rx="1" />
      <rect x="8.5" y="0" width="5.5" height="5.5" rx="1" />
      <rect x="0" y="8.5" width="5.5" height="5.5" rx="1" />
      <rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1" />
    </svg>
  );
  if (type === "signal") return (
    <svg {...s} viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
      <rect x="0" y="9" width="2.5" height="5" rx="1" />
      <rect x="3.8" y="6" width="2.5" height="8" rx="1" />
      <rect x="7.7" y="3" width="2.5" height="11" rx="1" />
      <rect x="11.5" y="0" width="2.5" height="14" rx="1" />
    </svg>
  );
  if (type === "table") return (
    <svg {...s} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <rect x="1" y="1" width="12" height="12" rx="1.5" />
      <line x1="1" y1="5" x2="13" y2="5" />
      <line x1="1" y1="9" x2="13" y2="9" />
      <line x1="5" y1="5" x2="5" y2="13" />
    </svg>
  );
  if (type === "star") return (
    <svg {...s} viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
      <path d="M7 1.2l1.4 3.8h4l-3.2 2.4 1.2 3.8L7 9l-3.4 2.2 1.2-3.8L1.6 5h4z" />
    </svg>
  );
  if (type === "move") return (
    <svg {...s} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M2 7h10M8 3l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  if (type === "check") return (
    <svg {...s} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <circle cx="7" cy="7" r="6" />
      <path d="M4.5 7l2 2 3-3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  if (type === "merge") return (
    <svg {...s} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <path d="M2 1v5l5 4v3" strokeLinecap="round" />
      <path d="M12 1v5l-5 4" strokeLinecap="round" />
    </svg>
  );
  return (
    <svg {...s} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <rect x="1" y="4.5" width="12" height="8.5" rx="1" />
      <path d="M1 4.5l2.5-3h7l2.5 3" />
      <path d="M5 8h4" strokeLinecap="round" />
    </svg>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

const SIDEBAR_ITEMS = [
  { label: "Overview",         href: "#sg-overview",    icon: "grid"    },
  { label: "Dominant Signals", href: "#sg-dominant",    icon: "signal"  },
  { label: "Force Register",   href: "#sg-register",    icon: "table"   },
  { label: "Featured Force",   href: "#sg-featured",    icon: "star"    },
  { label: "Operator Moves",   href: "#sg-moves",       icon: "move"    },
  { label: "Evidence Engine",  href: "#sg-evidence",    icon: "check"   },
  { label: "Convergences",     href: "#sg-convergences",icon: "merge"   },
  { label: "Archive",          href: "#sg-archive",     icon: "archive" },
];

function Sidebar({ pf }: { pf: string }) {
  return (
    <aside className="sg-sidebar">
      <div className="sg-sidebar-brand">
        <span style={{ fontFamily: pf, fontSize: 13, fontWeight: 600, color: GOLD, letterSpacing: "0.06em" }}>
          CE
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, color: CE_WHITE, letterSpacing: "0.18em" }}>
          SIGNALS
        </span>
      </div>

      <p className="sg-sidebar-section">INTELLIGENCE</p>

      <nav className="sg-sidebar-nav">
        {SIDEBAR_ITEMS.map((item, i) => (
          <a
            key={item.href}
            href={item.href}
            className={`sg-nav-item${i === 0 ? " sg-nav-item--active" : ""}`}
          >
            <SidebarIcon type={item.icon} />
            <span>{item.label}</span>
          </a>
        ))}
      </nav>

      <div className="sg-sidebar-footer">
        <div className="sg-live-indicator" style={{ marginBottom: 12 }}>
          <span className="sg-live-dot" />
          <span className="sg-live-label">LIVE</span>
        </div>
        <Link href="/" className="sg-sidebar-home-link">
          ← Cognitive Empire
        </Link>
      </div>
    </aside>
  );
}

// ── Dashboard header ──────────────────────────────────────────────────────────

function SearchGlyph() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.2" y2="16.2" strokeLinecap="round" />
    </svg>
  );
}

function DashboardHeader({ cycleLabel }: { cycleLabel: string }) {
  return (
    <header className="sg-header">
      <div className="sg-header-top">
        <div className="sg-header-titleblock">
          <div className="sg-header-eyebrow">CE SIGNALS <span className="sg-header-eyebrow-sep">/</span> OVERVIEW</div>
          <h1 className="sg-header-title">Structural intelligence across accelerating domains.</h1>
          <p className="sg-header-subtitle">
            Track the forces shaping our world. Identify what matters. Act with clarity.
          </p>
        </div>

        <div className="sg-header-controls">
          <div className="sg-header-search" aria-hidden="true">
            <SearchGlyph />
            <span>Search signals</span>
          </div>
          <div className="sg-live-indicator">
            <span className="sg-live-dot" />
            <span className="sg-live-label">LIVE</span>
          </div>
          <span className="sg-header-cycle">{cycleLabel}</span>
        </div>
      </div>
    </header>
  );
}

// ── KPI strip ─────────────────────────────────────────────────────────────────

type KPI = { label: string; value: string; sub: string; gold?: boolean };

function KPIGlyph({ gold }: { gold?: boolean }) {
  const color = gold ? "#C5A46E" : "rgba(0,229,255,0.60)";
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <circle cx="6" cy="6" r="5" fill="none" stroke={color} strokeWidth="1.1" />
      <circle cx="6" cy="6" r="1.6" fill={color} />
    </svg>
  );
}

function KPIStrip({ kpis }: { kpis: KPI[] }) {
  return (
    <div className="sg-kpi-strip">
      {kpis.map((kpi, i) => (
        <div key={i} className={`sg-kpi-card${kpi.gold ? " sg-kpi-card--gold" : ""}`}>
          <div className="sg-kpi-card-top">
            <KPIGlyph gold={kpi.gold} />
            <span className="sg-kpi-label">{kpi.label}</span>
          </div>
          <span className={`sg-kpi-value${kpi.gold ? " sg-kpi-gold" : ""}`}>{kpi.value}</span>
          <span className="sg-kpi-sub">{kpi.sub}</span>
        </div>
      ))}
    </div>
  );
}

// ── Panel header ──────────────────────────────────────────────────────────────

function PanelHdr({ label, meta, gold }: { label: string; meta?: string; gold?: boolean }) {
  return (
    <div className="sg-panel-hdr">
      <span className={`sg-panel-label${gold ? " sg-panel-label--gold" : ""}`}>{label}</span>
      {meta && <span className="sg-panel-meta">{meta}</span>}
    </div>
  );
}

// ── Force map (hero) ──────────────────────────────────────────────────────────

type MapNode = {
  id: string;
  title: string;
  weight: number;
  x: number;
  y: number;
  r: number;
  color: string;
  central: boolean;
};

// Deterministic decorative dust field — fixed formula, no runtime randomness.
const MAP_DUST: [number, number, number, number][] = Array.from({ length: 46 }, (_, i) => {
  const x = (i * 47.3 + (i % 5) * 6.1) % 100;
  const y = (i * 71.9 + (i % 7) * 4.3) % 100;
  const r = 0.4 + ((i * 13) % 7) / 10;
  const o = 0.10 + ((i * 7) % 10) / 45;
  return [x, y, r, o];
});

function stateColor(state: string | null): string {
  if (!state) return "#5C6E84";
  return STATE_MAP[state]?.color ?? "#5C6E84";
}

function buildForceMapNodes(forces: V2Signal[], featured: V2Signal | null): MapNode[] {
  const ring = forces.filter((f) => f.id !== featured?.id).slice(0, 7);
  const all = featured ? [featured, ...ring] : ring;
  const weights = all.map((f) => f.directional_weight ?? 0);
  const maxW = Math.max(1, ...weights);
  const minW = Math.min(...weights.filter((w) => w > 0), maxW);

  const scaleR = (w: number) => {
    if (maxW === minW) return 14;
    const t = (w - minW) / (maxW - minW);
    return 8 + t * 12;
  };

  const nodes: MapNode[] = [];

  if (featured) {
    nodes.push({
      id: featured.id,
      title: featured.title,
      weight: featured.directional_weight ?? 0,
      x: 50,
      y: 50,
      r: scaleR(featured.directional_weight ?? 0) + 7,
      color: stateColor(featured.signal_state),
      central: true,
    });
  }

  const n = ring.length;
  ring.forEach((f, i) => {
    const angle = (i / Math.max(n, 1)) * Math.PI * 2 - Math.PI / 2;
    const rx = 30, ry = 26;
    nodes.push({
      id: f.id,
      title: f.title,
      weight: f.directional_weight ?? 0,
      x: 50 + rx * Math.cos(angle),
      y: 50 + ry * Math.sin(angle),
      r: scaleR(f.directional_weight ?? 0),
      color: stateColor(f.signal_state),
      central: false,
    });
  });

  return nodes;
}

const MAP_LEGEND = [
  { key: "act_now",     label: "Act Now",     color: "#C5A46E" },
  { key: "directional", label: "Directional", color: "#00E5FF" },
  { key: "growing",     label: "Growing",     color: "rgba(0,229,255,0.60)" },
  { key: "watch",       label: "Watch",       color: "#5C6E84" },
] as const;

function ForceMap({ nodes }: { nodes: MapNode[] }) {
  const center = nodes.find((n) => n.central) ?? null;
  const ring   = nodes.filter((n) => !n.central);

  if (nodes.length === 0) {
    return (
      <div className="sg-map sg-map--empty">
        <span style={{ color: CE_MUTED, fontSize: 12 }}>No force data available.</span>
      </div>
    );
  }

  return (
    <div className="sg-map">
      <svg className="sg-map-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <radialGradient id="sgMapGlowOuter" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(197,164,110,0.10)" />
            <stop offset="100%" stopColor="rgba(197,164,110,0)" />
          </radialGradient>
          <radialGradient id="sgMapGlowInner" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(197,164,110,0.22)" />
            <stop offset="100%" stopColor="rgba(197,164,110,0)" />
          </radialGradient>
        </defs>

        {/* decorative dust field */}
        {MAP_DUST.map(([x, y, r, o], i) => (
          <circle key={`dust-${i}`} cx={x} cy={y} r={r} fill={`rgba(180,200,225,${o})`} />
        ))}

        {center && <ellipse cx={center.x} cy={center.y} rx={40} ry={34} fill="url(#sgMapGlowOuter)" />}
        {center && <ellipse cx={center.x} cy={center.y} rx={22} ry={18} fill="url(#sgMapGlowInner)" />}

        {/* ring-to-ring arcs for network density */}
        {ring.map((n, i) => {
          const next = ring[(i + 1) % ring.length];
          if (!next || ring.length < 3) return null;
          return (
            <line
              key={`arc-${n.id}`}
              x1={n.x} y1={n.y} x2={next.x} y2={next.y}
              stroke="rgba(122,141,166,0.16)" strokeWidth={0.2}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}

        {/* spokes from center */}
        {center && ring.map((n) => (
          <line
            key={`line-${n.id}`}
            x1={center.x} y1={center.y} x2={n.x} y2={n.y}
            stroke={n.color} strokeOpacity={0.30} strokeWidth={0.32}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>

      {nodes.map((n) => (
        <div
          key={n.id}
          className={`sg-map-node${n.central ? " sg-map-node--center" : ""}`}
          style={{ left: `${n.x}%`, top: `${n.y}%` }}
        >
          <span
            className="sg-map-node-dot"
            style={{
              width: n.r * 2, height: n.r * 2,
              background: n.color,
              boxShadow: `0 0 ${n.central ? 26 : 12}px ${n.color}`,
            }}
          />
          <span className="sg-map-node-label">{n.title}</span>
          {n.weight > 0 && <span className="sg-map-node-weight">{n.weight}%</span>}
        </div>
      ))}
    </div>
  );
}

function MapLegend() {
  return (
    <div className="sg-map-legend">
      {MAP_LEGEND.map((l) => (
        <span key={l.key} className="sg-map-legend-item">
          <span className="sg-map-legend-dot" style={{ background: l.color, boxShadow: `0 0 6px ${l.color}` }} />
          {l.label}
        </span>
      ))}
      <span className="sg-map-legend-item sg-map-legend-item--muted">Node size = weight</span>
    </div>
  );
}

// ── Featured Force panel ──────────────────────────────────────────────────────

function WeightRing({ weight }: { weight: number }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(weight, 100) / 100) * c;
  return (
    <svg width="76" height="76" viewBox="0 0 76 76" style={{ position: "absolute", top: -8, right: -8 }} aria-hidden="true">
      <circle cx="38" cy="38" r={r} fill="none" stroke="rgba(197,164,110,0.14)" strokeWidth="3" />
      <circle
        cx="38" cy="38" r={r} fill="none" stroke="#C5A46E" strokeWidth="3"
        strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
        transform="rotate(-90 38 38)"
      />
    </svg>
  );
}

function FeaturedForcePanel({ force, pf }: { force: V2Signal | null; pf: string }) {
  if (!force) {
    return (
      <div id="sg-featured" className="sg-panel sg-lead-force sg-c12">
        <PanelHdr label="Featured Force" gold />
        <div className="sg-panel-body" style={{ color: CE_MUTED, fontSize: 12 }}>
          No force data available.
        </div>
      </div>
    );
  }

  const urgency  = getUrgency(force);
  const weight   = force.directional_weight ?? 0;
  const path     = force.dominant_path ?? force.directional_thesis ?? null;
  const move     = force.operator_move ?? null;

  return (
    <div id="sg-featured" className="sg-panel sg-panel--gold sg-lead-force sg-c12">
      <PanelHdr label="Featured Force" meta={fmtCategory(force.category)} gold />

      <div className="sg-lead-body">
        <div className="sg-lead-main">
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" as const, alignItems: "center", marginBottom: 12 }}>
            {force.signal_state && <StateBadge state={force.signal_state} />}
            {urgency && <UrgencyBadge urgency={urgency} />}
          </div>

          <h2 style={{ fontFamily: pf, fontSize: 30, fontWeight: 600, color: CE_WHITE, margin: "0 0 14px", lineHeight: 1.18 }}>
            {force.title}
          </h2>

          {path && (
            <div style={{ marginBottom: move ? 14 : 0 }}>
              <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.35em", textTransform: "uppercase" as const, color: CE_DIM, margin: "0 0 6px" }}>
                Dominant Path
              </p>
              <p style={{ fontSize: 12.5, color: CE_MUTED, margin: 0, lineHeight: 1.6, maxWidth: 580 }}>
                {path}
              </p>
            </div>
          )}

          {move && (
            <div style={{
              display: "flex", alignItems: "flex-start", gap: 12,
              borderTop: `1px solid rgba(14,26,46,0.85)`, paddingTop: 12,
            }}>
              <span style={{
                fontSize: 10, fontWeight: 800, letterSpacing: "0.20em", textTransform: "uppercase" as const,
                color: GOLD, flexShrink: 0, paddingTop: 1,
                fontFamily: "ui-monospace, monospace",
              }}>
                MOVE →
              </span>
              <p style={{ fontSize: 12.5, color: CE_WHITE, margin: 0, lineHeight: 1.6, opacity: 0.92, maxWidth: 580 }}>
                {move}
              </p>
            </div>
          )}
        </div>

        <div className="sg-lead-side">
          {weight > 0 && (
            <div className="sg-lead-weight">
              <WeightRing weight={weight} />
              <div style={{ lineHeight: 1 }}>
                <span style={{ fontSize: 52, fontWeight: 700, color: CE_WHITE, letterSpacing: "-0.03em", lineHeight: 1 }}>
                  {weight}
                </span>
                <span style={{ fontSize: 18, color: CE_MUTED }}>{"%"}</span>
              </div>
              <span style={{ fontSize: 9, fontWeight: 700, color: CE_DIM, letterSpacing: "0.20em", textTransform: "uppercase" as const }}>
                weight
              </span>
            </div>
          )}

          <div style={{
            display: "flex", flexDirection: "column" as const, alignItems: "flex-end", gap: 6,
            fontSize: 10, color: CE_DIM, marginTop: "auto", paddingTop: 18,
          }}>
            <span><span style={{ color: GOLD }}>✓</span> Human-reviewed</span>
            <span><span style={{ color: GOLD }}>✓</span> Doctrine-governed</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Signal state distribution ─────────────────────────────────────────────────

function StateDistWidget({ signals }: { signals: V2Signal[] }) {
  const STATES = [
    { key: "act_now",     label: "ACT NOW",     color: "#C5A46E" },
    { key: "directional", label: "DIRECTIONAL", color: "#00E5FF" },
    { key: "growing",     label: "GROWING",     color: "rgba(0,229,255,0.60)" },
    { key: "watch",       label: "WATCH",       color: "#5C6E84" },
  ] as const;

  const counts = Object.fromEntries(STATES.map(s => [s.key, signals.filter(sig => sig.signal_state === s.key).length]));
  const max    = Math.max(1, ...Object.values(counts));
  const total  = signals.length;

  return (
    <div className="sg-panel sg-rail-panel">
      <PanelHdr label="Signal States" meta={`${total} forces`} />
      <div className="sg-panel-body">
        {STATES.map(({ key, label, color }) => {
          const count = counts[key] ?? 0;
          return (
            <div key={key} className="sg-dist-row">
              <span className="sg-dist-dot" style={{ background: color, boxShadow: `0 0 5px ${color}` }} />
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.10em", color, width: 76, flexShrink: 0 }}>
                {label}
              </span>
              <div className="sg-dist-track">
                <div className="sg-dist-fill" style={{ width: `${(count / max) * 100}%`, background: color }} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: CE_WHITE, width: 16, textAlign: "right" as const, flexShrink: 0 }}>
                {count}
              </span>
            </div>
          );
        })}
        <div style={{
          display: "flex", justifyContent: "space-between", paddingTop: 10,
          marginTop: 2, borderTop: `1px solid rgba(14,26,46,0.7)`,
          fontSize: 10, color: CE_DIM,
        }}>
          <span>Forces tracked</span>
          <span style={{ color: CE_WHITE, fontWeight: 600 }}>{total}</span>
        </div>
      </div>
    </div>
  );
}

// ── Dominant signals widget ───────────────────────────────────────────────────

function DsignalGlyph({ color }: { color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M1 11L5 6l3 3 5-7" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DominantSignalsWidget({ signals, pf }: { signals: V2Signal[]; pf: string }) {
  return (
    <div id="sg-dominant" className="sg-panel sg-c12">
      <PanelHdr label="Dominant Signals" meta={`${signals.length} active`} gold />
      <div className="sg-panel-body sg-dsignal-grid">
        {signals.length === 0 ? (
          <p style={{ fontSize: 12, color: CE_MUTED }}>No featured signals.</p>
        ) : signals.map((s) => {
          const urgency = getUrgency(s);
          const path    = s.dominant_path ?? s.directional_thesis ?? null;
          const isLive  = s.signal_state === "act_now" || s.is_featured;
          const color   = stateColor(s.signal_state);
          return (
            <div key={s.id} className={`sg-dsignal-card${isLive ? " sg-dsignal-card--live" : ""}`}>
              <div className="sg-dsignal-bar" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const, alignItems: "center" }}>
                  <span className="sg-dsignal-glyph"><DsignalGlyph color={color} /></span>
                  {s.signal_state && <StateBadge state={s.signal_state} />}
                  {urgency && <UrgencyBadge urgency={urgency} />}
                </div>
                {s.directional_weight != null && (
                  <span style={{ fontSize: 18, fontWeight: 700, color: CE_WHITE, flexShrink: 0 }}>
                    {s.directional_weight}
                    <span style={{ fontSize: 10, color: CE_MUTED }}>%</span>
                  </span>
                )}
              </div>

              <p style={{ fontFamily: pf, fontSize: 15, fontWeight: 600, color: CE_WHITE, margin: 0, lineHeight: 1.3 }}>
                {s.title}
              </p>

              {path && (
                <p className="sg-dsignal-path">{path}</p>
              )}

              {s.operator_move && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 7 }}>
                  <span style={{
                    fontSize: 8, fontWeight: 800, letterSpacing: "0.20em",
                    color: GOLD, flexShrink: 0, paddingTop: 2,
                  }}>
                    MOVE
                  </span>
                  <span style={{ fontSize: 11.5, color: CE_WHITE, opacity: 0.82, lineHeight: 1.5 }}>
                    {s.operator_move}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Operator moves queue ──────────────────────────────────────────────────────

function OperatorMovesQueue({ signals }: { signals: V2Signal[] }) {
  const moves = signals
    .filter((s) => s.operator_move)
    .map((s, i) => ({ move: s.operator_move!, force: s.title, color: stateColor(s.signal_state), n: i + 1 }))
    .slice(0, 6);

  return (
    <div id="sg-moves" className="sg-panel sg-rail-panel">
      <PanelHdr label="Operator Moves" meta={`${moves.length} queued`} gold />
      <div className="sg-panel-body sg-moves-body">
        {moves.length === 0 ? (
          <p style={{ fontSize: 12, color: CE_MUTED }}>No operator moves available.</p>
        ) : moves.map(({ move, force, color, n }) => (
          <div key={n} className="sg-move-item">
            <span className="sg-move-index" style={{ borderColor: `${color}55`, color }}>{n}</span>
            <div>
              <p style={{ fontSize: 11.5, color: "#C5D2E0", margin: "0 0 3px", lineHeight: 1.5 }}>
                {move}
              </p>
              <p style={{ fontSize: 9.5, color: CE_DIM, margin: 0 }}>{force}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Force register panel ──────────────────────────────────────────────────────

function ForceRegisterPanel({ signals }: { signals: V2Signal[] }) {
  return (
    <div id="sg-register" className="sg-panel sg-c12">
      <PanelHdr label="Seven Base Forces" meta="Force Register" />
      <div className="sg-register-list">
        {signals.map((s, i) => {
          const urgency = getUrgency(s);
          const path    = s.dominant_path ?? s.directional_thesis ?? null;
          const color   = stateColor(s.signal_state);
          return (
            <div key={s.id} className="sg-register-row">
              <span className="sg-register-rank" style={{ borderColor: `${color}44`, color }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="sg-register-body">
                <div className="sg-register-row-top">
                  <div className="sg-register-row-id">
                    <span className="sg-register-row-name">{s.title}</span>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const, marginTop: 7 }}>
                      {s.signal_state && <StateBadge state={s.signal_state} />}
                      {urgency && <UrgencyBadge urgency={urgency} />}
                    </div>
                  </div>
                  {s.directional_weight != null && (
                    <div className="sg-register-row-weight">
                      <span>{s.directional_weight}</span>
                      <span style={{ fontSize: 12, color: CE_MUTED, fontWeight: 600 }}>%</span>
                    </div>
                  )}
                </div>
                {path && <p className="sg-register-row-path">{path}</p>}
                {s.operator_move && (
                  <div className="sg-register-row-move">
                    <span className="sg-register-row-move-tag">MOVE</span>
                    <span>{s.operator_move}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Evidence engine strip ─────────────────────────────────────────────────────

const EVIDENCE_STAGES = [
  { num: "01", label: "Evidence",       desc: "Gathered continuously from structural sources, not headlines." },
  { num: "02", label: "Doctrine-Mapped", desc: "Filtered against the Eight Laws and structural invariants." },
  { num: "03", label: "Stress-Tested",  desc: "Challenged across independent reasoning passes before release." },
  { num: "04", label: "Human-Approved", desc: "Published only after founder review. Nothing publishes automatically." },
] as const;

function EvidenceEngineStrip() {
  return (
    <div id="sg-evidence" className="sg-panel sg-c12">
      <PanelHdr label="Evidence Engine" meta="Signal validation process" />
      <div className="sg-evidence-strip">
        {EVIDENCE_STAGES.map((stage, i) => (
          <div key={stage.num} className="sg-evidence-tile" style={{
            borderRight: i < EVIDENCE_STAGES.length - 1 ? `1px solid rgba(14,26,46,0.7)` : "none",
          }}>
            <div style={{
              fontSize: 15, fontWeight: 800, color: "rgba(201,169,97,0.38)",
              fontFamily: "ui-monospace, monospace", flexShrink: 0, minWidth: 26,
            }}>
              {stage.num}
            </div>
            <div>
              <p style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const,
                color: "rgba(201,169,97,0.70)", margin: "0 0 5px",
              }}>
                {stage.label}
              </p>
              <p style={{ fontSize: 11, color: CE_DIM, margin: 0, lineHeight: 1.6 }}>
                {stage.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Evidence & doctrine integrity (rail) ──────────────────────────────────────

function EvidenceDoctrineRailCard() {
  return (
    <div className="sg-panel sg-rail-panel">
      <PanelHdr label="Evidence & Doctrine" gold />
      <div className="sg-panel-body" style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {EVIDENCE_STAGES.map((stage) => (
          <div key={stage.num} className="sg-rail-evidence-row">
            <span className="sg-rail-evidence-num">{stage.num}</span>
            <span className="sg-rail-evidence-label">{stage.label}</span>
          </div>
        ))}
        <div style={{
          display: "flex", flexDirection: "column", gap: 6,
          marginTop: 10, paddingTop: 10, borderTop: `1px solid rgba(14,26,46,0.7)`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: CE_WHITE }}>
            <span style={{ color: GOLD }}>✓</span>
            <span>Human-reviewed</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: CE_WHITE }}>
            <span style={{ color: GOLD }}>✓</span>
            <span>Doctrine-governed</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Convergences widget ───────────────────────────────────────────────────────

function ConvergencesWidget({ convergences }: { convergences: ConvergenceResult[] }) {
  return (
    <div id="sg-convergences" className="sg-panel sg-c12">
      <PanelHdr label="Active Convergences" meta={`${convergences.length} detected`} gold />
      <div className="sg-panel-body sg-conv-grid">
        {convergences.map((c) => (
          <div key={c.id} style={{
            background: "rgba(2,5,10,0.60)",
            border: `1px solid rgba(201,169,97,0.10)`,
            borderRadius: 6, padding: "14px 16px",
            display: "flex", flexDirection: "column" as const, gap: 8,
          }}>
            {c.convergence_score != null && (
              <span style={{ fontSize: 20, fontWeight: 700, color: GOLD }}>
                {c.convergence_score.toFixed(0)}
              </span>
            )}
            <p style={{ fontSize: 13, fontWeight: 600, color: CE_WHITE, margin: 0, lineHeight: 1.3 }}>
              {c.title}
            </p>
            <p style={{ fontSize: 11.5, color: CE_MUTED, margin: 0, lineHeight: 1.55 }}>
              {truncateSentences(c.summary, 2)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Convergences preview (rail) ───────────────────────────────────────────────

function ConvergencesRailPreview({ convergences }: { convergences: ConvergenceResult[] }) {
  return (
    <div className="sg-panel sg-rail-panel">
      <PanelHdr label="Top Convergences" meta={`${convergences.length}`} />
      <div className="sg-panel-body" style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {convergences.slice(0, 3).map((c) => (
          <div key={c.id} className="sg-rail-conv-row">
            {c.convergence_score != null && (
              <span className="sg-rail-conv-score">{c.convergence_score.toFixed(0)}</span>
            )}
            <span className="sg-rail-conv-title">{c.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Dashboard layout ──────────────────────────────────────────────────────────

function SignalsDashboard({
  signals,
  convergences,
}: {
  signals: V2Signal[];
  convergences: ConvergenceResult[];
}) {
  const pf = playfair.style.fontFamily;

  const baseForces     = signals.filter((s) => s.is_base_signal);
  const sortedForces   = [...baseForces].sort((a, b) => (b.directional_weight ?? 0) - (a.directional_weight ?? 0));
  const featuredForce  = sortedForces[0] ?? null;

  const dominantSignals = signals.filter((s) => s.is_featured).length > 0
    ? signals.filter((s) => s.is_featured).slice(0, 3)
    : sortedForces.slice(0, 3);

  const actNowCount    = baseForces.filter((s) => s.signal_state === "act_now").length;
  const directional    = baseForces.filter((s) => s.signal_state === "directional").length;
  const highestWeight  = sortedForces[0]?.directional_weight ?? 0;
  const mapNodes       = buildForceMapNodes(sortedForces, featuredForce);

  const kpis: KPI[] = [
    { label: "Forces Tracked", value: String(baseForces.length || 7), sub: "Seven Base Forces" },
    { label: "ACT NOW",        value: String(actNowCount), sub: `of ${baseForces.length || 7} forces`, gold: actNowCount > 0 },
    { label: "Directional",    value: String(directional), sub: `of ${baseForces.length || 7} forces` },
    { label: "Highest Weight", value: highestWeight > 0 ? `${highestWeight}%` : "—", sub: featuredForce?.title ?? "—", gold: highestWeight > 0 },
    { label: "Human Reviewed", value: "Yes", sub: "Every signal" },
    { label: "Doctrine Governed", value: "Yes", sub: "Eight Laws" },
  ];

  return (
    <div
      className="sg-shell"
      style={{
        background: `url("${NOISE_URI}") repeat, radial-gradient(ellipse at 50% -8%, rgba(197,164,110,0.06), transparent 55%), linear-gradient(168deg, #02060F 0%, #030B1A 32%, #020810 65%, #010406 100%)`,
        color: CE_WHITE,
        minHeight: "100vh",
      }}
    >
      <StarField />
      <GridOverlay />

      <style>{`
        html { scroll-behavior: smooth; }

        /* ── Keyframes ── */
        @keyframes sgPulseAct {
          0%, 100% { box-shadow: none; }
          50%       { box-shadow: 0 0 10px rgba(197,164,110,0.42); }
        }
        @keyframes sgCyanPulse {
          0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 5px rgba(0,229,255,0.55); }
          50%       { opacity: 0.65; transform: scale(1.18); box-shadow: 0 0 10px rgba(0,229,255,0.85); }
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

        .sg-star-w { animation: sgStarW 12s ease-in-out infinite; }
        .sg-star-b { animation: sgStarB 18s ease-in-out infinite; }
        .sg-star-p { animation: sgStarP  8s ease-in-out infinite; }
        .sg-layer-w { animation: sgDriftW 110s ease-in-out infinite; }
        .sg-layer-b { animation: sgDriftB 145s ease-in-out infinite; }

        /* ── App shell ── */
        .sg-shell {
          display: grid;
          grid-template-columns: 260px 1fr;
          min-height: 100vh;
          position: relative;
        }

        /* ── Sidebar ── */
        .sg-sidebar {
          position: sticky;
          top: 0;
          height: 100vh;
          overflow-y: auto;
          background: rgba(1,3,8,0.98);
          border-right: 1px solid rgba(14,26,46,0.92);
          display: flex;
          flex-direction: column;
          z-index: 10;
        }
        .sg-sidebar-brand {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 20px 20px 16px;
          border-bottom: 1px solid rgba(14,26,46,0.7);
          background: linear-gradient(180deg, rgba(197,164,110,0.05), transparent);
          flex-shrink: 0;
        }
        .sg-sidebar-section {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.28em;
          color: rgba(46,62,82,0.75);
          padding: 16px 20px 8px;
          margin: 0;
          flex-shrink: 0;
        }
        .sg-sidebar-nav {
          display: flex;
          flex-direction: column;
          flex: 1;
          padding: 4px 10px 8px;
        }
        .sg-nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 3px;
          color: rgba(90,110,135,0.75);
          font-size: 12px;
          font-weight: 500;
          text-decoration: none;
          border-left: 2px solid transparent;
          transition: color 160ms, background 160ms, border-color 140ms;
          margin-bottom: 2px;
          position: relative;
        }
        .sg-nav-item:hover { color: #EEF3FA; background: rgba(10,20,38,0.7); }
        .sg-nav-item--active {
          color: #EEF3FA;
          background: linear-gradient(90deg, rgba(197,164,110,0.10), rgba(10,20,38,0.9) 65%);
          border-left-color: #C5A46E;
        }
        .sg-sidebar-footer {
          padding: 14px 20px;
          border-top: 1px solid rgba(14,26,46,0.7);
          flex-shrink: 0;
        }
        .sg-sidebar-home-link {
          font-size: 10px;
          color: rgba(46,62,82,0.85);
          text-decoration: none;
          letter-spacing: 0.05em;
          transition: color 140ms;
        }
        .sg-sidebar-home-link:hover { color: #7A8DA6; }

        /* ── Main area ── */
        .sg-main {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          min-width: 0;
          position: relative;
          z-index: 1;
        }
        .sg-workspace-inner {
          width: 100%;
          max-width: 1680px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          min-width: 0;
        }

        /* ── Header ── */
        .sg-header {
          position: sticky;
          top: 0;
          z-index: 20;
          background: rgba(1,4,10,0.94);
          border-bottom: 1px solid rgba(14,26,46,0.92);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          flex-shrink: 0;
          padding: 22px 24px 20px;
        }
        .sg-header-top {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
          flex-wrap: wrap;
        }
        .sg-header-titleblock { max-width: 720px; min-width: 0; flex: 1 1 auto; }
        .sg-header-eyebrow {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.30em;
          text-transform: uppercase;
          color: rgba(197,164,110,0.80);
          margin-bottom: 10px;
        }
        .sg-header-eyebrow-sep { color: rgba(197,164,110,0.35); margin: 0 2px; }
        .sg-header-title {
          font-family: ${playfair.style.fontFamily};
          font-size: 26px;
          font-weight: 600;
          line-height: 1.22;
          color: #F4F7FB;
          margin: 0 0 8px;
          letter-spacing: -0.01em;
        }
        .sg-header-subtitle {
          font-size: 12.5px;
          color: #7A8DA6;
          margin: 0;
          line-height: 1.6;
        }
        .sg-header-controls {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
          padding-bottom: 2px;
        }
        .sg-header-search {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border: 1px solid rgba(14,26,46,0.95);
          border-radius: 5px;
          background: rgba(3,7,16,0.7);
          color: rgba(90,110,135,0.85);
          font-size: 11.5px;
        }
        .sg-header-cycle { font-size: 10.5px; color: rgba(46,62,82,0.85); letter-spacing: 0.04em; white-space: nowrap; }
        .sg-live-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 5px 10px;
          border: 1px solid rgba(0,229,255,0.18);
          border-radius: 3px;
          background: rgba(0,229,255,0.04);
        }
        .sg-live-dot {
          display: inline-block;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #00E5FF;
          box-shadow: 0 0 6px rgba(0,229,255,0.70);
          animation: sgCyanPulse 2.4s ease-in-out infinite;
          flex-shrink: 0;
        }
        .sg-live-label {
          font-size: 9px;
          font-weight: 700;
          color: #00E5FF;
          letter-spacing: 0.22em;
          opacity: 0.85;
        }

        /* ── KPI strip ── */
        .sg-kpi-strip {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 10px;
          padding: 12px 24px;
          border-bottom: 1px solid rgba(14,26,46,0.92);
          background: rgba(1,4,10,0.55);
          flex-shrink: 0;
        }
        .sg-kpi-card {
          background: rgba(3,7,16,0.70);
          border: 1px solid rgba(14,26,46,0.85);
          border-radius: 6px;
          padding: 11px 13px 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          transition: border-color 180ms ease, transform 180ms ease, background 180ms ease, box-shadow 180ms ease;
          cursor: default;
        }
        .sg-kpi-card:hover {
          border-color: rgba(0,229,255,0.24);
          background: rgba(5,12,24,0.80);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.35);
        }
        .sg-kpi-card--gold:hover { border-color: rgba(197,164,110,0.42); }
        .sg-kpi-card-top { display: flex; align-items: center; gap: 6px; }
        .sg-kpi-label {
          font-size: 8.5px;
          font-weight: 700;
          letter-spacing: 0.20em;
          text-transform: uppercase;
          color: #334458;
        }
        .sg-kpi-value {
          font-size: 20px;
          font-weight: 700;
          color: #EEF3FA;
          letter-spacing: -0.01em;
          line-height: 1;
          font-variant-numeric: tabular-nums;
        }
        .sg-kpi-gold { color: #C5A46E; }
        .sg-kpi-sub {
          font-size: 9.5px;
          color: rgba(122,141,166,0.65);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* ── Grid ── */
        .sg-scrollarea { flex: 1; min-width: 0; padding: 16px 24px 28px; display: flex; flex-direction: column; gap: 14px; }
        .sg-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 12px;
        }
        .sg-c12 { grid-column: span 12; }

        /* ── Command grid: convergence map + intelligence rail ── */
        .sg-command-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
          align-items: start;
        }
        @media (min-width: 1180px) {
          .sg-command-grid { grid-template-columns: 1fr 360px; }
          .sg-rail { position: sticky; top: 168px; }
        }
        .sg-command-main { display: flex; flex-direction: column; gap: 12px; min-width: 0; }
        .sg-rail { display: flex; flex-direction: column; gap: 10px; }
        .sg-rail-panel { }

        /* ── Panel base ── */
        .sg-panel {
          background: rgba(3,7,16,0.85);
          border: 1px solid rgba(14,26,46,0.92);
          border-radius: 5px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: border-color 220ms ease, box-shadow 220ms ease;
        }
        .sg-panel:hover { border-color: rgba(197,164,110,0.22); box-shadow: 0 12px 40px rgba(0,0,0,0.30); }

        /* Gold-accent variant: Featured Force / hero map */
        .sg-panel--gold {
          border-left: 3px solid rgba(197,164,110,0.55);
          border-radius: 0 5px 5px 0;
        }
        .sg-panel--gold:hover { border-left-color: rgba(197,164,110,0.85); }

        .sg-panel-hdr {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 11px 16px 10px;
          border-bottom: 1px solid rgba(14,26,46,0.88);
          flex-shrink: 0;
        }
        .sg-panel-label {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.32em;
          text-transform: uppercase;
          color: #334458;
        }
        .sg-panel-label--gold { color: rgba(197,164,110,0.68); }
        .sg-panel-meta {
          font-size: 9px;
          color: rgba(46,62,82,0.60);
          letter-spacing: 0.05em;
        }
        .sg-panel-body { padding: 14px 16px; flex: 1; overflow: auto; }

        /* ── Pressure / convergence map (hero) ── */
        .sg-map-panel { min-width: 0; }
        .sg-map {
          position: relative;
          width: 100%;
          aspect-ratio: 2.05 / 1;
          min-height: 390px;
          max-height: 460px;
        }
        .sg-map--empty {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 260px;
        }
        .sg-map-svg { position: absolute; inset: 0; width: 100%; height: 100%; }
        .sg-map-node {
          position: absolute;
          transform: translate(-50%, -50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
          width: 122px;
          text-align: center;
          z-index: 2;
        }
        .sg-map-node--center { z-index: 3; width: 172px; }
        .sg-map-node-dot {
          border-radius: 50%;
          display: block;
          transition: transform 200ms ease;
          flex-shrink: 0;
        }
        .sg-map-node:hover .sg-map-node-dot { transform: scale(1.15); }
        .sg-map-node-label {
          font-size: 10.5px;
          color: #C5D2E0;
          letter-spacing: 0.01em;
          line-height: 1.3;
        }
        .sg-map-node--center .sg-map-node-label {
          font-size: 14px;
          font-weight: 600;
          color: #EEF3FA;
        }
        .sg-map-node-weight { font-size: 9px; color: #C5A46E; font-weight: 700; }
        .sg-map-legend {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          padding: 10px 16px 12px;
          border-top: 1px solid rgba(14,26,46,0.7);
        }
        .sg-map-legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          color: #7A8DA6;
        }
        .sg-map-legend-item--muted { color: rgba(46,62,82,0.85); margin-left: auto; }
        .sg-map-legend-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

        /* ── Lead force banner ── */
        .sg-lead-body {
          display: flex;
          gap: 32px;
          align-items: flex-start;
          padding: 22px 26px 24px;
        }
        .sg-lead-main { flex: 1; min-width: 0; }
        .sg-lead-side { display: flex; flex-direction: column; align-items: flex-end; flex-shrink: 0; }
        .sg-lead-weight { position: relative; text-align: right; padding-top: 4px; padding-right: 4px; }

        /* ── State dist ── */
        .sg-dist-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 0;
          border-bottom: 1px solid rgba(14,26,46,0.6);
        }
        .sg-dist-row:last-child { border-bottom: none; }
        .sg-dist-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .sg-dist-track {
          flex: 1;
          height: 2px;
          background: rgba(14,26,46,0.9);
          border-radius: 1px;
          overflow: hidden;
        }
        .sg-dist-fill {
          height: 100%;
          border-radius: 1px;
          transition: width 700ms ease-out;
        }

        /* ── Dominant signals ── */
        .sg-dsignal-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 12px;
        }
        .sg-dsignal-card {
          position: relative;
          background: rgba(2,5,10,0.55);
          border: 1px solid rgba(14,26,46,0.85);
          border-radius: 6px;
          padding: 16px 16px 15px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          overflow: hidden;
          transition: background 160ms, border-color 160ms, transform 160ms, box-shadow 160ms;
        }
        .sg-dsignal-bar { position: absolute; top: 0; left: 0; right: 0; height: 2px; opacity: 0.8; }
        .sg-dsignal-glyph {
          display: inline-flex; align-items: center; justify-content: center;
          width: 20px; height: 20px; border-radius: 4px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06);
          flex-shrink: 0;
        }
        .sg-dsignal-path { font-size: 11.5px; color: #7A8DA6; margin: 0; line-height: 1.55; }
        .sg-dsignal-card:hover {
          background: rgba(4,10,22,0.80);
          border-color: rgba(197,164,110,0.26);
          transform: translateY(-3px);
          box-shadow: 0 14px 34px rgba(0,0,0,0.35);
        }
        .sg-dsignal-card--live { border-left: 2px solid rgba(0,229,255,0.42); }
        .sg-dsignal-card--live:hover { border-left-color: rgba(0,229,255,0.75); }

        /* ── Operator moves (rail) ── */
        .sg-moves-body { display: flex; flex-direction: column; padding: 0; }
        .sg-move-item {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          padding: 10px 14px;
          border-bottom: 1px solid rgba(14,26,46,0.6);
          transition: background 150ms;
        }
        .sg-move-item:last-child { border-bottom: none; }
        .sg-move-item:hover { background: rgba(4,10,22,0.60); }
        .sg-move-index {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 1px solid;
          background: rgba(197,164,110,0.06);
          font-size: 9px;
          font-weight: 700;
          flex-shrink: 0;
          margin-top: 1px;
        }

        /* ── Rail: evidence & doctrine ── */
        .sg-rail-evidence-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 7px 0;
          border-bottom: 1px solid rgba(14,26,46,0.55);
        }
        .sg-rail-evidence-row:last-child { border-bottom: none; }
        .sg-rail-evidence-num {
          font-size: 10px;
          font-weight: 800;
          color: rgba(197,164,110,0.55);
          font-family: ui-monospace, monospace;
          width: 18px;
          flex-shrink: 0;
        }
        .sg-rail-evidence-label {
          font-size: 11px;
          color: #C5D2E0;
          font-weight: 500;
        }

        /* ── Rail: convergences preview ── */
        .sg-rail-conv-row {
          display: flex;
          align-items: baseline;
          gap: 10px;
          padding: 8px 0;
          border-bottom: 1px solid rgba(14,26,46,0.55);
        }
        .sg-rail-conv-row:last-child { border-bottom: none; }
        .sg-rail-conv-score { font-size: 15px; font-weight: 700; color: #C5A46E; flex-shrink: 0; width: 26px; }
        .sg-rail-conv-title { font-size: 11.5px; color: #C5D2E0; line-height: 1.4; }

        /* ── Force register rows ── */
        .sg-register-list { display: flex; flex-direction: column; }
        .sg-register-row {
          display: flex;
          gap: 14px;
          padding: 15px 18px;
          border-bottom: 1px solid rgba(14,26,46,0.75);
          transition: background 150ms;
        }
        .sg-register-row:last-child { border-bottom: none; }
        .sg-register-row:hover { background: rgba(4,10,22,0.55); }
        .sg-register-rank {
          font-size: 10px;
          font-weight: 700;
          font-family: ui-monospace, monospace;
          border: 1px solid;
          border-radius: 4px;
          width: 26px;
          height: 22px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 1px;
        }
        .sg-register-body { flex: 1; min-width: 0; }
        .sg-register-row-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .sg-register-row-name { font-size: 14px; font-weight: 600; color: #EEF3FA; }
        .sg-register-row-weight {
          font-size: 21px;
          font-weight: 700;
          color: #EEF3FA;
          flex-shrink: 0;
          display: flex;
          align-items: baseline;
          gap: 2px;
        }
        .sg-register-row-path {
          font-size: 12px;
          color: #7A8DA6;
          line-height: 1.55;
          margin: 9px 0 0;
          max-width: 640px;
        }
        .sg-register-row-move {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-top: 9px;
          padding-top: 9px;
          border-top: 1px solid rgba(14,26,46,0.55);
          font-size: 12px;
          color: #C5D2E0;
          line-height: 1.55;
        }
        .sg-register-row-move-tag {
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.18em;
          color: #C5A46E;
          flex-shrink: 0;
          padding-top: 1px;
          font-family: ui-monospace, monospace;
        }

        /* ── Evidence engine ── */
        .sg-evidence-strip {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
        }
        .sg-evidence-tile {
          display: flex;
          gap: 12px;
          padding: 15px 16px;
          transition: background 160ms;
        }
        .sg-evidence-tile:hover { background: rgba(4,10,22,0.70); }
        @media (max-width: 860px) {
          .sg-evidence-strip { grid-template-columns: 1fr 1fr; }
          .sg-evidence-tile:nth-child(odd)  { border-right: 1px solid rgba(14,26,46,0.7) !important; }
          .sg-evidence-tile:nth-child(even) { border-right: none !important; }
          .sg-evidence-tile { border-bottom: 1px solid rgba(14,26,46,0.5); }
          .sg-evidence-tile:nth-child(3),
          .sg-evidence-tile:nth-child(4) { border-bottom: none; }
        }

        /* ── Convergences ── */
        .sg-conv-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 12px;
        }

        /* ── Mobile ── */
        @media (max-width: 768px) {
          .sg-shell { grid-template-columns: minmax(0, 1fr); }
          .sg-sidebar {
            position: relative;
            height: auto;
            min-width: 0;
            flex-direction: row;
            overflow-x: auto;
            overflow-y: hidden;
            border-right: none;
            border-bottom: 1px solid rgba(14,26,46,0.92);
            scrollbar-width: none;
          }
          .sg-sidebar::-webkit-scrollbar { display: none; }
          .sg-sidebar-brand {
            padding: 12px 16px;
            border-bottom: none;
            border-right: 1px solid rgba(14,26,46,0.7);
            flex-shrink: 0;
          }
          .sg-sidebar-section { display: none; }
          .sg-sidebar-nav {
            flex-direction: row;
            flex: 1;
            padding: 0;
            overflow-x: auto;
            scrollbar-width: none;
          }
          .sg-sidebar-nav::-webkit-scrollbar { display: none; }
          .sg-nav-item {
            flex-shrink: 0;
            border-left: none;
            border-bottom: 2px solid transparent;
            border-radius: 0;
            white-space: nowrap;
            padding: 14px 14px;
            margin-bottom: 0;
          }
          .sg-nav-item--active {
            border-bottom-color: #C5A46E;
            background: rgba(10,20,38,0.6);
          }
          .sg-sidebar-footer { display: none; }
          .sg-header { padding: 16px 14px 14px; }
          .sg-header-top { align-items: flex-start; }
          .sg-header-title { font-size: 19px; }
          .sg-header-subtitle { display: none; }
          .sg-header-controls { display: none; }
          .sg-kpi-strip {
            padding: 10px 12px;
            grid-template-columns: none;
            grid-auto-flow: column;
            grid-auto-columns: minmax(104px, 1fr);
            overflow-x: auto;
            scrollbar-width: none;
          }
          .sg-kpi-strip::-webkit-scrollbar { display: none; }
          .sg-scrollarea { padding: 10px 12px 18px; gap: 10px; }
          .sg-grid { gap: 10px; }
          .sg-command-grid { gap: 10px; }
          .sg-map { aspect-ratio: 4 / 3; min-height: 240px; max-height: 300px; }
          .sg-map-node { width: 92px; }
          .sg-map-node--center { width: 128px; }
          .sg-map-node-label { font-size: 9px; }
          .sg-map-node--center .sg-map-node-label { font-size: 11px; }
          .sg-lead-body { flex-direction: column; gap: 16px; padding: 18px 16px 20px; }
          .sg-lead-side { align-items: flex-start !important; width: 100%; }
          .sg-lead-side > div:first-child { text-align: left !important; }
          .sg-lead-weight { padding-right: 0; }
        }

        /* ── Reduced motion ── */
        @media (prefers-reduced-motion: reduce) {
          .sg-star-w, .sg-star-b, .sg-star-p { animation: none !important; opacity: 0.4; }
          .sg-layer-w, .sg-layer-b { animation: none; }
          .sg-dist-fill { transition: none; }
          .sg-live-dot { animation: none; box-shadow: none; }
        }
      `}</style>

      <Sidebar pf={pf} />

      <div className="sg-main">
        <div className="sg-workspace-inner">
          <DashboardHeader cycleLabel="Signal Intelligence · Cycle 001" />
          <KPIStrip kpis={kpis} />

          <div id="sg-overview" className="sg-scrollarea">

            {/* Hero: convergence map + intelligence rail */}
            <div className="sg-command-grid">
              <div className="sg-command-main">
                <div id="sg-map" className="sg-panel sg-panel--gold sg-map-panel">
                  <PanelHdr label="Convergence Map" meta={`${mapNodes.length} forces mapped`} gold />
                  <ForceMap nodes={mapNodes} />
                  <MapLegend />
                </div>
                <FeaturedForcePanel force={featuredForce} pf={pf} />
              </div>

              <div className="sg-rail">
                <OperatorMovesQueue signals={baseForces} />
                <StateDistWidget signals={baseForces} />
                <EvidenceDoctrineRailCard />
                {convergences.length > 0 && <ConvergencesRailPreview convergences={convergences} />}
              </div>
            </div>

            {/* Supporting sections */}
            <div className="sg-grid">
              <DominantSignalsWidget signals={dominantSignals} pf={pf} />
              <ForceRegisterPanel signals={sortedForces} />
              <EvidenceEngineStrip />
              {convergences.length > 0 && (
                <ConvergencesWidget convergences={convergences} />
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function SignalsPage() {
  let v2Signals: V2Signal[]              = [];
  let v2Convergences: ConvergenceResult[] = [];
  try {
    [v2Signals, v2Convergences] = await Promise.all([
      fetchV2Signals(),
      fetchConvergences(),
    ]);
  } catch {
    // render empty state on error
  }
  return <SignalsDashboard signals={v2Signals} convergences={v2Convergences} />;
}
