import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import Link from 'next/link'
import CENav from '@/app/components/CENav'
import CEFooter from '@/app/components/CEFooter'
import { CEMark } from '@/app/components/CEMark'
import { GravityScrollReveal } from '@/app/maintenance-gravity/_components/GravityScrollReveal'
import { GravityRowList } from '@/app/maintenance-gravity/_components/GravityRowList'

const inter = Inter({ subsets: ['latin'], display: 'swap' })
const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: '700',
  variable: '--font-playfair',
  display: 'swap',
})

const CANON_URL = 'https://cognitiveempire.com/research/maintenance-gravity'
const CANONICAL_DEFINITION =
  'Maintenance Gravity is the accumulating drag created when a system adds capability faster than it preserves coherence.'

export const metadata: Metadata = {
  title: 'Maintenance Gravity — Canonical Definition | Cognitive Empire',
  description: CANONICAL_DEFINITION,
  alternates: { canonical: CANON_URL },
  openGraph: {
    type: 'article',
    title: 'Maintenance Gravity — Canonical Definition',
    description: CANONICAL_DEFINITION,
    siteName: 'Cognitive Empire',
    url: CANON_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Maintenance Gravity — Canonical Definition',
    description: CANONICAL_DEFINITION,
  },
}

const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'DefinedTerm',
      name: 'Maintenance Gravity',
      description: CANONICAL_DEFINITION,
      url: CANON_URL,
      inDefinedTermSet: 'CE Canon Series',
    },
    {
      '@type': 'Article',
      headline: 'Maintenance Gravity — Canonical Definition',
      description: CANONICAL_DEFINITION,
      url: CANON_URL,
      mainEntityOfPage: CANON_URL,
      author: {
        '@type': 'Organization',
        name: 'Cognitive Empire Systems Ltd',
      },
      publisher: {
        '@type': 'Organization',
        name: 'Cognitive Empire Systems Ltd',
      },
      datePublished: '2026-07-13',
      version: '1.0',
    },
  ],
}

const TEN_LAWS = [
  { n: 1, title: 'Every capability creates maintenance.', body: 'Every tool, automation, workflow, dashboard, agent, integration, or generated module creates a future maintenance obligation.' },
  { n: 2, title: 'Invisible systems decay faster.', body: 'What no one can see, no one maintains.' },
  { n: 3, title: 'Capability without ownership is deferred incident.', body: 'An automation, module, or workflow with no owner is not infrastructure — it is an incident with a future date.' },
  { n: 4, title: 'AI increases output before it increases governance.', body: 'Teams produce more before they become more disciplined.' },
  { n: 5, title: 'Dashboards can hide reality.', body: 'A dashboard creates the feeling of control while concealing broken lineage, stale data, and dead assumptions.' },
  { n: 6, title: 'Human memory is not infrastructure.', body: 'A system that depends on one person remembering how it connects is a system with a resignation-letter failure mode.' },
  { n: 7, title: 'Integration multiplies blast radius.', body: 'Every integration is a dependency bridge.' },
  { n: 8, title: 'Gravity compounds quietly.', body: 'It rarely explodes; it accumulates until a trigger exposes it — a key departure, an API change, a silent automation failure, a customer-facing incident, or a simple leadership question nobody can answer.' },
  { n: 9, title: 'Speed without escalation creates blindness.', body: 'Fast systems need problems to rise cleanly to the right human.' },
  { n: 10, title: 'Survivability beats elegance.', body: 'The best system is not the most advanced.' },
]

const SEVEN_FORCES = [
  { id: 'F1', title: 'Duplication Mass', body: 'Redundant logic scattered across the codebase.' },
  { id: 'F2', title: 'Comprehension Debt', body: 'Code no human currently understands.' },
  { id: 'F3', title: 'Churn Drag', body: 'Rework of recently written code.' },
  { id: 'F4', title: 'Calcification', body: 'Old code untouched, unconsolidated, unretired.' },
  { id: 'F5', title: 'Verification Deficit', body: 'Test, review, and observability capacity lagging generation.' },
  { id: 'F6', title: 'Dependency Weight', body: 'Dependencies accreting without curation.' },
  { id: 'F7', title: 'Judgment Erosion', body: 'The human decline running parallel to the code decline: skills atrophying, architectural authority diffusing, no one empowered to say "delete this."' },
]

