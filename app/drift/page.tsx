import EvidenceModal from "@/app/admin/drift/EvidenceModal";

type DriftOverview = {
  workspace: { id: string; name: string; type: string; status: string };
  workspace_members: { id: string; email: string; role: string; status: string }[];
  summary: {
    totalRevenueAtRisk: number;
    criticalDrift: number;
    overdueFollowups: number;
    openOpportunities: number;
    pendingInterventions: number;
    completedInterventions: number;
  };
  opportunities: any[];
  interventions: any[];
};

type AccountSummary = {
  id: string;
  name: string;
  maxDriftLevel: string;
  revenueAtRisk: number;
  opportunityCount: number;
};

const DRIFT_LEVEL_ORDER = ["healthy", "watch", "decaying", "critical"];

const SIDEBAR_BADGE: Record<string, string> = {
  healthy: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
  watch: "border-yellow-400/30 bg-yellow-500/10 text-yellow-300",
  decaying: "border-orange-400/30 bg-orange-500/10 text-orange-300",
  critical: "border-red-400/30 bg-red-500/10 text-red-300",
};

const LEVEL_BADGE: Record<string, string> = {
  healthy: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
  watch: "border-yellow-400/30 bg-yellow-500/10 text-yellow-200",
  decaying: "border-orange-400/30 bg-orange-500/10 text-orange-200",
  critical: "border-red-400/30 bg-red-500/10 text-red-200",
};

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
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
      const isHigher =
        DRIFT_LEVEL_ORDER.indexOf(level) > DRIFT_LEVEL_ORDER.indexOf(existing.maxDriftLevel);
      map.set(id, {
        ...existing,
        maxDriftLevel: isHigher ? level : existing.maxDriftLevel,
        revenueAtRisk: existing.revenueAtRisk + risk,
        opportunityCount: existing.opportunityCount + 1,
      });
    }
  }

  return [...map.values()].sort(
    (a, b) =>
      DRIFT_LEVEL_ORDER.indexOf(b.maxDriftLevel) -
      DRIFT_LEVEL_ORDER.indexOf(a.maxDriftLevel)
  );
}

