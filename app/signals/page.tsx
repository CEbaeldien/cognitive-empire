import { createClient } from "@supabase/supabase-js";
import CENav from "@/app/components/CENav";
import type { SignalCategory } from "@/types/signals";

// ── Supabase (service role — server component) ────────────────────────────────

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// ── Local types ───────────────────────────────────────────────────────────────

type VectorRef = { id: string; name: string };

type SignalResult = {
  id: string;
  title: string;
  category: SignalCategory;
  subcategory: string | null;
  summary: string;
  why_it_matters: string | null;
  second_order_effect: string | null;
  impact_layer: unknown; // JSONB in DB — guard before use
  published_at: string | null;
  signal_scores: Array<{ final_score: number }>;
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
  impact_layer: unknown; // JSONB in DB — guard before use
  published_at: string | null;
  convergence_doctrine_vectors: Array<{ doctrine_vectors: VectorRef | null }>;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<SignalCategory, string> = {
  intelligence:               "Intelligence",
  physical_systems:           "Physical Systems",
  infrastructure:             "Infrastructure",
  energy:                     "Energy",
  science_frontier:           "Science Frontier",
  governance_stability:       "Governance Stability",
  markets_human_prosperity:   "Markets & Human Prosperity",
  resources_continuity:       "Resources Continuity",
};

const CATEGORY_ORDER: SignalCategory[] = [
  "intelligence",
  "physical_systems",
  "infrastructure",
  "energy",
  "science_frontier",
  "governance_stability",
  "markets_human_prosperity",
  "resources_continuity",
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

function getFinalScore(s: SignalResult): number {
  return s.signal_scores[0]?.final_score ?? 0;
}

// Score is 0–100; thresholds proportional to spec's 0–10 notation
function scoreBadgeStyle(score: number): { bg: string; text: string; border: string } {
  if (score >= 80) return { bg: "rgba(239,68,68,0.12)",  text: "#f87171",  border: "rgba(239,68,68,0.3)"  };
  if (score >= 60) return { bg: "rgba(245,158,11,0.12)", text: "#fbbf24",  border: "rgba(245,158,11,0.3)" };
  if (score >= 40) return { bg: "rgba(0,224,255,0.10)",  text: "#00E0FF",  border: "rgba(0,224,255,0.3)"  };
  return           { bg: "rgba(100,116,139,0.12)",        text: "#94a3b8",  border: "rgba(100,116,139,0.3)" };
}

// ── Data fetching ─────────────────────────────────────────────────────────────

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

// ── Sub-components ────────────────────────────────────────────────────────────

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
  const score       = getFinalScore(signal);
  const pressures   = signal.signal_pressure_vectors
    .map((r) => r.pressure_vectors)
    .filter((v): v is VectorRef => v !== null)
    .slice(0, 4);
  const doctrines   = signal.signal_doctrine_vectors
    .map((r) => r.doctrine_vectors)
    .filter((v): v is VectorRef => v !== null)
    .slice(0, 3);
  const impacts     = getImpactLayers(signal.impact_layer).slice(0, 3);
  const sourceUrl   = signal.raw_items?.url ?? null;

  return (
    <article
      className="rounded-xl p-6 flex flex-col gap-5"
      style={{ background: "#0d0d1a", border: "1px solid #1c1a35" }}
    >
      {/* Header row */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {signal.subcategory && <Tag>{signal.subcategory}</Tag>}
          <ScoreBadge score={score} />
        </div>
        {sourceUrl && (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-medium transition-colors hover:text-[#00E0FF]"
            style={{ color: "#475569" }}
          >
            Source ↗
          </a>
        )}
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold leading-snug" style={{ color: "#f1f5f9" }}>
        {signal.title}
      </h3>

      {/* Summary */}
      <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>
        {signal.summary}
      </p>

      {/* Why it matters */}
      {signal.why_it_matters && (
        <div>
          <SectionLabel>Why it matters</SectionLabel>
          <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "#64748b" }}>
            {truncateSentences(signal.why_it_matters, 2)}
          </p>
        </div>
      )}

      {/* Tags row */}
      {(pressures.length > 0 || doctrines.length > 0 || impacts.length > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {pressures.map((v) => <Tag key={v.id}>{v.name}</Tag>)}
          {doctrines.map((v) => <Tag key={v.id} accent>{v.name}</Tag>)}
          {impacts.map((layer) => <Tag key={layer}>{layer}</Tag>)}
        </div>
      )}

      {/* Footer */}
      <p className="text-xs" style={{ color: "#334155" }}>
        Published {fmtDate(signal.published_at)}
      </p>
    </article>
  );
}

function ConvergenceCard({ c }: { c: ConvergenceResult }) {
  const doctrines = c.convergence_doctrine_vectors
    .map((r) => r.doctrine_vectors)
    .filter((v): v is VectorRef => v !== null)
    .slice(0, 3);
  const categories = (c.subcategories ?? []).slice(0, 4);
  const implications = truncateSentences(c.second_order_implications, 2);

  return (
    <article
      className="rounded-xl p-6 flex flex-col gap-5"
      style={{
        background: "rgba(0,224,255,0.02)",
        border: "1px solid rgba(0,224,255,0.15)",
      }}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2">
        {c.convergence_score !== null && (
          <ScoreBadge score={c.convergence_score} label="Convergence Score" />
        )}
        {categories.map((cat) => (
          <Tag key={cat} accent>
            {cat.replace(/_/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase())}
          </Tag>
        ))}
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold leading-snug" style={{ color: "#f1f5f9" }}>
        {c.title}
      </h3>

      {/* Summary */}
      <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>
        {c.summary}
      </p>

      {/* Second-order implications */}
      {implications && (
        <div>
          <SectionLabel>Second-order implications</SectionLabel>
          <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "#64748b" }}>
            {implications}
          </p>
        </div>
      )}

      {/* Doctrine vectors */}
      {doctrines.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {doctrines.map((v) => <Tag key={v.id} accent>{v.name}</Tag>)}
        </div>
      )}

      {/* Footer */}
      <p className="text-xs" style={{ color: "#334155" }}>
        Published {fmtDate(c.published_at)}
      </p>
    </article>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function SignalsPage() {
  let signals: SignalResult[] = [];
  let convergences: ConvergenceResult[] = [];
  let fetchError: string | null = null;

  try {
    [signals, convergences] = await Promise.all([fetchSignals(), fetchConvergences()]);
  } catch (err) {
    fetchError = err instanceof Error ? err.message : "Unknown error";
  }

  // Group signals by category; top 3 per category by final_score DESC
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

      <main
        className="min-h-screen"
        style={{ background: "#09091c", color: "#f1f5f9" }}
      >
        <div className="mx-auto max-w-5xl px-6 py-16">

          {/* ── Page header ─────────────────────────────────────────────────── */}
          <header className="mb-16">
            <p
              className="mb-3 text-xs font-semibold tracking-[0.35em] uppercase"
              style={{ color: "#00E0FF" }}
            >
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
            <div
              className="mb-10 rounded-lg px-5 py-4 text-sm"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}
            >
              {fetchError}
            </div>
          )}

          {/* ── Convergences ─────────────────────────────────────────────────── */}
          <section className="mb-20">
            <div
              className="mb-6 pb-4"
              style={{ borderBottom: "1px solid #1c1a35" }}
            >
              <SectionLabel>Convergences</SectionLabel>
              <h2 className="mt-1 text-2xl font-semibold" style={{ color: "#f1f5f9" }}>
                Active Convergences
              </h2>
              <p className="mt-1 text-sm" style={{ color: "#475569" }}>
                When 2 or more signals activate the same doctrine law simultaneously.
              </p>
            </div>

            {convergences.length === 0 ? (
              <p className="text-sm" style={{ color: "#334155" }}>
                No convergences published yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {convergences.map((c) => <ConvergenceCard key={c.id} c={c} />)}
              </div>
            )}
          </section>

          {/* ── Signals by category ───────────────────────────────────────────── */}
          <section>
            <div
              className="mb-10 pb-4"
              style={{ borderBottom: "1px solid #1c1a35" }}
            >
              <SectionLabel>Signal Intelligence</SectionLabel>
              <h2 className="mt-1 text-2xl font-semibold" style={{ color: "#f1f5f9" }}>
                Signals by Category
              </h2>
              <p className="mt-1 text-sm" style={{ color: "#475569" }}>
                Top 3 per category by CE Signal Score. Updated after human review.
              </p>
            </div>

            {byCategory.length === 0 ? (
              <p className="text-sm" style={{ color: "#334155" }}>
                No signals published yet.
              </p>
            ) : (
              <div className="space-y-16">
                {byCategory.map(({ category, signals: catSignals }) => (
                  <div key={category}>
                    {/* Category header */}
                    <div className="mb-5 flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold" style={{ color: "#e2e8f0" }}>
                          {fmtCategory(category)}
                        </h3>
                      </div>
                      <span className="text-xs" style={{ color: "#334155" }}>
                        {catSignals.length} signal{catSignals.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* Signal cards */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {catSignals.map((s) => <SignalCard key={s.id} signal={s} />)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── Footer note ───────────────────────────────────────────────────── */}
          <footer
            className="mt-24 pt-8 text-center text-xs"
            style={{ borderTop: "1px solid #1c1a35", color: "#334155" }}
          >
            Signals are published after human review. No autopublish.
          </footer>
        </div>
      </main>
    </>
  );
}
