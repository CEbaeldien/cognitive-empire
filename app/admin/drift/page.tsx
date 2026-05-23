import EvidenceModal from "./EvidenceModal";

type DriftOverview = {
  workspace: {
    id: string;
    name: string;
    type: string;
    status: string;
  };
  workspace_members: {
    id: string;
    email: string;
    role: string;
    status: string;
  }[];
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

async function getDriftOverview(): Promise<DriftOverview> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const res = await fetch(`${baseUrl}/api/drift/overview`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch Drift overview");
  }

  return res.json();
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

const DRIFT_LEVEL_STYLES: Record<string, string> = {
  healthy: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
  watch: "border-yellow-400/30 bg-yellow-500/10 text-yellow-200",
  decaying: "border-orange-400/30 bg-orange-500/10 text-orange-200",
  critical: "border-red-400/30 bg-red-500/10 text-red-200",
};

function DriftLevelBadge({ level }: { level?: string }) {
  const value = level || "unknown";
  const styles = DRIFT_LEVEL_STYLES[value] ?? "border-slate-600 bg-slate-800 text-slate-400";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs uppercase tracking-wide ${styles}`}>
      {value}
    </span>
  );
}

export default async function DriftAdminPage() {
  const data = await getDriftOverview();

  const topOpportunities = data.opportunities
    .slice()
    .sort(
      (a, b) =>
        Number(b.score?.revenue_at_risk ?? 0) -
        Number(a.score?.revenue_at_risk ?? 0)
    );

  return (
    <main className="min-h-screen bg-[#05070d] px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 border-b border-red-500/20 pb-6">
          <p className="text-xs uppercase tracking-[0.4em] text-red-400">
            Cognitive Empire / Drift / {data.workspace.name}
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Drift Command Center
          </h1>
          <p className="mt-3 text-slate-400">
            Revenue decay detection, intervention pressure, and execution risk.
          </p>
        </header>

        <section className="mb-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-red-500/25 bg-red-500/10 p-5">
            <p className="text-sm text-red-200">Revenue at Risk</p>
            <p className="mt-2 text-3xl font-bold text-red-300">
              {money(data.summary.totalRevenueAtRisk)}
            </p>
          </div>

          <div className="rounded-2xl border border-orange-500/25 bg-orange-500/10 p-5">
            <p className="text-sm text-orange-200">Critical Drift</p>
            <p className="mt-2 text-3xl font-bold text-orange-300">
              {data.summary.criticalDrift}
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-500/25 bg-yellow-500/10 p-5">
            <p className="text-sm text-yellow-200">Overdue Follow-ups</p>
            <p className="mt-2 text-3xl font-bold text-yellow-300">
              {data.summary.overdueFollowups}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
            <p className="text-sm text-slate-300">Open Opportunities</p>
            <p className="mt-2 text-3xl font-bold">
              {data.summary.openOpportunities}
            </p>
          </div>
        </section>
        {/* INTERVENTION QUEUE SECTION */}
        {/* Shows real pending interventions generated from Drift scores */}
        <section className="mb-8 rounded-2xl border border-red-500/20 bg-slate-950/80 p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Intervention Queue</h2>
              <p className="mt-1 text-sm text-slate-400">
                Real pending interventions generated from Drift scores.
              </p>
            </div>

            <span className="rounded-full border border-red-400/30 bg-red-500/10 px-3 py-1 text-xs uppercase tracking-wide text-red-200">
              {data.summary.pendingInterventions} Pending
            </span>
          </div>

          <div className="divide-y divide-slate-800">
            {data.interventions.map((intervention) => (
              <div
                key={intervention.id}
                className="grid gap-4 py-5 md:grid-cols-[1.2fr_1.4fr_1fr]"
              >
                <div>
                  <h3 className="text-lg font-semibold">
                    {intervention.opportunities?.accounts?.name ??
                      "Unknown Client"}
                  </h3>
                  <p className="mt-1 text-sm text-slate-400">
                    {intervention.opportunities?.title}
                  </p>
                </div>

                <div>
                  <p className="text-sm leading-6 text-slate-300">
                    {intervention.recommended_action}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {intervention.reason}
                  </p>
                </div>

                <div className="flex items-center justify-start gap-3 md:justify-end">
                  <span className="rounded-full border border-orange-400/30 bg-orange-500/10 px-3 py-1 text-xs uppercase tracking-wide text-orange-200">
                    {intervention.priority}
                  </span>
                  <EvidenceModal
                    interventionId={intervention.id}
                    recommendedAction={intervention.recommended_action}
                    workspaceId={intervention.workspace_id}
                    opportunityId={intervention.opportunity_id}
                    accountId={intervention.opportunities?.accounts?.id}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
        {/* OPPORTUNITY RISK LIST */}
{/* Ranked risky opportunities based on latest Drift scores */}
        <section className="rounded-2xl border border-red-500/20 bg-slate-950/80 p-5">
          <div className="mb-5">
           <h2 className="text-xl font-semibold">Opportunity Risk List</h2>
            <p className="mt-1 text-sm text-slate-400">
              These opportunities need attention first.
            </p>
          </div>

          <div className="divide-y divide-slate-800">
            {topOpportunities.map((opportunity) => (
              <div
                key={opportunity.id}
                className="grid gap-4 py-5 md:grid-cols-[1.5fr_1fr_1fr_1fr]"
              >
                <div>
                  <h3 className="text-lg font-semibold">
                    {opportunity.accounts?.name}
                  </h3>
                  <p className="mt-1 text-sm text-slate-400">
                    {opportunity.title} · {opportunity.stage}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Drift Score
                  </p>
                  <p className="mt-1 text-xl font-bold text-red-300">
                    {opportunity.score?.drift_score ?? "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Revenue at Risk
                  </p>
                  <p className="mt-1 text-xl font-bold text-red-300">
                    {money(Number(opportunity.score?.revenue_at_risk ?? 0))}
                  </p>
                </div>

                <div className="flex items-center justify-start md:justify-end">
                  <DriftLevelBadge level={opportunity.score?.drift_level} />
                </div>

                <p className="md:col-span-4 text-sm leading-6 text-slate-400">
                  {opportunity.score?.scoring_notes}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}