async function getDriftOverview(): Promise<DriftOverview> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/drift/overview`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch Drift overview");
  return res.json();
}

type PageProps = {
  searchParams: Promise<{ account?: string }>;
};

export default async function DriftPage({ searchParams }: PageProps) {
  const { account: activeAccountId } = await searchParams;
  const data = await getDriftOverview();

  const accounts = buildAccountSummaries(data.opportunities);

  const filteredOpportunities = activeAccountId
    ? data.opportunities.filter((o) => o.accounts?.id === activeAccountId)
    : data.opportunities;

  const filteredInterventions = activeAccountId
    ? data.interventions.filter(
        (i) => i.opportunities?.accounts?.id === activeAccountId
      )
    : data.interventions;

  const totalPortfolioValue = filteredOpportunities.reduce(
    (sum, o) => sum + Number(o.value ?? 0),
    0
  );
  const revenueAtRisk = filteredOpportunities.reduce(
    (sum, o) => sum + Number(o.score?.revenue_at_risk ?? 0),
    0
  );
  const exposurePct =
    totalPortfolioValue > 0
      ? Math.min(100, (revenueAtRisk / totalPortfolioValue) * 100)
      : 0;

  const dealsAtRisk = filteredOpportunities.filter((o) =>
    ["watch", "decaying", "critical"].includes(o.score?.drift_level ?? "")
  ).length;

  const activeAccount = activeAccountId
    ? accounts.find((a) => a.id === activeAccountId)
    : null;

  const sortedOpportunities = [...filteredOpportunities].sort(
    (a, b) => Number(b.score?.drift_score ?? 0) - Number(a.score?.drift_score ?? 0)
  );

  return (
    <div className="flex min-h-screen bg-[#05070d] text-slate-100">
      {/* CLIENT SWITCHER SIDEBAR */}
      <aside className="flex w-56 shrink-0 flex-col border-r border-slate-800/60 bg-slate-950">
        <div className="border-b border-slate-800/60 px-4 py-5">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
            Drift
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-100">
            {data.workspace.name}
          </p>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-4">
          <a
            href="/drift"
            className={`mb-1 flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition ${
              !activeAccountId
                ? "bg-slate-800 text-slate-100"
                : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
            }`}
          >
            <span>All Clients</span>
            <span className="text-xs text-slate-500">{accounts.length}</span>
          </a>

          <div className="mb-2 mt-4 px-3 text-xs uppercase tracking-[0.3em] text-slate-600">
            Clients
          </div>

          {accounts.map((account) => (
            <a
              key={account.id}
              href={`/drift?account=${account.id}`}
              className={`mb-1 flex flex-col rounded-xl px-3 py-2.5 transition ${
                activeAccountId === account.id
                  ? "bg-slate-800 text-slate-100"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm">{account.name}</span>
                <span
                  className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${
                    SIDEBAR_BADGE[account.maxDriftLevel] ??
                    "border-slate-600 bg-slate-800 text-slate-400"
                  }`}
                >
                  {account.maxDriftLevel}
                </span>
              </div>
              {account.revenueAtRisk > 0 && (
                <span className="mt-0.5 text-xs text-slate-500">
                  {money(account.revenueAtRisk)} at risk
                </span>
              )}
            </a>
          ))}
        </nav>

        <div className="border-t border-slate-800/60 px-4 py-3">
          <p className="text-xs text-slate-600">
            {data.workspace_members.length} member
            {data.workspace_members.length !== 1 ? "s" : ""}
          </p>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-auto px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">
            {activeAccount ? activeAccount.name : "All Clients"}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Revenue Execution
          </h1>
        </div>

        {/* REVENUE EXPOSURE BAR */}
        <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-950/80 p-6">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                Revenue Exposure
              </p>
              <p className="mt-2 text-2xl font-semibold text-red-300">
                {money(revenueAtRisk)}
                <span className="ml-2 text-base font-normal text-slate-500">
                  at risk of {money(totalPortfolioValue)}
                </span>
              </p>
            </div>
            <p className="text-2xl font-semibold text-slate-400">
              {exposurePct.toFixed(1)}
              <span className="text-base font-normal">% exposed</span>
            </p>
          </div>

          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500 transition-all"
              style={{ width: `${exposurePct.toFixed(1)}%` }}
            />
          </div>

          <div className="mt-5 grid grid-cols-4 gap-4 border-t border-slate-800 pt-5">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Open Deals</p>
              <p className="mt-1 text-xl font-semibold">{filteredOpportunities.length}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Deals at Risk</p>
              <p className="mt-1 text-xl font-semibold text-orange-300">{dealsAtRisk}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Pending Interventions</p>
              <p className="mt-1 text-xl font-semibold text-red-300">
                {filteredInterventions.length}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Overdue Follow-ups</p>
              <p className="mt-1 text-xl font-semibold text-yellow-300">
                {data.summary.overdueFollowups}
              </p>
            </div>
          </div>
        </section>

        {/* INTERVENTION QUEUE */}
        <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-950/80 p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                Intervention Queue
              </p>
              <h2 className="mt-1 text-lg font-semibold">Pending Actions</h2>
            </div>
            <span className="rounded-full border border-red-400/30 bg-red-500/10 px-3 py-1 text-xs uppercase tracking-wide text-red-300">
              {filteredInterventions.length} pending
            </span>
          </div>

          {filteredInterventions.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">
              No pending interventions.{" "}
              {activeAccountId ? "Try viewing all clients." : "Run the scoring engine to generate new ones."}
            </p>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {filteredInterventions.map((intervention) => (
                <div
                  key={intervention.id}
                  className="grid gap-4 py-5 md:grid-cols-[1.4fr_1.6fr_auto]"
                >
                  <div>
                    <p className="font-semibold text-slate-100">
                      {intervention.opportunities?.accounts?.name ?? "Unknown Client"}
                    </p>
                    <p className="mt-0.5 text-sm text-slate-400">
                      {intervention.opportunities?.title}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm leading-6 text-slate-300">
                      {intervention.recommended_action}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{intervention.reason}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs uppercase tracking-wide ${
                        intervention.priority === "high"
                          ? "border-red-400/30 bg-red-500/10 text-red-300"
                          : intervention.priority === "medium"
                          ? "border-yellow-400/30 bg-yellow-500/10 text-yellow-300"
                          : "border-slate-600 bg-slate-800 text-slate-400"
                      }`}
                    >
                      {intervention.priority}
                    </span>
                    <EvidenceModal
                      interventionId={intervention.id}
                      recommendedAction={intervention.recommended_action}
                      workspaceId={intervention.workspace_id}
                      opportunityId={intervention.opportunity_id}
                      accountId={intervention.opportunities?.accounts?.id ?? ""}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* OPPORTUNITY RISK LIST */}
        <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6">
          <div className="mb-5">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              Portfolio
            </p>
            <h2 className="mt-1 text-lg font-semibold">Opportunity Risk</h2>
          </div>

          {sortedOpportunities.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">
              No open opportunities.
            </p>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {sortedOpportunities.map((opp) => {
                const level = opp.score?.drift_level ?? "healthy";
                return (
                  <div
                    key={opp.id}
                    className="grid gap-4 py-4 md:grid-cols-[1.6fr_0.8fr_0.8fr_0.8fr]"
                  >
                    <div>
                      <p className="font-semibold text-slate-100">{opp.accounts?.name}</p>
                      <p className="mt-0.5 text-sm text-slate-400">
                        {opp.title} · {opp.stage}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        Drift Score
                      </p>
                      <p className="mt-1 text-lg font-semibold text-red-300">
                        {opp.score?.drift_score ?? "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        Revenue at Risk
                      </p>
                      <p className="mt-1 text-lg font-semibold text-red-300">
                        {money(Number(opp.score?.revenue_at_risk ?? 0))}
                      </p>
                    </div>

                    <div className="flex items-center md:justify-end">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs uppercase tracking-wide ${
                          LEVEL_BADGE[level] ??
                          "border-slate-600 bg-slate-800 text-slate-400"
                        }`}
                      >
                        {level}
                      </span>
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
