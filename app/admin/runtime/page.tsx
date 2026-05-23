type RuntimeSystem = {
  id: string;
  name: string;
  type: string | null;
  axis: string | null;
  status: string | null;
  description: string | null;
  primary_platform: string | null;
  dependencies: string[] | null;
};

type RuntimeProjectState = {
  id: string;
  current_state: string;
  status: string | null;
  priority: string | null;
  blockers: string[] | null;
  next_actions: string[] | null;
  runtime_systems?: {
    name: string;
  } | null;
};

type RuntimeDecision = {
  id: string;
  title: string;
  decision: string;
  reason: string | null;
  system: string | null;
  status: string | null;
  tags: string[] | null;
};

type RuntimeTask = {
  id: string;
  title: string;
  description: string | null;
  system: string | null;
  status: string | null;
  priority: string | null;
};

type RuntimeWorkflow = {
  id: string;
  name: string;
  platform: string | null;
  system: string | null;
  status: string | null;
  trigger_type: string | null;
  purpose: string | null;
  failure_risks: string[] | null;
};

type RuntimeOverview = {
  systems: RuntimeSystem[];
  projectStates: RuntimeProjectState[];
  decisions: RuntimeDecision[];
  tasks: RuntimeTask[];
  workflows: RuntimeWorkflow[];
};

async function getRuntimeOverview(): Promise<RuntimeOverview> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const res = await fetch(`${baseUrl}/api/runtime/overview`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch runtime overview");
  }

  return res.json();
}

function StatusBadge({ status }: { status?: string | null }) {
  const value = status || "unknown";

  return (
    <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-1 text-xs uppercase tracking-wide text-cyan-200">
      {value}
    </span>
  );
}

