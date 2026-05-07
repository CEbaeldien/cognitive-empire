"use client";

const domains = [
  "Science",
  "Physics",
  "AI",
  "Robotics",
  "Technology",
  "Energy",
  "Agriculture",
];

const signals = [
  {
    title: "AI inference costs continue compressing",
    domain: "AI",
    impact: "High",
    trend: "+18%",
    whatChanged:
      "Model providers continue reducing cost per token while increasing throughput.",
    whyItMatters:
      "Cheap inference shifts AI from occasional tool use into persistent operational infrastructure.",
    implication:
      "Operators should design workflows assuming intelligence can run continuously, not only on-demand.",
  },
  {
    title: "Humanoid robotics deployment accelerates",
    domain: "Robotics",
    impact: "High",
    trend: "+12%",
    whatChanged:
      "New humanoid platforms are improving dexterity, mobility, and real-world task adaptation.",
    whyItMatters:
      "Physical automation is moving closer to economically viable labor replacement.",
    implication:
      "Track deployment bottlenecks: cost, safety, energy density, and maintenance.",
  },
  {
    title: "Energy storage improvements reshape compute economics",
    domain: "Energy",
    impact: "Medium",
    trend: "+7%",
    whatChanged:
      "Battery and grid-storage systems continue improving cycle life and deployment economics.",
    whyItMatters:
      "Energy abundance directly affects compute scaling, robotics uptime, and industrial capacity.",
    implication:
      "Watch the intersection of energy density, compute demand, and automation deployment.",
  },
  {
    title: "Autonomous agriculture systems gain traction",
    domain: "Agriculture",
    impact: "Medium",
    trend: "+9%",
    whatChanged:
      "AI-guided farming systems are reducing labor dependency and improving resource precision.",
    whyItMatters:
      "Food production becomes increasingly tied to robotics, sensors, and predictive systems.",
    implication:
      "Agriculture becomes a strategic automation frontier, not a legacy sector.",
  },
];

const implications = [
  {
    label: "Operator",
    value:
      "Persistent intelligence changes execution economics. The advantage shifts toward people who redesign workflows, not people who merely use tools.",
  },
  {
    label: "Creator",
    value:
      "Raw updates are becoming cheap. Cross-domain synthesis and narrative clarity become the creator moat.",
  },
  {
    label: "Market",
    value:
      "Capital concentrates around infrastructure layers: compute, energy, robotics, data, and deployment systems.",
  },
  {
    label: "Infrastructure",
    value:
      "AI capability growth increases pressure on energy, chips, networks, and physical deployment capacity.",
  },
];