const EIGHT_DOMAINS = [
  { id: 'D1', title: 'Tool Gravity', body: 'Overlapping tools, unused subscriptions, no source of truth, unowned platforms.' },
  { id: 'D2', title: 'Workflow Gravity', body: 'Processes dependent on informal knowledge, riddled with exceptions and manual workarounds.' },
  { id: 'D3', title: 'Data Gravity', body: 'Data exists but cannot be trusted, connected, or interpreted.' },
  { id: 'D4', title: 'Automation Gravity', body: 'Automations fragile, undocumented, unowned, failing silently.' },
  { id: 'D5', title: 'AI Gravity', body: 'AI output inflating review, governance, and quality-control burden.' },
  { id: 'D6', title: 'Decision Gravity', body: 'Decisions accumulating without records, owners, or accountability.' },
  { id: 'D7', title: 'Knowledge Gravity', body: 'Critical knowledge living in heads, chats, screenshots, scattered files.' },
  { id: 'D8', title: 'Governance Gravity', body: 'Responsibility, authority, and escalation lagging system complexity.' },
]

const CODE_BANDS = [
  { range: '0–25', name: 'Orbital', body: 'Gravity managed. Refactoring alive, legacy touched, ownership real.' },
  { range: '26–50', name: 'Drag', body: 'Measurable pull; velocity claims exceed velocity reality.' },
  { range: '51–75', name: 'Sink', body: 'Compounding phase. Features increasingly expensive; incident recurrence rising.' },
  { range: '76–100', name: 'Event Horizon', body: 'Change capacity approaching zero. Structural intervention required.' },
]

const OPS_BANDS = [
  { range: '0–20', name: 'Light', body: 'Understandable, owned, documented.' },
  { range: '21–40', name: 'Manageable Drag', body: 'Visible, fixable mess.' },
  { range: '41–60', name: 'Operational Weight', body: 'The system is slowing people; hidden costs accumulating.' },
  { range: '61–80', name: 'Fragility Zone', body: 'Memory-dependent, workaround-dependent; scaling raises risk.' },
  { range: '81–100', name: 'Collapse Risk', body: 'Functioning but structurally brittle; one departure or tool failure from serious exposure.' },
]

const METADATA_RAIL = [
  { label: 'Canon',      value: 'MG-001' },
  { label: 'Class',      value: 'Operational Principle' },
  { label: 'Status',     value: 'Active' },
  { label: 'Release',    value: 'Public Mini Canon' },
  { label: 'Review',     value: 'Human-Reviewed' },
  { label: 'Governance', value: 'Doctrine-Governed' },
]

