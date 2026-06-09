"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

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
  yellow:       "#fbbf24",
  yellowBg:     "rgba(251,191,36,0.10)",
  red:          "#f87171",
  redBg:        "rgba(248,113,113,0.10)",
  orange:       "#fb923c",
  orangeBg:     "rgba(251,146,60,0.10)",
} as const;

type FPS = {
  id: string;
  domain: string;
  signal_potential: string;
  first_pass_signal: string | null;
  possible_constraint_shift: string | null;
  confidence: number | null;
  status: string;
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

function PotentialBadge({ v }: { v: string }) {
  if (v === "critical") return <Badge label="critical" bg="rgba(248,113,113,0.15)" color={C.red} />;
  if (v === "high")     return <Badge label="high"     bg={C.orangeBg}             color={C.orange} />;
  if (v === "medium")   return <Badge label="medium"   bg={C.yellowBg}             color={C.yellow} />;
  return <Badge label="low" bg="rgba(100,116,139,0.1)" color={C.faint} />;
}

function StatusBadge({ v }: { v: string }) {
  if (v === "ready_for_signal_intelligence") return <Badge label="ready"          bg={C.accentBg}  color={C.accent} />;
  if (v === "needs_more_sources")            return <Badge label="needs sources"  bg={C.yellowBg}  color={C.yellow} />;
  if (v === "needs_human_check")             return <Badge label="human check"   bg={C.orangeBg}  color={C.orange} />;
  if (v === "rejected_by_mesodma")           return <Badge label="rejected"      bg={C.redBg}     color={C.red} />;
  return <Badge label={fmt(v)} bg="rgba(100,116,139,0.1)" color={C.faint} />;
}

const TD: React.CSSProperties = { padding: "11px 14px", verticalAlign: "middle", borderBottom: `1px solid ${C.border}` };
const btnBase: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "none" };

export default function FirstPassSignalsPage() {
  const [signals,  setSignals]  = useState<FPS[]>([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [updating, setUpdating] = useState<Set<string>>(new Set());
  const [errors,   setErrors]   = useState<Map<string, string>>(new Map());

  const [filterStatus,    setFilterStatus]    = useState("");
  const [filterPotential, setFilterPotential] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "100" });
    if (filterStatus)    params.set("status",           filterStatus);
    if (filterPotential) params.set("signal_potential", filterPotential);
    fetch(`/api/mesodma/first-pass-signals?${params}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { setSignals(d.signals ?? []); setTotal(d.total ?? 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filterStatus, filterPotential]);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(id: string, status: string) {
    setUpdating(prev => new Set(prev).add(id));
    setErrors(prev => { const m = new Map(prev); m.delete(id); return m; });
    try {
      const res = await fetch("/api/mesodma/first-pass-signals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(d.error ?? `HTTP ${res.status}`);
      }
      setSignals(prev => prev.map(s => s.id === id ? { ...s, status } : s));
    } catch (e) {
      setErrors(prev => new Map(prev).set(id, e instanceof Error ? e.message : String(e)));
    } finally {
      setUpdating(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
  }

  const selStyle: React.CSSProperties = { padding: "6px 10px", borderRadius: 7, border: `1px solid ${C.border}`, background: "#0a0919", color: C.text, fontSize: 12, outline: "none", cursor: "pointer" };

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1400 }}>
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.5em", textTransform: "uppercase", color: C.faint, marginBottom: 4 }}>CE Admin · Mesodma</p>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: "-0.025em", margin: "0 0 4px" }}>
          First-Pass Signals {total > 0 && <span style={{ fontSize: 14, color: C.accent, fontWeight: 700 }}>{total}</span>}
        </h1>
        <p style={{ fontSize: 12, color: C.faint, margin: 0 }}>Human review queue. Promote promising signals, flag for more sources, or reject.</p>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        <select style={selStyle} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="ready_for_signal_intelligence">Ready</option>
          <option value="needs_more_sources">Needs Sources</option>
          <option value="needs_human_check">Human Check</option>
          <option value="rejected_by_mesodma">Rejected</option>
        </select>
        <select style={selStyle} value={filterPotential} onChange={e => setFilterPotential(e.target.value)}>
          <option value="">All potentials</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <button onClick={load} style={{ ...btnBase, padding: "6px 14px", background: C.accentBg, color: C.accent, border: `1px solid ${C.accentBorder}` }}>
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
                {["Domain", "Potential", "First-Pass Signal", "Constraint Shift", "Confidence", "Status", "Age", "Actions"].map(h => (
                  <th key={h} style={{ padding: "9px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, letterSpacing: "0.35em", textTransform: "uppercase", color: C.faint, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {signals.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: "40px 20px", textAlign: "center", color: C.faint, fontSize: 13 }}>
                    No first-pass signals found.
                  </td>
                </tr>
              ) : signals.map(s => {
                const busy = updating.has(s.id);
                const err  = errors.get(s.id);
                return (
                  <tr key={s.id} style={{ background: C.panel }}>
                    <td style={TD}><span style={{ fontSize: 11, color: C.muted }}>{s.domain ? fmt(s.domain) : "—"}</span></td>
                    <td style={TD}><PotentialBadge v={s.signal_potential} /></td>
                    <td style={{ ...TD, maxWidth: 320 }}>
                      <p style={{ margin: 0, fontSize: 12, color: C.text, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>
                        {s.first_pass_signal ?? <em style={{ color: C.faint }}>—</em>}
                      </p>
                    </td>
                    <td style={{ ...TD, maxWidth: 200 }}>
                      <p style={{ margin: 0, fontSize: 11, color: C.faint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {s.possible_constraint_shift ?? "—"}
                      </p>
                    </td>
                    <td style={TD}><span style={{ fontSize: 12, color: C.muted }}>{pct(s.confidence)}</span></td>
                    <td style={TD}><StatusBadge v={s.status} /></td>
                    <td style={TD}><span style={{ fontSize: 11, color: C.faint }}>{timeAgo(s.created_at)}</span></td>
                    <td style={{ ...TD, whiteSpace: "nowrap" }}>
                      {err && <p style={{ margin: "0 0 4px", fontSize: 10, color: C.red }}>{err}</p>}
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                        <Link
                          href="/ce-admin/signals/new"
                          style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: C.greenBg, color: C.green, border: `1px solid rgba(74,222,128,0.2)` }}
                        >
                          Promote →
                        </Link>
                        {s.status !== "needs_more_sources" && (
                          <button
                            onClick={() => updateStatus(s.id, "needs_more_sources")}
                            disabled={busy}
                            style={{ ...btnBase, background: C.yellowBg, color: C.yellow, border: `1px solid rgba(251,191,36,0.2)`, opacity: busy ? 0.6 : 1 }}
                          >
                            Needs Sources
                          </button>
                        )}
                        {s.status !== "rejected_by_mesodma" && (
                          <button
                            onClick={() => updateStatus(s.id, "rejected_by_mesodma")}
                            disabled={busy}
                            style={{ ...btnBase, background: C.redBg, color: C.red, border: `1px solid rgba(248,113,113,0.2)`, opacity: busy ? 0.6 : 1 }}
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