export default function SignalsPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#030407] text-white">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-[-10%] top-[-20%] h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="absolute right-[-10%] top-[10%] h-[420px] w-[420px] rounded-full bg-violet-500/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[35%] h-[520px] w-[520px] rounded-full bg-cyan-500/5 blur-[140px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:80px_80px] opacity-20" />
      </div>

      <div className="relative mx-auto max-w-[1700px] px-8 py-8">
        {/* Top Bar */}
        <header className="mb-10 flex items-start justify-between gap-6">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-lg font-bold tracking-tight">
                CE
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.34em] text-zinc-500">
                  Cognitive Empire
                </p>
                <p className="mt-1 text-sm text-zinc-500">
                  Signal Interface / Phase 1 Shell
                </p>
              </div>
            </div>

            <h1 className="max-w-4xl text-5xl font-semibold tracking-[-0.05em] text-white md:text-6xl">
              Structural intelligence for accelerating systems.
            </h1>

            <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-400">
              A CE-native interface for tracking meaningful shifts across
              science, physics, AI, robotics, technology, energy, and
              agriculture — without collapsing into news-feed noise.
            </p>
          </div>

          <div className="hidden min-w-[280px] rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl lg:block">
            <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
              Current Mode
            </p>
            <p className="mt-2 text-2xl font-semibold">Static Prototype</p>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              No ingestion. No backend. No automation. Interface proof only.
            </p>
          </div>
        </header>

        {/* Domain Strip */}
        <section className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
          {domains.map((domain, index) => (
            <div
              key={domain}
              className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 backdrop-blur-xl transition hover:border-white/20 hover:bg-white/[0.055]"
            >
              <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                Domain
              </p>
              <div className="mt-3 flex items-center justify-between">
                <p className="font-medium">{domain}</p>
                <span className="rounded-full border border-white/10 px-2 py-1 text-xs text-zinc-400">
                  {index + 1}
                </span>
              </div>
            </div>
          ))}
        </section>

        {/* Main Grid */}
        <section className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <aside className="col-span-12 rounded-3xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl lg:col-span-2">
            <p className="mb-4 text-xs uppercase tracking-[0.24em] text-zinc-500">
              Navigation
            </p>

            <nav className="space-y-2 text-sm">
              {["Overview", "Signals", "Convergence", "Timeline", "Briefs", "Archive"].map(
                (item, index) => (
                  <div
                    key={item}
                    className={`rounded-xl px-4 py-3 transition ${
                      index === 0
                        ? "border border-blue-400/20 bg-blue-400/10 text-blue-100"
                        : "text-zinc-400 hover:bg-white/[0.04] hover:text-white"
                    }`}
                  >
                    {item}
                  </div>
                )
              )}
            </nav>

            <div className="my-6 h-px bg-white/10" />

            <p className="mb-4 text-xs uppercase tracking-[0.24em] text-zinc-500">
              Signal Density
            </p>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-3xl font-semibold">28</p>
              <p className="mt-1 text-sm text-zinc-500">queued structural signals</p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-blue-400 to-cyan-300" />
              </div>
            </div>
          </aside>

          {/* Center */}
          <div className="col-span-12 space-y-6 lg:col-span-7">
            {/* Convergence Map */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 backdrop-blur-xl">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold tracking-[-0.03em]">
                    Convergence Map
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    Manual visual layer first. Intelligence logic later.
                  </p>
                </div>

                <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-zinc-500">
                  Static
                </span>
              </div>

              <div className="relative h-[360px] overflow-hidden rounded-2xl border border-white/10 bg-[#05070c]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.16),transparent_38%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:60px_60px] opacity-30" />

                {/* Fake nodes */}
                <div className="absolute left-[44%] top-[43%] h-6 w-6 rounded-full bg-blue-300 shadow-[0_0_45px_rgba(96,165,250,0.9)]" />
                <div className="absolute left-[24%] top-[32%] h-4 w-4 rounded-full bg-violet-300 shadow-[0_0_35px_rgba(196,181,253,0.8)]" />
                <div className="absolute left-[67%] top-[28%] h-4 w-4 rounded-full bg-cyan-300 shadow-[0_0_35px_rgba(103,232,249,0.8)]" />
                <div className="absolute left-[29%] top-[68%] h-4 w-4 rounded-full bg-emerald-300 shadow-[0_0_35px_rgba(110,231,183,0.8)]" />
                <div className="absolute left-[70%] top-[65%] h-4 w-4 rounded-full bg-yellow-300 shadow-[0_0_35px_rgba(253,224,71,0.8)]" />

                <p className="absolute left-[39%] top-[52%] text-sm font-medium text-blue-100">
                  Physical Intelligence
                </p>
                <p className="absolute left-[18%] top-[25%] text-sm text-zinc-300">
                  AI
                </p>
                <p className="absolute left-[63%] top-[21%] text-sm text-zinc-300">
                  Robotics
                </p>
                <p className="absolute left-[21%] top-[74%] text-sm text-zinc-300">
                  Agriculture
                </p>
                <p className="absolute left-[68%] top-[72%] text-sm text-zinc-300">
                  Energy
                </p>

                <div className="absolute bottom-5 left-5 rounded-xl border border-white/10 bg-black/40 px-4 py-3 backdrop-blur-xl">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    Emerging convergence
                  </p>
                  <p className="mt-1 text-sm text-zinc-300">
                    AI + Robotics + Energy + Agriculture
                  </p>
                </div>
              </div>
            </div>

            {/* Signal Cards */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 backdrop-blur-xl">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold tracking-[-0.03em]">
                    Top Structural Signals
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    Not updates. Directional shifts with downstream effects.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {signals.map((signal) => (
                  <article
                    key={signal.title}
                    className="rounded-2xl border border-white/10 bg-black/35 p-5 transition hover:border-blue-300/30 hover:bg-blue-300/[0.035]"
                  >
                    <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="mb-2 flex items-center gap-2">
                          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs uppercase tracking-[0.18em] text-zinc-400">
                            {signal.domain}
                          </span>
                          <span className="text-xs text-emerald-300">
                            {signal.trend}
                          </span>
                        </div>

                        <h3 className="text-xl font-semibold tracking-[-0.02em]">
                          {signal.title}
                        </h3>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          signal.impact === "High"
                            ? "border border-red-400/30 bg-red-400/10 text-red-200"
                            : "border border-yellow-400/30 bg-yellow-400/10 text-yellow-100"
                        }`}
                      >
                        {signal.impact} Impact
                      </span>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <p className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-600">
                          What changed
                        </p>
                        <p className="text-sm leading-6 text-zinc-300">
                          {signal.whatChanged}
                        </p>
                      </div>

                      <div>
                        <p className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-600">
                          Why it matters
                        </p>
                        <p className="text-sm leading-6 text-zinc-300">
                          {signal.whyItMatters}
                        </p>
                      </div>

                      <div>
                        <p className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-600">
                          Implication
                        </p>
                        <p className="text-sm leading-6 text-zinc-300">
                          {signal.implication}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <aside className="col-span-12 space-y-6 lg:col-span-3">
            <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 backdrop-blur-xl">
              <h2 className="text-2xl font-semibold tracking-[-0.03em]">
                Implication Layer
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Same signal. Different operational meanings.
              </p>

              <div className="mt-6 space-y-4">
                {implications.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-white/10 bg-black/30 p-4"
                  >
                    <p className="mb-2 text-xs uppercase tracking-[0.22em] text-zinc-500">
                      {item.label}
                    </p>
                    <p className="text-sm leading-6 text-zinc-300">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                Weekly Synthesis
              </p>

              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">
                Physical intelligence is becoming the convergence point.
              </h2>

              <p className="mt-4 text-sm leading-7 text-zinc-400">
                AI capability, robotics deployment, energy constraints, and
                agricultural automation are no longer separate domains. Their
                convergence suggests a shift from software-only leverage toward
                systems that act in the physical world.
              </p>
            </div>

            <div className="rounded-3xl border border-blue-400/20 bg-blue-400/[0.06] p-6">
              <p className="text-xs uppercase tracking-[0.24em] text-blue-200/70">
                Doctrine Anchor
              </p>
              <p className="mt-3 text-lg leading-7 text-blue-50">
                Intelligence is cheap. Judgment is power. Interfaces must
                compress complexity without surrendering human decision-making.
              </p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}