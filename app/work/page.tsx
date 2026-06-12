import Link from "next/link";
import CENav from "../components/CENav";
import CEFooter from "../components/CEFooter";

const SYSTEMS = [
  {
    number: "01",
    title: "Maintenance Gravity Audit",
    body: "Identifies where operational maintenance load is consuming disproportionate capacity relative to value output. Prioritizes what to rationalize, automate, or eliminate.",
    bullets: [
      "Maintenance burden mapping",
      "Gravity score by system and process",
      "Rationalization and automation priorities",
      "Decision-ready output report",
    ],
  },
  {
    number: "02",
    title: "AI Systems Governance",
    body: "Structures how AI is used, trusted, reviewed, and escalated inside operational environments. Removes ambiguity from human-machine boundaries.",
    bullets: [
      "Governance framework and policy design",
      "Task classification and review thresholds",
      "Audit, override, and escalation logic",
      "Human-machine boundary documentation",
    ],
  },
  {
    number: "03",
    title: "Operational Continuity Architecture",
    body: "Ensures critical operations persist through personnel changes, system disruptions, and knowledge drift.",
    bullets: [
      "Continuity dependency mapping",
      "Failure mode and risk identification",
      "Recovery protocol design",
      "Documentation and handoff architecture",
    ],
  },
  {
    number: "04",
    title: "Runtime & Orchestration Architecture",
    body: "Designs the coordination layer that governs how AI agents, tools, and operators function together under doctrine-level constraints.",
    bullets: [
      "Runtime system and workflow design",
      "Task routing and orchestration logic",
      "Oversight, intervention, and rollback architecture",
      "Execution governance documentation",
    ],
  },
];

export default function WorkPage() {
  return (
    <div className="min-h-screen bg-[#080d1a] text-[#f1f5f9]">
      <CENav />

      {/* Hero */}
      <section className="border-b border-[#1e2a45]">
        <div className="max-w-7xl mx-auto px-8 py-20">
          <p className="text-[10px] text-blue-400 uppercase tracking-widest mb-6">
            Cognitive Empire — Work
          </p>
          <h1 className="text-5xl font-thin text-[#f1f5f9] leading-tight mb-6 max-w-2xl">
            Operational Survivability Systems
          </h1>
          <p className="text-lg text-[#64748b] leading-relaxed max-w-2xl mb-4">
            CE designs and implements operational systems for organizations that cannot afford structural failure. These are not services, consulting engagements, or advisory arrangements.
          </p>
          <p className="text-sm text-[#475569] tracking-wide italic">
            Systems, not services.
          </p>
        </div>
      </section>

      {/* System Blocks */}
      <section>
        <div className="max-w-7xl mx-auto px-8 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SYSTEMS.map((sys) => (
              <div
                key={sys.number}
                className="p-8 bg-[#0f1629] border border-[#1e2a45] flex flex-col hover:border-blue-500/20 transition-colors duration-200"
              >
                <span className="text-blue-500 text-xs font-mono tracking-widest mb-5">
                  {sys.number}
                </span>
                <h2 className="text-xl font-semibold text-[#f1f5f9] mb-4">
                  {sys.title}
                </h2>
                <p className="text-[#64748b] text-sm leading-relaxed mb-6">
                  {sys.body}
                </p>
                <ul className="space-y-2 mb-8 flex-1">
                  {sys.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm text-[#94a3b8]">
                      <span className="text-blue-500 mt-px shrink-0">›</span>
                      {b}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/connect"
                  className="inline-flex items-center border border-[#1e2a45] text-[#f1f5f9] text-xs uppercase tracking-widest px-5 py-2.5 hover:border-blue-500/40 hover:text-blue-400 transition-all duration-200 self-start"
                >
                  Discuss {sys.title} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-[#1e2a45] bg-[#080d1a]">
        <div className="max-w-7xl mx-auto px-8 py-16 flex flex-col items-center text-center">
          <p className="text-[10px] text-[#64748b] uppercase tracking-widest mb-6">
            Start the conversation
          </p>
          <h2 className="text-3xl font-thin text-[#f1f5f9] mb-4">
            Identify the right operational system.
          </h2>
          <p className="text-[#64748b] text-sm mb-8 max-w-md leading-relaxed">
            Every engagement starts with understanding the environment and constraints.
          </p>
          <Link
            href="/connect"
            className="px-8 py-3 bg-blue-600 text-white text-sm font-semibold uppercase tracking-wide hover:bg-blue-500 transition-colors"
          >
            Connect →
          </Link>
        </div>
      </section>

      <CEFooter />
    </div>
  );
}
