import EvidenceModal from "@/app/admin/drift/EvidenceModal";
import { getDriftOverview } from "@/lib/drift/data";

type AccountSummary = {
  id: string;
  name: string;
  maxDriftLevel: string;
  revenueAtRisk: number;
  opportunityCount: number;
};

const LEVEL_ORDER = ["healthy", "watch", "decaying", "critical"];

const LEVEL_DOT: Record<string, string> = {
  healthy: "bg-emerald-500",
  watch: "bg-amber-400",
  decaying: "bg-amber-500",
  critical: "bg-red-500",
};

const PRIORITY_ACCENT: Record<string, string> = {
  high: "border-l-red-500",
  medium: "border-l-amber-500",
  low: "border-l-slate-700",
};

const PRIORITY_BADGE: Record<string, string> = {
  high: "border-red-500/20 bg-red-500/10 text-red-400",
  medium: "border-amber-500/20 bg-amber-500/10 text-amber-400",
  low: "border-slate-700 bg-slate-800/60 text-slate-500",
};

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

function buildAccountSummaries(opportunities: any[]): AccountSummary[] {
  const map = new Map<string, AccountSummary>();
  for (const opp of opportunities) {
    const id = opp.accounts?.id;
    const name = opp.accounts?.name ?? "Unknown";
    if (!id) continue;
    const level = opp.score?.drift_level ?? "healthy";
    const risk = Number(opp.score?.revenue_at_risk ?? 0);
    const existing = map.get(id);
    if (!existing) {
      map.set(id, { id, name, maxDriftLevel: level, revenueAtRisk: risk, opportunityCount: 1 });
    } else {
      const higher = LEVEL_ORDER.indexOf(level) > LEVEL_ORDER.indexOf(existing.maxDriftLevel);
      map.set(id, {
        ...existing,
        maxDriftLevel: higher ? level : existing.maxDriftLevel,
        revenueAtRisk: existing.revenueAtRisk + risk,
        opportunityCount: existing.opportunityCount + 1,
      });
    }
  }
  return [...map.values()].sort(
    (a, b) => LEVEL_ORDER.indexOf(b.maxDriftLevel) - LEVEL_ORDER.indexOf(a.maxDriftLevel)
  );
}

type PageProps = { searchParams: Promise<{ account?: string }> };

