import Link from "next/link";
import CENav from "../components/CENav";
import CEFooter from "../components/CEFooter";

const FEATURED_BRIEF = {
  category: "DOCTRINE",
  title: "Intelligence Is Cheap. Judgment Is Power.",
  excerpt:
    "The scarcity has shifted. The competitive advantage has moved. Most operators haven't noticed yet.",
  body: "When intelligence becomes abundant, it stops being the advantage. What remains — and what most organizations are structurally unprepared for — is judgment: the capacity to interpret signal correctly, act on it decisively, and build systems that preserve that capacity at scale.",
};

const BRIEFS = [
  {
    category: "SYSTEMS",
    title: "The Execution Bottleneck Migration",
    excerpt:
      "Why the primary constraint has moved from strategy formation to strategy execution — and what that means for operators.",
  },
  {
    category: "SIGNALS",
    title: "Compute, Energy, and the Sovereignty Layer",
    excerpt:
      "The infrastructure layer is not neutral. Understanding who controls compute is understanding who controls operational leverage.",
  },
  {
    category: "DOCTRINE",
    title: "Why Optimization Without Escalation Creates Fragility",
    excerpt:
      "Systems that optimize without escalation logic don't get better — they get brittle. The case for judgment checkpoints.",
  },
];

const THEMES = ["AI", "Robotics", "Compute", "Infrastructure", "Execution", "Systems", "Strategy"];

export default function BriefsPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <CENav />

      {/* Hero */}
      <section className="border-b border-[#1a1a2e]">
        <div className="max-w-7xl mx-auto px-8 py-20">
          <p className="text-[10px] text-[#00d4ff] uppercase tracking-widest mb-6">
            Intelligence Layer — CE Briefs
          </p>
          <h1 className="text-5xl font-thin text-white leading-tight mb-6 max-w-2xl">
            CE Briefs
          </h1>
          <p className="text-lg text-[#6b7280] leading-relaxed max-w-2xl mb-4">
            Operator-grade intelligence, execution analysis, and structural briefings for an AI-native world.
          </p>
          <p className="text-sm text-[#4b5563] italic">
            Signal translated into judgment and operational meaning.
          </p>
        </div>
      </section>

      {/* Featured Brief */}
      <section className="border-b border-[#1a1a2e]">
        <div className="max-w-7xl mx-auto px-8 py-16">
          <p className="text-[10px] text-[#6b7280] uppercase tracking-widest mb-8">
            Featured Brief
          </p>
          <div className="border border-[#1a1a2e] border-l-[3px] border-l-[#00d4ff] bg-[#0a0a0f] p-10">
            <span className="text-[#00d4ff] text-[10px] font-mono uppercase tracking-widest">
              {FEATURED_BRIEF.category}
            </span>
            <h2 className="text-3xl font-thin text-white mt-4 mb-5 leading-snug max-w-2xl">
              {FEATURED_BRIEF.title}
            </h2>
            <p className="text-[#9ca3af] text-base leading-relaxed mb-3 max-w-2xl">
              {FEATURED_BRIEF.excerpt}
            </p>
            <p className="text-[#6b7280] text-sm leading-relaxed mb-8 max-w-2xl">
              {FEATURED_BRIEF.body}
            </p>
            <span className="inline-flex items-center text-[#00d4ff] text-sm uppercase tracking-widest border-b border-[#00d4ff]/30 pb-px cursor-not-allowed opacity-60">
              Read Brief → (Coming Soon)
            </span>
          </div>
        </div>
      </section>

      {/* Latest Briefs Grid */}
      <section className="border-b border-[#1a1a2e]">
        <div className="max-w-7xl mx-auto px-8 py-16">
          <p className="text-[10px] text-[#6b7280] uppercase tracking-widest mb-8">
            Latest Briefs
          </p>
          <div className="grid grid-cols-3 gap-5">
            {BRIEFS.map((brief) => (
              <div
                key={brief.title}
                className="p-7 bg-[#0a0a0f] border border-[#1a1a2e] flex flex-col hover:border-[#00d4ff]/20 transition-colors duration-200"
              >
                <span className="text-[#00d4ff] text-[10px] font-mono uppercase tracking-widest mb-4">
                  {brief.category}
                </span>
                <h3 className="text-white text-base font-semibold leading-snug mb-4 flex-1">
                  {brief.title}
                </h3>
                <p className="text-[#6b7280] text-sm leading-relaxed mb-6">
                  {brief.excerpt}
                </p>
                <span className="text-[#4b5563] text-xs uppercase tracking-widest cursor-not-allowed">
                  Read → (Coming Soon)
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Themes */}
      <section className="border-b border-[#1a1a2e]">
        <div className="max-w-7xl mx-auto px-8 py-12">
          <p className="text-[10px] text-[#6b7280] uppercase tracking-widest mb-6">
            Coverage Areas
          </p>
          <div className="flex flex-wrap gap-2">
            {THEMES.map((theme) => (
              <span
                key={theme}
                className="px-4 py-1.5 border border-[#1a1a2e] text-[#6b7280] text-xs uppercase tracking-widest hover:border-[#00d4ff]/30 hover:text-white transition-all duration-150 cursor-default"
              >
                {theme}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-[#080810]">
        <div className="max-w-7xl mx-auto px-8 py-16 flex flex-col items-center text-center">
          <h2 className="text-2xl font-thin text-white mb-3">
            Need strategic clarity, not more noise?
          </h2>
          <p className="text-[#6b7280] text-sm mb-8 max-w-md">
            Signals tracks structural shifts. Dr. E routes you to the right system.
          </p>
          <div className="flex gap-4">
            <Link
              href="/signals"
              className="px-6 py-3 border border-[#1a1a2e] text-white text-sm uppercase tracking-wide hover:border-[#00d4ff]/40 hover:text-[#00d4ff] transition-all"
            >
              Explore Signals →
            </Link>
            <Link
              href="/connect"
              className="px-6 py-3 bg-[#00d4ff] text-black text-sm font-bold uppercase tracking-wide hover:bg-[#00b8d9] transition-colors"
            >
              Route Through Dr. E →
            </Link>
          </div>
        </div>
      </section>

      <CEFooter />
    </div>
  );
}
