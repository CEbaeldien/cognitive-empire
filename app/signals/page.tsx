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
  directional_thesis: string | null;
  dominant_path: string | null;
  v2_category: string | null;
  v2_subcategory: string | null;
  confidence: number | null;
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
  if (score >= 60) return { bg: "rgba(245,158,11,0.12)", text: "#fbbf24",  border: "rgba(245,158,11,0.3)" };
  if (score >= 40) return { bg: "rgba(0,224,255,0.10)",  text: "#00E0FF",  border: "rgba(0,224,255,0.3)"  };
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
      signal_state, is_base_signal, directional_thesis, dominant_path,
      v2_category, v2_subcategory, confidence,
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
        background: accent ? "rgba(0,224,255,0.08)" : "rgba(255,255,255,0.04)",
        border:     `1px solid ${accent ? "rgba(0,224,255,0.25)" : "rgba(255,255,255,0.08)"}`,
        color:      accent ? "#00E0FF" : "#94a3b8",
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
      style={{ background: "rgba(0,224,255,0.02)", border: "1px solid rgba(0,224,255,0.15)" }}>
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

// ── V2 design system ──────────────────────────────────────────────────────────

// Gold is authority — use only on: primary panel border, eyebrow hairline,
// confidence progress bar, list row arrows, active nav dot. ~10% visual weight.
const GOLD        = "#C9A961";                    // champagne/brass — never bright
const GOLD_DIM    = "rgba(201,169,97,0.38)";      // primary panel 1px border
const GOLD_FAINT  = "rgba(201,169,97,0.07)";      // progress bar track
const GOLD_RULE   = "rgba(201,169,97,0.20)";      // eyebrow hairline
const CE_WHITE    = "#EEF3FA";                    // cool off-white — primary type
const CE_MUTED    = "#7A8DA6";                    // muted blue-gray — secondary
const CE_FAINT    = "#1E2C3F";                    // deep blue-gray — dividers, dots
const BG_DEEP     = "#03050A";                    // near-black base
// Chips: dark navy fill, subtle blue-gray outline — NOT gold
const CHIP_BG     = "rgba(14, 24, 42, 0.75)";
const CHIP_BD     = "rgba(70, 95, 130, 0.20)";
const CHIP_TEXT   = "#6B7E98";
// Noise texture URI — fine fractalNoise grain at ~2% opacity, 220px tile
const NOISE_URI   = "data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='220'%20height='220'%3E%3Cfilter%20id='n'%3E%3CfeTurbulence%20type='fractalNoise'%20baseFrequency='0.82'%20numOctaves='4'%20stitchTiles='stitch'/%3E%3CfeColorMatrix%20type='matrix'%20values='0%200%200%200%200%200%200%200%200%200%200%200%200%200%200%200%200%200%200.022%200'/%3E%3C/filter%3E%3Crect%20width='220'%20height='220'%20filter='url(%23n)'/%3E%3C%2Fsvg%3E";

// Tag system — maps vector names to display labels with icons
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

// ── V2 operational intelligence constants ─────────────────────────────────────
// TODO: migrate operator_move, directional_weight, urgency to DB columns on signals table

type ForceUrgency = "Critical" | "High" | "Medium";

type ForceMeta = {
  title: string;
  dominant_path: string;
  operator_move: string;
  directional_weight: number;
  urgency: ForceUrgency;
  featured: boolean;
};

const BASE_FORCE_METADATA: ForceMeta[] = [
  {
    title: "Infrastructure Concentration",
    dominant_path: "Hyperscaler + frontier platform concentration",
    operator_move: "Build provider-portable AI architecture now.",
    directional_weight: 45,
    urgency: "High",
    featured: true,
  },
  {
    title: "Epistemic Collapse",
    dominant_path: "Provenance-backed verification",
    operator_move: "Add evidence ledgers to all signals.",
    directional_weight: 35,
    urgency: "High",
    featured: false,
  },
  {
    title: "Accountability Diffusion",
    dominant_path: "Audit + incident infrastructure",
    operator_move: "Add approval matrix and incident logs.",
    directional_weight: 30,
    urgency: "High",
    featured: false,
  },
  {
    title: "Labor Identity Displacement",
    dominant_path: "Uneven task restructuring",
    operator_move: "Build operator proof artifacts weekly.",
    directional_weight: 35,
    urgency: "High",
    featured: false,
  },
  {
    title: "Sovereignty Fragmentation",
    dominant_path: "Layered regulatory fragmentation",
    operator_move: "Create CE Jurisdiction Register.",
    directional_weight: 30,
    urgency: "High",
    featured: false,
  },
  {
    title: "Physical Compute Ceiling",
    dominant_path: "Power/grid constraint + solar/storage/flexibility",
    operator_move: "Track energy geography as AI geography.",
    directional_weight: 35,
    urgency: "Critical",
    featured: true,
  },
  {
    title: "Access Stratification",
    dominant_path: "Stratified abundance",
    operator_move: "Build low-bandwidth, PWA-first, provider-flexible systems.",
    directional_weight: 35,
    urgency: "Critical",
    featured: true,
  },
];

