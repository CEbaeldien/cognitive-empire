import Link from "next/link";
import CENav from "../components/CENav";
import CEFooter from "../components/CEFooter";

const ENGAGEMENTS = [
  {
    number: "01",
    title: "Revenue Decay Systems",
    body: "Detects silent revenue decay, forces evidence-backed interventions, and protects momentum already in motion.",
    bullets: [
      "Revenue Exposure Map",
      "Live Intervention Queue",
      "Weekly Revenue Reality reporting",
      "Execution Integrity Score",
    ],
    cta: "Discuss Revenue Decay System",
  },
  {
    number: "02",
    title: "Operator Execution Systems",
    body: "Turns chaotic AI usage into governed, repeatable operational leverage.",
    bullets: [
      "Operator runtime architecture",
      "AI task classification & judgment checkpoints",
      "Execution dashboards",
      "Governance & escalation logic",
    ],
    cta: "Discuss Operator Execution System",
  },
  {
    number: "03",
    title: "Strategic Signal Systems",
    body: "Cuts through noise and surfaces structural shifts that actually matter.",
    bullets: [
      "Signal architecture & scoring",
      "Convergence tracking",
      "Pressure vector analysis",
      "Strategic intelligence briefs & dashboards",
    ],
    cta: "Discuss Strategic Signal System",
  },
  {
    number: "04",
    title: "Custom Operational Systems",
    body: "Selective high-trust operational system design for more complex environments.",
    bullets: ["For serious, well-aligned opportunities only."],
    cta: "Route Through Dr. E",
  },
];

export default function WorkPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <CENav />

      {/* Hero */}
      <section className="border-b border-[#1a1a2e]">
        <div className="max-w-7xl mx-auto px-8 py-20">
          <p className="text-[10px] text-[#00d4ff] uppercase tracking-widest mb-6">
            Cognitive Empire — Work
          </p>
          <h1 className="text-5xl font-thin text-white leading-tight mb-6 max-w-2xl">
            Operational Intelligence Systems
          </h1>
          <p className="text-lg text-[#6b7280] leading-relaxed max-w-2xl mb-4">
            We design and implement judgment-preserving systems that reduce execution drift and create structured leverage for serious operators.
          </p>
          <p className="text-sm text-[#4b5563] tracking-wide italic">
            Systems, not services.
          </p>
        </div>
      </section>

      {/* Engagement Blocks */}
      <section>
        <div className="max-w-7xl mx-auto px-8 py-20">
          <div className="grid grid-cols-2 gap-6">
            {ENGAGEMENTS.map((eng) => (
              <div
                key={eng.number}
                className="p-8 bg-[#0a0a0f] border border-[#1a1a2e] flex flex-col"
              >
                <span className="text-[#00d4ff] text-xs font-mono tracking-widest mb-5">
                  {eng.number}
                </span>
                <h2 className="text-xl font-semibold text-white mb-4">
                  {eng.title}
                </h2>
                <p className="text-[#6b7280] text-sm leading-relaxed mb-6">
                  {eng.body}
                </p>
                <ul className="space-y-2 mb-8 flex-1">
                  {eng.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm text-[#9ca3af]">
                      <span className="text-[#00d4ff] mt-px shrink-0">›</span>
                      {b}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/connect"
                  className="inline-flex items-center border border-[#1a1a2e] text-white text-xs uppercase tracking-widest px-5 py-2.5 hover:border-[#00d4ff]/50 hover:text-[#00d4ff] transition-all duration-200 self-start"
                >
                  {eng.cta} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-[#1a1a2e] bg-[#080810]">
        <div className="max-w-7xl mx-auto px-8 py-16 flex flex-col items-center text-center">
          <p className="text-[10px] text-[#6b7280] uppercase tracking-widest mb-6">
            Start the conversation
          </p>
          <h2 className="text-3xl font-thin text-white mb-4">
            Discuss the right operational system.
          </h2>
          <p className="text-[#6b7280] text-sm mb-8 max-w-md leading-relaxed">
            Every engagement starts with understanding the environment. Dr. E routes you to the correct path.
          </p>
          <Link
            href="/connect"
            className="px-8 py-3 bg-[#00d4ff] text-black text-sm font-bold uppercase tracking-wide hover:bg-[#00b8d9] transition-colors"
          >
            Route Through Dr. E →
          </Link>
        </div>
      </section>

      <CEFooter />
    </div>
  );
}