export default async function DriftPage({ searchParams }: PageProps) {
  const { account: activeAccountId } = await searchParams;
  const data = await getDriftOverview();

  const accounts = buildAccountSummaries(data.opportunities);

  const filteredOpps = activeAccountId
    ? data.opportunities.filter((o) => o.accounts?.id === activeAccountId)
    : data.opportunities;

  const filteredInterventions = activeAccountId
    ? data.interventions.filter((i) => i.opportunities?.accounts?.id === activeAccountId)
    : data.interventions;

  const activeAccount = activeAccountId ? accounts.find((a) => a.id === activeAccountId) : null;

  const portfolioValue = filteredOpps.reduce((s, o) => s + Number(o.value ?? 0), 0);
  const revenueAtRisk = filteredOpps.reduce((s, o) => s + Number(o.score?.revenue_at_risk ?? 0), 0);
  const exposurePct = portfolioValue > 0 ? Math.min(100, (revenueAtRisk / portfolioValue) * 100) : 0;
  const criticalCount = filteredOpps.filter((o) => o.score?.drift_level === "critical").length;

  const latestScoredAt =
    filteredOpps.map((o) => o.score?.scored_at).filter(Boolean).sort().at(-1) ?? null;
  const snapshotAge = timeAgo(latestScoredAt);

  const leaking = filteredOpps
    .filter((o) => ["watch", "decaying", "critical"].includes(o.score?.drift_level ?? ""))
    .sort((a, b) => Number(b.score?.revenue_at_risk ?? 0) - Number(a.score?.revenue_at_risk ?? 0));

  const interventionByOppId = new Map(filteredInterventions.map((i) => [i.opportunity_id, i]));

  return (
    <div className="flex min-h-screen bg-[#06080f] text-slate-100">
      {/* SIDEBAR */}
      <aside className="flex w-52 shrink-0 flex-col border-r border-slate-800/40 bg-[#06080f]">
        <div className="border-b border-slate-800/40 px-5 py-5">
          <p className="text-[10px] uppercase tracking-[0.45em] text-slate-700">Drift</p>
          <p className="mt-1 text-[13px] font-semibold text-slate-200">{data.workspace.name}</p>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <a
            href="/drift"
            className={`mb-0.5 flex items-center justify-between rounded-lg px-3 py-2 text-[13px] transition-colors ${
              !activeAccountId
                ? "bg-slate-800/70 text-slate-100"
                : "text-slate-500 hover:bg-slate-900 hover:text-slate-300"
            }`}
          >
            <span>All Clients</span>
            <span className="text-[11px] text-slate-700">{accounts.length}</span>
          </a>

          <p className="mb-2 mt-5 px-3 text-[10px] uppercase tracking-[0.45em] text-slate-700">
            Clients
          </p>

          {accounts.map((account) => (
            <a
              key={account.id}
              href={`/drift?account=${account.id}`}
              className={`mb-0.5 flex flex-col rounded-lg px-3 py-2.5 transition-colors ${
                activeAccountId === account.id
                  ? "bg-slate-800/70 text-slate-100"
                  : "text-slate-500 hover:bg-slate-900 hover:text-slate-300"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`mt-px h-1.5 w-1.5 shrink-0 rounded-full ${
                    LEVEL_DOT[account.maxDriftLevel] ?? "bg-slate-600"
                  }`}
                />
                <span className="truncate text-[13px]">{account.name}</span>
              </div>
              {account.revenueAtRisk > 0 && (
                <p className="mt-0.5 pl-[18px] text-[11px] text-slate-700">
                  {money(account.revenueAtRisk)} exposed
                </p>
              )}
            </a>
          ))}
        </nav>

        <div className="border-t border-slate-800/40 px-5 py-3">
          <p className="text-[11px] text-slate-700">
            {data.workspace_members.length} member
            {data.workspace_members.length !== 1 ? "s" : ""}
          </p>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 overflow-auto px-10 py-10">
        {/* HEADER */}
        <div className="mb-10">
          <p className="text-[10px] uppercase tracking-[0.45em] text-slate-600">
            {activeAccount ? activeAccount.name : "All Clients"}
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight">Revenue Execution</h1>
        </div>

        {/* KPI BAR */}
        <div className="mb-10 grid grid-cols-4 divide-x divide-slate-800/50 rounded-xl border border-slate-800/50 bg-slate-900/30">
          <div className="px-7 py-5">
            <p className="text-[10px] uppercase tracking-[0.4em] text-slate-600">Revenue Exposure</p>
            <p className="mt-3 text-[22px] font-semibold leading-none text-red-400">
              {money(revenueAtRisk)}
            </p>
            <p className="mt-2 text-[11px] text-slate-600">{exposurePct.toFixed(1)}% of portfolio</p>
          </div>

          <div className="px-7 py-5">
            <p className="text-[10px] uppercase tracking-[0.4em] text-slate-600">Critical Decay</p>
            <p
              className={`mt-3 text-[22px] font-semibold leading-none ${
                criticalCount > 0 ? "text-red-400" : "text-slate-600"
              }`}
            >
              {criticalCount}
            </p>
            <p className="mt-2 text-[11px] text-slate-600">
              {criticalCount === 1 ? "opportunity" : "opportunities"}
            </p>
          </div>

          <div className="px-7 py-5">
            <p className="text-[10px] uppercase tracking-[0.4em] text-slate-600">
              Intervention Backlog
            </p>
            <p
              className={`mt-3 text-[22px] font-semibold leading-none ${
                filteredInterventions.length > 0 ? "text-amber-400" : "text-slate-600"
              }`}
            >
              {filteredInterventions.length}
            </p>
            <p className="mt-2 text-[11px] text-slate-600">pending actions</p>
          </div>

          <div className="px-7 py-5">
            <p className="text-[10px] uppercase tracking-[0.4em] text-slate-600">
              Snapshot Freshness
            </p>
            <p className="mt-3 text-[22px] font-semibold leading-none text-slate-300">
              {snapshotAge}
            </p>
            <p className="mt-2 text-[11px] text-slate-600">last scored</p>
          </div>
        </div>

        {/* INTERVENTION QUEUE */}
        <section className="mb-12">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.45em] text-slate-600">
                Action Required
              </p>
              <h2 className="mt-1.5 text-xl font-semibold tracking-tight">Intervention Queue</h2>
            </div>
            {filteredInterventions.length > 0 && (
              <span className="rounded border border-red-500/20 bg-red-500/10 px-3 py-1 text-[10px] uppercase tracking-widest text-red-400">
                {filteredInterventions.length} pending
              </span>
            )}
          </div>

          {filteredInterventions.length === 0 ? (
            <div className="rounded-xl border border-slate-800/50 px-8 py-14 text-center">
              <p className="text-sm text-slate-600">No pending interventions.</p>
              <p className="mt-1 text-[11px] text-slate-700">
                {activeAccountId
                  ? "Try viewing all clients."
                  : "Run the scoring engine to generate actions."}
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-800/50">
              {filteredInterventions.map((iv, idx) => (
                <div
                  key={iv.id}
                  className={`grid items-start gap-8 border-l-2 px-7 py-7 md:grid-cols-[1.4fr_2.2fr_auto] ${
                    PRIORITY_ACCENT[iv.priority] ?? "border-l-slate-700"
                  } ${idx > 0 ? "border-t border-slate-800/40" : ""} bg-slate-900/25 transition-colors hover:bg-slate-900/50`}
                >
                  <div>
                    <p className="text-[15px] font-semibold leading-snug text-slate-100">
                      {iv.opportunities?.accounts?.name ?? "Unknown Client"}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">{iv.opportunities?.title}</p>
                    {iv.opportunities?.stage && (
                      <p className="mt-0.5 text-[11px] text-slate-700">{iv.opportunities.stage}</p>
                    )}
                  </div>

                  <div>
                    <p className="text-[14px] leading-6 text-slate-200">{iv.recommended_action}</p>
                    <p className="mt-1.5 text-[12px] leading-5 text-slate-600">{iv.reason}</p>
                  </div>

                  <div className="flex flex-col items-end gap-3 pt-0.5">
                    <span
                      className={`rounded border px-2.5 py-0.5 text-[10px] uppercase tracking-widest ${
                        PRIORITY_BADGE[iv.priority] ?? PRIORITY_BADGE.low
                      }`}
                    >
                      {iv.priority}
                    </span>
                    <EvidenceModal
                      interventionId={iv.id}
                      recommendedAction={iv.recommended_action}
                      workspaceId={iv.workspace_id}
                      opportunityId={iv.opportunity_id}
                      accountId={iv.opportunities?.accounts?.id ?? ""}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* REVENUE LEAKING THIS WEEK */}
        <section>
          <div className="mb-6">
            <p className="text-[10px] uppercase tracking-[0.45em] text-slate-600">Revenue Triage</p>
            <h2 className="mt-1.5 text-xl font-semibold tracking-tight">
              Revenue Leaking This Week
            </h2>
          </div>

          {leaking.length === 0 ? (
            <div className="rounded-xl border border-slate-800/50 px-8 py-12 text-center">
              <p className="text-sm text-emerald-600">No revenue at risk. Portfolio is clean.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-800/50">
              <div className="grid grid-cols-[2fr_1.2fr_0.9fr_2.4fr_0.9fr] border-b border-slate-800/60 bg-slate-900/50 px-6 py-3">
                {["Opportunity", "Client", "Exposure", "Why It Leaked", "Intervention"].map((h) => (
                  <p key={h} className="text-[10px] uppercase tracking-[0.35em] text-slate-600">
                    {h}
                  </p>
                ))}
              </div>

              {leaking.map((opp, idx) => {
                const level = opp.score?.drift_level ?? "healthy";
                const hasIntervention = interventionByOppId.has(opp.id);
                return (
                  <div
                    key={opp.id}
                    className={`grid grid-cols-[2fr_1.2fr_0.9fr_2.4fr_0.9fr] items-start gap-4 px-6 py-4 ${
                      idx > 0 ? "border-t border-slate-800/40" : ""
                    } bg-slate-900/20 transition-colors hover:bg-slate-900/45`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span
                        className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                          LEVEL_DOT[level] ?? "bg-slate-600"
                        }`}
                      />
                      <div>
                        <p className="text-[13px] font-medium text-slate-200">{opp.title}</p>
                        <p className="mt-0.5 text-[11px] text-slate-600">{opp.stage}</p>
                      </div>
                    </div>

                    <p className="pt-px text-[13px] text-slate-400">{opp.accounts?.name}</p>

                    <p className="pt-px text-[13px] font-semibold text-red-400">
                      {money(Number(opp.score?.revenue_at_risk ?? 0))}
                    </p>

                    <p className="text-[12px] leading-5 text-slate-500">
                      {opp.score?.scoring_notes ?? "—"}
                    </p>

                    <div className="pt-0.5">
                      {hasIntervention ? (
                        <span className="rounded border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-amber-400">
                          Pending
                        </span>
                      ) : (
                        <span className="rounded border border-slate-700/60 bg-slate-800/40 px-2 py-0.5 text-[10px] uppercase tracking-widest text-slate-600">
                          None
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
