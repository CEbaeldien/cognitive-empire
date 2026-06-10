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

type BatchStats = {
  pending_count:    number;
  candidate_count:  number;
  first_pass_count: number;
  rejected_count:   number;
  last_batch_run:   string | null;
};

type BatchResult = {
  total_pending:          number;
  processed_this_run:     number;
  promoted_to_candidate:  number;
  promoted_to_first_pass: number;
  rejected:               number;
  errors:                 number;
};

type BatchProgress = { done: number; total: number };

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "Never";
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 2)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function nextBatchTime(): string {
  const now  = new Date();
  const next = new Date(now);
  next.setUTCHours(2, 0, 0, 0);
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
  const diffMs = next.getTime() - now.getTime();
  const h = Math.floor(diffMs / 3_600_000);
  const m = Math.floor((diffMs % 3_600_000) / 60_000);
  return `in ${h}h ${m}m (02:00 UTC)`;
}

function StatCard({ label, value, sub, color, href }: {
  label: string; value: string | number; sub?: string; color?: string; href?: string;
}) {
  const content = (
    <div style={{ flex: 1, minWidth: 140, padding: "18px 22px", borderRadius: 10, background: C.panel, border: `1px solid ${C.border}`, cursor: href ? "pointer" : "default", transition: "border-color 0.15s" }}>
      <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.4em", textTransform: "uppercase", color: C.faint, margin: "0 0 8px" }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 800, color: color ?? C.text, margin: 0, letterSpacing: "-0.03em", lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: C.faint, margin: "6px 0 0" }}>{sub}</p>}
    </div>
  );

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: "none", flex: 1, minWidth: 140, display: "block" }}>
        {content}
      </Link>
    );
  }
  return content;
}

