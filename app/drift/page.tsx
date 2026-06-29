"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import CENav from "../components/CENav";
import CEFooter from "../components/CEFooter";
import type { CsvHealth } from "../api/drift/csv-score/route";

const P = {
  bg:         "#03050A",
  panel:      "#0A1221",
  panelDeep:  "#060C18",
  border:     "rgba(255,255,255,0.07)",
  borderMid:  "rgba(255,255,255,0.10)",
  text:       "#EEF3FA",
  muted:      "#7A8DA6",
  dim:        "#4A5A70",
  gold:       "#C9A961",
  goldSoft:   "rgba(201,169,97,0.09)",
  goldBorder: "rgba(201,169,97,0.30)",
  goldDim:    "rgba(201,169,97,0.18)",
  red:        "#E05A5A",
  redSoft:    "rgba(224,90,90,0.10)",
  green:      "#4CAF82",
  amber:      "#E09A40",
} as const;

type DriftLevel = "healthy" | "watch" | "decaying" | "critical";

type ScoreResult = {
  opportunity_id:           string;
  drift_score:              number;
  drift_level:              DriftLevel;
  revenue_at_risk:          number;
  days_since_last_activity: number;
  has_missing_next_action:  boolean;
  has_overdue_followup:     boolean;
  scoring_notes:            string;
  recommended_action:       string;
};

type Summary = {
  total:                 number;
  critical:              number;
  decaying:              number;
  watch:                 number;
  healthy:               number;
  total_revenue_at_risk: number;
  avg_drift_score:       number;
};

const LEVEL_COLOR: Record<DriftLevel, string> = {
  healthy:  P.green,
  watch:    "rgba(255,255,255,0.55)",
  decaying: P.amber,
  critical: P.red,
};
const LEVEL_BG: Record<DriftLevel, string> = {
  healthy:  "rgba(76,175,130,0.10)",
  watch:    "rgba(255,255,255,0.06)",
  decaying: "rgba(224,154,64,0.10)",
  critical: "rgba(224,90,90,0.12)",
};

