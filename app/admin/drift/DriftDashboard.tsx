"use client";

import { useState } from "react";
import type { DriftOverview } from "@/lib/drift/data";
import EvidenceModal from "./EvidenceModal";
import ImportCSV from "./ImportCSV";

// ── Data helpers ──────────────────────────────────────────────────────────────

function usd(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
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

function firstBullets(notes: string | null | undefined, max = 4): string[] {
  if (!notes) return [];
  return notes.split(/\.\s+/).map(s => s.replace(/\.$/, "").trim()).filter(Boolean).slice(0, max);
}

function shortNote(notes: string | null | undefined): string {
  if (!notes) return "—";
  const first = notes.split(/\.\s+/)[0]?.replace(/\.$/, "").trim();
  return first ?? "—";
}

const LEVEL_ORDER: Record<string, number> = { healthy: 0, watch: 1, decaying: 2, critical: 3 };

const PRIORITY_TO_LEVEL: Record<string, string> = { high: "critical", medium: "decaying", low: "watch" };

const LATE_STAGES = new Set(["Negotiation", "Proposal Sent", "Contract Sent", "Closing", "Final Review"]);

// ── SVG Icons ─────────────────────────────────────────────────────────────────

const IcoRevenue = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const IcoInterventions = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const IcoReports = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const IcoDataSources = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
  </svg>
);

const IcoSettings = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
);

const IcoBell = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 01-3.46 0" />
  </svg>
);

const IcoPerson = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IcoChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const IcoInfo = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline", marginLeft: 4, verticalAlign: "middle", opacity: 0.4 }}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

// Decorative sparkline for Revenue Exposure KPI card
const Sparkline = () => (
  <svg width="96" height="36" viewBox="0 0 96 36" fill="none" style={{ opacity: 0.7 }}>
    <defs>
      <linearGradient id="spkGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
        <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
      </linearGradient>
    </defs>
    <path d="M0 26 L12 18 L20 22 L32 10 L44 16 L56 8 L68 13 L80 4 L92 10 L96 7" stroke="#ef4444" strokeWidth="1.5" fill="none" />
    <path d="M0 26 L12 18 L20 22 L32 10 L44 16 L56 8 L68 13 L80 4 L92 10 L96 7 L96 36 L0 36 Z" fill="url(#spkGrad)" />
  </svg>
);

// ── Main component ────────────────────────────────────────────────────────────

