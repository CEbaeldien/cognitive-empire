import type { Metadata } from 'next'
import Link from 'next/link'
import CENav from '@/app/components/CENav'
import CEFooter from '@/app/components/CEFooter'
import { MGScoringTool } from './_components/MGScoringTool'

export const metadata: Metadata = {
  title: 'Maintenance Gravity — Cognitive Empire',
  description:
    'How heavy is your operation? Get a free maintenance gravity score — describe your systems, copy a prompt, calculate your operational debt.',
  openGraph: {
    title: 'Maintenance Gravity — Cognitive Empire',
    description: 'How heavy is your operation? Free maintenance gravity scoring tool.',
    siteName: 'Cognitive Empire',
  },
}

const P = {
  bg:         '#03050A',
  panel:      '#0A1221',
  border:     'rgba(255,255,255,0.07)',
  borderMid:  'rgba(255,255,255,0.10)',
  text:       '#EBF1FA',
  muted:      '#7A8DA6',
  dim:        '#4A5A70',
  dimmer:     '#2A3548',
  gold:       '#C9A961',
  goldSoft:   'rgba(201,169,97,0.09)',
  goldBorder: 'rgba(201,169,97,0.30)',
  goldDim:    'rgba(201,169,97,0.15)',
} as const

interface Tier {
  id:       string
  name:     string
  price:    string
  sub:      string
  features: string[]
  cta:      string
  href:     string
  featured: boolean
}

const TIERS: Tier[] = [
  {
    id: 'free', name: 'Free', price: '$0', sub: '',
    features: [
      'Unlimited score tool uses',
      'Generated prompts for any AI',
      'Maintenance Gravity doctrine access',
    ],
    cta: 'Use the free tool', href: '#score-tool', featured: false,
  },
  {
    id: 'starter', name: 'Starter', price: '$49', sub: '/mo',
    features: [
      'Everything in Free',
      'Weekly MG report for your operation',
      'Intervention recommendations',
      'Priority support',
    ],
    cta: 'Get started →', href: '/maintenance-gravity/subscribe?tier=starter', featured: true,
  },
  {
    id: 'operator', name: 'Operator', price: '$149', sub: '/mo',
    features: [
      'Everything in Starter',
      'Full CE doctrine application',
      'Custom governance design session',
      'Monthly review call with CE team',
    ],
    cta: 'Get started →', href: '/maintenance-gravity/subscribe?tier=operator', featured: false,
  },
]

