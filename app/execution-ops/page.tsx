import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import CENav from '@/app/components/CENav'
import CEFooter from '@/app/components/CEFooter'
import SiteHoldBanner from '@/app/components/SiteHoldBanner'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  title: 'Execution Ops — Cognitive Empire',
  description:
    'MMCP orchestration. Maintenance Gravity defense. The practical engine for distributed intelligence.',
  openGraph: {
    title: 'Execution Ops — Cognitive Empire',
    description:
      'Run MMCP orchestration. Keep coherence stronger than Maintenance Gravity.',
    siteName: 'Cognitive Empire',
  },
}

const P = {
  bg:         '#05070B',
  panel:      '#0A1221',
  panelDeep:  '#0B1220',
  border:     'rgba(255,255,255,0.08)',
  text:       '#E6EDF7',
  light:      '#F4F7FB',
  mid:        '#C2CEDF',
  muted:      '#8B9AB3',
  dim:        '#4A5A70',
  dimmer:     '#3A4558',
  gold:       '#C5A26F',
  goldBorder: 'rgba(197,162,111,0.35)',
  goldDim:    'rgba(197,162,111,0.55)',
} as const

const PROTOCOLS: {
  num: string
  title: string
  intro: string
  bullets: string[]
  note: string | null
}[] = [
  {
    num: '1',
    title: 'MMCP Module Role Architecture',
    intro: 'Before introducing any new model or agent, create its role card:',
    bullets: [
      'Exact task it owns',
      'Context it receives and context it is forbidden to access',
      'What it can propose versus what it can never commit',
      'Clear escalation triggers',
    ],
    note: 'This single practice prevents local optimization from destroying global coherence.',
  },
  {
    num: '2',
    title: 'MMCP Orchestration Rhythm',
    intro: 'Replace constant reactive prompting with governed cycles:',
    bullets: [
      'Define the current mission slice',
      'Assign modules to specific fragments with explicit handoff rules',
      'Run the cycle',
      'Human review only at defined escalation boundaries',
      'Log outcome + coherence impact',
    ],
    note: 'This is how MMCP becomes a daily operating system instead of scattered tool use.',
  },
  {
    num: '3',
    title: 'Maintenance Gravity Defense (Real-Time)',
    intro: 'Inside every orchestration cycle, answer:',
    bullets: [
      'Does this new output or workflow increase future governance load more than it increases leverage?',
      'Track active modules + integration points + context layers weekly.',
    ],
    note: 'When the count rises without matching clarity gains, Maintenance Gravity is winning. Tighten orchestration immediately.',
  },
  {
    num: '4',
    title: 'Orchestration Failure Shield',
    intro: 'Run these checks inside MMCP cycles:',
    bullets: [
      'Local vs global coherence',
      'Context bleed across modules',
      'Escalation erosion — decisions quietly defaulting to models',
      'Velocity masking strategic drift',
    ],
    note: null,
  },
  {
    num: '5',
    title: 'Micro-Burst Orchestration (Constrained Time)',
    intro:
      'For operators under heavy real-world load: break work into the smallest coherent orchestration units that survive interruption while still carrying:',
    bullets: [
      'Clear module roles',
      'Explicit context boundaries',
      'Human escalation checkpoints',
    ],
    note: null,
  },
]

