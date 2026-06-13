import type { Metadata }   from 'next'
import { Inter, Playfair_Display } from 'next/font/google'

import { TopNav }           from './_components/TopNav'
import { KernelHero }       from './_components/KernelHero'
import { MiniIndexClient }  from './_components/MiniIndexClient'
import { ClosingDoctrine }  from './_components/ClosingDoctrine'
import { TelemetryRails }   from './_components/TelemetryRails'
import { ScrollReveal }     from './_components/ScrollReveal'
import {
  SectionShell,
  CanonPlate,
  CommandFrame,
  LawCard,
  MigrationBoard,
  SignalQuestionCard,
  StatExtract,
  DoctrineChip,
  DoctrinePanel,
  ModularCognitionViz,
  DecisionHalfLifeViz,
} from './_components/DoctrineComponents'

/* ─────────────────────────────────────────────────────────
   Fonts
───────────────────────────────────────────────────────── */
const inter = Inter({ subsets: ['latin'], display: 'swap' })
const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: '700',
  variable: '--font-playfair',
  display: 'swap',
})

/* ─────────────────────────────────────────────────────────
   Metadata
───────────────────────────────────────────────────────── */
export const metadata: Metadata = {
  title: 'Intelligence Is Abundant. Judgment Is Power. — Cognitive Empire',
  description:
    'The Public Kernel for Intelligence-Abundant Systems — a public doctrine for operators, builders, and institutions navigating intelligence-abundant systems.',
  openGraph: {
    title: 'Intelligence Is Abundant. Judgment Is Power.',
    description: 'The Cognitive Empire Public Doctrine — Operator Kernel.',
    siteName: 'Cognitive Empire',
  },
}

/* ─────────────────────────────────────────────────────────
   Data: Eight Laws
───────────────────────────────────────────────────────── */
const EIGHT_LAWS = [
  {
    numeral: 'I',
    title: 'Intelligence Abundance',
    description: 'When intelligence becomes abundant, output inflates and value migrates upstream.',
  },
  {
    numeral: 'II',
    title: 'Bottleneck Migration',
    description:
      'When one constraint collapses, another becomes dominant. Optimizing the wrong layer amplifies instability.',
  },
  {
    numeral: 'III',
    title: 'Responsibility Migration',
    description: 'Automation increases ambiguity. Ownership becomes economic currency.',
  },
  {
    numeral: 'IV',
    title: 'Output Inflation',
    description:
      'When everyone can produce, differentiation shifts to selection, constraint design, and outcome integrity.',
  },
  {
    numeral: 'V',
    title: 'Decision Half-Life',
    description:
      'Some decisions must be defended. Others must adapt. Confusing the two destroys cognitive capital.',
  },
  {
    numeral: 'VI',
    title: 'Escalation Preservation',
    description: 'Outsource analysis. Never outsource responsibility.',
  },
  {
    numeral: 'VII',
    title: 'Optimization Fragility',
    description: 'Systems optimized for speed without governance become brittle under scale.',
  },
  {
    numeral: 'VIII',
    title: 'Human Differentiation',
    description: 'Perfect logic commoditizes brands. Emotional signal preserves leverage.',
  },
]

/* ─────────────────────────────────────────────────────────
   Data: Section 01 stat extracts (from canon)
───────────────────────────────────────────────────────── */
const STAT_EXTRACTS: [string, string][] = [
  ['Execution',  'simplifies'],
  ['Production', 'cheapens'],
  ['Iteration',  'accelerates'],
  ['Output',     'multiplies'],
]

/* ─────────────────────────────────────────────────────────
   Data: Section 08 chips (extracted verbatim from canon)
───────────────────────────────────────────────────────── */
const SEC08_CHIPS: { label: string; type: 'danger' | 'warning' | 'info' | 'gold' }[] = [
  { label: 'Fails Visibly',       type: 'danger'  },
  { label: 'Fails Silently',      type: 'warning' },
  { label: 'Visible Layer',       type: 'info'    },
  { label: 'Bottleneck Migrated', type: 'gold'    },
]

