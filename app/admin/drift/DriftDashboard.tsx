"use client";

import { useState } from "react";
import type { DriftOverview } from "@/lib/drift/data";
import EvidenceModal from "./EvidenceModal";
import ImportCSV from "./ImportCSV";

// ── Style constants ───────────────────────────────────────────────────────────

const LEVEL_LEFT_BORDER: Record<string, string> = {
  critical: "border-l-red-500",
  decaying:  "border-l-orange-500",
  watch:     "border-l-yellow-500",
  healthy:   "border-l-slate-700",
};

const LEVEL_DOT: Record<string, string> = {
  critical: "bg-red-500",
  decaying:  "bg-orange-500",
  watch:     "bg-yellow-400",
  healthy:   "bg-emerald-500",
};

const LEVEL_PILL: Record<string, string> = {
  critical: "border-red-500/30 bg-red-500/10 text-red-400",
  decaying:  "border-orange-500/30 bg-orange-500/10 text-orange-400",
  watch:     "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
  healthy:   "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
};

const LEVEL_PILL_LABEL: Record<string, string> = {
  critical: "Critical",
  decaying:  "Decaying",
  watch:     "At Risk",
  healthy:   "Healthy",
};

const LEVEL_AMOUNT_COLOR: Record<string, string> = {
  critical: "text-red-400",
  decaying:  "text-orange-400",
  watch:     "text-yellow-400",
  healthy:   "text-slate-500",
};

const URGENCY_PILL: Record<string, string> = {
  critical: "border-red-500/30 bg-red-500/10 text-red-400",
  decaying:  "border-orange-500/30 bg-orange-500/10 text-orange-400",
  watch:     "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
};

const PRIORITY_BADGE: Record<string, { label: string; bg: string; iconBg: string }> = {
  high:   { label: "P1", bg: "border-red-500/20 bg-red-500/10 text-red-400",          iconBg: "bg-red-500/15 text-red-400" },
  medium: { label: "P2", bg: "border-orange-500/20 bg-orange-500/10 text-orange-400", iconBg: "bg-orange-500/15 text-orange-400" },
  low:    { label: "P3", bg: "border-yellow-500/20 bg-yellow-500/10 text-yellow-400", iconBg: "bg-yellow-500/15 text-yellow-400" },
};

const PRIORITY_TO_LEVEL: Record<string, string> = {
  high: "critical",
  medium: "decaying",
  low: "watch",
};

const LEVEL_ORDER: Record<string, number> = {
  healthy: 0, watch: 1, decaying: 2, critical: 3,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function usd(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD", maximumFractionDigits: 0,
  }).format(n);
}

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 2) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

