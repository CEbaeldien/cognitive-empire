import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import CENav from '@/app/components/CENav'
import CEFooter from '@/app/components/CEFooter'
import SiteHoldBanner from '@/app/components/SiteHoldBanner'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  title: 'Physical & Infra Ops — Cognitive Empire',
  description:
    'Map doctrine to real constraints. Build survivable systems. Defend continuity when creation outpaces capacity.',
  openGraph: {
    title: 'Physical & Infra Ops — Cognitive Empire',
    description: 'Real constraints. Real continuity. Survivable systems under actual load.',
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

const PROTOCOLS = [
  {
    title: 'Maintenance Gravity Defense',
    headline: 'Creation accelerates faster than continuity capacity. Every added layer carries future governance cost.',
    protocol:
      'Bounded Expansion Rule. Before adding any new system, workflow, or integration, assess whether current continuity capacity can absorb it. If not, either build continuity capacity first or refuse the expansion.',
    crossRef: null,
  },
  {
    title: 'Attention and Energy Mapping',
    headline:
      'Cognitive bandwidth is a physical constraint. Governance load that exceeds available attention produces debt, not output.',
    protocol:
      'At the start of each orchestration cycle, map available attention and energy against required governance load. Reduce governance commitments before adding new ones. When the gap is negative, the next system added will degrade the ones already running.',
    crossRef: null,
  },
  {
    title: 'Complexity Accumulation Audit',
    headline: 'Interaction density compounds silently. Systems that felt manageable at five layers can collapse at twelve.',
    protocol:
      'Map interaction density across current systems. Reduce one layer of unnecessary abstraction per audit cycle.',
    crossRef: null,
  },
  {
    title: 'MMCP Orchestration Under Physical Load',
    headline: 'Physical constraints reduce available orchestration bandwidth.',
    protocol:
      'When time, energy, or attention are scarce, MMCP must run with tighter module boundaries, stricter context rules, and higher refusal rates. Maintenance Gravity accelerates under physical pressure. Orchestration discipline must increase accordingly.',
    crossRef: 'Execution Ops',
  },
]

const SURVIVABLE_CHECKLIST = [
  'Governance clarity preserved as scale increases?',
  'Escalation integrity visible and protected?',
  'Human override capacity maintained at loss boundaries?',
  'Legibility preserved — can failures still be diagnosed quickly?',
  'Constraint discipline visible — what has been deliberately refused?',
  'Attention budget solvent — can current governance load be carried without degrading existing systems?',
]

export default function PhysicalInfraOpsPage() {
  return (
    <div
      className={inter.className}
      style={{
        background: `
          radial-gradient(circle at 60% 90%, rgba(197,162,111,0.025), transparent 30%),
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
          CE · Doctrine Pillar 03
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: 'clamp(2.2rem, 5vw, 3.4rem)', fontWeight: 200,
          color: P.light, letterSpacing: '-0.04em', lineHeight: 1.05,
          margin: '0 0 18px',
        }}>
          Physical &amp; Infra Ops
        </h1>

        <div style={{ width: 36, height: 1, background: P.goldBorder, marginBottom: 24 }} />

        <p style={{ fontSize: '1.08rem', color: P.mid, lineHeight: 1.65, marginBottom: 16, maxWidth: 620 }}>
          Real constraints. Real continuity. Survivable systems under actual load.
        </p>
        <p style={{ fontSize: '0.9rem', color: P.muted, lineHeight: 1.8, marginBottom: 16, maxWidth: 620 }}>
          Abundance feels digital. Its limits are physical: energy, hardware, geography, attention,
          contract timelines, and family obligations.
        </p>
        <p style={{ fontSize: '0.9rem', color: P.muted, lineHeight: 1.8, marginBottom: 52, maxWidth: 620 }}>
          This pillar maps the Operator Kernel directly to physical operating conditions — the
          constraints that force tighter orchestration, higher refusal rates, and harder choices
          about what survives and what doesn&apos;t.
        </p>

        {/* Section label */}
        <div style={{
          fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.28em',
          textTransform: 'uppercase', color: P.dimmer, fontFamily: 'monospace',
          marginBottom: 20,
        }}>
          Core Protocols
        </div>

        {/* Protocols */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 48 }}>
          {PROTOCOLS.map((p) => (
            <div
              key={p.title}
              style={{
                background: P.panel,
                border: `1px solid ${P.border}`,
                borderRadius: 12,
                padding: '20px 24px',
              }}
            >
              <p style={{
                fontSize: '0.62rem', letterSpacing: '0.2em',
                textTransform: 'uppercase', color: P.dim, fontFamily: 'monospace',
                margin: '0 0 8px',
              }}>
                {p.title}
                {p.crossRef && (
                  <span style={{ color: P.dimmer, marginLeft: 8 }}>
                    — Cross-reference: {p.crossRef}
                  </span>
                )}
              </p>
              <p style={{ fontSize: '0.96rem', color: P.light, fontWeight: 500, lineHeight: 1.5, margin: '0 0 14px' }}>
                {p.headline}
              </p>
              <div>
                <div style={{
                  fontSize: '0.55rem', letterSpacing: '0.24em',
                  textTransform: 'uppercase', color: P.dimmer, fontFamily: 'monospace',
                  marginBottom: 8,
                }}>
                  Protocol
                </div>
                <p style={{ fontSize: '0.85rem', color: P.muted, lineHeight: 1.78, margin: 0 }}>
                  {p.protocol}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Survivable Systems Checklist */}
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
            marginBottom: 18,
          }}>
            Survivable Systems Checklist
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {SURVIVABLE_CHECKLIST.map((item) => (
              <li
                key={item}
                style={{
                  fontSize: '0.86rem', color: P.muted, lineHeight: 1.75,
                  paddingBottom: 10, marginBottom: 10,
                  borderBottom: `1px solid rgba(255,255,255,0.05)`,
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                }}
              >
                <span style={{ color: P.goldBorder, flexShrink: 0, paddingTop: 2 }}>—</span>
                {item}
              </li>
            ))}
          </ul>
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
            Full manuscript chapters on Maintenance Gravity, Complexity Accumulation, Survivable
            Systems, and Physical Constraints are available in the Sovereign Kernel.
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
