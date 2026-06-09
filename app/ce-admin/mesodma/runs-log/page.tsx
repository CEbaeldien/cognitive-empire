"use client";

import React, { useState, useEffect, useCallback } from "react";

const C = {
  bg:           "#09091c",
  panel:        "#0e0c1f",
  panelDark:    "#0c0b1e",
  border:       "#1c1a35",
  accent:       "#00E0FF",
  accentBg:     "rgba(0,224,255,0.08)",
  accentBorder: "rgba(0,224,255,0.25)",
  text:         "#f1f5f9",
  muted:        "#94a3b8",
  faint:        "#64748b",
  green:        "#4ade80",
  greenBg:      "rgba(74,222,128,0.10)",
  red:          "#f87171",
  redBg:        "rgba(248,113,113,0.10)",
  input:        "#0a0919",
} as const;

type Run = {
  id: string;
  raw_item_id: string;
  module_name: string;
  model_used: string | null;
  route: string | null;
  confidence: number | null;
  error_flag: boolean;
  input_snapshot: Record<string, unknown>;
  output_json: Record<string, unknown>;
  created_at: string;
};

function fmt(s: string) { return s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()); }
function pct(n: number | null | undefined) { return n == null ? "—" : `${Math.round(n * 100)}%`; }
function timeAgo(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 2) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function Badge({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <span style={{ padding: "3px 9px", borderRadius: 5, background: bg, color, fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

function ModuleBadge({ name }: { name: string }) {
  const isAnthropic = name === "doctrine_filter" || name === "skeptic_check";
  return (
    <Badge
      label={fmt(name)}
      bg={isAnthropic ? "rgba(139,92,246,0.12)" : C.accentBg}
      color={isAnthropic ? "#a78bfa" : C.accent}
    />
  );
}

const TD: React.CSSProperties = { padding: "11px 14px", verticalAlign: "middle", borderBottom: `1px solid ${C.border}` };
const btnBase: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 14px", borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "none" };

export default function RunsLogPage() {
  const [runs,       setRuns]      = useState<Run[]>([]);
  const [total,      setTotal]     = useState(0);
  const [loading,    setLoading]   = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [filterModule, setFilterModule] = useState("");
  const [filterError,  setFilterError]  = useState("");

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "100" });
    if (filterModule) params.set("module_name", filterModule);
    if (filterError === "errors_only") params.set("error_flag", "true");
    fetch(`/api/mesodma/runs?${params}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { setRuns(d.runs ?? []); setTotal(d.total ?? 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filterModule, filterError]);

  useEffect(() => { load(); }, [load]);

  const selStyle: React.CSSProperties = { padding: "6px 10px", borderRadius: 7, border: `1px solid ${C.border}`, background: C.input, color: C.text, fontSize: 12, outline: "none", cursor: "pointer" };

  const errorCount = runs.filter(r => r.error_flag).length;

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1400 }}>
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.5em", textTransform: "uppercase", color: C.faint, marginBottom: 4 }}>CE Admin · Mesodma</p>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: "-0.025em", margin: "0 0 4px" }}>
          Runs Log {total > 0 && <span style={{ fontSize: 14, color: C.muted, fontWeight: 700 }}>{total} total</span>}
          {errorCount > 0 && <span style={{ fontSize: 13, color: C.red, fontWeight: 700, marginLeft: 10 }}>{errorCount} errors in view</span>}
        </h1>
        <p style={{ fontSize: 12, color: C.faint, margin: 0 }}>Module-level execution log. Each row is one AI module call.</p>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        <select style={selStyle} value={filterModule} onChange={e => setFilterModule(e.target.value)}>
          <option value="">All modules</option>
          <option value="noise_flood_blocker">Noise Flood Blocker</option>
          <option value="evidence_structurer">Evidence Structurer</option>
          <option value="doctrine_filter">Doctrine Filter</option>
          <option value="skeptic_check">Skeptic Check</option>
        </select>
        <select style={selStyle} value={filterError} onChange={e => setFilterError(e.target.value)}>
          <option value="">All results</option>
          <option value="errors_only">Errors only</option>
        </select>
        <button onClick={load} style={{ ...btnBase, background: C.accentBg, color: C.accent, border: `1px solid ${C.accentBorder}` }}>
          Refresh
        </button>
      </div>

      {loading ? (
        <p style={{ color: C.faint, fontSize: 13, padding: "24px 0" }}>Loading…</p>
      ) : (
        <div style={{ borderRadius: 10, border: `1px solid ${C.border}`, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead style={{ background: C.panelDark, borderBottom: `1px solid ${C.border}` }}>
              <tr>
                {["Module", "Model", "Route", "Confidence", "Result", "Age", ""].map(h => (
                  <th key={h} style={{ padding: "9px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, letterSpacing: "0.35em", textTransform: "uppercase", color: C.faint, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {runs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "40px 20px", textAlign: "center", color: C.faint, fontSize: 13 }}>
                    No runs logged yet.
                  </td>
                </tr>
              ) : runs.map(run => {
                const isExpanded = expandedId === run.id;
                return (
                  <React.Fragment key={run.id}>
                    <tr style={{ background: C.panel }}>
                      <td style={TD}><ModuleBadge name={run.module_name} /></td>
                      <td style={TD}><span style={{ fontSize: 10, color: C.faint, fontFamily: "monospace" }}>{run.model_used ?? "—"}</span></td>
                      <td style={TD}><span style={{ fontSize: 11, color: C.muted }}>{run.route ?? "—"}</span></td>
                      <td style={TD}><span style={{ fontSize: 12, color: C.muted }}>{pct(run.confidence)}</span></td>
                      <td style={TD}>
                        {run.error_flag
                          ? <Badge label="error" bg={C.redBg}   color={C.red} />
                          : <Badge label="ok"    bg={C.greenBg} color={C.green} />
                        }
                      </td>
                      <td style={TD}><span style={{ fontSize: 11, color: C.faint }}>{timeAgo(run.created_at)}</span></td>
                      <td style={TD}>
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : run.id)}
                          style={{ ...btnBase, padding: "4px 10px", background: "transparent", border: `1px solid ${C.border}`, color: C.faint, fontSize: 11 }}
                        >
                          {isExpanded ? "Hide" : "Inspect"}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr style={{ background: C.panelDark }}>
                        <td colSpan={7} style={{ padding: "16px 20px" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                            <div>
                              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: C.faint, margin: "0 0 8px" }}>Input Snapshot</p>
                              <pre style={{ margin: 0, fontSize: 11, color: C.muted, background: C.input, border: `1px solid ${C.border}`, borderRadius: 7, padding: "10px 14px", overflow: "auto", maxHeight: 220, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                                {JSON.stringify(run.input_snapshot, null, 2)}
                              </pre>
                            </div>
                            <div>
                              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: C.faint, margin: "0 0 8px" }}>Output JSON</p>
                              <pre style={{ margin: 0, fontSize: 11, color: C.muted, background: C.input, border: `1px solid ${C.border}`, borderRadius: 7, padding: "10px 14px", overflow: "auto", maxHeight: 220, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                                {JSON.stringify(run.output_json, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {!loading && total > 100 && (
        <p style={{ marginTop: 10, fontSize: 11, color: C.faint }}>Showing 100 of {total} most recent runs.</p>
      )}
    </div>
  );
}
