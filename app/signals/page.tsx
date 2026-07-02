import { createClient } from "@supabase/supabase-js";
import { Playfair_Display } from "next/font/google";
import Link from "next/link";
import type { SignalCategory } from "@/types/signals";

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

void CATEGORY_ORDER; // referenced for categorized views

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

const GOLD      = "#C9A961";
const GOLD_DIM  = "rgba(201,169,97,0.28)";
const CE_WHITE  = "#EEF3FA";
const CE_MUTED  = "#7A8DA6";
const CE_DIM    = "#46566A";
const PANEL_BG  = "rgba(3,7,16,0.82)";
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
        <Link href="/" className="sg-sidebar-home-link">
          ← Cognitive Empire
        </Link>
      </div>
    </aside>
  );
}

// ── Dashboard header ──────────────────────────────────────────────────────────

function DashboardHeader() {
  return (
    <header className="sg-header">
      <div className="sg-header-left">
        <span className="sg-header-wordmark">CE SIGNALS</span>
        <span className="sg-header-sep">·</span>
        <span className="sg-header-cycle">Signal Intelligence · Cycle 001</span>
        <div className="sg-live-indicator">
          <span className="sg-live-dot" />
          <span className="sg-live-label">LIVE</span>
        </div>
      </div>
      <p className="sg-header-sub">Human-reviewed structural intelligence for operators.</p>
    </header>
  );
}

// ── KPI strip ─────────────────────────────────────────────────────────────────

type KPI = { label: string; value: string; gold?: boolean };