/* ─────────────────────────────────────────────────────────
   Data: Alternating doctrine panels (sections 09–19)
───────────────────────────────────────────────────────── */
const ALTERNATING_SECTIONS = [
  {
    num: '09', id: 'governance', title: 'Governance Under Abundance',
    content:
      'Intelligence abundance expands capability. Governance determines consequence. Every intelligent system requires three layers: computation, commitment, and consequence. Computation can be distributed. Commitment must be bounded by authority. Consequence must be owned by identifiable actors.',
  },
  {
    num: '10', id: 'strategic-imperfection', title: 'Strategic Imperfection',
    content:
      'Perfection scales. Imitation scales faster. Strategic Imperfection is deliberate asymmetry: the disciplined refusal to optimize every surface into sameness. Under abundance, identity becomes scarce. Constraint signals authorship.',
  },
  {
    num: '11', id: 'agentic-commerce', title: 'Agentic Commerce',
    content:
      'Intelligence abundance does not eliminate markets. It restructures them. Commerce shifts from attention markets toward agent-mediated markets. Persuasion loses power where verification dominates.',
  },
  {
    num: '12', id: 'agent-engine', title: 'Agent Engine Optimization',
    content:
      'Search Engine Optimization shaped the attention era. Agent Engine Optimization shapes the abundance era. Structural legibility is the new visibility.',
  },
  {
    num: '13', id: 'great-filter', title: 'The Great Filter',
    content:
      'Abundance does not eliminate competition. It intensifies selection. The Great Filter of abundance does not ask who can produce. It asks who can remain coherent.',
  },
  {
    num: '14', id: 'renaissance', title: 'The Renaissance Operator',
    content:
      'The Renaissance Operator does not outproduce abundance. They orchestrate it. They are more stable, more deliberate, and more difficult to replace.',
  },
  {
    num: '15', id: 'maintenance', title: 'Maintenance Gravity',
    content:
      'Creation friction is falling faster than continuity capacity is expanding. Starting becomes inexpensive. Sustaining compounds. The question is no longer only: Can this be built? The question is: Can this remain coherent?',
  },
  {
    num: '16', id: 'survivable', title: 'Survivable Systems',
    content:
      'Abundance rewards expansion. Survival rewards coherence. The systems that endure will be the systems that remain governable under pressure.',
  },
  {
    num: '17', id: 'direction', title: 'Direction Without Prediction',
    content:
      'Prediction seeks certainty. Direction preserves coherence. The operator does not need to predict every event. They need to understand which constraint is becoming dominant.',
  },
  {
    num: '18', id: 'physical', title: 'Physical Constraints',
    content:
      'Intelligence abundance appears digital. Its constraints are physical. Digital intelligence remains bounded by physical systems.',
  },
  {
    num: '19', id: 'second-order', title: 'Second-Order Effects',
    content:
      'First-order effects are visible. Second-order effects are harder to see, yet more consequential. Design for consequence, not excitement.',
  },
]

const FOUR_QUESTIONS = [
  { num: '01', q: 'What changed?' },
  { num: '02', q: 'What structural direction does it support?' },
  { num: '03', q: 'What pressure is accumulating?' },
  { num: '04', q: 'What second-order consequence follows?' },
]

