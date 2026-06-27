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
          <ScoreBadge score={score} />
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
      <p className="text-xs" style={{ color: "#334155" }}>Published {fmtDate(signal.published_at)}</p>
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
      <p className="text-xs" style={{ color: "#334155" }}>Published {fmtDate(c.published_at)}</p>
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

function V2Nav() {
  return (
    <nav className="ce-v2-nav" style={{
      position: "sticky", top: 0, zIndex: 50,
      background: BG_DEEP,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 40px", height: 52,
    }}>
      {/* Wordmark */}
      <Link href="/signals" style={{ textDecoration: "none" }}>
        <span style={{
          fontFamily: playfair.style.fontFamily,
          fontSize: 15, fontWeight: 600, letterSpacing: "0.08em",
          color: CE_WHITE,
        }}>
          CE SIGNALS.
        </span>
      </Link>

      {/* Active nav item — SIGNALS only */}
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

function PrimarySignalCard({ signal }: { signal: V2Signal }) {
  const score  = getV2Score(signal);
  const tags   = getSignalTags(signal);

  return (
    <div className="ce-primary-card ce-primary-card-grid" style={{
      border: `1px solid ${GOLD_DIM}`, borderRadius: 10,
      background: "rgba(6, 12, 22, 0.60)",
      display: "grid", gridTemplateColumns: "65fr 35fr",
      overflow: "hidden",
    }}>
      {/* Left: content */}
      <div style={{ padding: "28px 30px", display: "flex", flexDirection: "column", gap: 18 }}>
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

        <p style={{ fontSize: 13, lineHeight: 1.75, color: CE_MUTED, margin: 0 }}>
          {signal.summary}
        </p>

        {tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 2 }}>
            {tags.map((t) => <V2TagChip key={t.label} tag={t} />)}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="ce-primary-card-right" style={{ borderLeft: "1px solid rgba(201,169,97,0.12)", display: "flex" }}>
        {/* Right: confidence */}
        <div style={{
          flex: 1, padding: "28px 26px",
          display: "flex", flexDirection: "column", justifyContent: "center", gap: 14,
        }}>
          <p style={{
            fontSize: 9, fontWeight: 700, letterSpacing: "0.45em",
            textTransform: "uppercase", color: CE_MUTED, margin: 0,
          }}>
            Confidence
          </p>

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

          {/* Progress bar — fills from 0 via CSS animation */}
          <div style={{ height: 3, background: GOLD_FAINT, borderRadius: 2, overflow: "hidden" }}>
            <div
              className="ce-bar-fill"
              style={{ "--target-width": `${Math.min(score, 100)}%` } as React.CSSProperties}
            />
          </div>

          <p style={{
            fontSize: 10, color: CE_MUTED, margin: 0,
            display: "flex", alignItems: "center", gap: 5,
          }}>
            <span style={{ color: CE_MUTED }}>✓</span>
            human-reviewed · doctrine-governed
          </p>
        </div>
      </div>
    </div>
  );
}

function SignalListRow({ signal }: { signal: V2Signal }) {
  const score = getV2Score(signal);
  const tags  = getSignalTags(signal).slice(0, 2);
  const blurb = signal.implication ?? signal.directional_thesis ?? truncateSentences(signal.summary, 1);

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
        {/* Status dot */}
        <div style={{
          width: 7, height: 7, borderRadius: "50%",
          background: CE_FAINT, flexShrink: 0, justifySelf: "center",
        }} />

        {/* Title + blurb */}
        <div style={{ minWidth: 0 }}>
          <p style={{
            fontFamily: playfair.style.fontFamily,
            fontSize: 14, fontWeight: 600, color: CE_WHITE,
            margin: "0 0 4px", lineHeight: 1.35,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {signal.title}
          </p>
          {blurb && (
            <p style={{
              fontSize: 12, color: CE_MUTED, margin: 0, lineHeight: 1.5,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {blurb}
            </p>
          )}
        </div>

        {/* Tags */}
        <div className="ce-list-row-tags" style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          {tags.map((t) => <V2TagChip key={t.label} tag={t} />)}
        </div>

        {/* Score */}
        <span style={{
          fontSize: 13, fontWeight: 600, color: CE_WHITE,
          letterSpacing: "0.02em", flexShrink: 0,
        }}>
          {score}<span style={{ fontSize: 11, fontWeight: 400, color: CE_MUTED, opacity: 0.55 }}>/100</span>
        </span>

        {/* Arrow — gold: directional accent, one of 5 permitted gold uses */}
        <span style={{ fontSize: 14, color: GOLD, flexShrink: 0 }}>→</span>
      </div>
    </Link>
  );
}

function SignalIntelligenceLayout({ signals }: { signals: V2Signal[] }) {
  // Base signals are always eligible; non-base require a score > 0
  const eligible = signals.filter((s) => s.is_base_signal || getFinalScore(s) > 0);
  // Base signals first (ordered by confidence desc), then others by score desc
  const sorted = [...eligible].sort((a, b) => {
    if (a.is_base_signal && !b.is_base_signal) return -1;
    if (!a.is_base_signal && b.is_base_signal) return 1;
    if (a.is_base_signal && b.is_base_signal) {
      return (b.confidence ?? 0) - (a.confidence ?? 0);
    }
    return getFinalScore(b) - getFinalScore(a);
  });
  const primary   = sorted[0] ?? null;
  const remaining = sorted.slice(1);
  const isEmpty   = eligible.length === 0;

  return (
    <div style={{
      minHeight: "100vh", position: "relative",
      background: `url("${NOISE_URI}") repeat, linear-gradient(175deg, ${BG_DEEP} 0%, #060E1C 42%, #04080E 100%)`,
      color: CE_WHITE,
    }}>

      {/* ── Animation layer ─────────────────────────────────────────────────── */}
      <style>{`
        /* CE Signals V2 — command-surface motion */

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

        /* Ambient layer — imperceptible whole-layer slow drift */
        @keyframes ceAmbientDrift {
          0%,100% { transform: translate(0px,  0px); }
          35%     { transform: translate(5px, -4px); }
          70%     { transform: translate(-4px, 3px); }
        }

        /* Light traces — opacity oscillation, very slow */
        @keyframes ceTraceDrift {
          0%,100% { opacity: 0.60; }
          50%     { opacity: 1.00; }
        }

        /* Scattered points — sparse, async twinkle */
        @keyframes ceTwinkle {
          0%,100% { opacity: 0.30; }
          25%     { opacity: 0.90; }
          65%     { opacity: 0.50; }
        }

        /* Load stagger — elements start at opacity:0 */
        .ce-el-1 { opacity: 0; animation: ceEaseUp 320ms ease-out   0ms forwards; }
        .ce-el-2 { opacity: 0; animation: ceEaseUp 320ms ease-out  80ms forwards; }
        .ce-el-3 { opacity: 0; animation: ceEaseUp 320ms ease-out 160ms forwards; }
        .ce-el-4 { opacity: 0; animation: ceEaseUp 320ms ease-out 240ms forwards; }

        /* Primary card — telemetry border pulse + hover lift */
        .ce-primary-card {
          animation: ceBorderPulse 4s ease-in-out infinite;
          transition: transform 200ms ease-out;
          will-change: transform;
        }
        .ce-primary-card:hover {
          transform: translateY(-2px) scale(1.005);
          border-color: rgba(201,169,97,0.75) !important;
        }

        /* Confidence bar fill */
        .ce-bar-fill {
          height: 100%;
          width: var(--target-width, 0%);
          background: #C9A961;
          border-radius: 2px;
          animation: ceFillBar 900ms ease-out forwards;
        }

        /* Background drift layer */
        .ce-bg-drift {
          animation: ceBgDrift 22s ease-in-out infinite;
        }

        /* Ambient SVG layer — slow whole-layer drift */
        .ce-ambient-layer {
          animation: ceAmbientDrift 30s ease-in-out infinite;
        }

        /* Light traces — individual fade cycles, staggered */
        .ce-trace-1 { animation: ceTraceDrift 28s ease-in-out  0s infinite; }
        .ce-trace-2 { animation: ceTraceDrift 24s ease-in-out  7s infinite; }
        .ce-trace-3 { animation: ceTraceDrift 32s ease-in-out 14s infinite; }
        .ce-trace-4 { animation: ceTraceDrift 26s ease-in-out  3s infinite; }
        .ce-trace-5 { animation: ceTraceDrift 30s ease-in-out 19s infinite; }
        .ce-trace-6 { animation: ceTraceDrift 27s ease-in-out 11s infinite; }

        /* Light points — async twinkle delays */
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

        /* Under-review row hover */
        .ce-under-review {
          transition: opacity 200ms ease-out;
        }
        .ce-under-review:hover { opacity: 0.75; }

        /* ── Judgment process strip + context panels ──────────────────── */

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

        /* ── Mobile responsive ── */
        @media (max-width: 768px) {
          .ce-v2-nav  { padding: 0 20px !important; }
          .ce-v2-main { padding: 36px 20px 60px !important; }

          /* Primary card: stack left/right panels */
          .ce-primary-card-grid { grid-template-columns: 1fr !important; }
          .ce-primary-card-right { border-left: none !important; border-top: 1px solid rgba(201,169,97,0.12) !important; }

          /* List row: hide tags column on small screens */
          .ce-list-row-tags { display: none !important; }

          /* Judgment strip: 2-col on mobile */
          .ce-judgment-strip { grid-template-columns: 1fr 1fr !important; }
          .ce-judgment-stage:nth-child(odd)  { border-right: 1px solid rgba(201,169,97,0.12); }
          .ce-judgment-stage:nth-child(even) { border-right: none !important; }
          .ce-judgment-stage { border-bottom: 1px solid rgba(201,169,97,0.08); }
        }

        /* prefers-reduced-motion — fall back to static final states */
        @media (prefers-reduced-motion: reduce) {
          .ce-el-1, .ce-el-2, .ce-el-3, .ce-el-4 {
            opacity: 1;
            animation: none;
            transform: none;
          }
          .ce-primary-card { animation: none; }
          .ce-bar-fill     { animation: none; }
          .ce-bg-drift     { animation: none; }
          .ce-ambient-layer,
          .ce-trace-1, .ce-trace-2, .ce-trace-3,
          .ce-trace-4, .ce-trace-5, .ce-trace-6,
          .ce-dot-1, .ce-dot-2, .ce-dot-3, .ce-dot-4, .ce-dot-5,
          .ce-dot-6, .ce-dot-7, .ce-dot-8, .ce-dot-9, .ce-dot-10 {
            animation: none;
            opacity: 1;
          }
          .ce-context-panel { transition: none; }
          .ce-context-panel:hover { transform: none; }
        }
      `}</style>

      {/* Ambient gold light traces + scattered points — edge-only, never over text */}
      <div
        aria-hidden="true"
        className="ce-ambient-layer"
        style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}
      >
        <svg
          width="100%" height="100%"
          viewBox="0 0 1200 800"
          preserveAspectRatio="none"
          style={{ position: "absolute", inset: 0 }}
        >
          {/* ── Light traces — thin cubic bezier curves, hugging edges ── */}

          {/* Top-left corner arc */}
          <path className="ce-trace-1"
            d="M -10,42 C 50,-14 138,22 212,6"
            fill="none" stroke="#C9A961" strokeWidth="0.8" strokeOpacity="0.13" />

          {/* Top-right corner arc */}
          <path className="ce-trace-2"
            d="M 988,8 C 1058,-18 1142,26 1215,14"
            fill="none" stroke="#C9A961" strokeWidth="0.7" strokeOpacity="0.10" />

          {/* Left edge, lower sweep */}
          <path className="ce-trace-3"
            d="M -14,548 C 16,594 6,652 -14,722"
            fill="none" stroke="#C9A961" strokeWidth="0.7" strokeOpacity="0.10" />

          {/* Right edge, lower sweep */}
          <path className="ce-trace-4"
            d="M 1214,504 C 1194,572 1210,652 1216,742"
            fill="none" stroke="#C9A961" strokeWidth="0.6" strokeOpacity="0.09" />

          {/* Bottom-left sweep */}
          <path className="ce-trace-5"
            d="M 18,790 C 92,756 192,796 292,776"
            fill="none" stroke="#C9A961" strokeWidth="0.6" strokeOpacity="0.09" />

          {/* Bottom-right sweep */}
          <path className="ce-trace-6"
            d="M 908,776 C 1008,796 1112,756 1215,788"
            fill="none" stroke="#C9A961" strokeWidth="0.7" strokeOpacity="0.10" />

          {/* ── Scattered light points — low density, edges and corners ── */}

          {/* Top-left corner */}
          <circle className="ce-dot-1"  cx="44"   cy="70"  r="1.5" fill="#C9A961" fillOpacity="0.18" />
          {/* Top-right corner */}
          <circle className="ce-dot-2"  cx="1156" cy="46"  r="1.2" fill="#EEF3FA" fillOpacity="0.10" />
          {/* Left edge, upper-mid */}
          <circle className="ce-dot-3"  cx="22"   cy="262" r="1.3" fill="#C9A961" fillOpacity="0.12" />
          {/* Right edge, upper-mid */}
          <circle className="ce-dot-4"  cx="1178" cy="214" r="1.5" fill="#C9A961" fillOpacity="0.14" />
          {/* Left edge, lower */}
          <circle className="ce-dot-5"  cx="18"   cy="524" r="1.1" fill="#EEF3FA" fillOpacity="0.07" />
          {/* Right edge, lower */}
          <circle className="ce-dot-6"  cx="1182" cy="492" r="1.3" fill="#C9A961" fillOpacity="0.11" />
          {/* Bottom-left area */}
          <circle className="ce-dot-7"  cx="76"   cy="732" r="1.0" fill="#EEF3FA" fillOpacity="0.06" />
          {/* Bottom, left-of-center */}
          <circle className="ce-dot-8"  cx="312"  cy="764" r="1.2" fill="#C9A961" fillOpacity="0.09" />
          {/* Bottom, right-of-center */}
          <circle className="ce-dot-9"  cx="888"  cy="770" r="1.0" fill="#EEF3FA" fillOpacity="0.06" />
          {/* Bottom-right area */}
          <circle className="ce-dot-10" cx="1124" cy="742" r="1.4" fill="#C9A961" fillOpacity="0.13" />
        </svg>
      </div>

      {/* Slow ambient navy lift — drifts behind all content */}
      <div
        aria-hidden="true"
        className="ce-bg-drift"
        style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse 88% 54% at 50% 22%, rgba(8,18,40,0.52) 0%, transparent 68%)",
        }}
      />

      {/* All content sits above the drift layer */}
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
              {/* Primary signal card — stagger 3 */}
              {primary && (
                <div className="ce-el-3" style={{ marginBottom: 44 }}>
                  <SignalWithContext primarySignal={<PrimarySignalCard signal={primary} />} />
                </div>
              )}

              {/* Secondary signals or quiet under-review state — stagger 4 */}
              <div className="ce-el-4">
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
                  <p
                    className="ce-under-review"
                    style={{
                      fontSize: 12, color: CE_MUTED, margin: 0,
                      letterSpacing: "0.01em", lineHeight: 1.6,
                      borderTop: `1px solid ${CE_FAINT}`, paddingTop: 20,
                    }}
                  >
                    More signals are under review. The gate decides when they are ready.
                  </p>
                )}
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
    let v2Signals: V2Signal[] = [];
    try {
      v2Signals = await fetchV2Signals();
    } catch {
      // render empty state on error
    }
    return <SignalIntelligenceLayout signals={v2Signals} />;
  }

  // V1 path (unchanged)
  let signals: SignalResult[]         = [];
  let convergences: ConvergenceResult[] = [];
  let fetchError: string | null       = null;

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
