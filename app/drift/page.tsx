"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import CENav from "../components/CENav";
import CEFooter from "../components/CEFooter";

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
};

type Summary = {
  total:                  number;
  critical:               number;
  decaying:               number;
  watch:                  number;
  healthy:                number;
  total_revenue_at_risk:  number;
  avg_drift_score:        number;
};

const LEVEL_COLOR: Record<DriftLevel, string> = {
  healthy:  "#4CAF82",
  watch:    "rgba(255,255,255,0.55)",
  decaying: "#E09A40",
  critical: "#E05A5A",
};

const LEVEL_BG: Record<DriftLevel, string> = {
  healthy:  "rgba(76,175,130,0.10)",
  watch:    "rgba(255,255,255,0.06)",
  decaying: "rgba(224,154,64,0.10)",
  critical: "rgba(224,90,90,0.12)",
};

function fmt(n: number) {
  return n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
    ? `$${(n / 1_000).toFixed(0)}K`
    : `$${n}`;
}

export default function DriftPage() {
  const inputRef  = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [summary,  setSummary]  = useState<Summary | null>(null);
  const [results,  setResults]  = useState<ScoreResult[]>([]);

  const runScore = async (file: File) => {
    setLoading(true);
    setError(null);
    setSummary(null);
    setResults([]);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/drift/csv-score", { method: "POST", body: fd });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? "Score failed");
      }
      const { summary: s, results: r } = await res.json() as { summary: Summary; results: ScoreResult[] };
      setSummary(s);
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

  const reset = () => { setSummary(null); setResults([]); setError(null); };

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
          grid-template-columns: 1fr 80px 100px 80px;
          gap: 12px;
          align-items: center;
          padding: 10px 14px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          font-size: 0.82rem;
          transition: background 120ms ease;
        }
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
          .ce-drift-wrap { padding: 40px 20px 64px !important; }
          .ce-stat-grid  { grid-template-columns: repeat(2,1fr) !important; }
          .ce-result-row { grid-template-columns: 1fr 60px !important; }
          .ce-result-row > *:nth-child(3),
          .ce-result-row > *:nth-child(4) { display: none; }
        }
      `}</style>

      <div style={{ background: P.bg, color: P.text, fontFamily: "system-ui, -apple-system, sans-serif", minHeight: "100vh" }}>
        <CENav />

        <div className="ce-drift-wrap" style={{ maxWidth: 1060, margin: "0 auto", padding: "56px 48px 80px" }}>

          {/* Page header */}
          <div className="ce-d1" style={{ marginBottom: 36 }}>
            <p style={{
              fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.44em",
              textTransform: "uppercase", color: P.gold, margin: "0 0 10px", fontFamily: "monospace",
            }}>
              Cognitive Empire — Drift Intelligence
            </p>
            <h1 style={{
              fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", fontWeight: 300,
              color: P.text, margin: "0 0 14px", letterSpacing: "-0.04em", lineHeight: 1.1,
            }}>
              Revenue Decay Detection
            </h1>
            <p style={{ fontSize: "0.95rem", color: P.muted, lineHeight: 1.7, maxWidth: 520, margin: 0 }}>
              Upload a pipeline CSV. Get a Drift Score per opportunity. No account, no pricing, no OAuth.
            </p>
          </div>

          {/* Divider */}
          <div className="ce-d1" style={{ height: 1, background: P.border, marginBottom: 32 }} />

          {!summary ? (
            <div className="ce-d2">
              {/* Drop zone */}
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
                  Required columns: id, value, probability, stage, last_activity_date, next_action, overdue_followup_count
                </p>
                <input ref={inputRef} type="file" accept=".csv" style={{ display: "none" }}
                  onChange={(e) => handleFiles(e.target.files)} />
              </div>

              {loading && (
                <p style={{ fontSize: "0.85rem", color: P.muted, marginTop: 20, textAlign: "center" }}>
                  Scoring opportunities…
                </p>
              )}
              {error && (
                <p style={{ fontSize: "0.85rem", color: P.red, marginTop: 16 }}>{error}</p>
              )}

              {/* Column reference */}
              <div style={{ marginTop: 24, padding: "16px 20px", background: P.panel, border: `1px solid ${P.border}` }}>
                <p style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: P.dim, margin: "0 0 10px" }}>
                  CSV Column Reference
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "6px 20px" }}>
                  {[
                    ["id",                    "Opportunity identifier"],
                    ["value",                 "Deal value (number)"],
                    ["probability",           "Win probability 0–100"],
                    ["stage",                 "Pipeline stage"],
                    ["last_activity_date",    "ISO date or YYYY-MM-DD"],
                    ["next_action",           "Text or blank if missing"],
                    ["overdue_followup_count","Number of overdue follow-ups"],
                  ].map(([col, desc]) => (
                    <div key={col} style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                      <code style={{ fontSize: "0.72rem", color: P.gold, fontFamily: "monospace", flexShrink: 0 }}>{col}</code>
                      <span style={{ fontSize: "0.75rem", color: P.muted }}>{desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="ce-d2">
              {/* Summary stat bar */}
              <div className="ce-stat-grid" style={{
                display: "grid", gridTemplateColumns: "repeat(5, 1fr)",
                gap: 12, marginBottom: 28,
              }}>
                {([
                  { label: "Critical",    value: summary.critical,  color: P.red  },
                  { label: "Decaying",    value: summary.decaying,  color: "#E09A40" },
                  { label: "Watch",       value: summary.watch,     color: "rgba(255,255,255,0.55)" },
                  { label: "Healthy",     value: summary.healthy,   color: "#4CAF82" },
                  { label: "Avg Score",   value: summary.avg_drift_score, color: P.gold },
                ] as const).map(({ label, value, color }) => (
                  <div key={label} style={{
                    background: P.panel, border: `1px solid ${P.borderMid}`,
                    borderTop: `2px solid ${color}`,
                    padding: "16px 14px",
                  }}>
                    <p style={{ fontSize: "1.6rem", fontWeight: 300, color, margin: "0 0 4px", lineHeight: 1 }}>
                      {value}
                    </p>
                    <p style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: P.dim, margin: 0 }}>
                      {label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Revenue at risk */}
              {summary.total_revenue_at_risk > 0 && (
                <div style={{
                  padding: "14px 20px", marginBottom: 24,
                  background: P.redSoft, border: `1px solid rgba(224,90,90,0.20)`,
                  display: "flex", alignItems: "center", gap: 12,
                }}>
                  <span style={{ fontSize: "1.4rem", fontWeight: 700, color: P.red }}>{fmt(summary.total_revenue_at_risk)}</span>
                  <p style={{ fontSize: "0.82rem", color: P.muted, margin: 0 }}>
                    estimated revenue at risk across {summary.critical + summary.decaying} critical/decaying opportunities
                  </p>
                </div>
              )}

              {/* Results table */}
              <div style={{ background: P.panel, border: `1px solid ${P.borderMid}` }}>
                {/* Table header */}
                <div className="ce-result-row" style={{
                  borderBottom: `1px solid ${P.border}`,
                  paddingTop: 8, paddingBottom: 8,
                }}>
                  <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: P.dim }}>Opportunity</span>
                  <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: P.dim }}>Score</span>
                  <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: P.dim }}>Level</span>
                  <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: P.dim }}>At Risk</span>
                </div>

                {results.slice(0, 100).map((r) => (
                  <div key={r.opportunity_id} className="ce-result-row">
                    <div>
                      <span style={{ color: P.text }}>{r.opportunity_id}</span>
                      {r.scoring_notes && (
                        <p style={{ fontSize: "0.72rem", color: P.dim, margin: "2px 0 0" }}>{r.scoring_notes}</p>
                      )}
                    </div>
                    <span style={{
                      fontFamily: "monospace", fontWeight: 700,
                      color: LEVEL_COLOR[r.drift_level],
                    }}>
                      {r.drift_score}
                    </span>
                    <span style={{
                      fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em",
                      textTransform: "uppercase", padding: "3px 8px",
                      background: LEVEL_BG[r.drift_level], color: LEVEL_COLOR[r.drift_level],
                      display: "inline-block",
                    }}>
                      {r.drift_level}
                    </span>
                    <span style={{ fontFamily: "monospace", color: r.revenue_at_risk > 0 ? P.red : P.dim }}>
                      {r.revenue_at_risk > 0 ? fmt(r.revenue_at_risk) : "—"}
                    </span>
                  </div>
                ))}
                {results.length > 100 && (
                  <p style={{ fontSize: "0.78rem", color: P.dim, padding: "10px 14px", margin: 0 }}>
                    Showing 100 of {results.length} rows.
                  </p>
                )}
              </div>

              {/* Actions */}
              <div style={{ marginTop: 28, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                <Link href="/work" className="ce-audit-cta" style={{
                  fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.16em",
                  textTransform: "uppercase", color: P.text,
                  border: `1px solid rgba(201,169,97,0.48)`,
                  background: "rgba(201,169,97,0.10)",
                  padding: "11px 24px", display: "inline-flex", alignItems: "center",
                }}>
                  Request Revenue Decay Audit →
                </Link>
                <button onClick={reset} style={{
                  fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.12em",
                  textTransform: "uppercase", color: P.muted,
                  border: `1px solid ${P.border}`, background: "transparent",
                  padding: "10px 18px", cursor: "pointer",
                  transition: "border-color 150ms ease",
                }}>
                  Upload another file
                </button>
              </div>
            </div>
          )}

          {/* Doctrine note */}
          <div className="ce-d3" style={{
            marginTop: 44, paddingTop: 20,
            borderTop: `1px solid ${P.border}`,
          }}>
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