export default function MaintenanceGravityPage() {
  return (
    <>
      <style>{`
        .mg-tier {
          transition: transform 200ms ease-out, border-color 200ms ease;
        }
        .mg-tier:hover { transform: translateY(-2px); }

        .mg-cta {
          display: block; text-align: center; text-decoration: none;
          transition: background 150ms ease, border-color 150ms ease, opacity 150ms ease;
        }
        .mg-cta:hover { opacity: 0.85; }

        @media (max-width: 767px) {
          .mg-tiers   { grid-template-columns: 1fr !important; }
          .mg-hero-w  { padding: 48px 20px 40px !important; }
          .mg-sec-w   { padding: 40px 20px 56px !important; }
        }
        @media (min-width: 768px) and (max-width: 999px) {
          .mg-tiers   { grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)) !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation: none !important; transition: none !important; }
        }
      `}</style>

      <div style={{
        background: P.bg, color: P.text,
        fontFamily: 'system-ui, -apple-system, sans-serif', minHeight: '100vh',
      }}>
        <CENav />

        {/* ══════ HERO ══════ */}
        <section style={{
          borderBottom: `1px solid ${P.border}`,
          background: 'linear-gradient(180deg, #050912 0%, #03050A 100%)',
        }}>
          <div className="mg-hero-w" style={{ maxWidth: 1280, margin: '0 auto', padding: '72px 48px 60px' }}>
            <p style={{
              fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.44em',
              textTransform: 'uppercase', color: P.gold, margin: '0 0 20px',
              fontFamily: 'monospace',
            }}>
              Maintenance Gravity
            </p>
            <h1 style={{
              fontSize: 'clamp(2.4rem, 4.5vw, 4rem)', fontWeight: 300,
              color: P.text, lineHeight: 1.08, margin: '0 0 16px',
              letterSpacing: '-0.04em', maxWidth: 640,
            }}>
              How heavy is<br />
              <span style={{ color: P.gold }}>your operation?</span>
            </h1>
            <p style={{
              fontSize: '1.05rem', color: P.muted, lineHeight: 1.7,
              maxWidth: 460, margin: '0 0 28px',
            }}>
              AI creates speed. Maintenance Gravity determines whether that speed survives.
              Get your free operational debt score in three steps.
            </p>
            <div style={{ width: 32, height: 1, background: P.goldBorder }} />
          </div>
        </section>

        {/* ══════ SCORING TOOL ══════ */}
        <section id="score-tool">
          <div className="mg-sec-w" style={{ maxWidth: 1280, margin: '0 auto', padding: '56px 48px' }}>
            <div style={{ marginBottom: 24 }}>
              <p style={{
                fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.44em',
                textTransform: 'uppercase', color: P.gold, margin: '0 0 6px',
                fontFamily: 'monospace',
              }}>
                Free Score Tool
              </p>
              <p style={{ fontSize: '0.84rem', color: P.dim, margin: '0 0 20px' }}>
                Three steps. No account required.
              </p>
            </div>
            <MGScoringTool />
          </div>
        </section>

        {/* ══════ PRICING ══════ */}
        <section style={{ borderTop: `1px solid ${P.border}` }}>
          <div className="mg-sec-w" style={{ maxWidth: 1280, margin: '0 auto', padding: '56px 48px 80px' }}>

            <div style={{ marginBottom: 36 }}>
              <p style={{
                fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.44em',
                textTransform: 'uppercase', color: P.gold, margin: '0 0 8px',
                fontFamily: 'monospace',
              }}>
                Plans
              </p>
              <h2 style={{
                fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 300,
                color: P.text, margin: '0 0 10px', letterSpacing: '-0.025em', lineHeight: 1.1,
              }}>
                Reduce your maintenance gravity
              </h2>
              <p style={{ fontSize: '0.88rem', color: P.muted, margin: 0, maxWidth: 420, lineHeight: 1.65 }}>
                The free tool gives you a score. The paid tiers give you the interventions.
              </p>
            </div>

            <div className="mg-tiers" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {TIERS.map((tier) => (
                <div key={tier.id} className="mg-tier" style={{
                  background: tier.featured
                    ? 'linear-gradient(180deg, #0D1828 0%, #0A1221 100%)'
                    : P.panel,
                  border: tier.featured ? `1px solid ${P.goldBorder}` : `1px solid ${P.borderMid}`,
                  borderTop: tier.featured ? `2px solid ${P.gold}` : `2px solid ${P.goldDim}`,
                  padding: '28px 24px 24px',
                  display: 'flex', flexDirection: 'column', position: 'relative',
                }}>
                  {tier.featured && (
                    <div style={{
                      position: 'absolute', top: -1, right: 20,
                      fontSize: '0.50rem', fontWeight: 700, letterSpacing: '0.22em',
                      textTransform: 'uppercase', color: P.bg,
                      background: P.gold, padding: '3px 8px', fontFamily: 'monospace',
                    }}>
                      RECOMMENDED
                    </div>
                  )}

                  <div style={{
                    fontSize: '0.60rem', fontWeight: 700, letterSpacing: '0.28em',
                    textTransform: 'uppercase', fontFamily: 'monospace',
                    color: tier.featured ? P.gold : P.muted, marginBottom: 12,
                  }}>
                    {tier.name}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: tier.sub ? 4 : 22, lineHeight: 1 }}>
                    <span style={{
                      fontSize: 'clamp(2rem, 3.5vw, 2.8rem)', fontWeight: 300,
                      color: P.text, letterSpacing: '-0.04em',
                    }}>
                      {tier.price}
                    </span>
                    {tier.sub && (
                      <span style={{ fontSize: '0.82rem', color: P.dim }}>{tier.sub}</span>
                    )}
                  </div>
                  {tier.sub && (
                    <div style={{ fontSize: '0.70rem', color: P.dim, marginBottom: 20 }}>
                      per month, cancel anytime
                    </div>
                  )}

                  <div style={{ height: 1, background: P.border, marginBottom: 20 }} />

                  <ul style={{
                    listStyle: 'none', margin: '0 0 auto', padding: 0,
                    display: 'flex', flexDirection: 'column', gap: 10, flex: 1,
                  }}>
                    {tier.features.map((f, i) => (
                      <li key={i} style={{
                        fontSize: '0.82rem',
                        color: i === 0 && tier.id !== 'free' ? P.dim : P.muted,
                        lineHeight: 1.5, display: 'flex', gap: 8, alignItems: 'flex-start',
                      }}>
                        <span style={{ color: P.gold, flexShrink: 0, marginTop: 1 }}>—</span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <div style={{ marginTop: 24 }}>
                    <Link href={tier.href} className="mg-cta" style={{
                      fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.16em',
                      textTransform: 'uppercase', padding: '10px 0',
                      color: tier.id === 'free' ? P.dim
                           : tier.featured ? P.bg
                           : P.text,
                      background: tier.id === 'free' ? 'transparent'
                                : tier.featured ? P.gold
                                : P.goldSoft,
                      border: `1px solid ${tier.id === 'free' ? P.border : P.goldBorder}`,
                    }}>
                      {tier.cta}
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <p style={{
              marginTop: 24, fontSize: '0.78rem', color: P.dim, textAlign: 'center',
            }}>
              Running multiple operations?{' '}
              <Link href="/connect" style={{
                color: P.muted, textDecoration: 'underline', textDecorationColor: P.dimmer,
              }}>
                Contact us for agency pricing
              </Link>
            </p>

          </div>
        </section>

        <CEFooter />
      </div>
    </>
  )
}