export default function MesodmaCockpit() {
  const [stats,         setStats]        = useState<BatchStats | null>(null);
  const [statsLoading,  setStatsLoading] = useState(true);
  const [batchRunning,  setBatchRunning] = useState(false);
  const [batchResult,   setBatchResult]  = useState<BatchResult | null>(null);
  const [batchError,    setBatchError]   = useState<string | null>(null);
  const [batchProgress, setBatchProgress] = useState<BatchProgress | null>(null);

  const loadStats = useCallback(() => {
    setStatsLoading(true);
    fetch("/api/mesodma/batch")
      .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
      .then((d: BatchStats) => setStats(d))
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  async function runBatchNow() {
    setBatchRunning(true);
    setBatchResult(null);
    setBatchError(null);
    setBatchProgress(null);

    try {
      // Step 1: fast fetch of pending item IDs from the server (< 2s, no AI calls)
      const res = await fetch("/api/mesodma/batch", {
        method: "POST",
        headers: { "Authorization": `Bearer ${process.env.NEXT_PUBLIC_MESODMA_API_KEY}` },
      });
      const batchData = await res.json() as { total_pending?: number; item_ids?: string[]; error?: string };
      if (!res.ok) throw new Error(batchData.error ?? `HTTP ${res.status}`);

      const total_pending = batchData.total_pending ?? 0;
      const item_ids = batchData.item_ids ?? [];

      if (item_ids.length === 0) {
        setBatchResult({ total_pending: 0, processed_this_run: 0, promoted_to_candidate: 0, promoted_to_first_pass: 0, rejected: 0, errors: 0 });
        return;
      }

      // Step 2: fire all process calls from the browser — no serverless timeout applies
      setBatchProgress({ done: 0, total: item_ids.length });
      let done = 0;
      let promoted_to_candidate = 0;
      let promoted_to_first_pass = 0;
      let rejected = 0;
      let errors = 0;

      const results = await Promise.allSettled(
        item_ids.map(id =>
          fetch("/api/mesodma/process", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ raw_item_id: id }),
          })
            .then(r => {
              if (!r.ok) throw new Error(`HTTP ${r.status}`);
              return r.json() as Promise<{ route_taken?: string }>;
            })
            .finally(() => {
              done++;
              setBatchProgress({ done, total: item_ids.length });
            })
        )
      );

      for (const r of results) {
        if (r.status === "rejected") {
          errors++;
        } else {
          const rt = (r.value as { route_taken?: string }).route_taken ?? "";
          if (rt === "promoted_to_first_pass_signal") {
            promoted_to_first_pass++;
            promoted_to_candidate++;
          } else if (rt === "candidate_evidence_stored" || rt === "stored_as_candidate_evidence") {
            promoted_to_candidate++;
          } else if (rt === "rejected_noise" || rt === "rejected_at_doctrine_filter") {
            rejected++;
          } else {
            errors++;
          }
        }
      }

      setBatchResult({ total_pending, processed_this_run: item_ids.length, promoted_to_candidate, promoted_to_first_pass, rejected, errors });
      loadStats();
    } catch (e) {
      setBatchError(e instanceof Error ? e.message : String(e));
    } finally {
      setBatchRunning(false);
      setBatchProgress(null);
    }
  }

  const progressPct = batchProgress ? Math.round((batchProgress.done / batchProgress.total) * 100) : 0;

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1200 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.5em", textTransform: "uppercase", color: C.faint, marginBottom: 4 }}>CE Admin · Mesodma</p>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: C.text, letterSpacing: "-0.025em", margin: "0 0 6px" }}>Cockpit</h1>
        <p style={{ fontSize: 13, color: C.faint, margin: 0, fontStyle: "italic" }}>Visibility is a lagging indicator of structural reality.</p>
      </div>

      {/* Stats Bar */}
      <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
        {statsLoading ? (
          <p style={{ fontSize: 13, color: C.faint }}>Loading stats…</p>
        ) : stats ? (
          <>
            <StatCard label="Pending"    value={stats.pending_count}    color={stats.pending_count > 0 ? C.yellow : C.text}   sub="raw items unprocessed" />
            <StatCard label="Candidates" value={stats.candidate_count}  color={C.accent}  sub="candidate evidence"               href="/ce-admin/mesodma/candidate-evidence" />
            <StatCard label="First-Pass" value={stats.first_pass_count} color={stats.first_pass_count > 0 ? C.green : C.text} sub="ready for review"        href="/ce-admin/mesodma/first-pass-signals" />
            <StatCard label="Noise"      value={stats.rejected_count}   color={stats.rejected_count > 0 ? C.red : C.text}    sub="rejected, 48h TTL"       href="/ce-admin/mesodma/noise-corner" />
            <StatCard label="Last Run"   value={timeAgo(stats.last_batch_run)} color={C.muted} sub="most recent module run"  href="/ce-admin/mesodma/runs-log" />
          </>
        ) : (
          <p style={{ fontSize: 12, color: C.red }}>Failed to load stats</p>
        )}
      </div>

      {/* Batch Control */}
      <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: "24px 28px", marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div>
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.4em", textTransform: "uppercase", color: C.faint, margin: "0 0 6px" }}>Batch Processing</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: "0 0 4px" }}>Run Batch Now</p>
            <p style={{ fontSize: 12, color: C.faint, margin: 0 }}>
              Processes up to 20 pending items through the 4-module pipeline in parallel.
              Next scheduled run: <span style={{ color: C.muted }}>{nextBatchTime()}</span>
            </p>
          </div>

          <button
            onClick={runBatchNow}
            disabled={batchRunning}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "10px 24px", borderRadius: 8, fontSize: 13, fontWeight: 700,
              cursor: batchRunning ? "not-allowed" : "pointer",
              background: batchRunning ? C.accentBg : C.accent,
              color: batchRunning ? C.accent : "#000",
              border: batchRunning ? `1px solid ${C.accentBorder}` : "none",
              opacity: batchRunning ? 0.8 : 1,
              flexShrink: 0,
            } as React.CSSProperties}
          >
            {batchRunning ? (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "spin 1s linear infinite" }}>
                  <path d="M21 12a9 9 0 11-6.219-8.56" />
                </svg>
                Running…
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" />
                </svg>
                Run Batch Now
              </>
            )}
          </button>
        </div>

        {/* Progress bar */}
        {batchRunning && batchProgress && (
          <div style={{ marginTop: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: C.accent }}>Processing items…</span>
              <span style={{ fontSize: 11, color: C.muted }}>{batchProgress.done} / {batchProgress.total}</span>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: C.border, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progressPct}%`, background: C.accent, borderRadius: 2, transition: "width 0.3s ease" }} />
            </div>
          </div>
        )}

        {/* Batch Result */}
        {batchResult && !batchError && (
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.4em", textTransform: "uppercase", color: C.green, margin: "0 0 12px" }}>Batch Complete</p>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              {[
                { label: "Pending",      value: batchResult.total_pending },
                { label: "Processed",    value: batchResult.processed_this_run },
                { label: "→ First-Pass", value: batchResult.promoted_to_first_pass, color: C.green },
                { label: "→ Candidate",  value: batchResult.promoted_to_candidate,  color: C.accent },
                { label: "Rejected",     value: batchResult.rejected,               color: C.red },
                { label: "Errors",       value: batchResult.errors,                 color: batchResult.errors > 0 ? C.orange : C.faint },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: C.faint, margin: "0 0 4px" }}>{label}</p>
                  <p style={{ fontSize: 20, fontWeight: 800, color: color ?? C.text, margin: 0 }}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {batchError && (
          <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: 8, background: C.redBg, border: `1px solid rgba(248,113,113,0.2)` }}>
            <p style={{ fontSize: 12, color: C.red, margin: 0 }}>Batch error: {batchError}</p>
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div style={{ marginBottom: 8 }}>
        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.45em", textTransform: "uppercase", color: C.faint, marginBottom: 12 }}>Review Queues</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {[
            { href: "/ce-admin/mesodma/first-pass-signals",  label: "First-Pass Signals",  desc: "Promote, flag, or reject",               count: stats?.first_pass_count, color: C.green },
            { href: "/ce-admin/mesodma/candidate-evidence",  label: "Candidate Evidence",  desc: "Structured evidence awaiting convergence", count: stats?.candidate_count },
            { href: "/ce-admin/mesodma/noise-corner",         label: "Noise Corner",        desc: "Rejected items expiring in 48h",           count: stats?.rejected_count,  color: C.red },
            { href: "/ce-admin/mesodma/runs-log",             label: "Runs Log",            desc: "Module-level execution log",               count: undefined },
            { href: "/ce-admin/mesodma/training-examples",    label: "Training Examples",   desc: "Calibrate pipeline behavior",              count: undefined },
          ].map(({ href, label, desc, count, color }) => (
            <Link key={href} href={href} style={{ textDecoration: "none", flex: "1 1 200px", minWidth: 200 }}>
              <div style={{ padding: "14px 18px", borderRadius: 9, background: C.panelDark, border: `1px solid ${C.border}`, transition: "border-color 0.15s", cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: C.text, margin: 0 }}>{label}</p>
                  {count != null && (
                    <span style={{ fontSize: 12, fontWeight: 800, color: color ?? C.accent }}>{count}</span>
                  )}
                </div>
                <p style={{ fontSize: 11, color: C.faint, margin: 0 }}>{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