function fmt(n: number) {
  return n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M`
       : n >= 1_000     ? `$${(n / 1_000).toFixed(0)}K`
       : `$${n}`;
}

// ── Finding card (module-level for stable identity) ──────────────────────────
function FindingCard({ r, hasValue, hasOwner }: { r: ScoreResult; hasValue: boolean; hasOwner: boolean }) {
  const lc = LEVEL_COLOR[r.drift_level];
  const missingParts: string[] = [];
  if (!hasValue)               missingParts.push("value");
  if (!hasOwner)               missingParts.push("owner");
  if (r.has_missing_next_action) missingParts.push("next action");

  return (
    <div style={{
      background: P.panel,
      border: `1px solid ${P.border}`,
      borderLeft: `3px solid ${lc}`,
      padding: "16px 18px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between" as const, alignItems: "flex-start", marginBottom: 8 }}>
        <p style={{ fontSize: "0.88rem", color: P.text, margin: 0, fontWeight: 500, lineHeight: 1.3 }}>
          {r.opportunity_id}
        </p>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0, marginLeft: 16 }}>
          <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "1rem", color: lc }}>{r.drift_score}</span>
          <span style={{
            fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const,
            padding: "2px 8px", background: LEVEL_BG[r.drift_level], color: lc,
          }}>{r.drift_level}</span>
        </div>
      </div>

      {r.scoring_notes && (
        <p style={{ fontSize: "0.78rem", color: P.muted, margin: "0 0 8px", lineHeight: 1.5 }}>
          {r.scoring_notes}
        </p>
      )}

      <p style={{ fontSize: "0.78rem", color: P.gold, margin: "0 0 10px", lineHeight: 1.5 }}>
        → {r.recommended_action}
      </p>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" as const, alignItems: "center" }}>
        {hasValue ? (
          r.revenue_at_risk > 0
            ? <span style={{ fontSize: "0.78rem", color: P.red, fontFamily: "monospace", fontWeight: 600 }}>{fmt(r.revenue_at_risk)} at risk</span>
            : <span style={{ fontSize: "0.75rem", color: P.muted }}>$0 exposure</span>
        ) : (
          <span style={{ fontSize: "0.72rem", color: P.dim }}>Value missing — add amount/value column</span>
        )}
        {missingParts.length > 0 && (
          <span style={{ fontSize: "0.68rem", color: P.dim }}>Missing: {missingParts.join(", ")}</span>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DriftPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver,   setDragOver]   = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [summary,    setSummary]    = useState<Summary | null>(null);
  const [results,    setResults]    = useState<ScoreResult[]>([]);
  const [csvHealth,  setCsvHealth]  = useState<CsvHealth | null>(null);
  const [showAll,    setShowAll]    = useState(false);

  const runScore = async (file: File) => {
    setLoading(true);
    setError(null);
    setSummary(null);
    setResults([]);
    setCsvHealth(null);
    setShowAll(false);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/drift/csv-score", { method: "POST", body: fd });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? "Score failed");
      }
      const { summary: s, csv_health: h, results: r } = await res.json() as {
        summary: Summary; csv_health: CsvHealth; results: ScoreResult[];
      };
      setSummary(s);
      setCsvHealth(h);
      setResults(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleFiles = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const file = list[0];
    if (!file.name.endsWith(".csv")) { setError("Only CSV files are supported."); return; }
    runScore(file);
  };

  const reset = () => { setSummary(null); setResults([]); setError(null); setCsvHealth(null); setShowAll(false); };

  const sLbl: React.CSSProperties = {
    fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.28em",
    textTransform: "uppercase", color: P.dim, margin: "0 0 12px",
  };
  const hCell: React.CSSProperties = {
    fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.22em",
    textTransform: "uppercase", color: P.dim,
  };

  return (
    <>
      <style>{`
        @keyframes ceReveal {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ce-d1 { opacity: 0; animation: ceReveal 280ms cubic-bezier(0.25,0.1,0.25,1.0)  60ms forwards; }
        .ce-d2 { opacity: 0; animation: ceReveal 280ms cubic-bezier(0.25,0.1,0.25,1.0) 120ms forwards; }
        .ce-d3 { opacity: 0; animation: ceReveal 280ms cubic-bezier(0.25,0.1,0.25,1.0) 180ms forwards; }

        .ce-drop-zone {
          cursor: pointer;
          border: 1px dashed rgba(255,255,255,0.12);
          background: rgba(6,12,24,0.6);
          transition: border-color 160ms ease, background 160ms ease;
        }
        .ce-drop-zone:hover, .ce-drop-zone.dragover {
          border-color: rgba(201,169,97,0.40);
          background: rgba(201,169,97,0.04);
        }

        .ce-result-row {
          display: grid;
          grid-template-columns: 1fr 72px 96px 80px;
          gap: 12px;
          align-items: center;
          padding: 10px 14px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          font-size: 0.82rem;
          transition: background 120ms ease;
        }
        .ce-result-row:last-child { border-bottom: none; }
        .ce-result-row:hover { background: rgba(255,255,255,0.02); }

        .ce-audit-cta {
          transition: background 160ms ease, border-color 160ms ease;
          text-decoration: none;
        }
        .ce-audit-cta:hover {
          background: rgba(201,169,97,0.20) !important;
          border-color: rgba(201,169,97,0.70) !important;
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation: none !important; transition: none !important; }
          .ce-d1,.ce-d2,.ce-d3 { opacity: 1; transform: none; }
        }

        @media (max-width: 768px) {
          .ce-drift-wrap  { padding: 40px 20px 64px !important; }
          .ce-stat-grid   { grid-template-columns: repeat(3,1fr) !important; }
          .ce-result-row  { grid-template-columns: 1fr 60px !important; }
          .ce-result-row > *:nth-child(3),
          .ce-result-row > *:nth-child(4) { display: none; }
        }

        @media (max-width: 480px) {
          .ce-stat-grid { grid-template-columns: repeat(2,1fr) !important; }
        }
      `}</style>

      <div style={{ background: P.bg, color: P.text, fontFamily: "system-ui, -apple-system, sans-serif", minHeight: "100vh" }}>
        <CENav />

        <div className="ce-drift-wrap" style={{ maxWidth: 1060, margin: "0 auto", padding: "56px 48px 80px" }}>

          {/* Page header */}
          <div className="ce-d1" style={{ marginBottom: 36 }}>
            <p style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.44em", textTransform: "uppercase", color: P.gold, margin: "0 0 10px", fontFamily: "monospace" }}>
              Cognitive Empire — Drift Intelligence
            </p>
            <h1 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", fontWeight: 300, color: P.text, margin: "0 0 14px", letterSpacing: "-0.04em", lineHeight: 1.1 }}>
              Revenue Decay Detection
            </h1>
            <p style={{ fontSize: "0.95rem", color: P.muted, lineHeight: 1.7, maxWidth: 520, margin: 0 }}>
              Upload a pipeline CSV. Get a Drift Score per opportunity. No account, no pricing, no OAuth.
            </p>
          </div>

          <div className="ce-d1" style={{ height: 1, background: P.border, marginBottom: 32 }} />

          {/* ── Pre-upload ─────────────────────────────────────────────────────── */}
          {!summary ? (
            <div className="ce-d2">
              <div
                className={`ce-drop-zone${dragOver ? " dragover" : ""}`}
                style={{ padding: "52px 32px", textAlign: "center", borderRadius: 4 }}
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                  stroke="rgba(201,169,97,0.50)" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"
                  style={{ display: "block", margin: "0 auto 14px" }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <p style={{ fontSize: "0.95rem", color: P.text, margin: "0 0 6px" }}>
                  Drop CSV here or <span style={{ color: P.gold }}>click to browse</span>
                </p>
                <p style={{ fontSize: "0.78rem", color: P.dim, margin: 0 }}>
                  Any CRM export works — flexible column detection
                </p>
                <input ref={inputRef} type="file" accept=".csv" style={{ display: "none" }}
                  onChange={(e) => handleFiles(e.target.files)} />
              </div>

              {loading && (
                <p style={{ fontSize: "0.85rem", color: P.muted, marginTop: 20, textAlign: "center" }}>
                  Scanning opportunities…
                </p>
              )}
              {error && (
                <p style={{ fontSize: "0.85rem", color: P.red, marginTop: 16 }}>{error}</p>
              )}

              {/* Column reference */}
              <div style={{ marginTop: 24, padding: "16px 20px", background: P.panel, border: `1px solid ${P.border}` }}>
                <p style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: P.dim, margin: "0 0 10px" }}>
                  Recognised Column Names
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "6px 20px" }}>
                  {([
                    ["opportunity / opportunity_name / deal / name / company / account", "Opportunity identifier"],
                    ["value / amount / deal_value / arr / revenue",                      "Deal value (number)"],
                    ["probability / close_probability / win_rate",                       "Win probability 0–100"],
                    ["stage / deal_stage / pipeline_stage",                              "Pipeline stage"],
                    ["last_activity_date / last_activity / last_contact",                "Last activity (ISO date)"],
                    ["next_action / next_step / follow_up",                              "Next action text"],
                    ["owner / owner_name / assigned_to / rep",                           "Deal owner"],
                    ["overdue_followup_count / overdue_count",                           "Overdue follow-up count"],
                  ] as [string, string][]).map(([col, desc]) => (
                    <div key={col} style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                      <code style={{ fontSize: "0.68rem", color: P.gold, fontFamily: "monospace", flexShrink: 0, lineHeight: 1.6 }}>{col}</code>
                      <span style={{ fontSize: "0.72rem", color: P.muted }}>{desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          ) : (
            /* ── Post-upload ─────────────────────────────────────────────────── */
            <div className="ce-d2">

              {/* ── 1. Scan Summary ─────────────────────────────────────────── */}
              <div style={{ marginBottom: 28 }}>
                <p style={sLbl}>Scan Summary</p>
                <div className="ce-stat-grid" style={{
                  display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, marginBottom: 16,
                }}>
                  {([
                    { label: "Scanned",   value: summary.total,           color: P.text },
                    { label: "Critical",  value: summary.critical,        color: P.red  },
                    { label: "Decaying",  value: summary.decaying,        color: P.amber },
                    { label: "Watch",     value: summary.watch,           color: "rgba(255,255,255,0.55)" },
                    { label: "Healthy",   value: summary.healthy,         color: P.green },
                    { label: "Avg Score", value: summary.avg_drift_score, color: P.gold  },
                  ] as const).map(({ label, value, color }) => (
                    <div key={label} style={{
                      background: P.panel, border: `1px solid ${P.borderMid}`,
                      borderTop: `2px solid ${color}`, padding: "14px 12px",
                    }}>
                      <p style={{ fontSize: "1.5rem", fontWeight: 300, color, margin: "0 0 4px", lineHeight: 1 }}>{value}</p>
                      <p style={{ fontSize: "0.56rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: P.dim, margin: 0 }}>{label}</p>
                    </div>
                  ))}
                </div>

                {/* Revenue exposure */}
                {csvHealth?.has_value ? (
                  summary.total_revenue_at_risk > 0 ? (
                    <div style={{
                      padding: "12px 18px", background: P.redSoft,
                      border: `1px solid rgba(224,90,90,0.20)`,
                      display: "flex", alignItems: "center", gap: 12,
                    }}>
                      <span style={{ fontSize: "1.3rem", fontWeight: 700, color: P.red }}>{fmt(summary.total_revenue_at_risk)}</span>
                      <span style={{ fontSize: "0.82rem", color: P.muted }}>
                        estimated revenue at risk across {summary.critical + summary.decaying} critical/decaying opportunities
                      </span>
                    </div>
                  ) : (
                    <p style={{ fontSize: "0.82rem", color: P.green, margin: 0 }}>No revenue exposure detected.</p>
                  )
                ) : (
                  <p style={{ fontSize: "0.8rem", color: P.dim, margin: 0 }}>
                    Revenue exposure unavailable — add an{" "}
                    <code style={{ color: P.gold, fontFamily: "monospace" }}>amount</code> or{" "}
                    <code style={{ color: P.gold, fontFamily: "monospace" }}>value</code> column to estimate exposure.
                  </p>
                )}
              </div>

              {/* ── 2. CSV Health ────────────────────────────────────────────── */}
              {csvHealth && (
                <div style={{ marginBottom: 28, padding: "16px 18px", background: P.panel, border: `1px solid ${P.border}` }}>
                  <p style={sLbl}>CSV Input Quality</p>
                  <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8, marginBottom: 14 }}>
                    {([
                      { label: "Opportunity Name", ok: csvHealth.has_name },
                      { label: "Deal Value",       ok: csvHealth.has_value },
                      { label: "Owner",            ok: csvHealth.has_owner },
                      { label: "Last Activity",    ok: csvHealth.has_last_activity },
                      { label: "Next Action",      ok: csvHealth.has_next_action },
                      { label: "Stage",            ok: csvHealth.has_stage },
                      { label: "Probability",      ok: csvHealth.has_probability },
                    ] as const).map(({ label, ok }) => (
                      <span key={label} style={{
                        fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.06em",
                        padding: "4px 10px",
                        border: `1px solid ${ok ? "rgba(76,175,130,0.30)" : P.border}`,
                        color: ok ? P.green : P.dim,
                        background: ok ? "rgba(76,175,130,0.06)" : "transparent",
                      }}>
                        {ok ? "✓" : "—"} {label}
                      </span>
                    ))}
                  </div>
                  <p style={{ fontSize: "0.8rem", margin: 0 }}>
                    <span style={{
                      fontWeight: 700, marginRight: 8,
                      color: csvHealth.confidence === "good" ? P.green
                           : csvHealth.confidence === "partial" ? P.amber
                           : P.red,
                    }}>
                      {csvHealth.confidence === "good"    ? "Good input quality"
                       : csvHealth.confidence === "partial" ? "Partial input quality"
                       : "Data-limited scan"}
                    </span>
                    <span style={{ color: P.dim }}>
                      {csvHealth.confidence === "good"
                        ? "Scoring reflects strong field coverage."
                        : csvHealth.confidence === "partial"
                        ? "Scoring is approximate. Add missing fields for sharper results."
                        : "Critical fields absent. Add last_activity_date, next_action, value, owner, and stage."}
                    </span>
                  </p>
                </div>
              )}

              {/* ── 3. Top Decay Findings ────────────────────────────────────── */}
              {(() => {
                const findings = [...results]
                  .filter(r => r.drift_level !== "healthy")
                  .sort((a, b) => b.drift_score - a.drift_score)
                  .slice(0, 10);

                return (
                  <div style={{ marginBottom: 28 }}>
                    <p style={sLbl}>Top Decay Findings</p>

                    {csvHealth?.data_limited && findings.length > 0 && (
                      <div style={{
                        padding: "10px 14px", marginBottom: 14,
                        background: "rgba(224,154,64,0.07)", border: "1px solid rgba(224,154,64,0.20)",
                      }}>
                        <p style={{ fontSize: "0.78rem", color: P.amber, margin: 0, lineHeight: 1.5 }}>
                          Data-limited scores — Add{" "}
                          <code style={{ fontFamily: "monospace" }}>last_activity_date</code>,{" "}
                          <code style={{ fontFamily: "monospace" }}>next_action</code>,{" "}
                          <code style={{ fontFamily: "monospace" }}>value</code>, and{" "}
                          <code style={{ fontFamily: "monospace" }}>stage</code> columns for sharper scoring.
                        </p>
                      </div>
                    )}

                    {findings.length === 0 ? (
                      <div style={{
                        padding: "24px", background: P.panel, border: `1px solid ${P.border}`,
                        textAlign: "center",
                      }}>
                        <p style={{ fontSize: "0.85rem", color: P.green, margin: 0 }}>
                          No significant decay detected — pipeline looks healthy across all scanned opportunities.
                        </p>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {findings.map((r, i) => (
                          <FindingCard
                            key={r.opportunity_id + i}
                            r={r}
                            hasValue={csvHealth?.has_value ?? false}
                            hasOwner={csvHealth?.has_owner ?? false}
                          />
                        ))}
                        {results.filter(r => r.drift_level !== "healthy").length > 10 && (
                          <p style={{ fontSize: "0.75rem", color: P.dim, margin: "4px 0 0", textAlign: "center" }}>
                            Showing top 10 findings. See full table below for all results.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* ── 4. Full Parsed Rows ──────────────────────────────────────── */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ display: "flex", justifyContent: "space-between" as const, alignItems: "center", marginBottom: 10 }}>
                  <p style={{ ...sLbl, margin: 0 }}>All Parsed Rows ({results.length})</p>
                  <button
                    onClick={() => setShowAll(v => !v)}
                    style={{
                      fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" as const,
                      color: P.muted, background: "none", border: `1px solid ${P.border}`,
                      padding: "4px 12px", cursor: "pointer", transition: "border-color 150ms ease",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = P.borderMid; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = P.border; }}
                  >
                    {showAll ? "Collapse ↑" : `Expand ↓`}
                  </button>
                </div>

                {showAll && (
                  <div style={{ background: P.panel, border: `1px solid ${P.borderMid}` }}>
                    <div className="ce-result-row" style={{ borderBottom: `1px solid ${P.border}`, paddingTop: 8, paddingBottom: 8 }}>
                      <span style={hCell}>Opportunity</span>
                      <span style={hCell}>Score</span>
                      <span style={hCell}>Level</span>
                      <span style={hCell}>At Risk</span>
                    </div>
                    {results.map((r, i) => (
                      <div key={r.opportunity_id + i} className="ce-result-row">
                        <div>
                          <span style={{ color: P.text }}>{r.opportunity_id}</span>
                          {r.scoring_notes && (
                            <p style={{ fontSize: "0.7rem", color: P.dim, margin: "2px 0 0", lineHeight: 1.4 }}>{r.scoring_notes}</p>
                          )}
                        </div>
                        <span style={{ fontFamily: "monospace", fontWeight: 700, color: LEVEL_COLOR[r.drift_level] }}>
                          {r.drift_score}
                        </span>
                        <span style={{
                          fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em",
                          textTransform: "uppercase" as const, padding: "2px 7px",
                          background: LEVEL_BG[r.drift_level], color: LEVEL_COLOR[r.drift_level],
                          display: "inline-block",
                        }}>
                          {r.drift_level}
                        </span>
                        <span style={{ fontFamily: "monospace", color: r.revenue_at_risk > 0 ? P.red : P.dim }}>
                          {r.revenue_at_risk > 0
                            ? fmt(r.revenue_at_risk)
                            : csvHealth?.has_value ? "—" : "N/A"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── 5. CTA ──────────────────────────────────────────────────── */}
              <div style={{
                padding: "24px 28px", marginBottom: 28,
                background: P.panelDeep,
                border: `1px solid ${P.goldBorder}`,
                borderTop: `2px solid ${P.gold}`,
              }}>
                <p style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", color: P.gold, margin: "0 0 10px" }}>
                  Want the full Drift workflow?
                </p>
                <p style={{ fontSize: "0.92rem", color: P.muted, lineHeight: 1.65, margin: "0 0 20px", maxWidth: 520 }}>
                  The public scanner identifies decay. The full Drift dashboard turns decay into weekly intervention discipline.
                </p>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" as const, alignItems: "center" }}>
                  <Link href="/work" className="ce-audit-cta" style={{
                    fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.16em",
                    textTransform: "uppercase", color: P.text,
                    border: `1px solid rgba(201,169,97,0.48)`,
                    background: "rgba(201,169,97,0.10)",
                    padding: "11px 24px", display: "inline-flex", alignItems: "center",
                  }}>
                    Request Revenue Discipline Audit →
                  </Link>
                  <span style={{
                    fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase",
                    color: P.dim, border: `1px solid ${P.border}`, padding: "10px 16px",
                  }}>
                    Drift Dashboard — Coming Soon
                  </span>
                  <button onClick={reset} style={{
                    fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.12em",
                    textTransform: "uppercase", color: P.muted,
                    border: `1px solid ${P.border}`, background: "transparent",
                    padding: "10px 16px", cursor: "pointer", transition: "border-color 150ms ease",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = P.borderMid; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = P.border; }}
                  >
                    Upload another file
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* Doctrine note */}
          <div className="ce-d3" style={{ marginTop: 44, paddingTop: 20, borderTop: `1px solid ${P.border}` }}>
            <p style={{ fontSize: "0.75rem", color: P.dim, lineHeight: 1.7, margin: 0 }}>
              <span style={{ color: P.gold }}>Drift Intelligence</span> scores every open opportunity on inactivity, missing next actions, overdue follow-up, stage risk, and deal value. Decay is structural — not a data quality problem.
            </p>
          </div>

        </div>

        <CEFooter />
      </div>
    </>
  );
}
