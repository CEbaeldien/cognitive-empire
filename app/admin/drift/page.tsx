import EvidenceModal from "./EvidenceModal";
import ImportCSV from "./ImportCSV";
import { getDriftOverview } from "@/lib/drift/data";

// ── Style maps ────────────────────────────────────────────────────────────────

const LEVEL_BORDER: Record<string, string> = {
  critical: "border-l-red-500",
  decaying: "border-l-orange-500",
  watch: "border-l-yellow-500",
  healthy: "border-l-slate-800",
};

const LEVEL_DOT: Record<string, string> = {
  critical: "bg-red-500",
  decaying: "bg-orange-500",
  watch: "bg-yellow-500",
  healthy: "bg-emerald-500",
};

const LEVEL_RISK_PILL: Record<string, string> = {
  critical: "border-red-500/25 bg-red-500/10 text-red-400",
  decaying: "border-orange-500/25 bg-orange-500/10 text-orange-400",
  watch: "border-yellow-500/25 bg-yellow-500/10 text-yellow-400",
  healthy: "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
};

const LEVEL_RISK_LABEL: Record<string, string> = {
  critical: "Critical",
  decaying: "Decaying",
  watch: "At Risk",
  healthy: "Healthy",
};

const URGENCY_BADGE: Record<string, string> = {
  critical: "border-red-500/35 bg-red-500/10 text-red-400",
  decaying: "border-orange-500/35 bg-orange-500/10 text-orange-400",
  watch: "border-yellow-500/35 bg-yellow-500/10 text-yellow-400",
};

const EXPOSURE_TEXT: Record<string, string> = {
  critical: "text-red-400",
  decaying: "text-orange-400",
  watch: "text-yellow-400",
  healthy: "text-slate-500",
};

const P_BADGE: Record<string, { label: string; cls: string; iconCls: string }> = {
  high:   { label: "P1", cls: "border-red-500/20 bg-red-500/10 text-red-400",    iconCls: "bg-red-500/15 text-red-400"    },
  medium: { label: "P2", cls: "border-orange-500/20 bg-orange-500/10 text-orange-400", iconCls: "bg-orange-500/15 text-orange-400" },
  low:    { label: "P3", cls: "border-yellow-500/20 bg-yellow-500/10 text-yellow-400", iconCls: "bg-yellow-500/15 text-yellow-400" },
};

const PRIORITY_TO_LEVEL: Record<string, string> = {
  high: "critical",
  medium: "decaying",
  low: "watch",
};

const LEVEL_ORDER: Record<string, number> = { healthy: 0, watch: 1, decaying: 2, critical: 3 };

// ── Helpers ───────────────────────────────────────────────────────────────────

function money(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}