function scoringBullets(notes: string | null | undefined): string[] {
  if (!notes) return [];
  return notes.split(/\.\s+/).map(s => s.replace(/\.$/, "").trim()).filter(Boolean).slice(0, 4);
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DriftDashboard({ data }: { data: DriftOverview }) {
  const [selectedClient, setSelectedClient] = useState<string | null>(null);

  // ── Lookup maps ─────────────────────────────────────────────────────────────
  const scoreByOppId = new Map(data.opportunities.map(o => [o.id, o.score]));
  const oppById      = new Map(data.opportunities.map(o => [o.id, o]));

  // ── Client filter ────────────────────────────────────────────────────────────
  const visibleOpps = selectedClient
    ? data.opportunities.filter(o => o.accounts?.name === selectedClient)
    : data.opportunities;

  const visibleInterventions = selectedClient
    ? data.interventions.filter(iv => iv.opportunities?.accounts?.name === selectedClient)
    : data.interventions;

  // Sort interventions by drift score desc
  const sortedInterventions = [...visibleInterventions].sort((a, b) =>
    Number(scoreByOppId.get(b.opportunity_id)?.drift_score ?? 0) -
    Number(scoreByOppId.get(a.opportunity_id)?.drift_score ?? 0)
  );

  // ── KPIs ─────────────────────────────────────────────────────────────────────
  const portfolioValue = visibleOpps.reduce((s, o) => s + Number(o.value ?? 0), 0);
  const revenueAtRisk  = visibleOpps.reduce((s, o) => s + Number(o.score?.revenue_at_risk ?? 0), 0);
  const exposurePct    = portfolioValue > 0 ? Math.min(100, (revenueAtRisk / portfolioValue) * 100) : 0;
  const criticalCount  = visibleOpps.filter(o => o.score?.drift_level === "critical").length;

  // ── Snapshot freshness (3-tier, workspace-wide) ──────────────────────────────
  const latestScoredAt =
    data.opportunities.map(o => o.score?.scored_at).filter(Boolean).sort().at(-1) ?? null;
  const snapshotLabel = timeAgo(latestScoredAt);
  const ageMs = latestScoredAt ? Date.now() - new Date(latestScoredAt).getTime() : null;
  const freshnessTier =
    ageMs === null         ? "none"  :
    ageMs < 3_600_000      ? "green" :
    ageMs < 86_400_000     ? "amber" : "red";
  const freshnessColor =
    freshnessTier === "green" ? "text-emerald-400" :
    freshnessTier === "amber" ? "text-amber-400"   :
    freshnessTier === "red"   ? "text-red-400"      : "text-slate-400";

  // ── Revenue leaking (last 7 days) ────────────────────────────────────────────
  const cutoff = Date.now() - 7 * 86_400_000;
  const leaking = visibleOpps
    .filter(o =>
      ["watch", "decaying", "critical"].includes(o.score?.drift_level ?? "") &&
      o.score?.scored_at &&
      new Date(o.score.scored_at).getTime() >= cutoff
    )
    .sort((a, b) => Number(b.score?.revenue_at_risk ?? 0) - Number(a.score?.revenue_at_risk ?? 0))
    .slice(0, 5);

  // ── Sidebar clients ───────────────────────────────────────────────────────────
  type SidebarClient = { name: string; level: string; risk: number; value: number };
  const clientMap = new Map<string, SidebarClient>();
  for (const opp of data.opportunities) {
    const name  = opp.accounts?.name ?? "Unknown";
    const level = opp.score?.drift_level ?? "healthy";
    const risk  = Number(opp.score?.revenue_at_risk ?? 0);
    const val   = Number(opp.value ?? 0);
    const prev  = clientMap.get(name);
    if (!prev) {
      clientMap.set(name, { name, level, risk, value: val });
    } else {
      const maxLevel =
        (LEVEL_ORDER[level] ?? 0) > (LEVEL_ORDER[prev.level] ?? 0) ? level : prev.level;
      clientMap.set(name, { name, level: maxLevel, risk: prev.risk + risk, value: prev.value + val });
    }
  }
  const sidebarClients = Array.from(clientMap.values())
    .sort((a, b) => (LEVEL_ORDER[b.level] ?? 0) - (LEVEL_ORDER[a.level] ?? 0) || b.risk - a.risk);

  // ── Operational confidence ────────────────────────────────────────────────────
  const scored  = visibleOpps.filter(o => o.score !== null).length;
  const opConf  = visibleOpps.length > 0 ? Math.round((scored / visibleOpps.length) * 100) : 100;
  const confClr = opConf >= 90 ? "text-emerald-400" : opConf >= 60 ? "text-amber-400" : "text-red-400";

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#080d1a", color: "#e2e8f0", fontFamily: "sans-serif" }}>

      {/* ══════════════ SIDEBAR (220px) ══════════════ */}
      <aside style={{ width: 220, minWidth: 220, maxWidth: 220, height: "100%", display: "flex", flexDirection: "column", background: "#090d1e", borderRight: "1px solid #1e2a45", overflow: "hidden" }}>

        {/* Wordmark */}
        <div style={{ padding: "20px 20px 16px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.5em", textTransform: "uppercase", color: "#94a3b8" }}>Drift</div>
          <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>Cognitive Empire Internal</div>
        </div>

        <div style={{ margin: "0 16px", borderTop: "1px solid #1e2a45" }} />

        {/* Workspace / All Clients */}
        <div style={{ padding: "12px 16px" }}>
          <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.4em", color: "#475569", marginBottom: 8 }}>Workspace</div>
          <button
            onClick={() => setSelectedClient(null)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              width: "100%", padding: "6px 8px", borderRadius: 6, border: "none", cursor: "pointer",
              background: selectedClient === null ? "#1e3a5f" : "transparent",
              color: "#cbd5e1",
            }}
          >
            <span style={{ fontSize: 13 }}>All Clients</span>
            <span style={{ fontSize: 10, background: "#1e293b", borderRadius: 4, padding: "2px 6px", color: "#64748b" }}>
              {sidebarClients.length}
            </span>
          </button>
        </div>

        <div style={{ margin: "0 16px", borderTop: "1px solid #1e2a45" }} />

        {/* Navigation */}
        <nav style={{ padding: "12px" }}>
          <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.4em", color: "#475569", marginBottom: 8, paddingLeft: 8 }}>Navigation</div>

          {/* Active item */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 12px", borderRadius: 6, background: "#1e3a5f", marginBottom: 2 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#60a5fa", flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 500, color: "#f1f5f9" }}>Revenue Execution</span>
          </div>

          {[
            { label: "Interventions", badge: data.summary.pendingInterventions > 0 ? data.summary.pendingInterventions : null },
            { label: "Reports",       badge: null },
            { label: "Data Sources",  badge: null },
            { label: "Settings",      badge: null },
          ].map(item => (
            <div
              key={item.label}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 12px", borderRadius: 6, marginBottom: 2, cursor: "default", color: "#64748b" }}
            >
              <span style={{ fontSize: 13 }}>{item.label}</span>
              {item.badge !== null && (
                <span style={{ fontSize: 10, background: "rgba(239,68,68,0.15)", color: "#f87171", borderRadius: 4, padding: "1px 6px" }}>
                  {item.badge}
                </span>
              )}
            </div>
          ))}
        </nav>

        <div style={{ margin: "0 16px", borderTop: "1px solid #1e2a45" }} />

        {/* Client list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, paddingLeft: 8 }}>
            <span style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.4em", color: "#475569" }}>Clients</span>
            <span style={{ fontSize: 14, color: "#334155", cursor: "default" }}>+</span>
          </div>

          {sidebarClients.length === 0 ? (
            <div style={{ fontSize: 11, color: "#334155", paddingLeft: 8 }}>No clients yet</div>
          ) : (
            sidebarClients.map(client => (
              <button
                key={client.name}
                onClick={() => setSelectedClient(selectedClient === client.name ? null : client.name)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  width: "100%", padding: "6px 8px", borderRadius: 6, border: "none", cursor: "pointer",
                  background: selectedClient === client.name ? "#1e3a5f" : "transparent",
                  color: "inherit", textAlign: "left",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, background: LEVEL_DOT[client.level] ? undefined : "#475569" }} className={LEVEL_DOT[client.level] ?? ""} />
                  <span style={{ fontSize: 12, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{client.name}</span>
                </div>
                {client.value > 0 && (
                  <span style={{ fontSize: 10, flexShrink: 0, marginLeft: 6 }} className={LEVEL_AMOUNT_COLOR[client.level] ?? "text-slate-500"}>
                    {usd(client.value)}
                  </span>
                )}
              </button>
            ))
          )}
        </div>

        {/* Profile */}
        <div style={{ borderTop: "1px solid #1e2a45", padding: "14px 16px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#334155", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: "#cbd5e1", flexShrink: 0 }}>
                E
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: "#cbd5e1" }}>Dr. E</div>
                <div style={{ fontSize: 10, color: "#475569" }}>Operator</div>
              </div>
            </div>
            <svg width="14" height="14" viewBox="0 0 20 20" fill="#475569">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </aside>

      {/* ══════════════ MAIN AREA ══════════════ */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

        {/* ── Header ── */}
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 28px", borderBottom: "1px solid #1e2a45", background: "#080d1a", flexShrink: 0 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 600, color: "#f8fafc", margin: 0, letterSpacing: "-0.02em" }}>
              Revenue Execution
              {selectedClient && (
                <span style={{ fontSize: 14, fontWeight: 400, color: "#475569", marginLeft: 12 }}>— {selectedClient}</span>
              )}
            </h1>
            <p style={{ fontSize: 12, color: "#475569", margin: "4px 0 0" }}>
              Real-time visibility into revenue decay and required interventions.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <ImportCSV />

            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "#64748b" }}>Last scored {snapshotLabel}</div>
              <div style={{ fontSize: 10, color: "#334155", marginTop: 2 }}>Next: Daily at midnight</div>
            </div>

            {/* Bell */}
            <div style={{ position: "relative" }}>
              <div style={{ width: 32, height: 32, borderRadius: 6, border: "1px solid #1e2a45", background: "#0f1629", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              {data.summary.pendingInterventions > 0 && (
                <span style={{ position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: "50%", background: "#ef4444", fontSize: 9, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {data.summary.pendingInterventions > 9 ? "9+" : data.summary.pendingInterventions}
                </span>
              )}
            </div>
          </div>
        </header>

        {/* ── Body ── */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

          {/* ── Center column ── */}
          <main style={{ flex: 1, overflowY: "auto", padding: "24px 28px", minWidth: 0 }}>

            {/* KPI Strip */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>

              {/* Revenue Exposure */}
              <div style={{ borderRadius: 8, border: "1px solid #1e2a45", background: "#0f1629", padding: "16px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.4em", color: "#475569" }}>Revenue Exposure</div>
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="rgba(239,68,68,0.6)" style={{ marginTop: 1, flexShrink: 0 }}>
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div style={{ fontSize: 24, fontWeight: 600, color: "#f87171", marginTop: 10, lineHeight: 1 }}>{usd(revenueAtRisk)}</div>
                <div style={{ fontSize: 11, color: "#475569", marginTop: 6 }}>{exposurePct.toFixed(1)}% of portfolio</div>
              </div>

              {/* Critical Decay */}
              <div style={{ borderRadius: 8, border: "1px solid #1e2a45", background: "#0f1629", padding: "16px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.4em", color: "#475569" }}>Critical Decay</div>
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="rgba(239,68,68,0.6)" style={{ marginTop: 1, flexShrink: 0 }}>
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div style={{ fontSize: 24, fontWeight: 600, lineHeight: 1, marginTop: 10, color: criticalCount > 0 ? "#f87171" : "#334155" }}>{criticalCount}</div>
                <div style={{ fontSize: 11, color: "#475569", marginTop: 6 }}>{criticalCount === 1 ? "opportunity" : "opportunities"}</div>
              </div>

              {/* Intervention Backlog */}
              <div style={{ borderRadius: 8, border: "1px solid #1e2a45", background: "#0f1629", padding: "16px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.4em", color: "#475569" }}>Intervention Backlog</div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(249,115,22,0.6)" strokeWidth="1.8" style={{ marginTop: 1, flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div style={{ fontSize: 24, fontWeight: 600, lineHeight: 1, marginTop: 10, color: sortedInterventions.length > 0 ? "#fb923c" : "#334155" }}>{sortedInterventions.length}</div>
                <div style={{ fontSize: 11, color: "#475569", marginTop: 6 }}>pending actions</div>
              </div>

              {/* Snapshot Freshness */}
              <div style={{ borderRadius: 8, border: "1px solid #1e2a45", background: "#0f1629", padding: "16px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.4em", color: "#475569" }}>Snapshot Freshness</div>
                  {freshnessTier === "green" ? (
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="rgba(52,211,153,0.7)" style={{ marginTop: 1, flexShrink: 0 }}>
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : freshnessTier === "amber" ? (
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="rgba(251,191,36,0.7)" style={{ marginTop: 1, flexShrink: 0 }}>
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="rgba(239,68,68,0.7)" style={{ marginTop: 1, flexShrink: 0 }}>
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div style={{ fontSize: 24, fontWeight: 600, lineHeight: 1, marginTop: 10 }} className={freshnessColor}>{snapshotLabel}</div>
                <div style={{ fontSize: 11, color: "#475569", marginTop: 6 }}>last scored</div>
              </div>
            </div>

            {/* Intervention Queue */}
            <section>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: "#f1f5f9" }}>Intervention Queue</h2>
                  {sortedInterventions.length > 0 && (
                    <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", padding: "2px 8px", borderRadius: 4, border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.1)", color: "#f87171" }}>
                      {sortedInterventions.length}
                    </span>
                  )}
                </div>
                <button style={{ fontSize: 12, color: "#475569", background: "none", border: "none", cursor: "pointer" }}>
                  View all →
                </button>
              </div>

              {sortedInterventions.length === 0 ? (
                <div style={{ borderRadius: 8, border: "1px solid #1e2a45", padding: "48px 32px", textAlign: "center" }}>
                  <div style={{ fontSize: 13, color: "#475569" }}>No pending interventions.</div>
                  <div style={{ fontSize: 11, color: "#334155", marginTop: 4 }}>
                    {selectedClient ? `No interventions for ${selectedClient}.` : "Run the scoring engine to generate actions."}
                  </div>
                </div>
              ) : (
                <div style={{ borderRadius: 8, border: "1px solid #1e2a45", overflow: "hidden" }}>

                  {/* Table header */}
                  <div style={{ display: "grid", gridTemplateColumns: "1.8fr 0.8fr 0.8fr 1.6fr 1.8fr 0.75fr auto", borderBottom: "1px solid #1e2a45", background: "#0f1629" }}>
                    {["Opportunity", "Stage", "Exposure", "Decay Reasons", "Required Intervention", "Urgency", ""].map((h, i) => (
                      <div key={i} style={{ padding: "10px 16px" }}>
                        <span style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.35em", color: "#475569" }}>{h}</span>
                      </div>
                    ))}
                  </div>

                  {/* Table rows */}
                  {sortedInterventions.map((iv, idx) => {
                    const score      = scoreByOppId.get(iv.opportunity_id);
                    const opp        = oppById.get(iv.opportunity_id);
                    const level      = score?.drift_level ?? PRIORITY_TO_LEVEL[iv.priority] ?? "watch";
                    const riskAmt    = Number(score?.revenue_at_risk ?? iv.opportunities?.value ?? 0);
                    const riskPct    = portfolioValue > 0 ? (riskAmt / portfolioValue) * 100 : 0;
                    const bullets    = scoringBullets(score?.scoring_notes);
                    const due        = daysUntil(opp?.next_action_due_date);
                    const acctName   = iv.opportunities?.accounts?.name ?? "Unknown Client";
                    const dealTitle  = iv.opportunities?.title ?? "—";
                    const stage      = iv.opportunities?.stage ?? opp?.stage ?? null;

                    const leftBorderColor =
                      level === "critical" ? "#ef4444" :
                      level === "decaying"  ? "#f97316" :
                      level === "watch"     ? "#eab308" : "#334155";

                    const dueColor =
                      due === null         ? "#475569" :
                      due < 0              ? "#f87171" :
                      due <= 3             ? "#f87171" :
                      due <= 7             ? "#fb923c" : "#475569";

                    return (
                      <div
                        key={iv.id}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1.8fr 0.8fr 0.8fr 1.6fr 1.8fr 0.75fr auto",
                          alignItems: "start",
                          borderLeft: `2px solid ${leftBorderColor}`,
                          borderTop: idx > 0 ? "1px solid rgba(30,42,69,0.6)" : "none",
                          background: "#090d1e",
                        }}
                      >
                        {/* Opportunity */}
                        <div style={{ padding: "14px 16px" }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9", lineHeight: 1.3 }}>{acctName}</div>
                          <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>{dealTitle}</div>
                          {stage && <div style={{ fontSize: 10, color: "#334155", marginTop: 2 }}>{stage}</div>}
                        </div>

                        {/* Stage */}
                        <div style={{ padding: "14px 16px" }}>
                          <div style={{ fontSize: 12, color: "#94a3b8" }}>{stage ?? "—"}</div>
                          <span className={`rounded border px-1.5 py-0.5 text-[9px] uppercase tracking-wide mt-2 inline-block ${LEVEL_PILL[level] ?? LEVEL_PILL.watch}`}>
                            {LEVEL_PILL_LABEL[level] ?? level}
                          </span>
                        </div>

                        {/* Exposure */}
                        <div style={{ padding: "14px 16px" }}>
                          <div style={{ fontSize: 13, fontWeight: 600 }} className={LEVEL_AMOUNT_COLOR[level] ?? "text-slate-400"}>{usd(riskAmt)}</div>
                          <div style={{ fontSize: 10, color: "#475569", marginTop: 3 }}>{riskPct.toFixed(1)}%</div>
                        </div>

                        {/* Decay Reasons */}
                        <div style={{ padding: "14px 16px" }}>
                          {bullets.length > 0 ? (
                            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                              {bullets.map((b, i) => (
                                <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 11, color: "#64748b", marginBottom: 4 }}>
                                  <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#334155", flexShrink: 0, marginTop: 5 }} />
                                  {b}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <div style={{ fontSize: 11, color: "#334155" }}>No scoring data</div>
                          )}
                        </div>

                        {/* Required Intervention */}
                        <div style={{ padding: "14px 16px" }}>
                          <div style={{ fontSize: 12, color: "#cbd5e1", lineHeight: 1.5 }}>{iv.recommended_action}</div>
                          {due !== null && (
                            <div style={{ fontSize: 10, fontWeight: 500, color: dueColor, marginTop: 6 }}>
                              {due < 0 ? `Overdue by ${Math.abs(due)}d` : due === 0 ? "Due today" : `Due in ${due}d`}
                            </div>
                          )}
                        </div>

                        {/* Urgency */}
                        <div style={{ padding: "14px 16px" }}>
                          <span className={`inline-block rounded border px-2 py-1 text-[9px] uppercase tracking-widest ${URGENCY_PILL[level] ?? "border-slate-700 text-slate-500"}`}>
                            {LEVEL_PILL_LABEL[level] ?? level}
                          </span>
                        </div>

                        {/* Action */}
                        <div style={{ padding: "12px", display: "flex", alignItems: "flex-start" }}>
                          <EvidenceModal
                            interventionId={iv.id}
                            recommendedAction={iv.recommended_action}
                            workspaceId={iv.workspace_id}
                            opportunityId={iv.opportunity_id}
                            accountId={iv.opportunities?.accounts?.id ?? ""}
                          />
                        </div>
                      </div>
                    );
                  })}

                  {/* Table footer */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #1e2a45", background: "#0f1629", padding: "8px 20px" }}>
                    <span style={{ fontSize: 11, color: "#475569" }}>
                      Showing {sortedInterventions.length} of {data.interventions.length} interventions
                      {selectedClient ? ` · ${selectedClient}` : ""}
                    </span>
                    <button style={{ fontSize: 11, color: "#475569", background: "none", border: "none", cursor: "pointer" }}>View all →</button>
                  </div>
                </div>
              )}
            </section>
          </main>

          {/* ══════════════ RIGHT COLUMN (320px) ══════════════ */}
          <div style={{ width: 320, minWidth: 320, maxWidth: 320, borderLeft: "1px solid #1e2a45", overflowY: "auto", padding: "24px 20px" }}>

            {/* Recommended Interventions */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", margin: 0 }}>Recommended Interventions</h3>
                <button style={{ fontSize: 11, color: "#475569", background: "none", border: "none", cursor: "pointer" }}>View all</button>
              </div>

              {sortedInterventions.length === 0 ? (
                <div style={{ fontSize: 12, color: "#334155" }}>No interventions pending.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {sortedInterventions.slice(0, 3).map(iv => {
                    const p = PRIORITY_BADGE[iv.priority] ?? PRIORITY_BADGE.low;
                    const clientName = iv.opportunities?.accounts?.name ?? "Unknown";
                    return (
                      <div key={iv.id} style={{ borderRadius: 8, border: "1px solid #1e2a45", background: "#0f1629", padding: "14px" }}>
                        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[11px] font-bold ${p.iconBg}`}>
                            {p.label}
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 500, color: "#e2e8f0", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                              {iv.recommended_action}
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                              <span style={{ fontSize: 11, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{clientName}</span>
                              <span className={`shrink-0 ml-2 rounded border px-1.5 py-0.5 text-[9px] ${p.bg}`}>{p.label}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <button style={{ fontSize: 11, color: "#475569", background: "none", border: "none", cursor: "pointer", marginTop: 12 }}>
                View all interventions →
              </button>
            </div>

            <div style={{ borderTop: "1px solid #1e2a45", marginBottom: 20 }} />

            {/* Revenue Leaking This Week */}
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", margin: "0 0 16px" }}>Revenue Leaking This Week</h3>

              {leaking.length === 0 ? (
                <div style={{ fontSize: 12, color: "#059669" }}>No revenue at risk this week.</div>
              ) : (
                <>
                  {/* Column headers */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "0 12px", marginBottom: 8 }}>
                    {["Opportunity", "Exposure", "Why Leaked"].map((h, i) => (
                      <div key={i} style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: i === 2 ? "0.2em" : "0.35em", color: "#475569" }}>{h}</div>
                    ))}
                  </div>

                  {leaking.map((opp, idx) => {
                    const level   = opp.score?.drift_level ?? "watch";
                    const riskAmt = Number(opp.score?.revenue_at_risk ?? 0);
                    const notes   = opp.score?.scoring_notes ?? "—";
                    const short   = notes.length > 48 ? notes.slice(0, 48) + "…" : notes;
                    return (
                      <div
                        key={opp.id}
                        style={{
                          display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "0 12px",
                          padding: "10px 0",
                          borderTop: idx > 0 ? "1px solid rgba(30,42,69,0.6)" : "none",
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 11, fontWeight: 500, color: "#cbd5e1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{opp.title}</div>
                          <div style={{ fontSize: 10, color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{opp.accounts?.name ?? "—"}</div>
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 600 }} className={LEVEL_AMOUNT_COLOR[level] ?? "text-slate-500"}>{usd(riskAmt)}</div>
                        <div style={{ fontSize: 10, color: "#475569", lineHeight: 1.5 }}>{short}</div>
                      </div>
                    );
                  })}

                  <button style={{ fontSize: 11, color: "#475569", background: "none", border: "none", cursor: "pointer", marginTop: 12 }}>
                    View full leaking report →
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Status bar ── */}
        <footer style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #1e2a45", background: "#080d1a", padding: "8px 28px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }} className={confClr}>{opConf}%</span>
            <span style={{ fontSize: 11, color: "#475569" }}>operational confidence</span>
          </div>
          <span style={{ fontSize: 11, color: "#475569" }}>
            {opConf < 80 ? "Score confidence reduced due to stale opportunities" : "Pipeline coverage is current"}
          </span>
          <span style={{ fontSize: 11, color: "#475569" }}>Scoring: Daily</span>
        </footer>
      </div>
    </div>
  );
}