/* ─────────────────────────────────────────────────────────
   Page
───────────────────────────────────────────────────────── */
export default function OperatorKernelPage() {
  return (
    <div
      className={`${inter.className} ${playfair.variable} antialiased text-[#E6EDF7] ce-kernel-root`}
      style={{
        background: `
          radial-gradient(circle at 70% 0%,  rgba(0,216,255,0.07), transparent 32%),
          radial-gradient(circle at 15% 10%, rgba(46,140,255,0.07), transparent 28%),
          linear-gradient(180deg, #05070B 0%, #07111F 42%, #05070B 100%)
        `,
        minHeight: '100vh',
      }}
    >
      {/* Ambient telemetry rails (fixed, 2xl+ only) */}
      <TelemetryRails />

      {/* Sticky navigation */}
      <TopNav />

      {/* Body: command frame wrapping sidebar + reading column */}
      <CommandFrame className="max-w-screen-2xl mx-auto flex">

        {/* Left mini-index (desktop only, client for active state) */}
        <MiniIndexClient />

        {/* Main reading column */}
        <main className="flex-1 max-w-[880px] px-8 pt-14 pb-24 min-w-0">

          {/* ── Hero ───────────────────────────────────── */}
          <KernelHero />

          {/* ── 01: The Prime Doctrine ─────────────────── */}
          <ScrollReveal>
            <SectionShell id="prime-doctrine" className="mb-20">
              <div className="flex items-baseline gap-x-4 mb-6">
                <span className="section-number text-7xl font-semibold">01</span>
                <h2 className="text-[1.45rem] font-semibold tracking-tight text-[#F4F7FB]">
                  The Prime Doctrine
                </h2>
              </div>

              {/* Two-column: prose left, stat extracts right */}
              <div className="flex flex-col lg:flex-row gap-10">
                <div className="doctrine-prose flex-1 min-w-0">
                  <p className="text-[1.55rem] leading-[1.2] tracking-[-0.5px] text-[#F4F7FB] mb-8">
                    When intelligence becomes abundant, confusion becomes the bottleneck.
                  </p>
                  <p>
                    The defining shift of this era is not that machines can produce more text,
                    code, images, analysis, or workflows. That is the visible layer.
                  </p>
                  <p className="mt-5">The deeper shift is structural.</p>
                  <CanonPlate className="mt-8 text-[15px]">
                    What changes is not capability.{' '}
                    <span className="font-medium text-[#C5A26F]">
                      What changes is constraint.
                    </span>
                  </CanonPlate>
                </div>

                {/* Stat extracts grid */}
                <div className="flex-shrink-0 w-full lg:w-[220px]">
                  <div className="text-[9px] tracking-[2.5px] text-[#3A4558] uppercase mb-4 select-none">
                    Structural Shifts
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
                    {STAT_EXTRACTS.map(([verb, change]) => (
                      <StatExtract key={verb} verb={verb} change={change} />
                    ))}
                  </div>
                </div>
              </div>
            </SectionShell>
          </ScrollReveal>

          {/* ── 02: Judgment Is Power ──────────────────── */}
          <ScrollReveal>
            <SectionShell id="judgment" className="mb-20">
              <div className="flex items-baseline gap-x-4 mb-6">
                <span className="section-number text-7xl font-semibold">02</span>
                <h2 className="text-[1.45rem] font-semibold tracking-tight text-[#F4F7FB]">
                  Judgment Is Power
                </h2>
              </div>

              <div className="doctrine-prose">
                <p>Judgment has two layers.</p>

                <div className="mt-8 grid gap-5 md:grid-cols-2">
                  <div className="ce-card rounded-3xl p-8">
                    <div className="text-xs tracking-[2.5px] text-[#C5A26F] mb-2.5 select-none">LAYER ONE</div>
                    <div className="font-semibold text-xl mb-3.5 tracking-tight text-[#F4F7FB]">
                      Cognitive Judgment
                    </div>
                    <p className="text-[#8B9AB3]">
                      Analysis, synthesis, pattern recognition, option comparison, and
                      reasoning. This layer can increasingly be assisted by intelligent systems.
                    </p>
                  </div>
                  <div className="ce-card rounded-3xl p-8">
                    <div className="text-xs tracking-[2.5px] text-[#C5A26F] mb-2.5 select-none">LAYER TWO</div>
                    <div className="font-semibold text-xl mb-3.5 tracking-tight text-[#F4F7FB]">
                      Consequential Judgment
                    </div>
                    <p className="text-[#8B9AB3]">
                      Accountable commitment under uncertainty, where objectives, constraints,
                      escalation, and irreversible outcomes remain attributable to a responsible actor.
                    </p>
                  </div>
                </div>

                <CanonPlate className="mt-8">
                  Cognitive judgment can be assisted.{' '}
                  <span className="font-medium text-[#C5A26F]">
                    Consequential judgment must be owned.
                  </span>
                </CanonPlate>

                <p className="mt-8">
                  The operator does not win by outproducing machines. The operator wins by
                  preserving direction, accountability, and coherence while machines expand
                  the production surface.
                </p>
              </div>
            </SectionShell>
          </ScrollReveal>

          {/* ── 03: The Eight Laws — 2×4 premium grid ─── */}
          <ScrollReveal>
            <SectionShell id="eight-laws" className="mb-20">
              <div className="flex items-baseline gap-x-4 mb-8">
                <span className="section-number text-7xl font-semibold">03</span>
                <h2 className="text-[1.45rem] font-semibold tracking-tight text-[#F4F7FB]">
                  The Eight Laws
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {EIGHT_LAWS.map((law) => (
                  <LawCard key={law.numeral} {...law} />
                ))}
              </div>
            </SectionShell>
          </ScrollReveal>

          {/* ── 04 + 05: Side-by-side ──────────────────── */}
          <ScrollReveal>
            <div className="grid lg:grid-cols-2 gap-x-8 mb-20">

              <SectionShell id="signal-noise">
                <div className="flex items-baseline gap-x-4 mb-5">
                  <span className="section-number text-6xl font-semibold">04</span>
                  <h3 className="font-semibold text-2xl tracking-tight text-[#F4F7FB]">
                    Signal vs. Noise
                  </h3>
                </div>
                <div className="doctrine-prose">
                  <p>
                    Intelligence abundance does not eliminate information asymmetry.
                    It reorganizes it.
                  </p>
                  <p className="mt-5">
                    When production becomes inexpensive, visibility becomes a lagging
                    indicator of structural reality.
                  </p>
                  <CanonPlate className="mt-7 text-[15px]">
                    Search visibility is a distribution event, not a discovery event.
                  </CanonPlate>
                  <div className="mt-7 flex gap-x-9 text-sm">
                    <div><span className="font-medium text-[#E6EDF7]">Signal compounds quietly.</span></div>
                    <div className="text-[#5E6B80]">Noise scales rapidly.</div>
                  </div>
                </div>
              </SectionShell>

              <SectionShell id="bottleneck" className="mt-12 lg:mt-0 lg:border-l border-white/10 lg:pl-8">
                <div className="flex items-baseline gap-x-4 mb-5">
                  <span className="section-number text-6xl font-semibold">05</span>
                  <h3 className="font-semibold text-2xl tracking-tight text-[#F4F7FB]">
                    Bottleneck Migration
                  </h3>
                </div>
                <div className="doctrine-prose text-[15px]">
                  <p className="mb-6">
                    Every system operates under constraint. When one dissolves, another
                    becomes dominant.
                  </p>
                  <MigrationBoard />
                </div>
              </SectionShell>

            </div>
          </ScrollReveal>

          {/* ── 06 + 07: Side-by-side with visualizations ─ */}
          <ScrollReveal>
            <div className="grid lg:grid-cols-2 gap-x-8 mb-20">

              <SectionShell id="modular">
                <div className="flex items-baseline gap-x-4 mb-5">
                  <span className="section-number text-6xl font-semibold">06</span>
                  <h3 className="font-semibold text-xl tracking-tight text-[#F4F7FB]">
                    Modular Cognition
                  </h3>
                </div>
                <div className="doctrine-prose text-[15px]">
                  <p>
                    Access is not architecture. Using multiple models is not orchestration.
                    Modular Cognition is the deliberate structuring of distributed intelligence
                    into a governed system. Architecture determines outcome. The operator commits.
                  </p>
                </div>
                <div className="mt-6 flex justify-start pl-2">
                  <ModularCognitionViz />
                </div>
              </SectionShell>

              <SectionShell id="half-life" className="mt-12 lg:mt-0 lg:border-l border-white/10 lg:pl-8">
                <div className="flex items-baseline gap-x-4 mb-5">
                  <span className="section-number text-6xl font-semibold">07</span>
                  <h3 className="font-semibold text-xl tracking-tight text-[#F4F7FB]">
                    Decision Half-Life
                  </h3>
                </div>
                <div className="doctrine-prose text-[15px]">
                  <p>
                    Not all decisions should be treated equally. Some must adapt quickly.
                    Others must resist volatility. A system incapable of adaptation becomes
                    obsolete. A system incapable of stability becomes incoherent.
                  </p>
                </div>
                <div className="mt-6 flex justify-start pl-2">
                  <DecisionHalfLifeViz />
                </div>
              </SectionShell>

            </div>
          </ScrollReveal>

          {/* ── 08: Failure Modes — wide panel with chips ─ */}
          <ScrollReveal>
            <SectionShell id="failure-modes" className="mb-20">
              <div className="ce-card rounded-3xl p-9">
                <div className="flex items-baseline gap-x-4 mb-6">
                  <span className="section-number text-6xl font-semibold">08</span>
                  <h3 className="font-semibold text-2xl tracking-tight text-[#F4F7FB]">
                    Failure Modes of Abundance
                  </h3>
                </div>

                {/* Canon-extracted chips */}
                <div className="flex flex-wrap gap-2.5 mb-7">
                  {SEC08_CHIPS.map(({ label, type }) => (
                    <DoctrineChip key={label} label={label} type={type} />
                  ))}
                </div>

                <div className="doctrine-prose text-[15px] max-w-2xl">
                  <p>
                    In constrained environments, incompetence fails visibly. In abundant
                    environments, intelligence fails silently. These are structural failures
                    caused by optimizing the visible layer after the bottleneck has migrated
                    upward.
                  </p>
                </div>
              </div>
            </SectionShell>
          </ScrollReveal>

          {/* ── 09–19: Alternating doctrine panels ──────── */}
          <div className="space-y-5 mb-20 max-w-3xl">
            {ALTERNATING_SECTIONS.map((sec, i) => (
              <ScrollReveal key={sec.id}>
                <DoctrinePanel
                  num={sec.num}
                  id={sec.id}
                  title={sec.title}
                  content={sec.content}
                  variant={i % 2 === 0 ? 'a' : 'b'}
                />
              </ScrollReveal>
            ))}
          </div>

          {/* ── 20: Signals — Intelligence Module ────────── */}
          <ScrollReveal>
            <SectionShell id="signals" className="mb-20">
              <div className="intelligence-module">

                {/* Module eyebrow */}
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-[9px] tracking-[2.5px] text-[#00D8FF] uppercase select-none font-mono">
                    MODULE 20
                  </span>
                  <div className="h-px flex-1 bg-[#00D8FF]/12" />
                </div>

                <div className="flex items-baseline gap-x-4 mb-6">
                  <span className="section-number text-7xl font-semibold">20</span>
                  <h2 className="text-[1.45rem] font-semibold tracking-tight text-[#F4F7FB]">
                    The Signals Application of the Operator Kernel
                  </h2>
                </div>

                <div className="doctrine-prose max-w-2xl">
                  <p>
                    Applied to CE Signals, the Operator Kernel provides a doctrine-governed
                    method for structural orientation.
                  </p>

                  {/* The Four Questions */}
                  <div className="mt-8">
                    <div className="text-[9px] tracking-[2.8px] text-[#00D8FF] mb-4 select-none uppercase font-mono">
                      The Four Questions
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {FOUR_QUESTIONS.map(({ num, q }) => (
                        <SignalQuestionCard key={num} num={num} question={q} />
                      ))}
                    </div>
                  </div>

                  <CanonPlate className="mt-8">
                    Signals are not news.
                    <br />
                    A single update does not create a signal.
                    <br />
                    <span className="font-medium text-[#C5A26F]">
                      Signals emerge when accumulated evidence reveals structural pressure.
                    </span>
                  </CanonPlate>

                  <p className="mt-7">
                    Signals is not forecasting. Signals is structural orientation under
                    volatility.
                  </p>
                </div>
              </div>
            </SectionShell>
          </ScrollReveal>

          {/* ── 21: Closing — Command Seal ───────────────── */}
          <ClosingDoctrine />

        </main>
      </CommandFrame>

      {/* Footer */}
      <footer className="border-t border-white/10 py-9 text-center text-xs text-[#5E6B80]">
        This is the public version of the doctrine. For operators building under
        intelligence abundance.
      </footer>
    </div>
  )
}