function decayBullets(notes: string | null | undefined): string[] {
  if (!notes) return [];
  return notes
    .split(/\.\s+/)
    .map((s) => s.replace(/\.$/, "").trim())
    .filter(Boolean)
    .slice(0, 4);
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function DriftAdminPage() {
  const data = await getDriftOverview();

  // ── computed values ──
  const portfolioValue = data.opportunities.reduce((s, o) => s + Number(o.value ?? 0), 0);
  const revenueAtRisk = data.summary.totalRevenueAtRisk;
  const exposurePct = portfolioValue > 0 ? Math.min(100, (revenueAtRisk / portfolioValue) * 100) : 0;

  const latestScoredAt =
    data.opportunities.map((o) => o.score?.scored_at).filter(Boolean).sort().at(-1) ?? null;
  const snapshotAge = timeAgo(latestScoredAt);
  const isFresh = latestScoredAt
    ? Date.now() - new Date(latestScoredAt).getTime() < 86400000
    : false;

  const leaking = data.opportunities
    .filter((o) => ["watch", "decaying", "critical"].includes(o.score?.drift_level ?? ""))
    .sort((a, b) => Number(b.score?.revenue_at_risk ?? 0) - Number(a.score?.revenue_at_risk ?? 0))
    .slice(0, 5);

  // lookup maps
  const scoreByOppId = new Map(data.opportunities.map((o) => [o.id, o.score]));
  const oppById = new Map(data.opportunities.map((o) => [o.id, o]));

  // sidebar clients grouped by account
  const accountMap = new Map<string, { name: string; level: string; risk: number }>();
  for (const opp of data.opportunities) {
    const name = opp.accounts?.name ?? "Unknown";
    const level = opp.score?.drift_level ?? "healthy";
    const risk = Number(opp.score?.revenue_at_risk ?? 0);
    const existing = accountMap.get(name);
    if (!existing) {
      accountMap.set(name, { name, level, risk });
    } else {
      const maxLevel =
        (LEVEL_ORDER[level] ?? 0) > (LEVEL_ORDER[existing.level] ?? 0) ? level : existing.level;
      accountMap.set(name, { name, level: maxLevel, risk: existing.risk + risk });
    }
  }
  const sidebarClients = Array.from(accountMap.values()).sort((a, b) => b.risk - a.risk);

  // operational confidence
  const scoredCount = data.opportunities.filter((o) => o.score !== null).length;
  const opConf =
    data.opportunities.length > 0
      ? Math.round((scoredCount / data.opportunities.length) * 100)
      : 100;
  const confColor =
    opConf >= 90 ? "text-emerald-400" : opConf >= 60 ? "text-amber-400" : "text-red-400";

  return (
    <div className="flex h-screen overflow-hidden bg-[#080c1a] font-sans text-slate-100">

      {/* ──────────────────────── SIDEBAR ──────────────────────── */}
      <aside className="flex h-full w-56 shrink-0 flex-col border-r border-slate-800/60 bg-[#090d1e]">

        {/* Wordmark */}
        <div className="px-5 pb-4 pt-5">
          <p className="text-[9px] font-semibold uppercase tracking-[0.55em] text-slate-400">Drift</p>
          <p className="mt-0.5 text-[11px] text-slate-600">Cognitive Empire Internal</p>
        </div>

        <div className="mx-4 border-t border-slate-800/50" />

        {/* Workspace */}
        <div className="px-4 py-3">
          <p className="mb-2 text-[9px] uppercase tracking-[0.4em] text-slate-600">Workspace</p>
          <div className="flex items-center justify-between rounded-md px-2 py-1.5">
            <span className="text-[13px] text-slate-300">All Clients</span>
            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-500">
              {sidebarClients.length}
            </span>
          </div>
        </div>

        <div className="mx-4 border-t border-slate-800/50" />

        {/* Navigation */}
        <nav className="px-3 py-3">
          <p className="mb-2 px-2 text-[9px] uppercase tracking-[0.4em] text-slate-600">Navigation</p>

          <div className="mb-0.5 flex items-center gap-2.5 rounded-md bg-[#182040] px-3 py-2">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
            <span className="text-[13px] font-medium text-slate-100">Revenue Execution</span>
          </div>

          {[
            {
              label: "Interventions",
              badge: data.summary.pendingInterventions > 0 ? data.summary.pendingInterventions : null,
              badgeCls: "bg-red-500/20 text-red-400",
            },
            { label: "Reports",      badge: null, badgeCls: "" },
            { label: "Data Sources", badge: null, badgeCls: "" },
            { label: "Settings",     badge: null, badgeCls: "" },
          ].map((item) => (
            <div
              key={item.label}
              className="mb-0.5 flex cursor-default items-center justify-between rounded-md px-3 py-2 text-slate-500 transition-colors hover:bg-slate-800/40 hover:text-slate-300"
            >
              <span className="text-[13px]">{item.label}</span>
              {item.badge !== null && (
                <span className={`rounded px-1.5 py-0.5 text-[10px] ${item.badgeCls}`}>
                  {item.badge}
                </span>
              )}
            </div>
          ))}
        </nav>

        <div className="mx-4 border-t border-slate-800/50" />

        {/* Clients */}
        <div className="flex-1 overflow-y-auto px-3 py-3">
          <div className="mb-2 flex items-center justify-between px-2">
            <p className="text-[9px] uppercase tracking-[0.4em] text-slate-600">Clients</p>
            <span className="cursor-default text-[14px] leading-none text-slate-700 hover:text-slate-500">+</span>
          </div>
          {sidebarClients.length === 0 ? (
            <p className="px-2 text-[11px] text-slate-700">No clients yet</p>
          ) : (
            sidebarClients.map((client) => (
              <div
                key={client.name}
                className="flex cursor-default items-center justify-between rounded-md px-2 py-1.5 transition-colors hover:bg-slate-800/30"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${LEVEL_DOT[client.level] ?? "bg-slate-600"}`}
                  />
                  <span className="truncate text-[12px] text-slate-400">{client.name}</span>
                </div>
                {client.risk > 0 && (
                  <span className={`ml-1.5 shrink-0 text-[10px] ${EXPOSURE_TEXT[client.level] ?? "text-slate-600"}`}>
                    {money(client.risk)}
                  </span>
                )}
              </div>
            ))
          )}
        </div>

        {/* Profile */}
        <div className="shrink-0 border-t border-slate-800/50 px-4 py-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-700 text-[11px] font-semibold text-slate-300">
                E
              </div>
              <div>
                <p className="text-[12px] font-medium text-slate-300">Dr. E</p>
                <p className="text-[10px] text-slate-600">Operator</p>
              </div>
            </div>
            <svg className="h-3.5 w-3.5 text-slate-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </aside>

      {/* ──────────────────────── MAIN AREA ──────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* ── TOP HEADER ── */}
        <header className="flex shrink-0 items-center justify-between border-b border-slate-800/60 bg-[#080c1a] px-7 py-4">
          <div>
            <h1 className="text-[20px] font-semibold tracking-tight text-white">Revenue Execution</h1>
            <p className="mt-0.5 text-[12px] text-slate-500">
              Real-time visibility into revenue decay and required interventions.
            </p>
          </div>

          <div className="flex items-center gap-5">
            <ImportCSV />

            <div className="text-right">
              <p className="text-[11px] text-slate-500">Last scored {snapshotAge}</p>
              <p className="text-[10px] text-slate-600">Next: Daily at midnight</p>
            </div>

            {/* Notification bell */}
            <div className="relative">
              <div className="flex h-8 w-8 items-center justify-center rounded border border-slate-800 bg-[#0d1224] text-slate-500">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              {data.summary.pendingInterventions > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                  {data.summary.pendingInterventions > 9 ? "9+" : data.summary.pendingInterventions}
                </span>
              )}
            </div>
          </div>
        </header>

        {/* ── CONTENT BODY ── */}
        <div className="flex flex-1 overflow-hidden">

          {/* ── CENTER COLUMN ── */}
          <main className="flex-1 overflow-y-auto px-7 py-6">

            {/* KPI STRIP */}
            <div className="mb-6 grid grid-cols-4 gap-4">

              {/* Revenue Exposure */}
              <div className="rounded-lg border border-slate-800/60 bg-[#0d1224] px-5 py-4">
                <div className="flex items-start justify-between">
                  <p className="text-[10px] uppercase tracking-[0.4em] text-slate-600">Revenue Exposure</p>
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500/60" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="mt-2.5 text-[24px] font-semibold leading-none text-red-400">{money(revenueAtRisk)}</p>
                <p className="mt-1.5 text-[11px] text-slate-600">{exposurePct.toFixed(1)}% of portfolio</p>
              </div>

              {/* Critical Decay */}
              <div className="rounded-lg border border-slate-800/60 bg-[#0d1224] px-5 py-4">
                <div className="flex items-start justify-between">
                  <p className="text-[10px] uppercase tracking-[0.4em] text-slate-600">Critical Decay</p>
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500/60" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className={`mt-2.5 text-[24px] font-semibold leading-none ${data.summary.criticalDrift > 0 ? "text-red-400" : "text-slate-600"}`}>
                  {data.summary.criticalDrift}
                </p>
                <p className="mt-1.5 text-[11px] text-slate-600">
                  {data.summary.criticalDrift === 1 ? "opportunity" : "opportunities"}
                </p>
              </div>

              {/* Intervention Backlog */}
              <div className="rounded-lg border border-slate-800/60 bg-[#0d1224] px-5 py-4">
                <div className="flex items-start justify-between">
                  <p className="text-[10px] uppercase tracking-[0.4em] text-slate-600">Intervention Backlog</p>
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-orange-500/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <p className={`mt-2.5 text-[24px] font-semibold leading-none ${data.summary.pendingInterventions > 0 ? "text-orange-400" : "text-slate-600"}`}>
                  {data.summary.pendingInterventions}
                </p>
                <p className="mt-1.5 text-[11px] text-slate-600">pending actions</p>
              </div>

              {/* Snapshot Freshness */}
              <div className="rounded-lg border border-slate-800/60 bg-[#0d1224] px-5 py-4">
                <div className="flex items-start justify-between">
                  <p className="text-[10px] uppercase tracking-[0.4em] text-slate-600">Snapshot Freshness</p>
                  {isFresh ? (
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500/70" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <p className="mt-2.5 text-[24px] font-semibold leading-none text-slate-300">{snapshotAge}</p>
                <p className="mt-1.5 text-[11px] text-slate-600">last scored</p>
              </div>
            </div>

            {/* INTERVENTION QUEUE */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-[16px] font-semibold tracking-tight">Intervention Queue</h2>
                  {data.interventions.length > 0 && (
                    <span className="rounded border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-red-400">
                      {data.interventions.length}
                    </span>
                  )}
                </div>
                <button className="text-[12px] text-slate-600 transition-colors hover:text-slate-300">
                  View all interventions →
                </button>
              </div>

              {data.interventions.length === 0 ? (
                <div className="rounded-lg border border-slate-800/50 px-8 py-14 text-center">
                  <p className="text-sm text-slate-600">No pending interventions.</p>
                  <p className="mt-1 text-[11px] text-slate-700">Run the scoring engine to generate actions.</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-lg border border-slate-800/60">
                  {/* Table header */}
                  <div className="grid grid-cols-[1.8fr_0.85fr_0.85fr_1.7fr_1.8fr_0.8fr_auto] border-b border-slate-800/60 bg-[#0d1224]">
                    {["Opportunity", "Stage", "Exposure", "Decay Reasons", "Required Intervention", "Urgency", ""].map(
                      (h, i) => (
                        <div key={i} className="px-4 py-3">
                          <p className="text-[9px] uppercase tracking-[0.4em] text-slate-600">{h}</p>
                        </div>
                      )
                    )}
                  </div>

                  {/* Table rows */}
                  {data.interventions.map((iv, idx) => {
                    const score = scoreByOppId.get(iv.opportunity_id);
                    const opp = oppById.get(iv.opportunity_id);
                    const level =
                      score?.drift_level ?? PRIORITY_TO_LEVEL[iv.priority] ?? "watch";
                    const riskAmt = Number(
                      score?.revenue_at_risk ?? iv.opportunities?.value ?? 0
                    );
                    const riskPct =
                      portfolioValue > 0 ? (riskAmt / portfolioValue) * 100 : 0;
                    const bullets = decayBullets(score?.scoring_notes);
                    const due = daysUntil(opp?.next_action_due_date);
                    const accountName =
                      iv.opportunities?.accounts?.name ?? "Unknown Client";
                    const dealName = iv.opportunities?.title ?? "—";
                    const stage = iv.opportunities?.stage ?? opp?.stage ?? null;

                    return (
                      <div
                        key={iv.id}
                        className={`grid grid-cols-[1.8fr_0.85fr_0.85fr_1.7fr_1.8fr_0.8fr_auto] items-start border-l-2 ${LEVEL_BORDER[level] ?? "border-l-slate-800"} ${idx > 0 ? "border-t border-slate-800/40" : ""} bg-[#090d1e] transition-colors hover:bg-[#0e1428]`}
                      >
                        {/* Opportunity */}
                        <div className="px-4 py-4">
                          <p className="text-[13px] font-semibold leading-snug text-slate-100">
                            {accountName}
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-500">{dealName}</p>
                          {stage && (
                            <p className="mt-0.5 text-[10px] text-slate-700">{stage}</p>
                          )}
                        </div>

                        {/* Stage */}
                        <div className="px-4 py-4">
                          <p className="text-[12px] text-slate-400">{stage ?? "—"}</p>
                          <span
                            className={`mt-1.5 inline-block rounded border px-1.5 py-0.5 text-[9px] uppercase tracking-wide ${LEVEL_RISK_PILL[level] ?? LEVEL_RISK_PILL.watch}`}
                          >
                            {LEVEL_RISK_LABEL[level] ?? level}
                          </span>
                        </div>

                        {/* Exposure */}
                        <div className="px-4 py-4">
                          <p className={`text-[13px] font-semibold ${EXPOSURE_TEXT[level] ?? "text-slate-400"}`}>
                            {money(riskAmt)}
                          </p>
                          <p className="mt-0.5 text-[10px] text-slate-600">
                            {riskPct.toFixed(1)}%
                          </p>
                        </div>

                        {/* Decay Reasons */}
                        <div className="px-4 py-4">
                          {bullets.length > 0 ? (
                            <ul className="space-y-1">
                              {bullets.map((b, i) => (
                                <li key={i} className="flex items-start gap-1.5 text-[11px] text-slate-500">
                                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-700" />
                                  {b}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-[11px] text-slate-700">No scoring data</p>
                          )}
                        </div>

                        {/* Required Intervention */}
                        <div className="px-4 py-4">
                          <p className="text-[12px] leading-5 text-slate-300">
                            {iv.recommended_action}
                          </p>
                          {due !== null && (
                            <p
                              className={`mt-1.5 text-[10px] font-medium ${
                                due < 0
                                  ? "text-red-400"
                                  : due <= 3
                                  ? "text-red-400"
                                  : due <= 7
                                  ? "text-orange-400"
                                  : "text-slate-600"
                              }`}
                            >
                              {due < 0
                                ? `Overdue by ${Math.abs(due)}d`
                                : due === 0
                                ? "Due today"
                                : `Due in ${due}d`}
                            </p>
                          )}
                        </div>

                        {/* Urgency */}
                        <div className="px-4 py-4">
                          <span
                            className={`inline-block rounded border px-2 py-1 text-[9px] uppercase tracking-widest ${URGENCY_BADGE[level] ?? "border-slate-700 text-slate-500"}`}
                          >
                            {level === "critical"
                              ? "Critical"
                              : level === "decaying"
                              ? "Decaying"
                              : level === "watch"
                              ? "Watch"
                              : level}
                          </span>
                        </div>

                        {/* Action */}
                        <div className="flex items-start px-3 py-3.5">
                          <EvidenceModal
                            interventionId={iv.id}
                            recommendedAction={iv.recommended_action}
                            workspaceId={iv.workspace_id}
                            opportunityId={iv.opportunity_id}
                            accountId={iv.opportunities?.accounts?.id}
                          />
                        </div>
                      </div>
                    );
                  })}

                  {/* Table footer */}
                  <div className="flex items-center justify-between border-t border-slate-800/40 bg-[#0d1224] px-5 py-2.5">
                    <p className="text-[11px] text-slate-600">
                      Showing {data.interventions.length} of {data.interventions.length} interventions
                    </p>
                    <button className="text-[11px] text-slate-600 transition-colors hover:text-slate-300">
                      View all interventions →
                    </button>
                  </div>
                </div>
              )}
            </section>
          </main>

          {/* ── RIGHT COLUMN ── */}
          <div className="w-[272px] shrink-0 overflow-y-auto border-l border-slate-800/60 px-5 py-6">

            {/* Recommended Interventions */}
            <div className="mb-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-[13px] font-semibold text-slate-200">Recommended Interventions</h3>
                <button className="text-[11px] text-slate-600 transition-colors hover:text-slate-400">
                  View all
                </button>
              </div>

              {data.interventions.length === 0 ? (
                <p className="text-[12px] text-slate-700">No interventions pending.</p>
              ) : (
                <div className="space-y-3">
                  {data.interventions.slice(0, 3).map((iv) => {
                    const p = P_BADGE[iv.priority] ?? P_BADGE.low;
                    const clientName = iv.opportunities?.accounts?.name ?? "Unknown";
                    return (
                      <div
                        key={iv.id}
                        className="rounded-lg border border-slate-800/60 bg-[#0d1224] p-3.5"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[11px] font-bold ${p.iconCls}`}
                          >
                            {p.label}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-2 text-[12px] font-medium leading-snug text-slate-200">
                              {iv.recommended_action}
                            </p>
                            <div className="mt-2 flex items-center justify-between">
                              <p className="truncate text-[11px] text-slate-500">{clientName}</p>
                              <span
                                className={`ml-2 shrink-0 rounded border px-1.5 py-0.5 text-[9px] ${p.cls}`}
                              >
                                {p.label}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <button className="mt-3 text-[11px] text-slate-600 transition-colors hover:text-slate-400">
                View all interventions →
              </button>
            </div>

            <div className="mb-5 border-t border-slate-800/50" />

            {/* Revenue Leaking This Week */}
            <div>
              <h3 className="mb-4 text-[13px] font-semibold text-slate-200">
                Revenue Leaking This Week
              </h3>

              {leaking.length === 0 ? (
                <p className="text-[12px] text-emerald-600">No revenue at risk.</p>
              ) : (
                <>
                  <div className="mb-2 grid grid-cols-[1fr_auto_1.2fr] gap-x-3">
                    {["Opportunity", "Exposure", "Why It Leaked"].map((h) => (
                      <p key={h} className="text-[9px] uppercase tracking-[0.35em] text-slate-600">
                        {h}
                      </p>
                    ))}
                  </div>

                  <div>
                    {leaking.map((opp, idx) => {
                      const level = opp.score?.drift_level ?? "watch";
                      const riskAmt = Number(opp.score?.revenue_at_risk ?? 0);
                      const notes = opp.score?.scoring_notes ?? "—";
                      const short = notes.length > 52 ? notes.slice(0, 52) + "…" : notes;
                      return (
                        <div
                          key={opp.id}
                          className={`grid grid-cols-[1fr_auto_1.2fr] gap-x-3 py-2.5 ${idx > 0 ? "border-t border-slate-800/30" : ""}`}
                        >
                          <div className="min-w-0">
                            <p className="truncate text-[11px] font-medium leading-tight text-slate-300">
                              {opp.title}
                            </p>
                            <p className="truncate text-[10px] text-slate-600">
                              {opp.accounts?.name ?? "—"}
                            </p>
                          </div>
                          <p className={`text-[12px] font-semibold ${EXPOSURE_TEXT[level] ?? "text-slate-500"}`}>
                            {money(riskAmt)}
                          </p>
                          <p className="text-[10px] leading-4 text-slate-600">{short}</p>
                        </div>
                      );
                    })}
                  </div>

                  <button className="mt-3 text-[11px] text-slate-600 transition-colors hover:text-slate-400">
                    View full leaking report →
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── STATUS BAR ── */}
        <footer className="flex shrink-0 items-center justify-between border-t border-slate-800/50 bg-[#080c1a] px-7 py-2">
          <div className="flex items-center gap-2">
            <span className={`text-[13px] font-semibold ${confColor}`}>{opConf}%</span>
            <span className="text-[11px] text-slate-600">operational confidence</span>
          </div>
          <p className="text-[11px] text-slate-600">
            {opConf < 80
              ? "Score confidence reduced due to stale opportunities"
              : "Pipeline coverage is current"}
          </p>
          <p className="text-[11px] text-slate-600">Scoring: Daily</p>
        </footer>
      </div>
    </div>
  );
}
