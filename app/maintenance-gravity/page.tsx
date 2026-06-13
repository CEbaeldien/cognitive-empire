import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import { CEMark } from '@/app/components/CEMark'
import { GravityScrollReveal } from './_components/GravityScrollReveal'
import { GravityRowList } from './_components/GravityRowList'

const inter = Inter({ subsets: ['latin'], display: 'swap' })
const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: '700',
  variable: '--font-playfair',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Maintenance Gravity — Cognitive Empire',
  description:
    'Maintenance Gravity is the accumulating operational drag created when intelligent systems enter production. Mini Canonical Release 1 from Cognitive Empire.',
  openGraph: {
    title: 'Maintenance Gravity — Mini Canonical Release 1',
    description: 'AI creates speed. Maintenance determines whether that speed survives.',
    siteName: 'Cognitive Empire',
  },
}

const METADATA_RAIL = [
  { label: 'Canon',      value: 'MG-001' },
  { label: 'Class',      value: 'Operational Principle' },
  { label: 'Status',     value: 'Active' },
  { label: 'Release',    value: 'Public Mini Canon' },
  { label: 'Review',     value: 'Human-Reviewed' },
  { label: 'Governance', value: 'Doctrine-Governed' },
]

export default function MaintenanceGravityPage() {
  return (
    <div
      className={`${inter.className} ${playfair.variable} antialiased text-[#E6EDF7]`}
      style={{
        background: `
          radial-gradient(circle at 22% 12%, rgba(197,162,111,0.042), transparent 28%),
          radial-gradient(circle at 78% 82%, rgba(255,255,255,0.014), transparent 30%),
          linear-gradient(180deg, #05070B 0%, #0B1220 52%, #05070B 100%)
        `,
        minHeight: '100vh',
      }}
    >
      {/* Gravity field ambient */}
      <div className="mg-gravity-field" aria-hidden="true" />

      {/* ─── Navigation ──────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#05070B]/94 backdrop-blur-2xl">
        <div className="max-w-[1480px] mx-auto px-8">
          <div className="flex h-[68px] items-center">

            {/* Left: CE mark + name */}
            <div className="flex items-center gap-x-3 flex-1">
              <a href="/" aria-label="Cognitive Empire home">
                <span className="text-[#F4F7FB]">
                  <CEMark className="w-8 h-8" />
                </span>
              </a>
              <a
                href="/"
                className="font-semibold tracking-[-0.4px] text-[#F4F7FB] hover:text-white transition-colors text-[1rem]"
              >
                Cognitive Empire
              </a>
            </div>

            {/* Center: OPS KERNEL link */}
            <div className="hidden md:flex items-center gap-x-3">
              <a
                href="/operator-kernel"
                className="text-[11px] tracking-[3px] uppercase font-mono text-[#C5A26F] hover:text-[#D4B47E] transition-colors"
              >
                OPS KERNEL
              </a>
            </div>

            {/* Right: badge + release number */}
            <div className="flex-1 flex justify-end items-center gap-x-4">
              <span className="hidden md:inline text-[9px] tracking-[2.5px] text-[#5E6B80] uppercase font-mono select-none">
                Public Canon Release
              </span>
              <span className="text-[#C5A26F] text-[11px] font-mono font-semibold tracking-[1px]">
                001
              </span>
            </div>

          </div>
        </div>
      </nav>

      {/* ─── Body: two-column layout ──────────────────────── */}
      <div className="max-w-[1480px] mx-auto flex flex-col lg:flex-row">

        {/* ── Left column: hero + canon statement ────────── */}
        <div className="hidden lg:block w-[380px] xl:w-[440px] flex-shrink-0 border-r border-white/[0.07]">
          <div className="sticky top-[68px] px-10 pt-14 pb-14 flex flex-col" style={{ maxHeight: 'calc(100vh - 68px)', overflowY: 'auto' }}>

            {/* Eyebrow */}
            <div className="mg-eyebrow flex items-center gap-x-4 mb-7">
              <span className="text-[9px] tracking-[3.5px] text-[rgba(197,162,111,0.75)] uppercase font-mono select-none">
                Mini Canonical Release 1
              </span>
            </div>

            {/* Title */}
            <h1 className="mg-title heading-serif text-[3.4rem] xl:text-[4.2rem] leading-[0.88] tracking-[-3px] text-[#F4F7FB] mb-8">
              Maintenance<br />Gravity
            </h1>

            {/* Core line */}
            <div className="mg-core-line mb-9">
              <p className="text-[1.1rem] leading-[1.45] tracking-[-0.2px] text-[#C2CEDF]">
                AI creates speed.
              </p>
              <p className="text-[1.1rem] leading-[1.45] tracking-[-0.2px] text-[#8B9AB3]">
                Maintenance determines whether<br />that speed survives.
              </p>
            </div>

            {/* Divider */}
            <div className="mg-hero-meta w-full h-px bg-white/[0.06] mb-8" />

            {/* Canon statement */}
            <div className="mg-hero-meta flex-1">
              <div className="text-[8px] tracking-[2.5px] text-[#3A4558] uppercase font-mono mb-4 select-none">
                Canon Statement
              </div>
              <div className="mg-canon-plate">
                <p className="text-[0.93rem] leading-[1.72] text-[#E6EDF7] mb-4">
                  Maintenance Gravity is the accumulating operational drag created when intelligent systems enter production.
                </p>
                <p className="text-[0.87rem] leading-[1.76] text-[#8B9AB3]">
                  It is the increasing difficulty of understanding, governing, repairing, trusting, and safely depending on systems over time.
                </p>
              </div>
            </div>

            {/* Bottom marks */}
            <div className="mg-rail-fade mt-10 flex items-center gap-x-3 text-[8.5px] tracking-[1.5px] text-[#3A4558] uppercase font-mono select-none">
              <span>Human-Reviewed</span>
              <span className="text-white/10">·</span>
              <span>Doctrine-Governed</span>
            </div>

          </div>
        </div>

        {/* Mobile: hero (shown only on mobile/tablet) */}
        <div className="lg:hidden px-6 pt-12 pb-8 border-b border-white/[0.07]">
          <div className="mg-eyebrow text-[9px] tracking-[3px] text-[rgba(197,162,111,0.7)] uppercase font-mono mb-6 select-none">
            Mini Canonical Release 1
          </div>
          <h1 className="mg-title heading-serif text-[3.2rem] leading-[0.88] tracking-[-2.5px] text-[#F4F7FB] mb-7">
            Maintenance<br />Gravity
          </h1>
          <div className="mg-core-line mb-8">
            <p className="text-[1.1rem] leading-[1.4] text-[#C2CEDF]">AI creates speed.</p>
            <p className="text-[1.1rem] leading-[1.4] text-[#8B9AB3]">Maintenance determines whether that speed survives.</p>
          </div>
          <div className="mg-hero-meta mg-canon-plate">
            <p className="text-[0.93rem] leading-[1.72] text-[#E6EDF7] mb-3">
              Maintenance Gravity is the accumulating operational drag created when intelligent systems enter production.
            </p>
            <p className="text-[0.87rem] leading-[1.76] text-[#8B9AB3]">
              It is the increasing difficulty of understanding, governing, repairing, trusting, and safely depending on systems over time.
            </p>
          </div>
        </div>

        {/* ── Center: Doctrine sections ───────────────────── */}
        <main className="flex-1 px-8 xl:px-10 pt-14 pb-24 min-w-0 space-y-8">

          {/* Core Problem */}
          <GravityScrollReveal>
            <section id="core-problem" className="section-shell">
              <div className="text-[8px] tracking-[2.5px] text-[#3A4558] uppercase font-mono mb-4 select-none">
                The Core Problem
              </div>
              <div className="gravity-card bg-[#0D1524] border border-white/[0.09] rounded-xl p-7">
                <p className="text-[1.05rem] font-semibold tracking-[-0.2px] text-[#F4F7FB] mb-5 leading-snug">
                  Deployment has become easier than maintenance.
                </p>
                <div className="space-y-3 text-[#8B9AB3] text-[0.88rem] leading-[1.76]">
                  <p>
                    The friction to build has dropped. The cost to sustain has not. Each system deployed accelerates the next deployment — but rarely accelerates the organization&rsquo;s capacity to govern what was already deployed.
                  </p>
                  <p className="text-[#BDC9DD] font-medium">
                    The organization appears faster while becoming less governable.
                  </p>
                  <p>
                    Speed compounds. Maintenance mass compounds. The gap between them becomes structural debt that no tool release can erase.
                  </p>
                </div>
              </div>
            </section>
          </GravityScrollReveal>

          {/* What It Looks Like */}
          <GravityScrollReveal delay={60}>
            <section id="what-it-looks-like" className="section-shell">
              <div className="text-[8px] tracking-[2.5px] text-[#3A4558] uppercase font-mono mb-4 select-none">
                What Maintenance Gravity Looks Like
              </div>
              <GravityRowList />
            </section>
          </GravityScrollReveal>

          {/* Core Law */}
          <GravityScrollReveal delay={60}>
            <section id="core-law" className="section-shell">
              <div className="text-[8px] tracking-[2.5px] text-[#3A4558] uppercase font-mono mb-4 select-none">
                Core Law
              </div>
              <div className="space-y-4">
                <div className="mg-canon-plate">
                  <p className="text-[0.97rem] leading-[1.7] text-[#E6EDF7] font-medium">
                    Every intelligent system creates maintenance mass.
                  </p>
                </div>
                <div className="space-y-3 text-[#8B9AB3] text-[0.88rem] leading-[1.76] pl-1">
                  <p>
                    Maintenance mass is not a product failure. It is a structural consequence of deployment without governance design.
                  </p>
                  <p>
                    When deployment outpaces governance capacity, systems become difficult to understand, harder to repair, and increasingly impossible to safely depend upon.
                  </p>
                </div>
              </div>
            </section>
          </GravityScrollReveal>

          {/* Human-in-the-Loop */}
          <GravityScrollReveal delay={60}>
            <section id="human-in-loop" className="section-shell">
              <div className="gravity-card bg-[#0D1524] border border-white/[0.09] rounded-xl p-7">
                <div className="text-[8px] tracking-[2.5px] text-[#3A4558] uppercase font-mono mb-5 select-none">
                  Human-in-the-Loop Is Not Governance
                </div>
                <p className="text-[1.02rem] font-semibold tracking-[-0.2px] text-[#F4F7FB] mb-5 leading-[1.45]">
                  Approval stamps do not constitute oversight.<br />
                  Reviews that lack understanding do not constitute accountability.
                </p>
                <div className="space-y-3 text-[#8B9AB3] text-[0.88rem] leading-[1.76]">
                  <p>
                    Governance is not a human being positioned inside a workflow. Governance is a human being with authority, context, and responsibility for consequence.
                  </p>
                  <p className="text-[#BDC9DD]">
                    Human-in-the-loop is an architectural description. Governance is an institutional discipline.
                  </p>
                </div>
              </div>
            </section>
          </GravityScrollReveal>

          {/* Continuity */}
          <GravityScrollReveal delay={60}>
            <section id="continuity" className="section-shell">
              <div className="text-[8px] tracking-[2.5px] text-[#3A4558] uppercase font-mono mb-4 select-none">
                Continuity Is the Real Test
              </div>
              <div className="space-y-4">
                <div className="mg-canon-plate">
                  <p className="text-[0.97rem] leading-[1.7] text-[#E6EDF7]">
                    Continuity is not uptime.{' '}
                    <span className="text-[#C5A26F] font-medium">Continuity is governed survivability.</span>
                  </p>
                </div>
                <div className="space-y-3 text-[#8B9AB3] text-[0.88rem] leading-[1.76] pl-1">
                  <p>
                    A system can be technically operational while being institutionally ungovernable. Uptime is a server metric. Continuity is an organizational capacity.
                  </p>
                  <p>
                    The organizations building toward real continuity are not those with the most automation. They are the ones that can carry the weight of what they automate.
                  </p>
                </div>
              </div>
            </section>
          </GravityScrollReveal>

          {/* CE Position */}
          <GravityScrollReveal delay={60}>
            <section id="ce-position" className="section-shell">
              <div
                className="gravity-card bg-[#0B1220] border border-white/[0.07] rounded-xl p-7"
                style={{ borderLeft: '2.5px solid rgba(197,162,111,0.40)' }}
              >
                <div className="text-[8px] tracking-[2.5px] text-[rgba(197,162,111,0.55)] uppercase font-mono mb-5 select-none">
                  The Canonical Response
                </div>
                <div className="space-y-3 text-[0.88rem] leading-[1.76]">
                  <p className="text-[#E6EDF7]">
                    The organizations that will matter most are not those that automate the most, but those that build the capacity to govern what they automate.
                  </p>
                  <p className="text-[#8B9AB3]">
                    Maintenance Gravity is a structural constraint, not a technical problem. It does not yield to faster tools. It yields to governance design, continuity architecture, and institutional discipline.
                  </p>
                  <p className="text-[#8B9AB3]">
                    CE doctrine recognizes Maintenance Gravity as one of the defining constraints of the intelligence-abundant era.
                  </p>
                </div>
              </div>
            </section>
          </GravityScrollReveal>

          {/* Doctrine Seal */}
          <GravityScrollReveal>
            <section
              id="doctrine-seal"
              className="section-shell mt-8 border-t border-white/[0.07] pt-16 pb-4"
            >
              <div className="text-center text-[8px] tracking-[3px] text-[#3A4558] uppercase font-mono mb-12 select-none">
                Doctrine Seal — MG-001
              </div>

              <div className="mg-seal max-w-[560px] mx-auto text-center">
                <span className="mg-seal-corner mg-seal-corner-tl" aria-hidden="true" />
                <span className="mg-seal-corner mg-seal-corner-tr" aria-hidden="true" />
                <span className="mg-seal-corner mg-seal-corner-bl" aria-hidden="true" />
                <span className="mg-seal-corner mg-seal-corner-br" aria-hidden="true" />

                <div className="mb-6 flex justify-center text-[rgba(197,162,111,0.6)]">
                  <CEMark className="w-12 h-12" />
                </div>

                <div className="heading-serif text-[1.5rem] md:text-[1.8rem] leading-[1.2] tracking-[-0.8px] text-[#F4F7FB] mb-2">
                  AI creates operational speed.
                </div>
                <div className="heading-serif text-[1.5rem] md:text-[1.8rem] leading-[1.2] tracking-[-0.8px] text-[#C5A26F] mb-8">
                  Maintenance Gravity determines<br className="hidden sm:block" /> whether that speed endures.
                </div>

                <div className="w-12 h-px bg-[rgba(197,162,111,0.22)] mx-auto mb-8" />

                <p className="text-[#8B9AB3] text-[0.85rem] leading-[1.82] max-w-[400px] mx-auto">
                  The organizations that will matter most are not those that automate the most,
                  but those that can carry the weight of what they automate.
                </p>

                <div className="mt-10 flex flex-col items-center gap-y-1.5">
                  <div className="text-[8.5px] tracking-[3px] text-[#5E6B80] uppercase select-none font-mono">
                    Cognitive Empire
                  </div>
                  <div className="text-[8.5px] tracking-[3px] text-[#3A4558] uppercase select-none font-mono">
                    Public Mini Canon · 2026
                  </div>
                </div>
              </div>

              <div className="mt-12 text-center text-[8px] tracking-[2.5px] text-[#2A3548] uppercase select-none font-mono">
                Classification: Public · Doctrine Version 1.0 · MG-001
              </div>
            </section>
          </GravityScrollReveal>

        </main>

        {/* ── Right: Metadata rail ────────────────────────── */}
        <aside
          className="hidden xl:block w-[162px] flex-shrink-0 border-l border-white/[0.07] px-6 pt-14 pb-14"
          aria-label="Canon metadata"
        >
          <div className="mg-rail-fade sticky top-[68px] pt-2">
            <div className="text-[7.5px] tracking-[2px] text-[#2A3548] uppercase font-mono mb-5 select-none">
              Canon
            </div>
            <div className="border border-white/[0.05] rounded-xl overflow-hidden">
              {METADATA_RAIL.map(({ label, value }) => (
                <div key={label} className="mg-rail-item px-3.5">
                  <div className="mg-rail-label">{label}</div>
                  <div className="mg-rail-value">{value}</div>
                </div>
              ))}
            </div>
            <div className="mt-8 w-full h-px bg-white/[0.04]" />
            <div className="mt-5 text-[7.5px] tracking-[1.5px] text-[#2A3548] uppercase font-mono select-none leading-[1.9]">
              Part of the<br />CE Canon Series
            </div>
          </div>
        </aside>

      </div>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-8 text-center text-[10px] text-[#3A4558] font-mono tracking-[0.5px]">
        Human-Reviewed · Doctrine-Governed · Cognitive Empire © 2026
      </footer>
    </div>
  )
}