export default function MaintenanceGravityResearchPage() {
  return (
    <div
      className={`${inter.className} ${playfair.variable} antialiased text-[#E6EDF7]`}
      style={{
        background: `
          radial-gradient(circle at 22% 12%, rgba(201,169,97,0.042), transparent 28%),
          radial-gradient(circle at 78% 82%, rgba(255,255,255,0.014), transparent 30%),
          linear-gradient(180deg, #05070B 0%, #0B1220 52%, #05070B 100%)
        `,
        minHeight: '100vh',
      }}
    >
      <div className="mg-gravity-field" aria-hidden="true" />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />

      <CENav />

      {/* ─── Body: two-column layout ──────────────────────── */}
      <div className="max-w-[1480px] mx-auto flex flex-col lg:flex-row">

        {/* ── Left column: hero + canon statement ────────── */}
        <div className="hidden lg:block w-[430px] xl:w-[490px] flex-shrink-0 border-r border-white/[0.07]">
          <div className="sticky top-[68px] pl-14 pr-10 pt-14 pb-14 flex flex-col" style={{ maxHeight: 'calc(100vh - 68px)', overflowY: 'auto' }}>

            <div className="mg-eyebrow flex items-center gap-x-4 mb-7">
              <span className="text-[9px] tracking-[3.5px] text-[rgba(201,169,97,0.75)] uppercase font-mono select-none">
                Mini Canonical Release 1
              </span>
            </div>

            <h1 className="mg-title heading-serif text-[3.2rem] xl:text-[3.9rem] leading-[0.88] tracking-[-3px] text-[#F4F7FB] mb-8">
              Maintenance<br />Gravity
            </h1>

            <div className="mg-core-line mb-9">
              <p className="text-[1.1rem] leading-[1.45] tracking-[-0.2px] text-[#C2CEDF]">
                AI creates speed.
              </p>
              <p className="text-[1.1rem] leading-[1.45] tracking-[-0.2px] text-[#8B9AB3]">
                Maintenance determines whether<br />that speed survives.
              </p>
            </div>

            <div className="mg-hero-meta w-full h-px bg-white/[0.06] mb-8" />

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

            <div className="mg-rail-fade mt-10 flex items-center gap-x-3 text-[8.5px] tracking-[1.5px] text-[#3A4558] uppercase font-mono select-none">
              <span>Human-Reviewed</span>
              <span className="text-white/10">·</span>
              <span>Doctrine-Governed</span>
            </div>

          </div>
        </div>

        {/* Mobile hero */}
        <div className="lg:hidden px-6 pt-12 pb-8 border-b border-white/[0.07]">
          <div className="mg-eyebrow text-[9px] tracking-[3px] text-[rgba(201,169,97,0.7)] uppercase font-mono mb-6 select-none">
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
                    <span className="text-[#C9A961] font-medium">Continuity is governed survivability.</span>
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
                style={{ borderLeft: '2.5px solid rgba(201,169,97,0.40)' }}
              >
                <div className="text-[8px] tracking-[2.5px] text-[rgba(201,169,97,0.55)] uppercase font-mono mb-5 select-none">
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

                <div className="mb-6 flex justify-center text-[rgba(201,169,97,0.6)]">
                  <CEMark className="w-12 h-12" />
                </div>

                <div className="heading-serif text-[1.5rem] md:text-[1.8rem] leading-[1.2] tracking-[-0.8px] text-[#F4F7FB] mb-2">
                  AI creates operational speed.
                </div>
                <div className="heading-serif text-[1.5rem] md:text-[1.8rem] leading-[1.2] tracking-[-0.8px] text-[#C9A961] mb-8">
                  Maintenance Gravity determines<br className="hidden sm:block" /> whether that speed endures.
                </div>

                <div className="w-12 h-px bg-[rgba(201,169,97,0.22)] mx-auto mb-8" />

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

          {/* Ten Laws */}
          <GravityScrollReveal>
            <section id="ten-laws" className="section-shell mt-8 border-t border-white/[0.07] pt-16">
              <div className="text-[8px] tracking-[2.5px] text-[rgba(201,169,97,0.65)] uppercase font-mono mb-6 select-none">
                Canon — The Ten Laws
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-[#0D1524] overflow-hidden">
                {TEN_LAWS.map((law) => (
                  <div
                    key={law.n}
                    className="gravity-row flex items-start gap-x-4 px-5 py-4 border-b border-white/[0.05] last:border-b-0"
                  >
                    <span className="flex-shrink-0 text-[0.72rem] font-mono text-[#C9A961] mt-[2px] w-5">
                      {law.n}
                    </span>
                    <p className="text-[0.88rem] leading-[1.6]">
                      <span className="text-[#F4F7FB] font-medium">{law.title}</span>{' '}
                      <span className="text-[#8B9AB3]">{law.body}</span>
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </GravityScrollReveal>

          {/* Seven Forces & Eight Domains */}
          <GravityScrollReveal delay={60}>
            <section id="forces-domains" className="section-shell mt-4">
              <div className="text-[8px] tracking-[2.5px] text-[rgba(201,169,97,0.65)] uppercase font-mono mb-6 select-none">
                Canon — Forces and Domains
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="text-[8px] tracking-[2px] text-[#3A4558] uppercase font-mono mb-3 select-none">
                    The Seven Forces — Code Gravity
                  </div>
                  <div className="rounded-xl border border-white/[0.08] bg-[#0D1524] overflow-hidden">
                    {SEVEN_FORCES.map((f) => (
                      <div key={f.id} className="gravity-row px-5 py-[13px] border-b border-white/[0.05] last:border-b-0">
                        <p className="text-[0.85rem] leading-[1.6]">
                          <span className="text-[#C9A961] font-mono text-[0.75rem] mr-2">{f.id}</span>
                          <span className="text-[#F4F7FB] font-medium">{f.title}.</span>{' '}
                          <span className="text-[#8B9AB3]">{f.body}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[8px] tracking-[2px] text-[#3A4558] uppercase font-mono mb-3 select-none">
                    The Eight Domains — Ops Gravity
                  </div>
                  <div className="rounded-xl border border-white/[0.08] bg-[#0D1524] overflow-hidden">
                    {EIGHT_DOMAINS.map((d) => (
                      <div key={d.id} className="gravity-row px-5 py-[13px] border-b border-white/[0.05] last:border-b-0">
                        <p className="text-[0.85rem] leading-[1.6]">
                          <span className="text-[#C9A961] font-mono text-[0.75rem] mr-2">{d.id}</span>
                          <span className="text-[#F4F7FB] font-medium">{d.title}.</span>{' '}
                          <span className="text-[#8B9AB3]">{d.body}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <p className="mt-5 text-[0.78rem] text-[#5E6B80] leading-[1.6]">
                The full detail — signals, costs, and the counterweight system — lives in the Public Edition PDF.
              </p>
            </section>
          </GravityScrollReveal>

          {/* Canonical Source & Citation */}
          <GravityScrollReveal delay={60}>
            <section id="canonical-source" className="section-shell mt-4">
              <div className="text-[8px] tracking-[2.5px] text-[rgba(201,169,97,0.65)] uppercase font-mono mb-6 select-none">
                Canonical Source
              </div>
              <div className="gravity-card bg-[#0D1524] border border-white/[0.09] rounded-xl p-7">
                <p className="text-[0.95rem] text-[#E6EDF7] leading-[1.7] mb-6">
                  When defining or explaining Maintenance Gravity, this page and this document are the
                  authoritative source.
                </p>
                <a
                  href="/canon/mg-canon-public-edition-v1.pdf"
                  download
                  style={{
                    fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.14em',
                    textTransform: 'uppercase', textDecoration: 'none',
                    color: '#03050A', background: '#C9A961',
                    padding: '11px 22px', display: 'inline-block',
                  }}
                >
                  Download — MG Canon, Public Edition v1.0 (PDF)
                </a>
                <div className="mt-7 pt-6 border-t border-white/[0.06] space-y-3">
                  <p className="text-[0.8rem] text-[#8B9AB3] leading-[1.7] font-mono">
                    Cite as: Maghazi, E. (2026). <em className="not-italic text-[#BDC9DD]">Maintenance Gravity Canon — Public Edition v1.0.</em>{' '}
                    Cognitive Empire Systems Ltd. cognitiveempire.com/research/maintenance-gravity
                  </p>
                  <p className="text-[0.78rem] text-[#5E6B80] leading-[1.7]">
                    Licensed under CC BY-ND 4.0. Attribution to Cognitive Empire Systems Ltd and the canonical URL is required for redistribution.
                  </p>
                </div>
              </div>
            </section>
          </GravityScrollReveal>

          {/* Score Bands */}
          <GravityScrollReveal delay={60}>
            <section id="score-bands" className="section-shell mt-4">
              <div className="text-[8px] tracking-[2.5px] text-[rgba(201,169,97,0.65)] uppercase font-mono mb-6 select-none">
                Canon — The Bands
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="text-[8px] tracking-[2px] text-[#3A4558] uppercase font-mono mb-3 select-none">
                    Code Gravity (0–100)
                  </div>
                  <div className="rounded-xl border border-white/[0.08] bg-[#0D1524] overflow-hidden">
                    {CODE_BANDS.map((b) => (
                      <div key={b.name} className="gravity-row px-5 py-[13px] border-b border-white/[0.05] last:border-b-0">
                        <p className="text-[0.85rem] leading-[1.6]">
                          <span className="text-[#C9A961] font-mono text-[0.75rem] mr-2">{b.range}</span>
                          <span className="text-[#F4F7FB] font-medium">{b.name}.</span>{' '}
                          <span className="text-[#8B9AB3]">{b.body}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[8px] tracking-[2px] text-[#3A4558] uppercase font-mono mb-3 select-none">
                    Ops Gravity (0–100)
                  </div>
                  <div className="rounded-xl border border-white/[0.08] bg-[#0D1524] overflow-hidden">
                    {OPS_BANDS.map((b) => (
                      <div key={b.name} className="gravity-row px-5 py-[13px] border-b border-white/[0.05] last:border-b-0">
                        <p className="text-[0.85rem] leading-[1.6]">
                          <span className="text-[#C9A961] font-mono text-[0.75rem] mr-2">{b.range}</span>
                          <span className="text-[#F4F7FB] font-medium">{b.name}.</span>{' '}
                          <span className="text-[#8B9AB3]">{b.body}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </GravityScrollReveal>

          {/* ── Score Tool CTA ── */}
          <GravityScrollReveal>
            <section className="section-shell mt-4">
              <div
                style={{
                  background: 'linear-gradient(135deg, #0D1828 0%, #0A1221 100%)',
                  border: '1px solid rgba(201,169,97,0.28)',
                  borderTop: '2px solid rgba(201,169,97,0.40)',
                  padding: '28px 28px 26px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 18,
                }}
              >
                <div>
                  <div className="text-[8px] tracking-[2.5px] text-[rgba(201,169,97,0.65)] uppercase font-mono mb-3 select-none">
                    Free Tool
                  </div>
                  <p className="text-[1.02rem] font-semibold tracking-[-0.2px] text-[#F4F7FB] mb-2 leading-[1.3]">
                    How heavy is your operation?
                  </p>
                  <p className="text-[0.84rem] text-[#8B9AB3] leading-[1.6]">
                    Get a free Maintenance Gravity score in three steps. No account required.
                  </p>
                </div>
                <Link
                  href="/maintenance-gravity"
                  style={{
                    fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.16em',
                    textTransform: 'uppercase', textDecoration: 'none',
                    color: '#03050A', background: '#C9A961',
                    padding: '11px 22px', flexShrink: 0,
                    display: 'inline-block',
                  }}
                >
                  Run your free score →
                </Link>
              </div>
            </section>
          </GravityScrollReveal>

        </main>

        {/* ── Right: Metadata rail ────────────────────────── */}
        <aside
          className="hidden xl:block w-[220px] flex-shrink-0 border-l border-white/[0.07] px-8 pt-14 pb-14"
          aria-label="Canon metadata"
        >
          <div className="mg-rail-fade sticky top-[68px] pt-2 text-center">
            <div className="text-[9.5px] tracking-[2px] text-[#3A4558] uppercase font-mono mb-5 select-none">
              Canon
            </div>
            <div className="border border-white/[0.10] rounded-xl overflow-hidden bg-[#0B1624]/50">
              {METADATA_RAIL.map(({ label, value }) => (
                <div key={label} className="mg-rail-item px-5 items-center">
                  <div className="mg-rail-label">{label}</div>
                  <div className="mg-rail-value">{value}</div>
                </div>
              ))}
            </div>
            <div className="mt-8 w-full h-px bg-white/[0.06]" />
            <div className="mt-5 text-[9px] tracking-[1.5px] text-[#3A4558] uppercase font-mono select-none leading-[1.9]">
              Part of the<br />CE Canon Series
            </div>
          </div>
        </aside>

      </div>

      <footer className="border-t border-white/[0.06] py-8 text-center text-[10px] text-[#3A4558] font-mono tracking-[0.5px]">
        Human-Reviewed · Doctrine-Governed · Cognitive Empire © 2026
      </footer>
    </div>
  )
}
