"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import CENav from "../components/CENav";
import CEFooter from "../components/CEFooter";

// ─── Hero Geometry ────────────────────────────────────────────────────────────

function HeroGeometry() {
  const hexPoints = (r: number, cx = 200, cy = 200) =>
    [0, 60, 120, 180, 240, 300]
      .map((a) => {
        const rad = (a * Math.PI) / 180;
        return `${(cx + r * Math.cos(rad)).toFixed(2)},${(cy + r * Math.sin(rad)).toFixed(2)}`;
      })
      .join(" ");

  const ringDots = (radius: number, count: number) =>
    Array.from({ length: count }, (_, i) => {
      const rad = ((i * 360) / count) * (Math.PI / 180);
      return {
        x: parseFloat((200 + radius * Math.cos(rad)).toFixed(4)),
        y: parseFloat((200 + radius * Math.sin(rad)).toFixed(4)),
      };
    });

  return (
    <div className="flex items-center justify-center w-full h-full">
      <svg
        viewBox="0 0 400 400"
        className="w-[380px] h-[380px] max-w-full"
        style={{ filter: "drop-shadow(0 0 24px rgba(0,212,255,0.13))" }}
      >
        <defs>
          <radialGradient id="hg-bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#00d4ff" stopOpacity="0" />
          </radialGradient>
          <filter id="hg-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle cx="200" cy="200" r="185" fill="url(#hg-bg)" />
        <circle cx="200" cy="200" r="170" fill="none" stroke="#00d4ff" strokeWidth="0.4" opacity="0.08" />
        <circle cx="200" cy="200" r="148" fill="none" stroke="#00d4ff" strokeWidth="0.4" opacity="0.11" />

        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: 48, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "200px 200px" }}
        >
          <circle cx="200" cy="200" r="128" fill="none" stroke="#00d4ff" strokeWidth="0.5" opacity="0.17" />
          {ringDots(128, 8).map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r="2.5" fill="#00d4ff" opacity="0.5" filter="url(#hg-glow)" />
          ))}
        </motion.g>

        <motion.g
          animate={{ rotate: -360 }}
          transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "200px 200px" }}
        >
          <circle cx="200" cy="200" r="100" fill="none" stroke="#00d4ff" strokeWidth="0.5" opacity="0.2" />
          {ringDots(100, 6).map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r="2" fill="#00d4ff" opacity="0.45" filter="url(#hg-glow)" />
          ))}
        </motion.g>

        <circle cx="200" cy="200" r="74" fill="none" stroke="#00d4ff" strokeWidth="0.5" opacity="0.22" />
        <polygon points={hexPoints(58)} fill="none" stroke="#00d4ff" strokeWidth="1" opacity="0.4" filter="url(#hg-glow)" />
        <polygon points={hexPoints(28)} fill="rgba(0,212,255,0.04)" stroke="#00d4ff" strokeWidth="1" opacity="0.6" filter="url(#hg-glow)" />

        {[0, 60, 120, 180, 240, 300].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          return (
            <line key={i}
              x1={(200 + 28 * Math.cos(rad)).toFixed(2)} y1={(200 + 28 * Math.sin(rad)).toFixed(2)}
              x2={(200 + 58 * Math.cos(rad)).toFixed(2)} y2={(200 + 58 * Math.sin(rad)).toFixed(2)}
              stroke="#00d4ff" strokeWidth="0.5" opacity="0.18"
            />
          );
        })}

        <motion.g
          style={{ transformOrigin: "200px 200px" }}
          animate={{ scale: [1, 1.85], opacity: [0.2, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeOut", repeatDelay: 1.5 }}
        >
          <circle cx="200" cy="200" r="74" fill="none" stroke="#00d4ff" strokeWidth="0.8" />
        </motion.g>

        <motion.circle cx="200" cy="200" r="4" fill="#00d4ff" filter="url(#hg-glow)"
          animate={{ opacity: [0.65, 1, 0.65] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </svg>
    </div>
  );
}

// ─── Small Hex for Operating Principle ───────────────────────────────────────

function SmallHex() {
  const pts = (r: number) =>
    [0, 60, 120, 180, 240, 300]
      .map((a) => {
        const rad = (a * Math.PI) / 180;
        return `${(50 + r * Math.cos(rad)).toFixed(1)},${(50 + r * Math.sin(rad)).toFixed(1)}`;
      })
      .join(" ");

  return (
    <svg viewBox="0 0 100 100" className="w-[120px] h-[120px]" fill="none"
      style={{ filter: "drop-shadow(0 0 12px rgba(0,212,255,0.12))" }}>
      <polygon points={pts(44)} fill="rgba(0,212,255,0.03)" stroke="#00d4ff" strokeWidth="1" opacity="0.35" />
      <polygon points={pts(32)} fill="none" stroke="#00d4ff" strokeWidth="1" opacity="0.25" />
      <polygon points={pts(18)} fill="rgba(0,212,255,0.06)" stroke="#00d4ff" strokeWidth="1" opacity="0.5" />
      <circle cx="50" cy="50" r="3" fill="#00d4ff" opacity="0.8" />
    </svg>
  );
}

// ─── Drift Sparkline ──────────────────────────────────────────────────────────

function DriftSparkline() {
  return (
    <svg viewBox="0 0 240 60" className="w-full h-14 mt-4 mb-2" fill="none">
      <line x1="0" y1="30" x2="240" y2="30" stroke="#1a1a2e" strokeWidth="1" strokeDasharray="4,4" />
      <path d="M0,10 C25,13 50,20 80,30 C105,38 125,46 148,52"
        stroke="#4b5563" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="148" cy="52" r="3.5" fill="#00d4ff" />
      <line x1="148" y1="52" x2="148" y2="14" stroke="#00d4ff" strokeWidth="0.5" strokeDasharray="3,3" opacity="0.4" />
      <path d="M148,52 C168,47 196,38 240,30"
        stroke="#00d4ff" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <CENav />

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="border-b border-[#1a1a2e]">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-16 md:py-24 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div>
            <p className="text-[10px] text-[#6b7280] uppercase tracking-widest mb-6">
              Cognitive Empire
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-thin leading-tight text-white mb-6">
              Operational intelligence systems for an{" "}
              <span className="text-[#00d4ff]">AI-native</span> world.
            </h1>
            <p className="text-base text-[#6b7280] leading-relaxed mb-10 max-w-lg">
              Cognitive Empire builds products, intelligence layers, and execution systems that turn abundant intelligence into structured operational power.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/drift"
                className="px-6 py-3 bg-[#00d4ff] text-black text-sm font-bold uppercase tracking-wide hover:bg-[#00b8d9] transition-colors">
                Explore Drift →
              </Link>
              <Link href="/connect"
                className="px-6 py-3 border border-white/25 text-white text-sm uppercase tracking-wide hover:border-white/50 hover:bg-white/5 transition-all">
                Route Through Dr. E →
              </Link>
            </div>
          </div>
          <div className="hidden md:flex items-center justify-center h-[400px]">
            <HeroGeometry />
          </div>
        </div>
      </section>

      {/* ── What We Build ──────────────────────────────────────────── */}
      <section className="border-b border-[#1a1a2e]">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-16 md:py-20">
          <p className="text-[10px] text-[#6b7280] uppercase tracking-widest mb-12">
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
                items: ["Work", "Dr. E Routing"],
              },
            ].map(({ Icon, title, body, items }) => (
              <div key={title} className="p-8 bg-[#0a0a0f] border border-[#1a1a2e] hover:border-[#00d4ff]/20 transition-colors duration-200">
                <span className="text-[#4b5563] block mb-5">
                  <Icon />
                </span>
                <h3 className="text-white font-semibold text-lg mb-3">{title}</h3>
                <p className="text-[#6b7280] text-sm leading-relaxed mb-6">{body}</p>
                <div className="border-t border-[#1a1a2e] pt-5">
                  <p className="text-[#3b3b4f] text-[10px] uppercase tracking-widest mb-3">Featured</p>
                  <div className="flex flex-wrap gap-2">
                    {items.map((item) => (
                      <span key={item} className="text-[#6b7280] text-xs border border-[#1a1a2e] px-2 py-0.5">
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
      <section className="border-b border-[#1a1a2e]">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-16 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Panel 1 — Drift */}
            <div className="p-8 bg-[#0a0a0f] border border-[#1a1a2e] flex flex-col">
              <p className="text-[10px] text-[#00d4ff] uppercase tracking-widest mb-6">
                Featured Product
              </p>
              <h2 className="text-2xl font-semibold text-white mb-3">Drift</h2>
              <p className="text-base text-[#9ca3af] leading-relaxed mb-4">
                Detect revenue decay before it becomes revenue loss.
              </p>
              <p className="text-sm text-[#6b7280] leading-relaxed mb-4">
                For operators managing active pipelines, interventions, and execution accountability.
              </p>
              <DriftSparkline />
              <div className="flex-1" />
              <Link href="/drift"
                className="inline-flex items-center text-[#00d4ff] text-sm uppercase tracking-widest border-b border-[#00d4ff]/30 pb-px hover:border-[#00d4ff] transition-colors self-start mt-6">
                Explore Drift →
              </Link>
            </div>

            {/* Panel 2 — Intelligence Layer */}
            <div className="p-8 bg-[#0a0a0f] border border-[#1a1a2e] flex flex-col">
              <p className="text-[10px] text-[#00d4ff] uppercase tracking-widest mb-6">
                Intelligence Layer
              </p>
              <div className="mb-6 pb-6 border-b border-[#1a1a2e]">
                <h3 className="text-lg font-semibold text-white mb-2">Signals</h3>
                <p className="text-sm text-[#6b7280] leading-relaxed">
                  Tracks structural shifts across intelligence, robotics, compute, infrastructure, and operational systems.
                </p>
                <Link href="/signals"
                  className="inline-flex items-center text-[#00d4ff] text-xs uppercase tracking-widest border-b border-[#00d4ff]/30 pb-px hover:border-[#00d4ff] transition-colors mt-4">
                  Explore Signals →
                </Link>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">CE Research</h3>
                <p className="text-sm text-[#6b7280] leading-relaxed">
                  Translate signal into judgment, context, and operational meaning.
                </p>
                <Link href="/briefs"
                  className="inline-flex items-center text-[#00d4ff] text-xs uppercase tracking-widest border-b border-[#00d4ff]/30 pb-px hover:border-[#00d4ff] transition-colors mt-4">
                  Read CE Research →
                </Link>
              </div>
            </div>

            {/* Panel 3 — Operational Systems */}
            <div className="p-8 bg-[#0a0a0f] border border-[#1a1a2e] flex flex-col">
              <p className="text-[10px] text-[#00d4ff] uppercase tracking-widest mb-6">
                Operational Systems
              </p>
              <p className="text-sm text-[#6b7280] leading-relaxed mb-6">
                For operators and teams that need structured systems, not generic AI automation.
              </p>
              <ul className="space-y-3 flex-1">
                {[
                  "Revenue Decay Systems",
                  "Operator Execution Systems",
                  "Strategic Signal Systems",
                  "Custom Operational Systems",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-[#9ca3af]">
                    <span className="text-[#00d4ff] mt-px shrink-0">›</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/connect"
                className="inline-flex items-center text-[#00d4ff] text-sm uppercase tracking-widest border-b border-[#00d4ff]/30 pb-px hover:border-[#00d4ff] transition-colors self-start mt-8">
                Discuss Operational Systems →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Operating Principle ─────────────────────────────────────── */}
      <section className="border-b border-[#1a1a2e]">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-16 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
            <div className="flex items-center justify-center">
              <SmallHex />
            </div>
            <div>
              <p className="text-[10px] text-[#6b7280] uppercase tracking-widest mb-8">
                Operating Principle
              </p>
              <p className="text-3xl font-thin text-white leading-snug mb-2">
                Intelligence is no longer scarce.
              </p>
              <p className="text-3xl font-thin text-[#00d4ff] leading-snug mb-8">
                Structure, judgment, and execution are.
              </p>
              <p className="text-base text-[#6b7280] leading-relaxed max-w-lg">
                Cognitive Empire is built around preserving human judgment while increasing operational leverage. Every product and system reflects this principle.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────────── */}
      <section className="bg-[#080810] border-t border-[#1a1a2e]">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-16 md:py-24 flex flex-col items-center text-center">
          <p className="text-[10px] text-[#6b7280] uppercase tracking-widest mb-6">
            Entry Point
          </p>
          <h2 className="text-4xl font-thin text-white mb-4">
            Enter through Dr. E.
          </h2>
          <p className="text-base text-[#6b7280] mb-10 max-w-md leading-relaxed">
            Find the correct path into Cognitive Empire.
          </p>
          <div className="flex gap-4">
            <Link href="/connect"
              className="px-8 py-3.5 bg-[#00d4ff] text-black text-sm font-bold uppercase tracking-wide hover:bg-[#00b8d9] transition-colors">
              Route Through Dr. E →
            </Link>
            <Link href="/drift"
              className="px-8 py-3.5 border border-white/25 text-white text-sm uppercase tracking-wide hover:border-white/50 hover:bg-white/5 transition-all">
              Explore Drift →
            </Link>
          </div>
        </div>
      </section>

      <CEFooter />
    </div>
  );
}