const SEEDED_CONVERGENCE: ConvergenceResult = {
  id: "seeded-compute-sovereignty",
  title: "Compute Sovereignty Convergence",
  summary:
    "AI leverage is concentrating around actors with compute, energy, jurisdictional access, and deployment infrastructure.",
  convergence_score: null,
  subcategories: [
    "Infrastructure Concentration",
    "Physical Compute Ceiling",
    "Access Stratification",
    "Sovereignty Fragmentation",
  ],
  second_order_implications:
    "The next competitive moat is not software — it is physical control over the layers that run software.",
  impact_layer: null,
  published_at: null,
  convergence_doctrine_vectors: [],
};

function getMeta(title: string): ForceMeta | null {
  return BASE_FORCE_METADATA.find((m) => m.title === title) ?? null;
}

// ── Inline SVG icons ──────────────────────────────────────────────────────────

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
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3" />
      <line x1="12" y1="3"  x2="12" y2="6"  />
      <line x1="12" y1="18" x2="12" y2="21" />
      <line x1="3"  y1="12" x2="6"  y2="12" />
      <line x1="18" y1="12" x2="21" y2="12" />
    </svg>
  );
}

function ScalesIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <line x1="12" y1="3"  x2="12" y2="21" />
      <path d="M7 20h10" />
      <path d="M3 8l9-5 9 5" />
      <path d="M5 8L3 16h4L5 8z" />
      <path d="M19 8l2 8h-4l2-8z" />
    </svg>
  );
}

function TagIcon({ icon }: { icon: TagIcon }) {
  if (icon === "shield")  return <ShieldIcon />;
  if (icon === "pillars") return <PillarsIcon />;
  if (icon === "target")  return <CrosshairIcon />;
  return <ScalesIcon />;
}

// ── V2 sub-components ─────────────────────────────────────────────────────────

function V2TagChip({ tag }: { tag: V2Tag }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 9px", borderRadius: 4,
      background: CHIP_BG, border: `1px solid ${CHIP_BD}`,
      color: CHIP_TEXT, fontSize: 10, fontWeight: 600, letterSpacing: "0.1em",
    }}>
      <TagIcon icon={tag.icon} />
      {tag.label}
    </span>
  );
}

function UrgencyBadge({ urgency }: { urgency: ForceUrgency }) {
  const s = urgency === "Critical"
    ? { bg: "rgba(239,68,68,0.12)",  color: "#f87171"  }
    : urgency === "High"
      ? { bg: "rgba(251,191,36,0.10)", color: "#fbbf24" }
      : { bg: "rgba(0,224,255,0.08)", color: "#67e8f9"  };
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
      background: s.bg, color: s.color, padding: "2px 8px", borderRadius: 4,
    }}>
      {urgency}
    </span>
  );
}

function ActNowStateBadge() {
  return (
    <span style={{
      fontSize: 9, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase",
      background: "rgba(251,191,36,0.15)", color: "#fbbf24",
      padding: "2px 9px", borderRadius: 4,
    }}>
      ACT NOW
    </span>
  );
}

function V2Nav() {
  return (
    <nav className="ce-v2-nav" style={{
      position: "sticky", top: 0, zIndex: 50,
      background: BG_DEEP,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 40px", height: 52,
    }}>
      <Link href="/signals" style={{ textDecoration: "none" }}>
        <span style={{
          fontFamily: playfair.style.fontFamily,
          fontSize: 15, fontWeight: 600, letterSpacing: "0.08em",
          color: CE_WHITE,
        }}>
          CE SIGNALS.
        </span>
      </Link>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        <Link href="/signals" style={{
          fontSize: 11, fontWeight: 600, letterSpacing: "0.18em",
          color: CE_WHITE, textDecoration: "none",
        }}>
          SIGNALS
        </Link>
        <div style={{ width: 4, height: 4, borderRadius: "50%", background: GOLD }} />
      </div>
    </nav>
  );
}

function getV2Score(signal: V2Signal): number {
  const scored = getFinalScore(signal);
  if (scored > 0) return Math.round(scored);
  if (signal.confidence) return Math.round(signal.confidence * 100);
  return 0;
}

// ── Directional Command Layer ─────────────────────────────────────────────────

type ActNowCardData = {
  title: string;
  dominant_path: string;
  operator_move: string;
  urgency: ForceUrgency;
  directional_weight: number;
};