export default function DriftDashboard({ data }: { data: DriftOverview }) {
  const [selectedClient, setSelectedClient] = useState<string | null>(null);

  // ── Lookup maps ──────────────────────────────────────────────────────────────
  const scoreByOppId = new Map(data.opportunities.map(o => [o.id, o.score]));
  const oppById = new Map(data.opportunities.map(o => [o.id, o]));

  // ── Filtered data ────────────────────────────────────────────────────────────
  const visibleOpps = selectedClient
    ? data.opportunities.filter(o => o.accounts?.name === selectedClient)
    : data.opportunities;

  const visibleInterventions = selectedClient
    ? data.interventions.filter(iv => iv.opportunities?.accounts?.name === selectedClient)
    : data.interventions;

  const sortedInterventions = [...visibleInterventions].sort((a, b) =>
    Number(scoreByOppId.get(b.opportunity_id)?.drift_score ?? 0) -
    Number(scoreByOppId.get(a.opportunity_id)?.drift_score ?? 0)
  );

  // ── KPIs ─────────────────────────────────────────────────────────────────────
  const portfolioValue = visibleOpps.reduce((s, o) => s + Number(o.value ?? 0), 0);
  const revenueAtRisk = visibleOpps.reduce((s, o) => s + Number(o.score?.revenue_at_risk ?? 0), 0);
  const exposurePct = portfolioValue > 0 ? Math.min(100, (revenueAtRisk / portfolioValue) * 100) : 0;
  const criticalCount = visibleOpps.filter(o => o.score?.drift_level === "critical").length;

  // ── Snapshot freshness ───────────────────────────────────────────────────────
  const latestScoredAt = data.opportunities.map(o => o.score?.scored_at).filter(Boolean).sort().at(-1) ?? null;
  const snapshotLabel = timeAgo(latestScoredAt);
  const ageMs = latestScoredAt ? Date.now() - new Date(latestScoredAt).getTime() : null;
  const freshnessTier = ageMs === null ? "none" : ageMs < 3_600_000 ? "green" : ageMs < 86_400_000 ? "amber" : "red";

  // ── Revenue leaking (7 days) ─────────────────────────────────────────────────
  const cutoff = Date.now() - 7 * 86_400_000;
  const leaking = visibleOpps
    .filter(o =>
      ["watch", "decaying", "critical"].includes(o.score?.drift_level ?? "") &&
      o.score?.scored_at && new Date(o.score.scored_at).getTime() >= cutoff
    )
    .sort((a, b) => Number(b.score?.revenue_at_risk ?? 0) - Number(a.score?.revenue_at_risk ?? 0))
    .slice(0, 5);

  // ── Sidebar clients ──────────────────────────────────────────────────────────
  type SClient = { name: string; level: string; risk: number; value: number };
  const cMap = new Map<string, SClient>();
  for (const opp of data.opportunities) {
    const name = opp.accounts?.name ?? "Unknown";
    const level = opp.score?.drift_level ?? "healthy";
    const risk = Number(opp.score?.revenue_at_risk ?? 0);
    const val = Number(opp.value ?? 0);
    const prev = cMap.get(name);
    if (!prev) {
      cMap.set(name, { name, level, risk, value: val });
    } else {
      const maxLevel = (LEVEL_ORDER[level] ?? 0) > (LEVEL_ORDER[prev.level] ?? 0) ? level : prev.level;
      cMap.set(name, { name, level: maxLevel, risk: prev.risk + risk, value: prev.value + val });
    }
  }
  const sidebarClients = Array.from(cMap.values())
    .sort((a, b) => (LEVEL_ORDER[b.level] ?? 0) - (LEVEL_ORDER[a.level] ?? 0) || b.risk - a.risk);

  // ── Operational confidence ────────────────────────────────────────────────────
  const scored = visibleOpps.filter(o => o.score !== null).length;
  const opConf = visibleOpps.length > 0 ? Math.round((scored / visibleOpps.length) * 100) : 100;

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden bg-[#0b0f1c] text-white antialiased">

      {/* ══════════ SIDEBAR ══════════ */}
      <aside className="flex h-full w-56 shrink-0 flex-col bg-[#090c17] border-r border-white/[0.06]">

        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/20">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M4 4 L16 10 L4 16 L7 10 Z" fill="#3b82f6" />
            </svg>
          </div>
          <span className="text-[17px] font-semibold text-white tracking-tight">Drift</span>
        </div>

        {/* Workspace label */}
        <div className="px-5 pb-2 pt-1">
          <p className="text-[9px] font-medium uppercase tracking-[0.5em] text-slate-600">Drift</p>
          <p className="mt-0.5 text-[11px] font-medium text-slate-400">Cognitive Empire Internal</p>
        </div>

        <div className="mx-4 my-2 border-t border-white/[0.05]" />

        {/* Workspace / All Clients */}
        <div className="px-3 pb-2">
          <p className="mb-1.5 px-2 text-[9px] font-medium uppercase tracking-[0.45em] text-slate-600">Workspace</p>
          <button
            onClick={() => setSelectedClient(null)}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors ${selectedClient === null ? "bg-blue-500/[0.12] text-white" : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"}`}
          >
            <span className="text-[13px] font-medium">All Clients</span>
            <span className="rounded bg-white/[0.08] px-1.5 py-0.5 text-[10px] text-slate-400">
              {sidebarClients.length}
            </span>
          </button>
        </div>

        <div className="mx-4 border-t border-white/[0.05]" />

        {/* Navigation */}
        <nav className="px-3 py-3">
          <p className="mb-2 px-2 text-[9px] font-medium uppercase tracking-[0.45em] text-slate-600">Navigation</p>

          {/* Active: Revenue Execution */}
          <div className="mb-0.5 flex items-center gap-3 rounded-lg bg-blue-500/[0.12] px-3 py-2">
            <span className="text-blue-400"><IcoRevenue /></span>
            <span className="text-[13px] font-semibold text-white">Revenue Execution</span>
          </div>

          {/* Inactive items */}
          {[
            { label: "Interventions", icon: <IcoInterventions />, badge: data.summary.pendingInterventions > 0 ? data.summary.pendingInterventions : null },
            { label: "Reports",       icon: <IcoReports />,      badge: null },
            { label: "Data Sources",  icon: <IcoDataSources />,  badge: null },
            { label: "Settings",      icon: <IcoSettings />,     badge: null },
          ].map(item => (
            <div
              key={item.label}
              className="mb-0.5 flex cursor-default items-center justify-between rounded-lg px-3 py-2 text-slate-500 hover:bg-white/[0.04] hover:text-slate-300 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="opacity-60">{item.icon}</span>
                <span className="text-[13px]">{item.label}</span>
              </div>
              {item.badge !== null && (
                <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] text-red-400">{item.badge}</span>
              )}
            </div>
          ))}
        </nav>

        <div className="mx-4 border-t border-white/[0.05]" />

        {/* Clients */}
        <div className="flex-1 overflow-y-auto px-3 py-3">
          <div className="mb-2 flex items-center justify-between px-2">
            <p className="text-[9px] font-medium uppercase tracking-[0.45em] text-slate-600">Clients</p>
            <button className="text-slate-600 hover:text-slate-400 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>

          {sidebarClients.length === 0 ? (
            <p className="px-2 text-[11px] text-slate-700">No clients yet</p>
          ) : sidebarClients.map(client => {
            const dotColor =
              client.level === "critical" ? "#ef4444" :
              client.level === "decaying"  ? "#f97316" :
              client.level === "watch"     ? "#eab308" : "#22c55e";
            const expColor =
              client.level === "critical" ? "#f87171" :
              client.level === "decaying"  ? "#fb923c" :
              client.level === "watch"     ? "#fbbf24" : "#4ade80";
            return (
              <button
                key={client.name}
                onClick={() => setSelectedClient(selectedClient === client.name ? null : client.name)}
                className={`mb-1 flex w-full items-start gap-2.5 rounded-lg px-2 py-2 text-left transition-colors ${selectedClient === client.name ? "bg-blue-500/[0.12]" : "hover:bg-white/[0.04]"}`}
              >
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: dotColor }} />
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-medium text-slate-300">{client.name}</p>
                  {client.risk > 0 && (
                    <p className="text-[10px]" style={{ color: expColor }}>{usd(client.risk)} exposed</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Profile */}
        <div className="shrink-0 border-t border-white/[0.05] px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-[12px] font-bold text-white">
                E
              </div>
              <div>
                <p className="text-[12px] font-medium text-slate-200">Dr. E</p>
                <p className="text-[10px] text-slate-500">Operator</p>
              </div>
            </div>
            <span className="text-slate-600"><IcoChevronRight /></span>
          </div>
        </div>
      </aside>

      {/* ══════════ MAIN ══════════ */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Header */}
        <header className="flex shrink-0 items-start justify-between border-b border-white/[0.06] bg-[#0b0f1c] px-8 pb-4 pt-5">
          <div>
            <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.45em] text-slate-600">
              {selectedClient ?? "All Clients"}
            </p>
            <h1 className="text-[22px] font-bold text-white leading-tight">Revenue Execution</h1>
            <p className="mt-1 text-[12px] text-slate-500">Real-time visibility into revenue decay and required interventions.</p>
          </div>

          <div className="flex items-center gap-6 pt-1">
            <ImportCSV />

            <div className="text-right">
              <div className="flex items-center justify-end gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{
                  backgroundColor:
                    freshnessTier === "green" ? "#22c55e" :
                    freshnessTier === "amber" ? "#f59e0b" : "#ef4444"
                }} />
                <span className="text-[12px] text-slate-300">Last scored: <span className="text-white font-medium">{snapshotLabel}</span></span>
              </div>
              <div className="mt-0.5 flex items-center justify-end gap-1.5 text-[11px] text-slate-500">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
                Next refresh: Daily at midnight
              </div>
            </div>

            {/* Bell */}
            <div className="relative">
              <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-slate-400 hover:text-slate-200 transition-colors">
                <IcoBell />
              </button>
              {data.summary.pendingInterventions > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {data.summary.pendingInterventions > 9 ? "9+" : data.summary.pendingInterventions}
                </span>
              )}
            </div>
          </div>
        </header>

        {/* KPI Strip */}
        <div className="grid shrink-0 grid-cols-4 gap-4 border-b border-white/[0.06] bg-[#0b0f1c] px-8 py-5">

          {/* Revenue Exposure */}
          <div className="rounded-xl border border-white/[0.07] bg-[#0f1420] p-5">
            <div className="flex items-start justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-slate-500">
                Revenue Exposure<IcoInfo />
              </p>
            </div>
            <div className="mt-3 flex items-end justify-between">
              <div>
                <p className="text-[28px] font-bold leading-none text-red-400">{usd(revenueAtRisk)}</p>
                <p className="mt-2 text-[11px] text-slate-500">{exposurePct.toFixed(1)}% of portfolio</p>
              </div>
              <Sparkline />
            </div>
          </div>

          {/* Critical Decay */}
          <div className="rounded-xl border border-white/[0.07] bg-[#0f1420] p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-slate-500">Critical Decay</p>
            <div className="mt-3 flex items-center justify-between">
              <div>
                <p className={`text-[28px] font-bold leading-none ${criticalCount > 0 ? "text-white" : "text-slate-600"}`}>{criticalCount}</p>
                <p className="mt-2 text-[11px] text-slate-500">critical opportunities</p>
              </div>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.8 }}>
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
          </div>

          {/* Intervention Backlog */}
          <div className="rounded-xl border border-white/[0.07] bg-[#0f1420] p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-slate-500">
              Intervention Backlog<IcoInfo />
            </p>
            <div className="mt-3 flex items-center justify-between">
              <div>
                <p className={`text-[28px] font-bold leading-none ${sortedInterventions.length > 0 ? "text-orange-400" : "text-slate-600"}`}>
                  {sortedInterventions.length}
                </p>
                <p className="mt-2 text-[11px] text-slate-500">unresolved actions</p>
              </div>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.8 }}>
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
          </div>

          {/* Snapshot Freshness */}
          <div className="rounded-xl border border-white/[0.07] bg-[#0f1420] p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-slate-500">
              Snapshot Freshness<IcoInfo />
            </p>
            <div className="mt-3 flex items-center justify-between">
              <div>
                <p className={`text-[28px] font-bold leading-none ${freshnessTier === "green" ? "text-emerald-400" : freshnessTier === "amber" ? "text-amber-400" : "text-red-400"}`}>
                  {snapshotLabel}
                </p>
                <p className="mt-2 text-[11px] text-slate-500">last scored</p>
              </div>
              {freshnessTier === "green" ? (
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.8 }}>
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              ) : (
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={freshnessTier === "amber" ? "#f59e0b" : "#ef4444"} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.8 }}>
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">

          {/* ── Center ── */}
          <main className="flex-1 overflow-y-auto px-8 py-6">

            {/* Queue header */}
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-[20px] font-bold text-white">Intervention Queue</h2>
                {sortedInterventions.length > 0 && (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-[11px] font-bold text-white">
                    {sortedInterventions.length}
                  </span>
                )}
              </div>
              <button className="flex items-center gap-1.5 rounded-lg border border-white/[0.1] px-4 py-2 text-[12px] text-slate-300 transition-colors hover:border-white/[0.2] hover:text-white">
                View all interventions <IcoChevronRight />
              </button>
            </div>

            {sortedInterventions.length === 0 ? (
              <div className="rounded-xl border border-white/[0.06] py-16 text-center">
                <p className="text-[14px] text-slate-500">No pending interventions.</p>
                <p className="mt-1.5 text-[11px] text-slate-700">
                  {selectedClient ? `No interventions for ${selectedClient}.` : "Run the scoring engine to generate actions."}
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-white/[0.06]">

                {/* Column headers */}
                <div className="grid border-b border-white/[0.06] bg-[#0d1220]"
                  style={{ gridTemplateColumns: "2fr 0.7fr 0.7fr 1.5fr 1.8fr 0.75fr auto" }}>
                  {[
                    { h: "OPPORTUNITY",            cls: "px-5 py-3" },
                    { h: "STAGE",                  cls: "px-3 py-3" },
                    { h: "EXPOSURE",               cls: "px-3 py-3" },
                    { h: "DECAY REASONS",          cls: "px-3 py-3" },
                    { h: "REQUIRED INTERVENTION",  cls: "px-3 py-3" },
                    { h: "URGENCY",                cls: "px-3 py-3" },
                    { h: "ACTION",                 cls: "px-3 py-3" },
                  ].map(({ h, cls }) => (
                    <div key={h} className={`text-[9px] font-semibold uppercase tracking-[0.35em] text-slate-600 ${cls}`}>{h}</div>
                  ))}
                </div>

                {/* Rows */}
                {sortedInterventions.map((iv, idx) => {
                  const score = scoreByOppId.get(iv.opportunity_id);
                  const opp = oppById.get(iv.opportunity_id);
                  const level = score?.drift_level ?? PRIORITY_TO_LEVEL[iv.priority] ?? "watch";
                  const riskAmt = Number(score?.revenue_at_risk ?? iv.opportunities?.value ?? 0);
                  const riskPct = portfolioValue > 0 ? (riskAmt / portfolioValue) * 100 : 0;
                  const bullets = firstBullets(score?.scoring_notes);
                  const due = daysUntil(opp?.next_action_due_date ?? iv.opportunities?.next_action_due_date);
                  const acctName = iv.opportunities?.accounts?.name ?? "Unknown";
                  const dealTitle = iv.opportunities?.title ?? "—";
                  const stage = iv.opportunities?.stage ?? opp?.stage ?? null;
                  const owner = opp?.accounts?.contact_name ?? iv.opportunities?.accounts?.contact_name ?? null;
                  const isLate = stage ? LATE_STAGES.has(stage) : false;

                  const leftColor =
                    level === "critical" ? "#ef4444" :
                    level === "decaying"  ? "#f97316" :
                    level === "watch"     ? "#eab308" : "#334155";

                  const amtColor =
                    level === "critical" ? "#f87171" :
                    level === "decaying"  ? "#fb923c" :
                    level === "watch"     ? "#fbbf24" : "#94a3b8";

                  const riskTagCls =
                    level === "critical" ? "text-red-400" :
                    level === "decaying"  ? "text-orange-400" :
                    level === "watch"     ? "text-yellow-400" : "text-emerald-400";

                  const riskLabel =
                    level === "critical" ? "High-Risk" :
                    level === "decaying"  ? "At Risk" :
                    level === "watch"     ? "Watch" : "Low Risk";

                  const urgencyBadgeCls =
                    level === "critical" ? "border-red-500 text-red-400" :
                    level === "decaying"  ? "border-orange-500 text-orange-400" :
                    level === "watch"     ? "border-yellow-500 text-yellow-400" : "border-slate-600 text-slate-400";

                  const urgencyLabel =
                    level === "critical" ? "CRITICAL" :
                    level === "decaying"  ? "DECAYING" :
                    level === "watch"     ? "WATCH" : level.toUpperCase();

                  const dueColor =
                    due === null ? "#64748b" :
                    due < 0 ? "#f87171" :
                    due <= 2 ? "#f87171" :
                    due <= 5 ? "#fb923c" : "#94a3b8";

                  const dueLabel =
                    due === null ? null :
                    due < 0 ? `Overdue by ${Math.abs(due)}d` :
                    due === 0 ? "Due today" :
                    due === 1 ? "Due in 1 day" :
                    `Due in ${due} days`;

                  return (
                    <div
                      key={iv.id}
                      className={`grid items-start bg-[#0a0e1b] transition-colors hover:bg-[#0d1220] ${idx > 0 ? "border-t border-white/[0.05]" : ""}`}
                      style={{
                        gridTemplateColumns: "2fr 0.7fr 0.7fr 1.5fr 1.8fr 0.75fr auto",
                        borderLeft: `2.5px solid ${leftColor}`,
                      }}
                    >
                      {/* Opportunity */}
                      <div className="px-5 py-4">
                        <p className="text-[14px] font-semibold text-white">{acctName}</p>
                        <p className="mt-0.5 text-[11px] text-slate-500">{dealTitle}</p>
                        {owner && (
                          <div className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-600">
                            <IcoPerson />{owner}
                          </div>
                        )}
                      </div>

                      {/* Stage */}
                      <div className="px-3 py-4">
                        <p className="text-[12px] text-slate-400">{stage ?? "—"}</p>
                        <p className={`mt-1 text-[11px] font-medium ${riskTagCls}`}>{riskLabel}</p>
                        {isLate && <p className="mt-0.5 text-[10px] text-orange-400/80">Late Stage</p>}
                      </div>

                      {/* Exposure */}
                      <div className="px-3 py-4">
                        <p className="text-[14px] font-bold" style={{ color: amtColor }}>{usd(riskAmt)}</p>
                        <p className="mt-0.5 text-[11px] text-slate-600">{riskPct.toFixed(1)}%</p>
                      </div>

                      {/* Decay Reasons */}
                      <div className="px-3 py-4">
                        {bullets.length > 0 ? (
                          <ul className="space-y-1.5">
                            {bullets.map((b, i) => (
                              <li key={i} className="flex items-start gap-1.5 text-[11px] text-slate-400">
                                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-600" />
                                {b}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-[11px] text-slate-700">No scoring data</p>
                        )}
                      </div>

                      {/* Required Intervention */}
                      <div className="px-3 py-4">
                        <p className="text-[12px] leading-[1.5] text-slate-200">{iv.recommended_action}</p>
                        {dueLabel && (
                          <p className="mt-2 text-[11px] font-medium" style={{ color: dueColor }}>{dueLabel}</p>
                        )}
                      </div>

                      {/* Urgency */}
                      <div className="flex items-start px-3 py-4">
                        <span className={`rounded border px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider ${urgencyBadgeCls}`}>
                          {urgencyLabel}
                        </span>
                      </div>

                      {/* Action */}
                      <div className="flex items-start px-3 py-4">
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

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-white/[0.05] bg-[#0d1220] px-5 py-3">
                  <p className="text-[11px] text-slate-600">
                    Showing {sortedInterventions.length} of {data.interventions.length} interventions
                  </p>
                  <button className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 transition-colors">
                    View all interventions <IcoChevronRight />
                  </button>
                </div>
              </div>
            )}
          </main>

          {/* ── Right column ── */}
          <aside className="w-80 shrink-0 overflow-y-auto border-l border-white/[0.06] px-5 py-6">

            {/* Recommended Interventions */}
            <div className="mb-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-[14px] font-bold text-white">Recommended Interventions</h3>
                <button className="text-[12px] font-medium text-blue-400 hover:text-blue-300 transition-colors">View all</button>
              </div>

              {sortedInterventions.length === 0 ? (
                <p className="text-[12px] text-slate-600">No interventions pending.</p>
              ) : (
                <div className="space-y-3">
                  {sortedInterventions.slice(0, 3).map((iv, i) => {
                    const clientName = iv.opportunities?.accounts?.name ?? "Unknown";
                    const opp = oppById.get(iv.opportunity_id);
                    const owner = opp?.accounts?.contact_name ?? iv.opportunities?.accounts?.contact_name ?? null;
                    const pLabel = iv.priority === "high" ? "P1" : iv.priority === "medium" ? "P2" : "P3";
                    const pBg = iv.priority === "high" ? "bg-red-500/20 text-red-400" : "bg-orange-500/20 text-orange-400";
                    const iconBgs = ["bg-red-500/20", "bg-orange-500/20", "bg-blue-500/20"];
                    const iconBg = iconBgs[i] ?? "bg-slate-700/50";
                    const icons = [
                      // Phone icon
                      <svg key="p" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.68A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z" /></svg>,
                      // Arrows icon
                      <svg key="a" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 014-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 01-4 4H3" /></svg>,
                      // Refresh icon
                      <svg key="r" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" /></svg>,
                    ];
                    const iconColor = i === 0 ? "#f87171" : i === 1 ? "#fb923c" : "#60a5fa";
                    return (
                      <div key={iv.id} className="rounded-xl border border-white/[0.07] bg-[#0f1420] p-4">
                        <div className="flex items-start gap-3">
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconBg}`} style={{ color: iconColor }}>
                            {icons[i]}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="line-clamp-2 text-[13px] font-semibold leading-snug text-white">{iv.recommended_action}</p>
                              <span className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-bold ${pBg}`}>{pLabel}</span>
                            </div>
                            <p className="mt-1.5 text-[11px] text-slate-500">{clientName}</p>
                            {owner && (
                              <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-600">
                                <IcoPerson />{owner}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <button className="mt-3 flex items-center gap-1 text-[12px] text-blue-400 hover:text-blue-300 transition-colors">
                View all interventions <IcoChevronRight />
              </button>
            </div>

            <div className="mb-5 border-t border-white/[0.06]" />

            {/* Revenue Leaking */}
            <div>
              <h3 className="mb-4 text-[14px] font-bold text-white">Revenue Leaking This Week</h3>

              {leaking.length === 0 ? (
                <p className="text-[12px] text-emerald-600">No revenue at risk this week.</p>
              ) : (
                <>
                  {/* Table header */}
                  <div className="mb-2 grid gap-x-2" style={{ gridTemplateColumns: "1.2fr 0.9fr auto 1.1fr" }}>
                    {["Opportunity", "Client", "Exposure", "Why It Leaked"].map((h, i) => (
                      <p key={i} className="text-[9px] font-semibold uppercase tracking-[0.3em] text-slate-600">{h}</p>
                    ))}
                  </div>

                  {leaking.map((opp, idx) => {
                    const level = opp.score?.drift_level ?? "watch";
                    const riskAmt = Number(opp.score?.revenue_at_risk ?? 0);
                    const amtColor =
                      level === "critical" ? "#f87171" :
                      level === "decaying"  ? "#fb923c" :
                      level === "watch"     ? "#fbbf24" : "#94a3b8";
                    const why = shortNote(opp.score?.scoring_notes);
                    return (
                      <div
                        key={opp.id}
                        className={`grid gap-x-2 py-2.5 text-[11px] ${idx > 0 ? "border-t border-white/[0.04]" : ""}`}
                        style={{ gridTemplateColumns: "1.2fr 0.9fr auto 1.1fr" }}
                      >
                        <p className="truncate text-slate-300 font-medium">{opp.title}</p>
                        <p className="truncate text-slate-500">{opp.accounts?.name ?? "—"}</p>
                        <p className="font-bold" style={{ color: amtColor }}>{usd(riskAmt)}</p>
                        <p className="truncate text-slate-600">{why}</p>
                      </div>
                    );
                  })}

                  <button className="mt-3 flex items-center gap-1 text-[12px] text-blue-400 hover:text-blue-300 transition-colors">
                    View full leaking report <IcoChevronRight />
                  </button>
                </>
              )}
            </div>
          </aside>
        </div>

        {/* Status Bar */}
        <footer className="flex shrink-0 items-center justify-between border-t border-white/[0.06] bg-[#0b0f1c] px-8 py-2.5">
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span className="text-[12px] text-slate-400">
              Operational confidence:{" "}
              <span className={`font-semibold ${opConf >= 90 ? "text-emerald-400" : opConf >= 60 ? "text-blue-400" : "text-red-400"}`}>
                {opConf}%
              </span>
            </span>
            <span className="text-[12px] text-slate-600">
              {opConf < 80 ? "Score confidence reduced due to stale opportunities" : "Pipeline coverage is current"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[12px] text-slate-500">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Scoring: Daily
          </div>
        </footer>
      </div>
    </div>
  );
}
