import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import CENav from '@/app/components/CENav'
import CEFooter from '@/app/components/CEFooter'
import SiteHoldBanner from '@/app/components/SiteHoldBanner'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  title: 'Governance Ops — Cognitive Empire',
  description:
    'Turn the Immutable Laws into live decision frameworks. Keep responsibility human when automation scales.',
  openGraph: {
    title: 'Governance Ops — Cognitive Empire',
    description: 'Responsibility stays human. Escalation stays explicit. Judgment stays sovereign.',
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

const LAWS = [
  {
    numeral: 'I',
    name: 'Intelligence Abundance Law',
    headline: 'Output inflates. Value migrates upstream.',
    protocol:
      'Weekly Value Migration Audit — identify where output is growing fastest and where ownership remains thin. Redirect attention upstream.',
  },
  {
    numeral: 'II',
    name: 'Bottleneck Migration Law',
    headline:
      'When one constraint collapses, another dominates. Optimizing the wrong layer creates instability.',
    protocol:
      'Active Bottleneck Diagnostic. Answer three questions after any major capability shift or capacity increase: What was the constraint before? What is dominant now? What layer are we currently optimizing?',
  },
  {
    numeral: 'III',
    name: 'Responsibility Migration Law',
    headline: 'Automation increases ambiguity. Ownership becomes economic currency.',
    protocol:
      'Responsibility Mapping. For every workflow or agentic process, explicitly name who owns consequence and who holds escalation authority.',
  },
  {
    numeral: 'IV',
    name: 'Output Inflation Law',
    headline:
      'When everyone can produce, differentiation moves to selection, constraint design, and outcome integrity.',
    protocol: 'Selection Before Amplification. Nothing scales without passing a deliberate filter.',
  },
  {
    numeral: 'V',
    name: 'Decision Half-Life Law',
    headline: 'Some decisions must be defended. Others must adapt. Confusing them destroys coherence.',
    protocol:
      'Decision Half-Life Filter. Protect long half-life decisions. Iterate only inside the boundaries they define.',
  },
  {
    numeral: 'VI',
    name: 'Escalation Preservation Law',
    headline: 'Outsource analysis. Never outsource responsibility.',
    protocol:
      'Escalation Boundary Definition. Pre-define which actions require human override before deployment.',
  },
  {
    numeral: 'VII',
    name: 'Optimization Fragility Law',
    headline: 'Speed without governance produces brittleness under scale.',
    protocol: 'Governance Friction Test. Locate where added velocity increases hidden fragility.',
  },
  {
    numeral: 'VIII',
    name: 'Human Differentiation Law',
    headline: 'Perfect logic commoditizes. Constraint and signal preserve leverage.',
    protocol:
      'Strategic Imperfection. Identify the single surface you will not optimize for scale. Commit to it explicitly in writing. Revisit quarterly — protect it, do not improve it.',
  },
]

export default function GovernanceOpsPage() {
  return (
    <div
      className={inter.className}
      style={{
        background: `
          radial-gradient(circle at 82% 6%, rgba(197,162,111,0.035), transparent 30%),
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
          CE · Doctrine Pillar 01
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: 'clamp(2.4rem, 5vw, 3.6rem)', fontWeight: 200,
          color: P.light, letterSpacing: '-0.04em', lineHeight: 1.05,
          margin: '0 0 18px',
        }}>
          Governance Ops
        </h1>

        <div style={{ width: 36, height: 1, background: P.goldBorder, marginBottom: 24 }} />

        <p style={{ fontSize: '1.08rem', color: P.mid, lineHeight: 1.65, marginBottom: 16, maxWidth: 620 }}>
          Responsibility stays human. Escalation stays explicit. Judgment stays sovereign.
        </p>
        <p style={{ fontSize: '0.9rem', color: P.muted, lineHeight: 1.8, marginBottom: 16, maxWidth: 620 }}>
          When intelligence is abundant, governance becomes the scarce function that determines whether
          speed creates leverage or fragility. Automation increases throughput. It also increases
          ambiguity. Ownership is the currency that survives.
        </p>
        <p style={{ fontSize: '0.9rem', color: P.muted, lineHeight: 1.8, marginBottom: 52, maxWidth: 620 }}>
          This pillar converts the 8 Immutable Laws and core structural principles into public,
          executable governance protocols.
        </p>

        {/* Section label */}
        <div style={{
          fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.28em',
          textTransform: 'uppercase', color: P.dimmer, fontFamily: 'monospace',
          marginBottom: 20,
        }}>
          The 8 Immutable Laws — Operational Versions
        </div>

        {/* Laws */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 56 }}>
          {LAWS.map((law) => (
            <div
              key={law.numeral}
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
                  {law.numeral}
                </span>
                <div>
                  <div style={{
                    fontSize: '0.57rem', letterSpacing: '0.2em',
                    textTransform: 'uppercase', color: P.dim, fontFamily: 'monospace',
                    marginBottom: 6,
                  }}>
                    {law.name}
                  </div>
                  <p style={{ fontSize: '0.96rem', color: P.light, fontWeight: 500, lineHeight: 1.5, margin: 0 }}>
                    {law.headline}
                  </p>
                </div>
              </div>
              <div style={{ paddingLeft: 36 }}>
                <div style={{
                  fontSize: '0.55rem', letterSpacing: '0.24em',
                  textTransform: 'uppercase', color: P.dimmer, fontFamily: 'monospace',
                  marginBottom: 8,
                }}>
                  Protocol
                </div>
                <p style={{ fontSize: '0.85rem', color: P.muted, lineHeight: 1.78, margin: 0 }}>
                  {law.protocol}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Connection to Execution Ops */}
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
            Connection to Execution Ops
          </div>
          <p style={{ fontSize: '0.88rem', color: P.mid, lineHeight: 1.78, margin: 0 }}>
            Strong governance creates the conditions for clean MMCP orchestration. Clear
            responsibility and escalation boundaries allow orchestration to move fast without
            diffusing ownership or accelerating Maintenance Gravity.
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
              href="/execution-ops"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 12,
                background: P.panel, border: `1px solid ${P.border}`,
                borderRadius: 8, padding: '12px 18px', textDecoration: 'none',
              }}
            >
              <span style={{
                fontSize: '0.56rem', letterSpacing: '0.22em',
                color: P.gold, fontFamily: 'monospace', textTransform: 'uppercase',
              }}>02</span>
              <span style={{ fontSize: '0.82rem', color: P.muted }}>Execution Ops →</span>
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
            maxWidth: 440, margin: '0 auto 18px',
          }}>
            Full manuscript sections on Governance Under Abundance, Decision Half-Life, and the
            Immutable Laws are available in the Sovereign Kernel.
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
