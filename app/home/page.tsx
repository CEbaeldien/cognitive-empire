"use client";

import Link from "next/link";
import CENav from "../components/CENav";
import CEFooter from "../components/CEFooter";

// ─── Section icons ─────────────────────────────────────────────────────────────

function IconProducts() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="2" y="2" width="9" height="9" rx="1" />
      <rect x="13" y="2" width="9" height="9" rx="1" />
      <rect x="2" y="13" width="9" height="9" rx="1" />
      <rect x="13" y="13" width="9" height="9" rx="1" />
    </svg>
  );
}

function IconIntelligence() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="2" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}

function IconSystems() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="3" y="3" width="6" height="6" rx="1" />
      <rect x="15" y="3" width="6" height="6" rx="1" />
      <rect x="9" y="15" width="6" height="6" rx="1" />
      <path d="M6 9v3a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V9" />
      <line x1="12" y1="9" x2="12" y2="15" />
    </svg>
  );
}

// ─── Drift activity sparkline (blue accent, no animation) ─────────────────────

function DriftSparkline() {
  return (
    <svg viewBox="0 0 240 60" className="w-full h-14 mt-4 mb-2" fill="none">
      <line x1="0" y1="30" x2="240" y2="30" stroke="#1e2a45" strokeWidth="1" strokeDasharray="4,4" />
      <path d="M0,10 C25,13 50,20 80,30 C105,38 125,46 148,52"
        stroke="#334155" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="148" cy="52" r="3.5" fill="#3b82f6" />
      <line x1="148" y1="52" x2="148" y2="14" stroke="#3b82f6" strokeWidth="0.5" strokeDasharray="3,3" opacity="0.4" />
      <path d="M148,52 C168,47 196,38 240,30"
        stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#080d1a] text-[#f1f5f9]">
      <CENav />

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="border-b border-[#1e2a45]">
        <div className="max-w-4xl mx-auto px-6 md:px-8 py-20 md:py-28">
          <p className="text-[10px] text-[#64748b] uppercase tracking-widest mb-6">
            Cognitive Empire
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-thin leading-tight text-[#f1f5f9] mb-6">
            Operational intelligence systems for an{" "}
            <span className="text-blue-400">AI-native</span> world.
          </h1>
          <p className="text-base text-[#64748b] leading-relaxed mb-10 max-w-2xl">
            Cognitive Empire builds products, intelligence layers, and execution systems that turn abundant intelligence into structured operational power.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/drift"
              className="px-6 py-3 bg-blue-600 text-white text-sm font-semibold uppercase tracking-wide hover:bg-blue-500 transition-colors"
            >
              Explore Drift →
            </Link>
            <Link
              href="/connect"
              className="px-6 py-3 border border-[#1e2a45] text-[#f1f5f9] text-sm uppercase tracking-wide hover:border-blue-500/40 hover:bg-blue-500/5 transition-all"
            >
              Connect →
            </Link>
          </div>
        </div>
      </section>

      {/* ── What We Build ──────────────────────────────────────────── */}
      <section className="border-b border-[#1e2a45]">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-16 md:py-20">
          <p className="text-[10px] text-[#64748b] uppercase tracking-widest mb-12">
            What We Build ——
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                Icon: IconProducts,
                title: "Products",
                body: "Revenue and execution intelligence products for operators who can't afford to drift.",
                items: ["Drift"],
              },
              {
                Icon: IconIntelligence,
                title: "Intelligence",
                body: "Structural signal intelligence and strategic briefings that translate signal into judgment.",
                items: ["Signals", "CE Research"],
              },
              {
                Icon: IconSystems,
                title: "Systems",
                body: "Custom operational systems for serious operators and high-trust environments.",
                items: ["Work"],
              },
            ].map(({ Icon, title, body, items }) => (
              <div key={title} className="p-8 bg-[#0f1629] border border-[#1e2a45] hover:border-blue-500/20 transition-colors duration-200">
                <span className="text-[#334155] block mb-5">
                  <Icon />
                </span>
                <h3 className="text-[#f1f5f9] font-semibold text-lg mb-3">{title}</h3>
                <p className="text-[#64748b] text-sm leading-relaxed mb-6">{body}</p>
                <div className="border-t border-[#1e2a45] pt-5">
                  <p className="text-[#334155] text-[10px] uppercase tracking-widest mb-3">Featured</p>
                  <div className="flex flex-wrap gap-2">
                    {items.map((item) => (
                      <span key={item} className="text-[#64748b] text-xs border border-[#1e2a45] px-2 py-0.5">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Three Feature Panels ────────────────────────────────────── */}
      <section className="border-b border-[#1e2a45]">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-16 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Panel 1 — Drift */}
            <div className="p-8 bg-[#0f1629] border border-[#1e2a45] flex flex-col">
              <p className="text-[10px] text-blue-400 uppercase tracking-widest mb-6">
                Featured Product
              </p>
              <h2 className="text-2xl font-semibold text-[#f1f5f9] mb-3">Drift</h2>
              <p className="text-base text-[#94a3b8] leading-relaxed mb-4">
                Detect revenue decay before it becomes revenue loss.
              </p>
              <p className="text-sm text-[#64748b] leading-relaxed mb-4">
                For operators managing active pipelines, interventions, and execution accountability.
              </p>
              <DriftSparkline />
              <div className="flex-1" />
              <Link
                href="/drift"
                className="inline-flex items-center text-blue-400 text-sm uppercase tracking-widest border-b border-blue-500/30 pb-px hover:border-blue-400 transition-colors self-start mt-6"
              >
                Explore Drift →
              </Link>
            </div>

            {/* Panel 2 — Intelligence Layer */}
            <div className="p-8 bg-[#0f1629] border border-[#1e2a45] flex flex-col">
              <p className="text-[10px] text-blue-400 uppercase tracking-widest mb-6">
                Intelligence Layer
              </p>
              <div className="mb-6 pb-6 border-b border-[#1e2a45]">
                <h3 className="text-lg font-semibold text-[#f1f5f9] mb-2">Signals</h3>
                <p className="text-sm text-[#64748b] leading-relaxed">
                  Tracks structural shifts across intelligence, robotics, compute, infrastructure, and operational systems.
                </p>
                <Link
                  href="/signals"
                  className="inline-flex items-center text-blue-400 text-xs uppercase tracking-widest border-b border-blue-500/30 pb-px hover:border-blue-400 transition-colors mt-4"
                >
                  Explore Signals →
                </Link>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#f1f5f9] mb-2">CE Research</h3>
                <p className="text-sm text-[#64748b] leading-relaxed">
                  Translate signal into judgment, context, and operational meaning.
                </p>
                <Link
                  href="/briefs"
                  className="inline-flex items-center text-blue-400 text-xs uppercase tracking-widest border-b border-blue-500/30 pb-px hover:border-blue-400 transition-colors mt-4"
                >
                  Read CE Research →
                </Link>
              </div>
            </div>

            {/* Panel 3 — Operational Systems */}
            <div className="p-8 bg-[#0f1629] border border-[#1e2a45] flex flex-col">
              <p className="text-[10px] text-blue-400 uppercase tracking-widest mb-6">
                Operational Systems
              </p>
              <p className="text-sm text-[#64748b] leading-relaxed mb-6">
                For operators and teams that need structured systems, not generic AI automation.
              </p>
              <ul className="space-y-3 flex-1">
                {[
                  "Maintenance Gravity Audit",
                  "AI Systems Governance",
                  "Operational Continuity Architecture",
                  "Runtime & Orchestration Architecture",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-[#94a3b8]">
                    <span className="text-blue-500 mt-px shrink-0">›</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/work"
                className="inline-flex items-center text-blue-400 text-sm uppercase tracking-widest border-b border-blue-500/30 pb-px hover:border-blue-400 transition-colors self-start mt-8"
              >
                View Systems →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Operating Principle ─────────────────────────────────────── */}
      <section className="border-b border-[#1e2a45]">
        <div className="max-w-4xl mx-auto px-6 md:px-8 py-16 md:py-20">
          <p className="text-[10px] text-[#64748b] uppercase tracking-widest mb-8">
            Operating Principle
          </p>
          <p className="text-3xl font-thin text-[#f1f5f9] leading-snug mb-2">
            Intelligence is no longer scarce.
          </p>
          <p className="text-3xl font-thin text-blue-400 leading-snug mb-8">
            Structure, judgment, and execution are.
          </p>
          <p className="text-base text-[#64748b] leading-relaxed max-w-2xl">
            Cognitive Empire is built around preserving human judgment while increasing operational leverage. Every product and system reflects this principle.
          </p>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────────── */}
      <section className="bg-[#080d1a] border-t border-[#1e2a45]">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-16 md:py-24 flex flex-col items-center text-center">
          <p className="text-[10px] text-[#64748b] uppercase tracking-widest mb-6">
            Entry Point
          </p>
          <h2 className="text-4xl font-thin text-[#f1f5f9] mb-4">
            Start with Connect.
          </h2>
          <p className="text-base text-[#64748b] mb-10 max-w-md leading-relaxed">
            Find the correct path into Cognitive Empire.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/connect"
              className="px-8 py-3.5 bg-blue-600 text-white text-sm font-semibold uppercase tracking-wide hover:bg-blue-500 transition-colors"
            >
              Connect →
            </Link>
            <Link
              href="/drift"
              className="px-8 py-3.5 border border-[#1e2a45] text-[#f1f5f9] text-sm uppercase tracking-wide hover:border-blue-500/40 hover:bg-blue-500/5 transition-all"
            >
              Explore Drift →
            </Link>
          </div>
        </div>
      </section>

      <CEFooter />
    </div>
  );
}