function PriorityBadge({ priority }: { priority?: string | null }) {
  const value = priority || "medium";

  return (
    <span className="rounded-full border border-slate-500/40 bg-slate-500/10 px-2 py-1 text-xs uppercase tracking-wide text-slate-300">
      {value}
    </span>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-cyan-400/20 bg-slate-950/70 p-5 shadow-[0_0_40px_rgba(8,145,178,0.08)]">
      <div className="mb-4">
        <h2 className="text-xl font-semibold tracking-wide text-slate-100">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export default async function RuntimeDashboardPage() {
  const data = await getRuntimeOverview();

  const activeSystems = data.systems.filter(
    (system) => system.status === "active"
  ).length;

  const lockedDecisions = data.decisions.filter(
    (decision) => decision.status === "locked"
  ).length;

  const pendingTasks = data.tasks.filter(
    (task) => task.status === "pending"
  ).length;

  const activeWorkflows = data.workflows.filter(
    (workflow) => workflow.status === "active"
  ).length;

  return (
    <main className="min-h-screen bg-[#020817] px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 border-b border-cyan-400/20 pb-6">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">
            Cognitive Empire
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            CE Runtime Dashboard
          </h1>
          <p className="mt-3 max-w-3xl text-slate-400">
            Internal operational registry for systems, project states, locked
            decisions, tasks, and workflows.
          </p>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-5">
            <p className="text-sm text-cyan-200">Active Systems</p>
            <p className="mt-2 text-3xl font-semibold">{activeSystems}</p>
          </div>

          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-5">
            <p className="text-sm text-cyan-200">Locked Decisions</p>
            <p className="mt-2 text-3xl font-semibold">{lockedDecisions}</p>
          </div>

          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-5">
            <p className="text-sm text-cyan-200">Pending Tasks</p>
            <p className="mt-2 text-3xl font-semibold">{pendingTasks}</p>
          </div>

          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-5">
            <p className="text-sm text-cyan-200">Active Workflows</p>
            <p className="mt-2 text-3xl font-semibold">{activeWorkflows}</p>
          </div>
        </div>

        <div className="grid gap-6">
          <Section
            title="Systems Registry"
            subtitle="All major systems known to CE Runtime."
          >
            <div className="grid gap-4 md:grid-cols-2">
              {data.systems.map((system) => (
                <div
                  key={system.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/70 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-100">
                        {system.name}
                      </h3>
                      <p className="mt-1 text-sm text-slate-400">
                        {system.axis}
                      </p>
                    </div>
                    <StatusBadge status={system.status} />
                  </div>

                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    {system.description}
                  </p>

                  {system.primary_platform ? (
                    <p className="mt-3 text-xs uppercase tracking-wide text-cyan-300">
                      {system.primary_platform}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </Section>

          <Section
            title="Project States"
            subtitle="Current operating state for active and planned systems."
          >
            <div className="grid gap-4">
              {data.projectStates.map((state) => (
                <div
                  key={state.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/70 p-4"
                >
                  <div className="mb-3 flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-semibold">
                      {state.runtime_systems?.name || "Unknown System"}
                    </h3>
                    <StatusBadge status={state.status} />
                    <PriorityBadge priority={state.priority} />
                  </div>

                  <p className="text-sm leading-6 text-slate-300">
                    {state.current_state}
                  </p>

                  {state.blockers?.length ? (
                    <div className="mt-4">
                      <p className="text-xs uppercase tracking-wide text-red-300">
                        Blockers
                      </p>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-400">
                        {state.blockers.map((blocker) => (
                          <li key={blocker}>{blocker}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {state.next_actions?.length ? (
                    <div className="mt-4">
                      <p className="text-xs uppercase tracking-wide text-cyan-300">
                        Next Actions
                      </p>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-400">
                        {state.next_actions.map((action) => (
                          <li key={action}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </Section>

          <Section
            title="Locked Decisions"
            subtitle="Decisions that should not be repeatedly reopened."
          >
            <div className="grid gap-4 md:grid-cols-2">
              {data.decisions.map((decision) => (
                <div
                  key={decision.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/70 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-semibold">{decision.title}</h3>
                    <StatusBadge status={decision.status} />
                  </div>

                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    {decision.decision}
                  </p>

                  {decision.reason ? (
                    <p className="mt-3 text-sm leading-6 text-slate-500">
                      {decision.reason}
                    </p>
                  ) : null}

                  {decision.system ? (
                    <p className="mt-3 text-xs uppercase tracking-wide text-cyan-300">
                      {decision.system}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </Section>

          <Section
            title="Tasks"
            subtitle="Runtime execution queue."
          >
            {data.tasks.length === 0 ? (
              <p className="text-sm text-slate-500">
                No runtime tasks recorded yet.
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {data.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-xl border border-slate-800 bg-slate-900/70 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-semibold">{task.title}</h3>
                      <StatusBadge status={task.status} />
                    </div>

                    {task.description ? (
                      <p className="mt-3 text-sm text-slate-300">
                        {task.description}
                      </p>
                    ) : null}

                    <div className="mt-3 flex gap-2">
                      <PriorityBadge priority={task.priority} />
                      {task.system ? <StatusBadge status={task.system} /> : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section
            title="Workflows"
            subtitle="n8n and automation workflows registered under CE Runtime."
          >
            <div className="grid gap-4 md:grid-cols-2">
              {data.workflows.map((workflow) => (
                <div
                  key={workflow.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/70 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {workflow.name}
                      </h3>
                      <p className="mt-1 text-sm text-slate-400">
                        {workflow.platform} · {workflow.system}
                      </p>
                    </div>
                    <StatusBadge status={workflow.status} />
                  </div>

                  {workflow.purpose ? (
                    <p className="mt-3 text-sm leading-6 text-slate-300">
                      {workflow.purpose}
                    </p>
                  ) : null}

                  {workflow.trigger_type ? (
                    <p className="mt-3 text-xs uppercase tracking-wide text-cyan-300">
                      Trigger: {workflow.trigger_type}
                    </p>
                  ) : null}

                  {workflow.failure_risks?.length ? (
                    <div className="mt-4">
                      <p className="text-xs uppercase tracking-wide text-red-300">
                        Failure Risks
                      </p>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-400">
                        {workflow.failure_risks.map((risk) => (
                          <li key={risk}>{risk}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </main>
  );
}