function KPIStrip({ kpis }: { kpis: KPI[] }) {
  return (
    <div className="sg-kpi-strip">
      {kpis.map((kpi, i) => (
        <div key={i} className="sg-kpi">
          <span className="sg-kpi-label">{kpi.label}</span>
          <span className={`sg-kpi-value${kpi.gold ? " sg-kpi-gold" : ""}`}>{kpi.value}</span>
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

// ── Featured Force panel ──────────────────────────────────────────────────────

function FeaturedForcePanel({ force, pf }: { force: V2Signal | null; pf: string }) {
  if (!force) {
    return (
      <div id="sg-featured" className="sg-panel sg-c7">
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
    <div id="sg-featured" className="sg-panel sg-c7">
      <PanelHdr label="Featured Force" meta={fmtCategory(force.category)} gold />

      <div className="sg-panel-body sg-featured-body">
        {/* Top row: badges + weight */}
        <div className="sg-featured-top">
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" as const, alignItems: "center" }}>
            {force.signal_state && <StateBadge state={force.signal_state} />}
            {urgency && <UrgencyBadge urgency={urgency} />}
          </div>
          {weight > 0 && (
            <div style={{ textAlign: "right" as const }}>
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
        </div>

        {/* Force name */}
        <h2 style={{ fontFamily: pf, fontSize: 22, fontWeight: 600, color: CE_WHITE, margin: 0, lineHeight: 1.25 }}>
          {force.title}
        </h2>

        {/* Dominant path */}
        {path && (
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 5 }}>
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.35em", textTransform: "uppercase" as const, color: CE_DIM, margin: 0 }}>
              Dominant Path
            </p>
            <p style={{ fontSize: 12, color: CE_MUTED, margin: 0, lineHeight: 1.65 }}>
              {path}
            </p>
          </div>
        )}

        {/* Operator move */}
        {move && (
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 10,
            borderTop: `1px solid rgba(14,26,46,0.85)`, paddingTop: 14,
          }}>
            <span style={{
              fontSize: 9, fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase" as const,
              color: GOLD, flexShrink: 0, paddingTop: 2,
            }}>
              MOVE →
            </span>
            <p style={{ fontSize: 12, color: CE_WHITE, margin: 0, lineHeight: 1.6, opacity: 0.90 }}>
              {move}
            </p>
          </div>
        )}

        {/* Status */}
        <div style={{
          display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: CE_DIM,
          borderTop: `1px solid rgba(14,26,46,0.7)`, paddingTop: 12, marginTop: "auto",
        }}>
          <span style={{ color: GOLD }}>✓</span>
          <span>Human-reviewed</span>
          <span style={{ color: "rgba(62,78,98,0.4)" }}>·</span>
          <span style={{ color: GOLD }}>✓</span>
          <span>Doctrine-governed</span>
        </div>
      </div>
    </div>
  );
}

// ── Signal state distribution ─────────────────────────────────────────────────

function StateDistWidget({ signals }: { signals: V2Signal[] }) {
  const STATES = [
    { key: "act_now",     label: "ACT NOW",     color: "#D4AF6A" },
    { key: "directional", label: "DIRECTIONAL", color: "#7AAEE0" },
    { key: "growing",     label: "GROWING",     color: "#5BBFD8" },
    { key: "watch",       label: "WATCH",       color: "#5C6E84" },
  ] as const;

  const counts = Object.fromEntries(STATES.map(s => [s.key, signals.filter(sig => sig.signal_state === s.key).length]));
  const max    = Math.max(1, ...Object.values(counts));
  const total  = signals.length;

  return (
    <div className="sg-panel sg-c5">
      <PanelHdr label="Signal States" meta={`${total} forces`} />
      <div className="sg-panel-body">
        {STATES.map(({ key, label, color }) => {
          const count = counts[key] ?? 0;
          return (
            <div key={key} className="sg-dist-row">
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.10em", color, width: 88, flexShrink: 0 }}>
                {label}
              </span>
              <div className="sg-dist-track">
                <div className="sg-dist-fill" style={{ width: `${(count / max) * 100}%`, background: color }} />
              </div>
              <span style={{ fontSize: 15, fontWeight: 700, color: CE_WHITE, width: 18, textAlign: "right" as const, flexShrink: 0 }}>
                {count}
              </span>
            </div>
          );
        })}
        <div style={{
          display: "flex", justifyContent: "space-between", paddingTop: 12,
          marginTop: 4, borderTop: `1px solid rgba(14,26,46,0.7)`,
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

function DominantSignalsWidget({ signals, pf }: { signals: V2Signal[]; pf: string }) {
  return (
    <div id="sg-dominant" className="sg-panel sg-c8">
      <PanelHdr label="Dominant Signals" meta={`${signals.length} active`} gold />
      <div className="sg-panel-body sg-dominant-body">
        {signals.length === 0 ? (
          <p style={{ fontSize: 12, color: CE_MUTED }}>No featured signals.</p>
        ) : signals.map((s) => {
          const urgency = getUrgency(s);
          const path    = s.dominant_path ?? s.directional_thesis ?? null;
          return (
            <div key={s.id} className="sg-dominant-card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
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
                <p style={{ fontSize: 11.5, color: CE_MUTED, margin: 0, lineHeight: 1.55 }}>
                  {path}
                </p>
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
    .map((s) => ({ move: s.operator_move!, force: s.title }))
    .slice(0, 7);

  return (
    <div id="sg-moves" className="sg-panel sg-c4">
      <PanelHdr label="Operator Moves" meta={`${moves.length} queued`} />
      <div className="sg-panel-body sg-moves-body">
        {moves.length === 0 ? (
          <p style={{ fontSize: 12, color: CE_MUTED }}>No operator moves available.</p>
        ) : moves.map(({ move, force }, i) => (
          <div key={i} className="sg-move-item">
            <span style={{ fontSize: 12, color: GOLD, flexShrink: 0 }}>→</span>
            <div>
              <p style={{ fontSize: 11.5, color: "#C5D2E0", margin: "0 0 3px", lineHeight: 1.55 }}>
                {move}
              </p>
              <p style={{ fontSize: 10, color: CE_DIM, margin: 0 }}>{force}</p>
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
      <div className="sg-table-wrap">
        <table className="sg-table">
          <thead>
            <tr>
              {["Force", "State", "Dominant Path", "Weight", "Urgency", "Operator Move"].map((h) => (
                <th key={h} className="sg-th">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {signals.map((s, i) => {
              const urgency = getUrgency(s);
              return (
                <tr key={s.id} className="sg-tr" style={{
                  borderBottom: i < signals.length - 1 ? `1px solid rgba(14,26,46,0.75)` : "none",
                }}>
                  <td className="sg-td sg-td-force">{s.title}</td>
                  <td className="sg-td">
                    {s.signal_state
                      ? <StateBadge state={s.signal_state} />
                      : <span style={{ color: CE_DIM }}>—</span>}
                  </td>
                  <td className="sg-td sg-td-path">{s.dominant_path ?? s.directional_thesis ?? "—"}</td>
                  <td className="sg-td" style={{ whiteSpace: "nowrap" as const }}>
                    {s.directional_weight != null ? (
                      <span style={{ display: "inline-flex", alignItems: "baseline", gap: 1 }}>
                        <span style={{ fontSize: 17, fontWeight: 700, color: CE_WHITE }}>{s.directional_weight}</span>
                        <span style={{ fontSize: 10, color: CE_MUTED }}>%</span>
                      </span>
                    ) : <span style={{ color: CE_DIM }}>—</span>}
                  </td>
                  <td className="sg-td">
                    {urgency ? <UrgencyBadge urgency={urgency} /> : <span style={{ color: CE_DIM }}>—</span>}
                  </td>
                  <td className="sg-td sg-td-move">{s.operator_move ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
              fontSize: 13, fontWeight: 800, color: "rgba(201,169,97,0.35)",
              fontFamily: "ui-monospace, monospace", flexShrink: 0, minWidth: 24,
            }}>
              {stage.num}
            </div>
            <div>
              <p style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const,
                color: "rgba(201,169,97,0.68)", margin: "0 0 5px",
              }}>
                {stage.label}
              </p>
              <p style={{ fontSize: 11, color: CE_DIM, margin: 0, lineHeight: 1.65 }}>
                {stage.desc}
              </p>
            </div>
          </div>
        ))}
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

  const kpis: KPI[] = [
    { label: "Forces Tracked", value: String(baseForces.length || 7) },
    { label: "ACT NOW",        value: String(actNowCount), gold: actNowCount > 0 },
    { label: "Directional",    value: String(directional) },
    { label: "Highest Weight", value: highestWeight > 0 ? `${highestWeight}%` : "—", gold: highestWeight > 0 },
    { label: "Human Reviewed", value: "Yes" },
    { label: "Doctrine Governed", value: "Yes" },
  ];

  return (
    <div
      className="sg-shell"
      style={{
        background: `url("${NOISE_URI}") repeat, linear-gradient(168deg, #02060F 0%, #030B1A 32%, #020810 65%, #010406 100%)`,
        color: CE_WHITE,
        minHeight: "100vh",
      }}
    >
      <StarField />

      <style>{`
        html { scroll-behavior: smooth; }

        /* ── Keyframes ── */
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

        .sg-star-w { animation: sgStarW 12s ease-in-out infinite; }
        .sg-star-b { animation: sgStarB 18s ease-in-out infinite; }
        .sg-star-p { animation: sgStarP  8s ease-in-out infinite; }
        .sg-layer-w { animation: sgDriftW 110s ease-in-out infinite; }
        .sg-layer-b { animation: sgDriftB 145s ease-in-out infinite; }

        /* ── App shell ── */
        .sg-shell {
          display: grid;
          grid-template-columns: 240px 1fr;
          min-height: 100vh;
          position: relative;
        }

        /* ── Sidebar ── */
        .sg-sidebar {
          position: sticky;
          top: 0;
          height: 100vh;
          overflow-y: auto;
          background: rgba(1,3,8,0.97);
          border-right: 1px solid rgba(14,26,46,0.92);
          display: flex;
          flex-direction: column;
          z-index: 10;
        }
        .sg-sidebar-brand {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 18px 20px 14px;
          border-bottom: 1px solid rgba(14,26,46,0.7);
          flex-shrink: 0;
        }
        .sg-sidebar-section {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.28em;
          color: rgba(46,62,82,0.8);
          padding: 14px 20px 6px;
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
          padding: 9px 12px;
          border-radius: 5px;
          color: rgba(90,110,135,0.75);
          font-size: 12px;
          font-weight: 500;
          text-decoration: none;
          border-left: 2px solid transparent;
          transition: color 160ms, background 160ms;
          margin-bottom: 1px;
          position: relative;
        }
        .sg-nav-item:hover { color: #EEF3FA; background: rgba(10,20,38,0.7); }
        .sg-nav-item--active {
          color: #EEF3FA;
          background: rgba(10,20,38,0.9);
          border-left-color: #C9A961;
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
          position: relative;
          z-index: 1;
        }

        /* ── Header ── */
        .sg-header {
          position: sticky;
          top: 0;
          z-index: 20;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          height: 52px;
          background: rgba(2,6,12,0.88);
          border-bottom: 1px solid rgba(14,26,46,0.88);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          flex-shrink: 0;
        }
        .sg-header-left {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .sg-header-wordmark {
          font-size: 12px;
          font-weight: 700;
          color: #EEF3FA;
          letter-spacing: 0.14em;
        }
        .sg-header-sep { color: rgba(46,62,82,0.7); }
        .sg-header-cycle { font-size: 11px; color: #7A8DA6; letter-spacing: 0.05em; }
        .sg-live-indicator {
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .sg-live-dot {
          display: inline-block;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #4ADE80;
          box-shadow: 0 0 6px rgba(74,222,128,0.6);
        }
        .sg-live-label {
          font-size: 9px;
          font-weight: 700;
          color: #4ADE80;
          letter-spacing: 0.16em;
        }
        .sg-header-sub {
          font-size: 11px;
          color: rgba(46,62,82,0.9);
          margin: 0;
          white-space: nowrap;
        }

        /* ── KPI strip ── */
        .sg-kpi-strip {
          display: flex;
          border-bottom: 1px solid rgba(14,26,46,0.88);
          background: rgba(2,5,12,0.55);
          flex-shrink: 0;
        }
        .sg-kpi {
          flex: 1;
          padding: 12px 16px;
          border-right: 1px solid rgba(14,26,46,0.65);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .sg-kpi:last-child { border-right: none; }
        .sg-kpi-label {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: #3A4D62;
        }
        .sg-kpi-value {
          font-size: 20px;
          font-weight: 700;
          color: #EEF3FA;
          letter-spacing: -0.01em;
          line-height: 1;
        }
        .sg-kpi-gold { color: #C9A961; }

        /* ── Grid ── */
        .sg-scrollarea { flex: 1; padding: 14px; }
        .sg-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 12px;
        }
        .sg-c4, .sg-c5, .sg-c7, .sg-c8, .sg-c12 { grid-column: span 12; }
        @media (min-width: 1100px) {
          .sg-c4  { grid-column: span 4; }
          .sg-c5  { grid-column: span 5; }
          .sg-c7  { grid-column: span 7; }
          .sg-c8  { grid-column: span 8; }
          .sg-c12 { grid-column: span 12; }
        }

        /* ── Panel base ── */
        .sg-panel {
          background: rgba(3,7,16,0.82);
          border: 1px solid rgba(14,26,46,0.90);
          border-radius: 8px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .sg-panel-hdr {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 11px 16px 10px;
          border-bottom: 1px solid rgba(14,26,46,0.85);
          flex-shrink: 0;
        }
        .sg-panel-label {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.30em;
          text-transform: uppercase;
          color: #3A4D62;
        }
        .sg-panel-label--gold { color: rgba(201,169,97,0.60); }
        .sg-panel-meta {
          font-size: 9px;
          color: rgba(46,62,82,0.65);
          letter-spacing: 0.05em;
        }
        .sg-panel-body { padding: 16px; flex: 1; overflow: auto; }

        /* ── Featured force ── */
        .sg-featured-body {
          display: flex;
          flex-direction: column;
          gap: 16px;
          height: 100%;
        }
        .sg-featured-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        /* ── State dist ── */
        .sg-dist-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 0;
          border-bottom: 1px solid rgba(14,26,46,0.6);
        }
        .sg-dist-row:last-child { border-bottom: none; }
        .sg-dist-track {
          flex: 1;
          height: 3px;
          background: rgba(14,26,46,0.9);
          border-radius: 2px;
          overflow: hidden;
        }
        .sg-dist-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 700ms ease-out;
        }

        /* ── Dominant signals ── */
        .sg-dominant-body {
          display: flex;
          flex-direction: column;
          padding: 0;
        }
        .sg-dominant-card {
          padding: 14px 16px;
          border-bottom: 1px solid rgba(14,26,46,0.7);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .sg-dominant-card:last-child { border-bottom: none; }

        /* ── Operator moves ── */
        .sg-moves-body {
          display: flex;
          flex-direction: column;
          padding: 0;
        }
        .sg-move-item {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          padding: 11px 16px;
          border-bottom: 1px solid rgba(14,26,46,0.6);
        }
        .sg-move-item:last-child { border-bottom: none; }

        /* ── Force register table ── */
        .sg-table-wrap { overflow-x: auto; overflow-y: auto; max-height: 360px; }
        .sg-table { width: 100%; border-collapse: collapse; font-size: 12px; min-width: 740px; }
        .sg-th {
          position: sticky;
          top: 0;
          padding: 10px 16px;
          text-align: left;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.30em;
          text-transform: uppercase;
          color: #3A4D62;
          background: rgba(2,5,10,0.97);
          white-space: nowrap;
          border-bottom: 1px solid rgba(14,26,46,0.92);
        }
        .sg-tr {
          background: rgba(2,5,10,0.45);
          transition: background 150ms ease;
        }
        .sg-tr:hover { background: rgba(5,13,26,0.85); }
        .sg-td { padding: 12px 16px; vertical-align: top; }
        .sg-td-force { color: #EEF3FA; font-weight: 600; font-size: 13px; white-space: nowrap; }
        .sg-td-path  { color: #7A8DA6; max-width: 220px; font-size: 12px; line-height: 1.5; }
        .sg-td-move  { color: #7A8DA6; max-width: 200px; font-size: 12px; line-height: 1.5; }

        /* ── Evidence engine ── */
        .sg-evidence-strip {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
        }
        .sg-evidence-tile {
          display: flex;
          gap: 12px;
          padding: 14px 16px;
        }
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
          .sg-shell { grid-template-columns: 1fr; }
          .sg-sidebar {
            position: relative;
            height: auto;
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
            border-bottom-color: #C9A961;
            background: rgba(10,20,38,0.6);
          }
          .sg-sidebar-footer { display: none; }
          .sg-header-sub { display: none; }
          .sg-kpi-strip { overflow-x: auto; flex-wrap: nowrap; scrollbar-width: none; }
          .sg-kpi-strip::-webkit-scrollbar { display: none; }
          .sg-kpi { min-width: 100px; }
          .sg-scrollarea { padding: 10px; }
          .sg-grid { gap: 10px; }
        }

        /* ── Reduced motion ── */
        @media (prefers-reduced-motion: reduce) {
          .sg-star-w, .sg-star-b, .sg-star-p { animation: none !important; opacity: 0.4; }
          .sg-layer-w, .sg-layer-b { animation: none; }
          .sg-dist-fill { transition: none; }
        }
      `}</style>

      <Sidebar pf={pf} />

      <div className="sg-main">
        <DashboardHeader />
        <KPIStrip kpis={kpis} />

        <div id="sg-overview" className="sg-scrollarea">
          <div className="sg-grid">

            {/* Row 1 */}
            <FeaturedForcePanel force={featuredForce} pf={pf} />
            <StateDistWidget signals={baseForces} />

            {/* Row 2 */}
            <DominantSignalsWidget signals={dominantSignals} pf={pf} />
            <OperatorMovesQueue signals={baseForces} />

            {/* Row 3 */}
            <ForceRegisterPanel signals={sortedForces} />

            {/* Row 4 */}
            <EvidenceEngineStrip />

            {/* Row 5 — convergences, if any */}
            {convergences.length > 0 && (
              <ConvergencesWidget convergences={convergences} />
            )}

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