export default function ExecutionOpsPage() {
  return (
    <div
      className={inter.className}
      style={{
        background: `
          radial-gradient(circle at 15% 8%, rgba(0,216,255,0.03), transparent 30%),
          linear-gradient(180deg, #05070B 0%, #07111F 50%, #05070B 100%)
        `,
        minHeight: '100vh',
        color: P.text,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <SiteHoldBanner />
      <CENav />

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '64px 32px 120px' }}>

        {/* Eyebrow */}
        <div style={{
          fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.32em',
          textTransform: 'uppercase', color: P.gold, fontFamily: 'monospace',
          marginBottom: 28,
        }}>
          CE · Doctrine Pillar 02
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: 'clamp(2.4rem, 5vw, 3.6rem)', fontWeight: 200,
          color: P.light, letterSpacing: '-0.04em', lineHeight: 1.05,
          margin: '0 0 12px',
        }}>
          Execution Ops
        </h1>

        {/* Sub-headline */}
        <p style={{
          fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.22em',
          textTransform: 'uppercase', color: P.dim, fontFamily: 'monospace',
          margin: '0 0 18px',
        }}>
          MMCP · Orchestration · Maintenance Gravity
        </p>

        <div style={{ width: 36, height: 1, background: P.goldBorder, marginBottom: 24 }} />

        {/* Opening — bridge before "This is the active engine" */}
        <p style={{ fontSize: '1.08rem', color: P.mid, lineHeight: 1.65, marginBottom: 16, maxWidth: 620 }}>
          Governance establishes the boundaries. Execution is how you move within them.
          This is the active engine.
        </p>

        <p style={{ fontSize: '0.9rem', color: P.muted, lineHeight: 1.8, marginBottom: 16, maxWidth: 620 }}>
          Intelligence abundance makes generation cheap. The binding constraint becomes
          orchestration — the deliberate architecture of how distributed intelligence interacts
          over time without producing fragmentation and entropy.
        </p>

        <p style={{ fontSize: '0.9rem', color: P.muted, lineHeight: 1.8, marginBottom: 16, maxWidth: 620 }}>
          <strong style={{ color: P.mid, fontWeight: 600 }}>MMCP</strong> is the orchestration engine that runs on top of the Operator Kernel.
          It protects human consequential judgment while turning doctrine into compounding,
          executable action even under real-world time pressure.
        </p>

        <p style={{ fontSize: '0.9rem', color: P.muted, lineHeight: 1.8, marginBottom: 52, maxWidth: 620 }}>
          <strong style={{ color: P.mid, fontWeight: 600 }}>Maintenance Gravity</strong> is the opposing force.
          Every new output, workflow, integration, or agent adds governance cost and complexity.
          Without disciplined orchestration, creation outruns continuity and coherence quietly collapses.
          Execution Ops exists to keep MMCP orchestration stronger than Maintenance Gravity.
        </p>

        {/* MMCP Core section */}
        <div style={{
          background: P.panelDeep,
          border: `1px solid rgba(255,255,255,0.07)`,
          borderRadius: 12,
          padding: '24px 28px',
          marginBottom: 48,
        }}>
          <div style={{
            fontSize: '0.55rem', letterSpacing: '0.28em',
            textTransform: 'uppercase', color: P.goldDim, fontFamily: 'monospace',
            marginBottom: 14,
          }}>
            MMCP Orchestration Core
          </div>
          <p style={{ fontSize: '0.9rem', color: P.mid, lineHeight: 1.78, margin: 0 }}>
            MMCP treats models, agents, and tools as modules with defined roles, explicit context
            boundaries, and zero default decision rights. The human remains the only actor with
            escalation authority and consequential judgment.
          </p>
        </div>

        {/* Protocols label */}
        <div style={{
          fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.28em',
          textTransform: 'uppercase', color: P.dimmer, fontFamily: 'monospace',
          marginBottom: 20,
        }}>
          Primary Public Protocols — Maximum Weight
        </div>

        {/* Protocols */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 56 }}>
          {PROTOCOLS.map((protocol) => (
            <div
              key={protocol.num}
              style={{
                background: P.panel,
                border: `1px solid ${P.border}`,
                borderRadius: 12,
                padding: '20px 24px',
              }}
            >
              <div style={{ display: 'flex', gap: 16, marginBottom: 14, alignItems: 'flex-start' }}>
                <span style={{
                  fontSize: '0.56rem', fontWeight: 700, letterSpacing: '0.3em',
                  textTransform: 'uppercase', color: P.gold, fontFamily: 'monospace',
                  flexShrink: 0, paddingTop: 3, minWidth: 20,
                }}>
                  {protocol.num}
                </span>
                <p style={{
                  fontSize: '0.96rem', color: P.light, fontWeight: 600,
                  lineHeight: 1.4, margin: 0,
                }}>
                  {protocol.title}
                </p>
              </div>
              <div style={{ paddingLeft: 36 }}>
                <p style={{ fontSize: '0.85rem', color: P.muted, lineHeight: 1.78, margin: '0 0 10px' }}>
                  {protocol.intro}
                </p>
                <ul style={{ margin: '0 0 10px', paddingLeft: 18 }}>
                  {protocol.bullets.map((b) => (
                    <li
                      key={b}
                      style={{
                        fontSize: '0.84rem', color: P.muted, lineHeight: 1.75,
                        marginBottom: 4,
                      }}
                    >
                      {b}
                    </li>
                  ))}
                </ul>
                {protocol.note && (
                  <p style={{
                    fontSize: '0.83rem', color: P.dim, lineHeight: 1.75,
                    margin: 0, fontStyle: 'italic',
                  }}>
                    {protocol.note}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Core Principle */}
        <div style={{
          background: P.panelDeep,
          border: `1px solid rgba(255,255,255,0.07)`,
          borderLeft: `2.5px solid ${P.goldBorder}`,
          borderRadius: 12,
          padding: '24px 28px',
          marginBottom: 40,
        }}>
          <div style={{
            fontSize: '0.55rem', letterSpacing: '0.28em',
            textTransform: 'uppercase', color: P.goldDim, fontFamily: 'monospace',
            marginBottom: 14,
          }}>
            Core Principle
          </div>
          <p style={{ fontSize: '1.0rem', color: P.light, lineHeight: 1.6, margin: '0 0 10px', fontWeight: 500 }}>
            Orchestration is constraint design, not model comparison.
          </p>
          <p style={{ fontSize: '0.88rem', color: P.muted, lineHeight: 1.78, margin: 0 }}>
            The objective is never maximum output. The objective is maximum coherence under the
            constant pressure of Maintenance Gravity.
          </p>
        </div>

        {/* Connection to other pillars */}
        <div style={{
          background: P.panel,
          border: `1px solid ${P.border}`,
          borderRadius: 12,
          padding: '20px 24px',
          marginBottom: 40,
        }}>
          <div style={{
            fontSize: '0.55rem', letterSpacing: '0.28em',
            textTransform: 'uppercase', color: P.dimmer, fontFamily: 'monospace',
            marginBottom: 14,
          }}>
            Connection to Other Pillars
          </div>
          <p style={{ fontSize: '0.85rem', color: P.muted, lineHeight: 1.78, margin: '0 0 8px' }}>
            <strong style={{ color: P.mid, fontWeight: 600 }}>Governance Ops</strong> supplies the
            responsibility and escalation boundaries that make safe, fast orchestration possible.
          </p>
          <p style={{ fontSize: '0.85rem', color: P.muted, lineHeight: 1.78, margin: 0 }}>
            <strong style={{ color: P.mid, fontWeight: 600 }}>Physical &amp; Infra Ops</strong> defines
            the real constraints — time, energy, hardware, contracts — that force tighter MMCP
            orchestration and higher refusal rates.
          </p>
        </div>

        {/* Inter-pillar navigation */}
        <div style={{
          borderTop: `1px solid rgba(255,255,255,0.07)`,
          paddingTop: 32,
          marginBottom: 48,
        }}>
          <div style={{
            fontSize: '0.55rem', letterSpacing: '0.26em',
            textTransform: 'uppercase', color: P.dimmer, fontFamily: 'monospace',
            marginBottom: 16,
          }}>
            Related Pillars
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <Link
              href="/governance-ops"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 12,
                background: P.panel, border: `1px solid ${P.border}`,
                borderRadius: 8, padding: '12px 18px', textDecoration: 'none',
              }}
            >
              <span style={{
                fontSize: '0.56rem', letterSpacing: '0.22em',
                color: P.gold, fontFamily: 'monospace', textTransform: 'uppercase',
              }}>01</span>
              <span style={{ fontSize: '0.82rem', color: P.muted }}>Governance Ops →</span>
            </Link>
            <Link
              href="/physical-infra-ops"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 12,
                background: P.panel, border: `1px solid ${P.border}`,
                borderRadius: 8, padding: '12px 18px', textDecoration: 'none',
              }}
            >
              <span style={{
                fontSize: '0.56rem', letterSpacing: '0.22em',
                color: P.gold, fontFamily: 'monospace', textTransform: 'uppercase',
              }}>03</span>
              <span style={{ fontSize: '0.82rem', color: P.muted }}>Physical &amp; Infra Ops →</span>
            </Link>
          </div>
        </div>

        {/* Go Deeper */}
        <div style={{ textAlign: 'center', paddingTop: 8 }}>
          <div style={{
            fontSize: '0.55rem', letterSpacing: '0.26em',
            textTransform: 'uppercase', color: P.dimmer, fontFamily: 'monospace',
            marginBottom: 14,
          }}>
            Go Deeper
          </div>
          <p style={{
            fontSize: '0.85rem', color: '#5E6B80', lineHeight: 1.78,
            maxWidth: 460, margin: '0 auto 18px',
          }}>
            Full manuscript treatment of Modular Cognition, Maintenance Gravity, Complexity
            Accumulation, and operational continuity is in the Sovereign Kernel.
          </p>
          <Link
            href="/operator-kernel"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.16em',
              textTransform: 'uppercase', color: P.gold, textDecoration: 'none',
            }}
          >
            Access the Sovereign Kernel →
          </Link>
        </div>

      </main>

      <CEFooter />
    </div>
  )
}
