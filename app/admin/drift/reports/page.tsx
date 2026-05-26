"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

const S = {
  bg:     "#0b0f1c",
  panel:  "#0f1420",
  border: "#1a2035",
  text:   "#f1f5f9",
  muted:  "#94a3b8",
  faint:  "#64748b",
  blue:   "#3b82f6",
} as const;

function usd(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

type Report = {
  id: string; report_type: string; period_start: string; period_end: string;
  revenue_at_risk: number; revenue_protected: number; deals_at_risk: number;
  completed_interventions: number; dominant_drift_pattern: string | null;
  report_summary: string; created_at: string;
};

type Opp = {
  id: string; title: string; stage: string | null; value: number;
  score: { drift_level: string; drift_score: number; revenue_at_risk: number; scoring_notes: string | null } | null;
  accounts: { name: string } | null;
  interventions_status?: string;
};

const LEVEL_COLORS: Record<string, string> = {
  critical: "#f87171", decaying: "#fb923c", watch: "#fbbf24", healthy: "#4ade80",
};

function shortNote(notes: string | null | undefined): string {
  if (!notes) return "—";
  return notes.split(/\.\s+/)[0]?.replace(/\.$/, "").trim() ?? "—";
}

function exportLeakingCSV(opps: Opp[]) {
  const headers = ["Opportunity", "Client", "Stage", "Value", "Drift Score", "Drift Level", "Revenue at Risk", "Why It Leaked"];
  const rows = opps.map(o => [
    o.title, o.accounts?.name ?? "—", o.stage ?? "—",
    o.value, o.score?.drift_score ?? "—", o.score?.drift_level ?? "—",
    o.score?.revenue_at_risk ?? 0, shortNote(o.score?.scoring_notes),
  ].map(c => `"${String(c).replace(/"/g, '""')}"`).join(","));
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "drift-revenue-leaking.csv"; a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const [leakingOpps, setLeakingOpps] = useState<Opp[]>([]);
  const [loadingOpps, setLoadingOpps] = useState(true);

  const loadReports = useCallback(() => {
    fetch("/api/drift/reports")
      .then(r => r.json())
      .then(d => setReports(d.reports ?? []))
      .catch(() => {})
      .finally(() => setLoadingReports(false));
  }, []);

  useEffect(() => { loadReports(); }, [loadReports]);

  useEffect(() => {
    fetch("/api/drift/overview")
      .then(r => r.json())
      .then(d => {
        const decaying = (d.opportunities ?? []).filter((o: Opp) =>
          ["watch", "decaying", "critical"].includes(o.score?.drift_level ?? "")
        ).sort((a: Opp, b: Opp) => (b.score?.revenue_at_risk ?? 0) - (a.score?.revenue_at_risk ?? 0));
        setLeakingOpps(decaying);
      })
      .catch(() => {})
      .finally(() => setLoadingOpps(false));
  }, []);

  async function handleGenerateReport() {
    setGenerating(true);
    setGenerateError(null);
    try {
      const res = await fetch("/api/drift/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report_type: "weekly", scope_type: "workspace", generated_by: "manual" }),
      });
      const data = await res.json();
      if (!res.ok) { setGenerateError(data.error ?? "Failed to generate report"); }
      else { loadReports(); }
    } catch {
      setGenerateError("Network error");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: S.bg, fontFamily: "system-ui, -apple-system, sans-serif", color: S.text }}>

      {/* Top bar */}
      <div style={{ borderBottom: `1px solid ${S.border}`, background: "#090c17", padding: "14px 40px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(59,130,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="12" height="12" viewBox="0 0 20 20" fill="none"><path d="M4 4 L16 10 L4 16 L7 10 Z" fill="#3b82f6" /></svg>
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.02em" }}>Drift</span>
        </div>
        <span style={{ color: S.border, fontSize: 16 }}>/</span>
        <span style={{ fontSize: 13, color: S.muted }}>Reports</span>
        <div style={{ flex: 1 }} />
        <Link href="/admin/drift" style={{ fontSize: 12, color: S.faint, textDecoration: "none" }}>
          ← Revenue Execution
        </Link>
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 40px 80px" }}>

        <div style={{ marginBottom: 36 }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.4em", textTransform: "uppercase", color: S.faint, marginBottom: 6 }}>Analysis</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 8px" }}>Reports</h1>
          <p style={{ fontSize: 14, color: S.faint, margin: 0 }}>Revenue decay analysis and weekly execution reports.</p>
        </div>

        {/* ── Section A: Weekly Reality Report ─────────────── */}
        <div style={{ borderRadius: 14, border: `1px solid ${S.border}`, background: S.panel, padding: 28, marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: S.text, margin: "0 0 6px" }}>Weekly Reality Report</h2>
              <p style={{ fontSize: 13, color: S.faint, margin: 0 }}>Client-ready summary of pipeline decay, interventions taken, and execution evidence.</p>
            </div>
            <button
              onClick={handleGenerateReport}
              disabled={generating}
              style={{ flexShrink: 0, marginLeft: 20, padding: "9px 20px", borderRadius: 8, border: "none", background: S.blue, color: "#fff", fontSize: 13, fontWeight: 600, cursor: generating ? "not-allowed" : "pointer", opacity: generating ? 0.6 : 1 }}
            >
              {generating ? "Generating…" : "Generate Report"}
            </button>
          </div>

          {generateError && (
            <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 7, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: 12 }}>
              {generateError}
            </div>
          )}

          {loadingReports ? (
            <p style={{ fontSize: 13, color: S.faint }}>Loading…</p>
          ) : reports.length === 0 ? (
            <div style={{ padding: "24px 0", borderTop: `1px solid ${S.border}` }}>
              <p style={{ fontSize: 13, color: S.faint }}>No reports generated yet. Click Generate Report to create the first one.</p>
            </div>
          ) : (
            <div style={{ borderTop: `1px solid ${S.border}`, paddingTop: 16 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr>
                    {["Generated", "Period", "Deals at Risk", "Revenue at Risk", "Protected", "Interventions", "Pattern"].map(h => (
                      <th key={h} style={{ padding: "0 16px 10px 0", textAlign: "left", fontSize: 9, fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: S.faint }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r, i) => (
                    <tr key={r.id} style={{ borderTop: i > 0 ? `1px solid ${S.border}` : "none" }}>
                      <td style={{ padding: "12px 16px 12px 0", color: S.muted, whiteSpace: "nowrap" }}>{fmt(r.created_at)}</td>
                      <td style={{ padding: "12px 16px 12px 0", color: S.muted, whiteSpace: "nowrap", fontSize: 11 }}>{r.period_start} → {r.period_end}</td>
                      <td style={{ padding: "12px 16px 12px 0", color: r.deals_at_risk > 0 ? "#fb923c" : S.faint }}>{r.deals_at_risk}</td>
                      <td style={{ padding: "12px 16px 12px 0", color: "#f87171", fontWeight: 600 }}>{usd(r.revenue_at_risk)}</td>
                      <td style={{ padding: "12px 16px 12px 0", color: "#4ade80" }}>{usd(r.revenue_protected)}</td>
                      <td style={{ padding: "12px 16px 12px 0", color: S.muted }}>{r.completed_interventions}</td>
                      <td style={{ padding: "12px 16px 12px 0", color: S.faint, fontSize: 11 }}>{r.dominant_drift_pattern?.replace(/_/g, " ") ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Section B: Revenue Leaking ────────────────────── */}
        <div style={{ borderRadius: 14, border: `1px solid ${S.border}`, background: S.panel, padding: 28 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: S.text, margin: "0 0 6px" }}>Revenue Leaking Report</h2>
              <p style={{ fontSize: 13, color: S.faint, margin: 0 }}>All opportunities with active decay — no 7-day limit.</p>
            </div>
            {leakingOpps.length > 0 && (
              <button
                onClick={() => exportLeakingCSV(leakingOpps)}
                style={{ flexShrink: 0, marginLeft: 20, display: "flex", alignItems: "center", gap: 7, padding: "8px 16px", borderRadius: 8, border: `1px solid ${S.border}`, background: "transparent", color: S.muted, fontSize: 12, fontWeight: 500, cursor: "pointer" }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export CSV
              </button>
            )}
          </div>

          {loadingOpps ? (
            <p style={{ fontSize: 13, color: S.faint }}>Loading…</p>
          ) : leakingOpps.length === 0 ? (
            <div style={{ padding: "32px 0", textAlign: "center" }}>
              <p style={{ fontSize: 14, color: "#22c55e", margin: "0 0 6px" }}>No revenue at risk</p>
              <p style={{ fontSize: 12, color: S.faint, margin: 0 }}>All opportunities are in healthy range.</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${S.border}` }}>
                    {["Opportunity", "Client", "Stage", "Exposure", "Score", "Level", "Why It Leaked", "Intervention Status"].map(h => (
                      <th key={h} style={{ padding: "0 14px 10px 0", textAlign: "left", fontSize: 9, fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: S.faint, whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leakingOpps.map((o, i) => {
                    const level = o.score?.drift_level ?? "watch";
                    const color = LEVEL_COLORS[level] ?? S.muted;
                    return (
                      <tr key={o.id} style={{ borderBottom: i < leakingOpps.length - 1 ? `1px solid ${S.border}` : "none" }}>
                        <td style={{ padding: "12px 14px 12px 0", color: S.text, fontWeight: 500, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.title}</td>
                        <td style={{ padding: "12px 14px 12px 0", color: S.muted, whiteSpace: "nowrap" }}>{o.accounts?.name ?? "—"}</td>
                        <td style={{ padding: "12px 14px 12px 0", color: S.faint, whiteSpace: "nowrap" }}>{o.stage ?? "—"}</td>
                        <td style={{ padding: "12px 14px 12px 0", color, fontWeight: 700, whiteSpace: "nowrap" }}>{usd(o.score?.revenue_at_risk ?? 0)}</td>
                        <td style={{ padding: "12px 14px 12px 0", color, fontWeight: 600 }}>{o.score?.drift_score ?? "—"}</td>
                        <td style={{ padding: "12px 14px 12px 0" }}>
                          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", padding: "3px 8px", borderRadius: 4, background: `${color}15`, color }}>{level}</span>
                        </td>
                        <td style={{ padding: "12px 14px 12px 0", color: S.faint, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{shortNote(o.score?.scoring_notes)}</td>
                        <td style={{ padding: "12px 14px 12px 0", color: S.faint, whiteSpace: "nowrap" }}>—</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