function ActNowCard({ data }: { data: ActNowCardData }) {
  return (
    <div style={{
      padding: "22px 24px",
      borderRadius: 8,
      background: "rgba(5, 9, 18, 0.80)",
      border: data.urgency === "Critical"
        ? "1px solid rgba(239,68,68,0.22)"
        : "1px solid rgba(201,169,97,0.20)",
      display: "flex", flexDirection: "column", gap: 14,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <ActNowStateBadge />
        <UrgencyBadge urgency={data.urgency} />
        <span style={{ fontSize: 10, color: CE_MUTED, marginLeft: "auto" }}>
          {data.directional_weight}% weight
        </span>
      </div>

      <p style={{
        fontFamily: playfair.style.fontFamily,
        fontSize: 16, fontWeight: 600, color: CE_WHITE,
        margin: 0, lineHeight: 1.3,
      }}>
        {data.title}
      </p>

      <div>
        <p style={{
          fontSize: 9, fontWeight: 700, letterSpacing: "0.35em", textTransform: "uppercase",
          color: CE_MUTED, margin: "0 0 5px",
        }}>
          Dominant Path
        </p>
        <p style={{ fontSize: 12, color: CE_WHITE, margin: 0, lineHeight: 1.55, opacity: 0.82 }}>
          {data.dominant_path}
        </p>
      </div>

      <div style={{
        borderTop: "1px solid rgba(201,169,97,0.09)", paddingTop: 12,
        display: "flex", alignItems: "flex-start", gap: 8,
      }}>
        <span style={{
          fontSize: 9, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase",
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
  const featured = BASE_FORCE_METADATA
    .filter((m) => m.featured)
    .map((meta) => {
      const db = signals.find((s) => s.title === meta.title);
      return {
        title: meta.title,
        dominant_path: db?.dominant_path ?? meta.dominant_path,
        operator_move: meta.operator_move,
        urgency: meta.urgency,
        directional_weight: meta.directional_weight,
      } as ActNowCardData;
    });

  return (
    <section style={{ marginBottom: 52 }}>
      <div style={{ marginBottom: 20 }}>
        <p style={{
          fontSize: 9, fontWeight: 700, letterSpacing: "0.45em", textTransform: "uppercase",
          color: CE_MUTED, margin: "0 0 7px",
        }}>
          Directional Intelligence
        </p>
        <p style={{
          fontFamily: playfair.style.fontFamily,
          fontSize: 18, fontWeight: 600, color: CE_WHITE,
          margin: "0 0 14px",
        }}>
          Dominant Signals — 2026–2031
        </p>
        <div style={{ height: 1, background: "rgba(239,68,68,0.18)" }} />
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
  return (
    <section style={{ marginBottom: 52 }}>
      <div style={{ marginBottom: 16 }}>
        <p style={{
          fontSize: 9, fontWeight: 700, letterSpacing: "0.45em", textTransform: "uppercase",
          color: CE_MUTED, margin: "0 0 7px",
        }}>
          Force Register
        </p>
        <p style={{
          fontFamily: playfair.style.fontFamily,
          fontSize: 18, fontWeight: 600, color: CE_WHITE,
          margin: "0 0 14px",
        }}>
          Seven Base Forces
        </p>
        <div style={{ height: 1, background: CE_FAINT }} />
      </div>

      <div style={{ borderRadius: 8, border: `1px solid ${CE_FAINT}`, overflow: "hidden", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 700 }}>
          <thead>
            <tr style={{ background: "rgba(3,5,10,0.85)", borderBottom: `1px solid ${CE_FAINT}` }}>
              {["Force", "State", "Dominant Path", "Weight", "Urgency", "Operator Move"].map((h) => (
                <th key={h} style={{
                  padding: "10px 14px", textAlign: "left",
                  fontSize: 9, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase",
                  color: CE_MUTED, whiteSpace: "nowrap",
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {BASE_FORCE_METADATA.map((meta, i) => {
              const db = signals.find((s) => s.title === meta.title);
              const dominantPath = db?.dominant_path ?? meta.dominant_path;
              return (
                <tr key={meta.title} style={{
                  borderBottom: i < BASE_FORCE_METADATA.length - 1 ? `1px solid ${CE_FAINT}` : "none",
                  background: "rgba(3,5,10,0.45)",
                }}>
                  <td style={{
                    padding: "11px 14px", color: CE_WHITE,
                    fontWeight: 600, whiteSpace: "nowrap", fontSize: 12,
                  }}>
                    {meta.title}
                  </td>
                  <td style={{ padding: "11px 14px" }}>
                    <ActNowStateBadge />
                  </td>
                  <td style={{ padding: "11px 14px", color: CE_MUTED, maxWidth: 220, fontSize: 11 }}>
                    {dominantPath}
                  </td>
                  <td style={{ padding: "11px 14px", color: CE_WHITE, fontWeight: 700, whiteSpace: "nowrap" }}>
                    {meta.directional_weight}%
                  </td>
                  <td style={{ padding: "11px 14px" }}>
                    <UrgencyBadge urgency={meta.urgency} />
                  </td>
                  <td style={{ padding: "11px 14px", color: CE_MUTED, fontSize: 11 }}>
                    {meta.operator_move}
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

// ── V2 signal cards ───────────────────────────────────────────────────────────

function PrimarySignalCard({ signal }: { signal: V2Signal }) {
  const score  = getV2Score(signal);
  const tags   = getSignalTags(signal);
  const meta   = getMeta(signal.title);
  const dominantPath   = signal.dominant_path ?? meta?.dominant_path ?? null;
  const operatorMove   = meta?.operator_move ?? null;
  const directionalW   = meta?.directional_weight ?? null;
  const isActNow       = signal.signal_state === "act_now";

  return (
    <div className="ce-primary-card ce-primary-card-grid" style={{
      border: `1px solid ${GOLD_DIM}`, borderRadius: 10,
      background: "rgba(6, 12, 22, 0.60)",
      display: "grid", gridTemplateColumns: "65fr 35fr",
      overflow: "hidden",
    }}>
      {/* Left: content */}
      <div style={{ padding: "28px 30px", display: "flex", flexDirection: "column", gap: 16 }}>
        {/* State badges row */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {isActNow && <ActNowStateBadge />}
          {meta && <UrgencyBadge urgency={meta.urgency} />}
          {!isActNow && signal.signal_state && (
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
              background: "rgba(96,165,250,0.12)", color: "#93c5fd",
              padding: "2px 8px", borderRadius: 4,
            }}>
              {signal.signal_state.replace("_", " ")}
            </span>
          )}
        </div>

        <p style={{
          fontSize: 9, fontWeight: 700, letterSpacing: "0.45em",
          textTransform: "uppercase", color: CE_MUTED, margin: 0,
        }}>
          Primary Signal
        </p>

        <h2 style={{
          fontFamily: playfair.style.fontFamily,
          fontSize: 22, fontWeight: 600, lineHeight: 1.3,
          color: CE_WHITE, margin: 0,
        }}>
          {signal.title}
        </h2>

        {dominantPath && (
          <div>
            <p style={{
              fontSize: 9, fontWeight: 700, letterSpacing: "0.35em", textTransform: "uppercase",
              color: CE_MUTED, margin: "0 0 5px",
            }}>
              Dominant Path
            </p>
            <p style={{ fontSize: 12, lineHeight: 1.65, color: CE_MUTED, margin: 0 }}>
              {dominantPath}
            </p>
          </div>
        )}

        {operatorMove && (
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 8,
            borderTop: `1px solid ${CE_FAINT}`, paddingTop: 12,
          }}>
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase",
              color: GOLD, flexShrink: 0, paddingTop: 2,
            }}>
              MOVE →
            </span>
            <p style={{ fontSize: 12, color: CE_WHITE, margin: 0, lineHeight: 1.55, opacity: 0.9 }}>
              {operatorMove}
            </p>
          </div>
        )}

        <p style={{ fontSize: 13, lineHeight: 1.75, color: CE_MUTED, margin: 0 }}>
          {signal.summary}
        </p>

        {tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 2 }}>
            {tags.map((t) => <V2TagChip key={t.label} tag={t} />)}
          </div>
        )}
      </div>

      {/* Right: score / weight */}
      <div className="ce-primary-card-right" style={{ borderLeft: "1px solid rgba(201,169,97,0.12)", display: "flex" }}>
        <div style={{
          flex: 1, padding: "28px 26px",
          display: "flex", flexDirection: "column", justifyContent: "center", gap: 16,
        }}>
          <p style={{
            fontSize: 9, fontWeight: 700, letterSpacing: "0.45em",
            textTransform: "uppercase", color: CE_MUTED, margin: 0,
          }}>
            {score > 0 ? "Confidence" : "Status"}
          </p>

          {score > 0 ? (
            <>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{
                  fontFamily: playfair.style.fontFamily,
                  fontSize: 54, fontWeight: 700, lineHeight: 1,
                  color: CE_WHITE,
                }}>
                  {score}
                </span>
                <span style={{ fontSize: 16, color: CE_MUTED, fontWeight: 400 }}>/100</span>
              </div>

              <div style={{ height: 3, background: GOLD_FAINT, borderRadius: 2, overflow: "hidden" }}>
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
                color: CE_MUTED, margin: "0 0 4px",
              }}>
                Directional Weight
              </p>
              <p style={{ fontSize: 24, fontWeight: 700, color: CE_WHITE, margin: 0 }}>
                {directionalW}%
              </p>
            </div>
          )}

          <p style={{
            fontSize: 10, color: CE_MUTED, margin: 0,
            display: "flex", alignItems: "center", gap: 5,
          }}>
            <span>✓</span>
            human-reviewed · doctrine-governed
          </p>
        </div>
      </div>
    </div>
  );
}

function SignalListRow({ signal }: { signal: V2Signal }) {
  const score      = getV2Score(signal);
  const tags       = getSignalTags(signal).slice(0, 2);
  const meta       = getMeta(signal.title);
  const blurb      = signal.implication ?? signal.directional_thesis ?? truncateSentences(signal.summary, 1);
  const operatorMove = meta?.operator_move ?? null;
  const isActNow   = signal.signal_state === "act_now";

  return (
    <Link href={`/signals/${signal.id}`} style={{ textDecoration: "none", display: "block" }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: "20px 1fr auto auto auto",
        alignItems: "center",
        gap: 16,
        padding: "16px 4px",
        cursor: "pointer",
      }}>
        {/* Status dot — gold for act_now */}
        <div style={{
          width: 7, height: 7, borderRadius: "50%",
          background: isActNow ? GOLD : CE_FAINT,
          flexShrink: 0, justifySelf: "center",
        }} />

        {/* Title + context */}
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
            {isActNow && (
              <span style={{
                fontSize: 8, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase",
                background: "rgba(251,191,36,0.12)", color: "#fbbf24",
                padding: "1px 6px", borderRadius: 3, flexShrink: 0,
              }}>
                ACT NOW
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
                letterSpacing: "0.2em", textTransform: "uppercase", marginRight: 6,
              }}>MOVE</span>
              <span style={{ color: CE_MUTED }}>{operatorMove}</span>
            </p>
          )}
        </div>

        {/* Tags */}
        <div className="ce-list-row-tags" style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          {tags.map((t) => <V2TagChip key={t.label} tag={t} />)}
        </div>

        {/* Score or pending */}
        {score > 0 ? (
          <span style={{
            fontSize: 13, fontWeight: 600, color: CE_WHITE,
            letterSpacing: "0.02em", flexShrink: 0,
          }}>
            {score}<span style={{ fontSize: 11, fontWeight: 400, color: CE_MUTED, opacity: 0.55 }}>/100</span>
          </span>
        ) : (
          <span style={{ fontSize: 10, color: CE_MUTED, opacity: 0.6, flexShrink: 0 }}>pending</span>
        )}

        {/* Arrow */}
        <span style={{ fontSize: 14, color: GOLD, flexShrink: 0 }}>→</span>
      </div>
    </Link>
  );
}

// ── V2 layout ─────────────────────────────────────────────────────────────────

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
    if (a.is_base_signal && b.is_base_signal) return (b.confidence ?? 0) - (a.confidence ?? 0);
    return getFinalScore(b) - getFinalScore(a);
  });
  const primary   = sorted[0] ?? null;
  const remaining = sorted.slice(1);
  const isEmpty   = eligible.length === 0;

  // Fall back to seeded convergence if nothing published yet
  const displayConvergences = convergences.length > 0 ? convergences : [SEEDED_CONVERGENCE];

  return (
    <div style={{
      minHeight: "100vh", position: "relative",
      background: `url("${NOISE_URI}") repeat, linear-gradient(175deg, ${BG_DEEP} 0%, #060E1C 42%, #04080E 100%)`,
      color: CE_WHITE,
    }}>

      <style>{`
        @keyframes ceEaseUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        @keyframes ceBorderPulse {
          0%, 100% { border-color: rgba(201,169,97,0.38); }
          50%       { border-color: rgba(201,169,97,0.70); }
        }
        @keyframes ceFillBar {
          from { width: 0; }
          to   { width: var(--target-width, 0%); }
        }
        @keyframes ceBgDrift {
          0%,100% { transform: translate(0px,   0px);  opacity: 0.52; }
          33%      { transform: translate(10px, -6px);  opacity: 0.44; }
          66%      { transform: translate(-8px,  5px);  opacity: 0.48; }
        }
        @keyframes ceAmbientDrift {
          0%,100% { transform: translate(0px,  0px); }
          35%     { transform: translate(5px, -4px); }
          70%     { transform: translate(-4px, 3px); }
        }
        @keyframes ceTraceDrift {
          0%,100% { opacity: 0.60; }
          50%     { opacity: 1.00; }
        }
        @keyframes ceTwinkle {
          0%,100% { opacity: 0.30; }
          25%     { opacity: 0.90; }
          65%     { opacity: 0.50; }
        }

        .ce-el-1 { opacity: 0; animation: ceEaseUp 320ms ease-out   0ms forwards; }
        .ce-el-2 { opacity: 0; animation: ceEaseUp 320ms ease-out  80ms forwards; }
        .ce-el-3 { opacity: 0; animation: ceEaseUp 320ms ease-out 160ms forwards; }
        .ce-el-4 { opacity: 0; animation: ceEaseUp 320ms ease-out 240ms forwards; }
        .ce-el-5 { opacity: 0; animation: ceEaseUp 320ms ease-out 320ms forwards; }
        .ce-el-6 { opacity: 0; animation: ceEaseUp 320ms ease-out 400ms forwards; }

        .ce-primary-card {
          animation: ceBorderPulse 4s ease-in-out infinite;
          transition: transform 200ms ease-out;
          will-change: transform;
        }
        .ce-primary-card:hover {
          transform: translateY(-2px) scale(1.005);
          border-color: rgba(201,169,97,0.75) !important;
        }

        .ce-bar-fill {
          height: 100%;
          width: var(--target-width, 0%);
          background: #C9A961;
          border-radius: 2px;
          animation: ceFillBar 900ms ease-out forwards;
        }

        .ce-bg-drift       { animation: ceBgDrift 22s ease-in-out infinite; }
        .ce-ambient-layer  { animation: ceAmbientDrift 30s ease-in-out infinite; }

        .ce-trace-1 { animation: ceTraceDrift 28s ease-in-out  0s infinite; }
        .ce-trace-2 { animation: ceTraceDrift 24s ease-in-out  7s infinite; }
        .ce-trace-3 { animation: ceTraceDrift 32s ease-in-out 14s infinite; }
        .ce-trace-4 { animation: ceTraceDrift 26s ease-in-out  3s infinite; }
        .ce-trace-5 { animation: ceTraceDrift 30s ease-in-out 19s infinite; }
        .ce-trace-6 { animation: ceTraceDrift 27s ease-in-out 11s infinite; }

        .ce-dot-1  { animation: ceTwinkle 18s ease-in-out  0s  infinite; }
        .ce-dot-2  { animation: ceTwinkle 22s ease-in-out  8s  infinite; }
        .ce-dot-3  { animation: ceTwinkle 16s ease-in-out  4s  infinite; }
        .ce-dot-4  { animation: ceTwinkle 25s ease-in-out 13s  infinite; }
        .ce-dot-5  { animation: ceTwinkle 19s ease-in-out  2s  infinite; }
        .ce-dot-6  { animation: ceTwinkle 23s ease-in-out 17s  infinite; }
        .ce-dot-7  { animation: ceTwinkle 17s ease-in-out  6s  infinite; }
        .ce-dot-8  { animation: ceTwinkle 21s ease-in-out 10s  infinite; }
        .ce-dot-9  { animation: ceTwinkle 20s ease-in-out 15s  infinite; }
        .ce-dot-10 { animation: ceTwinkle 24s ease-in-out  1s  infinite; }

        .ce-under-review { transition: opacity 200ms ease-out; }
        .ce-under-review:hover { opacity: 0.75; }

        .ce-judgment-eyebrow {
          font-family: ui-monospace, monospace;
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #5E6B80;
          margin: 0 0 0.6rem;
        }
        .ce-judgment-eyebrow--gold { color: #C9A961; }

        .ce-judgment-strip {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 1.25rem;
        }

        .ce-judgment-stage {
          padding: 0.9rem 1.1rem;
          border-right: 1px solid rgba(201,169,97,0.12);
          background: rgba(3,5,10,0.65);
        }
        .ce-judgment-stage:last-child { border-right: none; }

        .ce-stage-copy {
          font-size: 11.5px;
          line-height: 1.65;
          color: #4A5A6E;
          margin: 0;
        }

        .ce-signal-row {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1px;
          background: rgba(255,255,255,0.055);
          border-radius: 10px;
          overflow: hidden;
        }
        @media (min-width: 900px) {
          .ce-signal-row { grid-template-columns: 1fr 1.8fr 1fr; }
        }

        .ce-context-panel {
          padding: 1.35rem 1.25rem;
          background: rgba(4,7,14,0.82);
          transition: transform 220ms ease, border-color 220ms ease;
        }
        .ce-context-panel:hover { transform: translateY(-2px); }
        .ce-context-panel--left  { border-left:  1px solid rgba(201,169,97,0.55); }
        .ce-context-panel--right { border-right: 1px solid rgba(201,169,97,0.55); }
        .ce-context-panel--left:hover  { border-left-color:  rgba(201,169,97,0.85); }
        .ce-context-panel--right:hover { border-right-color: rgba(201,169,97,0.85); }

        .ce-context-body {
          font-size: 12.5px;
          line-height: 1.72;
          color: #C5D0E0;
        }
        .ce-context-body p           { margin: 0 0 0.65rem; }
        .ce-context-body p:last-child { margin-bottom: 0; }

        .ce-context-meta {
          font-size: 10.5px;
          color: #4A5A6E;
          margin: 0;
          font-style: italic;
        }

        .ce-primary-slot { background: #03050A; }

        @media (max-width: 768px) {
          .ce-v2-nav  { padding: 0 20px !important; }
          .ce-v2-main { padding: 36px 20px 60px !important; }
          .ce-primary-card-grid  { grid-template-columns: 1fr !important; }
          .ce-primary-card-right { border-left: none !important; border-top: 1px solid rgba(201,169,97,0.12) !important; }
          .ce-list-row-tags { display: none !important; }
          .ce-judgment-strip { grid-template-columns: 1fr 1fr !important; }
          .ce-judgment-stage:nth-child(odd)  { border-right: 1px solid rgba(201,169,97,0.12); }
          .ce-judgment-stage:nth-child(even) { border-right: none !important; }
          .ce-judgment-stage { border-bottom: 1px solid rgba(201,169,97,0.08); }
        }

        @media (prefers-reduced-motion: reduce) {
          .ce-el-1, .ce-el-2, .ce-el-3, .ce-el-4, .ce-el-5, .ce-el-6 {
            opacity: 1; animation: none; transform: none;
          }
          .ce-primary-card { animation: none; }
          .ce-bar-fill     { animation: none; }
          .ce-bg-drift     { animation: none; }
          .ce-ambient-layer,
          .ce-trace-1, .ce-trace-2, .ce-trace-3,
          .ce-trace-4, .ce-trace-5, .ce-trace-6,
          .ce-dot-1, .ce-dot-2, .ce-dot-3, .ce-dot-4, .ce-dot-5,
          .ce-dot-6, .ce-dot-7, .ce-dot-8, .ce-dot-9, .ce-dot-10 {
            animation: none; opacity: 1;
          }
          .ce-context-panel { transition: none; }
          .ce-context-panel:hover { transform: none; }
        }
      `}</style>

      {/* Ambient gold light traces */}
      <div
        aria-hidden="true"
        className="ce-ambient-layer"
        style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}
      >
        <svg width="100%" height="100%" viewBox="0 0 1200 800" preserveAspectRatio="none"
          style={{ position: "absolute", inset: 0 }}>
          <path className="ce-trace-1" d="M -10,42 C 50,-14 138,22 212,6"
            fill="none" stroke="#C9A961" strokeWidth="0.8" strokeOpacity="0.13" />
          <path className="ce-trace-2" d="M 988,8 C 1058,-18 1142,26 1215,14"
            fill="none" stroke="#C9A961" strokeWidth="0.7" strokeOpacity="0.10" />
          <path className="ce-trace-3" d="M -14,548 C 16,594 6,652 -14,722"
            fill="none" stroke="#C9A961" strokeWidth="0.7" strokeOpacity="0.10" />
          <path className="ce-trace-4" d="M 1214,504 C 1194,572 1210,652 1216,742"
            fill="none" stroke="#C9A961" strokeWidth="0.6" strokeOpacity="0.09" />
          <path className="ce-trace-5" d="M 18,790 C 92,756 192,796 292,776"
            fill="none" stroke="#C9A961" strokeWidth="0.6" strokeOpacity="0.09" />
          <path className="ce-trace-6" d="M 908,776 C 1008,796 1112,756 1215,788"
            fill="none" stroke="#C9A961" strokeWidth="0.7" strokeOpacity="0.10" />

          <circle className="ce-dot-1"  cx="44"   cy="70"  r="1.5" fill="#C9A961" fillOpacity="0.18" />
          <circle className="ce-dot-2"  cx="1156" cy="46"  r="1.2" fill="#EEF3FA" fillOpacity="0.10" />
          <circle className="ce-dot-3"  cx="22"   cy="262" r="1.3" fill="#C9A961" fillOpacity="0.12" />
          <circle className="ce-dot-4"  cx="1178" cy="214" r="1.5" fill="#C9A961" fillOpacity="0.14" />
          <circle className="ce-dot-5"  cx="18"   cy="524" r="1.1" fill="#EEF3FA" fillOpacity="0.07" />
          <circle className="ce-dot-6"  cx="1182" cy="492" r="1.3" fill="#C9A961" fillOpacity="0.11" />
          <circle className="ce-dot-7"  cx="76"   cy="732" r="1.0" fill="#EEF3FA" fillOpacity="0.06" />
          <circle className="ce-dot-8"  cx="312"  cy="764" r="1.2" fill="#C9A961" fillOpacity="0.09" />
          <circle className="ce-dot-9"  cx="888"  cy="770" r="1.0" fill="#EEF3FA" fillOpacity="0.06" />
          <circle className="ce-dot-10" cx="1124" cy="742" r="1.4" fill="#C9A961" fillOpacity="0.13" />
        </svg>
      </div>

      <div
        aria-hidden="true"
        className="ce-bg-drift"
        style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse 88% 54% at 50% 22%, rgba(8,18,40,0.52) 0%, transparent 68%)",
        }}
      />

      <div style={{ position: "relative" }}>
        <V2Nav />

        <main className="ce-v2-main" style={{ maxWidth: 960, margin: "0 auto", padding: "52px 40px 80px" }}>

          {/* Eyebrow — stagger 1 */}
          <div className="ce-el-1" style={{ marginBottom: 18 }}>
            <p style={{
              fontSize: 9, fontWeight: 500, letterSpacing: "0.38em",
              textTransform: "uppercase", color: "rgba(201,169,97,0.48)", margin: "0 0 14px",
            }}>
              Signal Intelligence &nbsp;•&nbsp; Cycle 001
            </p>
            <div style={{ height: 1, background: GOLD_RULE }} />
          </div>

          {/* Doctrine headline — stagger 2 */}
          <h1 className="ce-el-2" style={{
            fontFamily: playfair.style.fontFamily,
            fontSize: 30, fontWeight: 400, lineHeight: 1.3,
            color: CE_WHITE, margin: "0 0 44px", maxWidth: 680,
          }}>
            Structural clarity is earned through disciplined filtration.
          </h1>

          {isEmpty ? (
            <div style={{
              padding: "48px 0", borderTop: `1px solid ${CE_FAINT}`,
              fontSize: 13, color: CE_MUTED,
            }}>
              No signals published in this cycle.
            </div>
          ) : (
            <>
              {/* Directional Command Layer — stagger 3 */}
              <div className="ce-el-3">
                <DirectionalCommandLayer signals={eligible} />
              </div>

              {/* Force Matrix — stagger 4 */}
              <div className="ce-el-4">
                <ForceMatrixTable signals={eligible} />
              </div>

              {/* Primary signal card — stagger 5 */}
              {primary && (
                <div className="ce-el-5" style={{ marginBottom: 44 }}>
                  <SignalWithContext primarySignal={<PrimarySignalCard signal={primary} />} />
                </div>
              )}

              {/* Signal list — stagger 6 */}
              <div className="ce-el-6">
                {remaining.length > 0 ? (
                  <div>
                    <p style={{
                      fontSize: 9, fontWeight: 700, letterSpacing: "0.45em",
                      textTransform: "uppercase", color: CE_MUTED, marginBottom: 4,
                    }}>
                      Published Signals
                    </p>
                    <div style={{ height: 1, background: CE_FAINT, marginBottom: 4 }} />
                    {remaining.map((s, i) => (
                      <div key={s.id}>
                        <SignalListRow signal={s} />
                        {i < remaining.length - 1 && (
                          <div style={{ height: 1, background: CE_FAINT }} />
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

              {/* Active Convergences — at bottom */}
              <div style={{ marginTop: 64 }}>
                <div style={{ marginBottom: 16 }}>
                  <p style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: "0.45em", textTransform: "uppercase",
                    color: CE_MUTED, margin: "0 0 7px",
                  }}>
                    Convergence Intelligence
                  </p>
                  <p style={{
                    fontFamily: playfair.style.fontFamily,
                    fontSize: 18, fontWeight: 600, color: CE_WHITE,
                    margin: "0 0 14px",
                  }}>
                    Active Convergences
                  </p>
                  <div style={{ height: 1, background: "rgba(0,224,255,0.15)" }} />
                </div>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: 16,
                }}>
                  {displayConvergences.map((c) => <ConvergenceCard key={c.id} c={c} />)}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function SignalsPage() {
  const v2Mode = process.env.NEXT_PUBLIC_SIGNALS_V2 === "true";

  // V2 path
  if (v2Mode) {
    let v2Signals: V2Signal[]           = [];
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

  // V1 path (unchanged)
  let signals: SignalResult[]           = [];
  let convergences: ConvergenceResult[] = [];
  let fetchError: string | null         = null;

  try {
    [signals, convergences] = await Promise.all([fetchSignals(), fetchConvergences()]);
  } catch (err) {
    fetchError = err instanceof Error ? err.message : "Unknown error";
  }

  const byCategory: { category: SignalCategory; signals: SignalResult[] }[] = [];
  for (const cat of CATEGORY_ORDER) {
    const catSignals = signals
      .filter((s) => s.category === cat)
      .sort((a, b) => getFinalScore(b) - getFinalScore(a))
      .slice(0, 3);
    if (catSignals.length > 0) byCategory.push({ category: cat, signals: catSignals });
  }

  const totalSignals = byCategory.reduce((n, g) => n + g.signals.length, 0);

  return (
    <>
      <CENav />

      <main className="min-h-screen" style={{ background: "#09091c", color: "#f1f5f9" }}>
        <div className="mx-auto max-w-5xl px-6 py-16">

          <header className="mb-16">
            <p className="mb-3 text-xs font-semibold tracking-[0.35em] uppercase" style={{ color: "#00E0FF" }}>
              Cognitive Empire
            </p>
            <h1 className="mb-3 text-4xl font-bold tracking-tight" style={{ color: "#f1f5f9" }}>
              CE Signals
            </h1>
            <p className="text-base" style={{ color: "#64748b" }}>
              Structural pressure intelligence. Doctrine-governed. Human-reviewed.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Tag>{byCategory.length} categories active</Tag>
              <Tag>{totalSignals} signals visible</Tag>
              <Tag>{convergences.length} convergences</Tag>
            </div>
          </header>

          {fetchError && (
            <div className="mb-10 rounded-lg px-5 py-4 text-sm"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
              {fetchError}
            </div>
          )}

          <section className="mb-20">
            <div className="mb-6 pb-4" style={{ borderBottom: "1px solid #1c1a35" }}>
              <SectionLabel>Convergences</SectionLabel>
              <h2 className="mt-1 text-2xl font-semibold" style={{ color: "#f1f5f9" }}>Active Convergences</h2>
              <p className="mt-1 text-sm" style={{ color: "#475569" }}>
                When 2 or more signals activate the same doctrine law simultaneously.
              </p>
            </div>
            {convergences.length === 0 ? (
              <p className="text-sm" style={{ color: "#334155" }}>No convergences published yet.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {convergences.map((c) => <ConvergenceCard key={c.id} c={c} />)}
              </div>
            )}
          </section>

          <section>
            <div className="mb-10 pb-4" style={{ borderBottom: "1px solid #1c1a35" }}>
              <SectionLabel>Signal Intelligence</SectionLabel>
              <h2 className="mt-1 text-2xl font-semibold" style={{ color: "#f1f5f9" }}>Signals by Category</h2>
              <p className="mt-1 text-sm" style={{ color: "#475569" }}>
                Top 3 per category by CE Signal Score. Updated after human review.
              </p>
            </div>
            {byCategory.length === 0 ? (
              <p className="text-sm" style={{ color: "#334155" }}>No signals published yet.</p>
            ) : (
              <div className="space-y-16">
                {byCategory.map(({ category, signals: catSignals }) => (
                  <div key={category}>
                    <div className="mb-5 flex items-center justify-between">
                      <h3 className="text-lg font-semibold" style={{ color: "#e2e8f0" }}>
                        {fmtCategory(category)}
                      </h3>
                      <span className="text-xs" style={{ color: "#334155" }}>
                        {catSignals.length} signal{catSignals.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {catSignals.map((s) => <SignalCard key={s.id} signal={s} />)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <footer className="mt-24 pt-8 text-center text-xs"
            style={{ borderTop: "1px solid #1c1a35", color: "#334155" }}>
            Signals are published after human review. No autopublish.
          </footer>

        </div>
      </main>
    </>
  );
}
