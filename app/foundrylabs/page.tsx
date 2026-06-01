import Link from "next/link";
import CENav from "../components/CENav";
import CEFooter from "../components/CEFooter";

const RESEARCH_DIRECTIONS = [
  {
    title: "Runtime Systems",
    description: "Architectures for governed, observable AI-assisted execution inside operational environments.",
  },
  {
    title: "Intelligence Interfaces",
    description: "How structured intelligence surfaces into human decision-making without displacing judgment.",
  },
  {
    title: "Operational Tooling",
    description: "Lightweight tools for intervention tracking, signal routing, and execution accountability.",
  },
  {
    title: "Human-Machine Coordination",
    description: "Models for preserving human judgment while increasing operational leverage through AI systems.",
  },
  {
    title: "Applied Infrastructure Concepts",
    description: "Compute, energy, and sovereignty layers as operational variables — not background conditions.",
  },
  {
    title: "Signal Architecture",
    description: "How to design scoring, weighting, and convergence logic for structural intelligence signals.",
  },
];

export default function FoundryLabsPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <CENav />

      {/* Hero */}
      <section className="border-b border-[#1a1a2e]">
        <div className="max-w-7xl mx-auto px-8 py-20">
          <p className="text-[10px] text-[#00d4ff] uppercase tracking-widest mb-6">
            Cognitive Empire — FoundryLabs
          </p>
          <h1 className="text-5xl font-thin text-white leading-tight mb-6 max-w-2xl">
            FoundryLabs
          </h1>
          <p className="text-lg text-[#6b7280] leading-relaxed max-w-2xl mb-4">
            Applied research, system experimentation, and long-horizon technical exploration inside Cognitive Empire.
          </p>
          <p className="text-sm text-[#4b5563] italic">
            Where future systems are studied before they are productized.
          </p>
        </div>
      </section>

      {/* What FoundryLabs Is */}
      <section className="border-b border-[#1a1a2e]">
        <div className="max-w-7xl mx-auto px-8 py-16">
          <div className="max-w-3xl">
            <p className="text-[10px] text-[#6b7280] uppercase tracking-widest mb-6">
              What FoundryLabs Is ——
            </p>
            <p className="text-xl text-[#9ca3af] leading-relaxed">
              FoundryLabs is CE&rsquo;s internal applied research layer — focused on experimentation, infrastructure thinking, and future system design.
            </p>
            <p className="text-base text-[#6b7280] leading-relaxed mt-5">
              It is not a consulting practice. It is not a product line. It is the internal environment where ideas are pressure-tested before they become part of the operational stack.
            </p>
          </div>
        </div>
      </section>

      {/* Research Directions */}
      <section className="border-b border-[#1a1a2e]">
        <div className="max-w-7xl mx-auto px-8 py-16">
          <p className="text-[10px] text-[#6b7280] uppercase tracking-widest mb-10">
            Research Directions ——
          </p>
          <div className="grid grid-cols-3 gap-5">
            {RESEARCH_DIRECTIONS.map((dir, i) => (
              <div
                key={dir.title}
                className="p-6 border border-[#1a1a2e] bg-[#0a0a0f] hover:border-[#00d4ff]/20 transition-colors duration-200"
              >
                <span className="text-[#3b3b4f] text-[10px] font-mono tracking-widest block mb-4">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="text-white text-sm font-semibold mb-3 uppercase tracking-wide">
                  {dir.title}
                </h3>
                <p className="text-[#6b7280] text-xs leading-relaxed">
                  {dir.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Current Status */}
      <section className="border-b border-[#1a1a2e]">
        <div className="max-w-7xl mx-auto px-8 py-16">
          <div className="max-w-2xl">
            <p className="text-[10px] text-[#6b7280] uppercase tracking-widest mb-6">
              Current Status
            </p>
            <p className="text-base text-[#6b7280] leading-relaxed">
              FoundryLabs is an active internal research layer. Public outputs will expand selectively over time. Some findings surface through CE Research. System patterns become products when they pass operational pressure tests.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-[#080810]">
        <div className="max-w-7xl mx-auto px-8 py-16 flex flex-col items-center text-center">
          <h2 className="text-2xl font-thin text-white mb-3">
            Follow the research output.
          </h2>
          <p className="text-[#6b7280] text-sm mb-8 max-w-md leading-relaxed">
            CE Research translates research into judgment. Dr. E routes serious engagement.
          </p>
          <div className="flex gap-4">
            <Link
              href="/briefs"
              className="px-6 py-3 border border-[#1a1a2e] text-white text-sm uppercase tracking-wide hover:border-[#00d4ff]/40 hover:text-[#00d4ff] transition-all"
            >
              Read CE Research →
            </Link>
            <Link
              href="/connect"
              className="px-6 py-3 bg-[#00d4ff] text-black text-sm font-bold uppercase tracking-wide hover:bg-[#00b8d9] transition-colors"
            >
              Connect →
            </Link>
          </div>
        </div>
      </section>

      <CEFooter />
    </div>
  );
}
