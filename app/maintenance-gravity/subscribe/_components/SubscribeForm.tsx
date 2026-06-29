'use client'

import { useState } from 'react'
import Link from 'next/link'

const P = {
  bg:        '#03050A',
  panel:     '#0A1221',
  border:    'rgba(255,255,255,0.07)',
  borderMid: 'rgba(255,255,255,0.10)',
  text:      '#EBF1FA',
  muted:     '#7A8DA6',
  dim:       '#4A5A70',
  dimmer:    '#2A3548',
  gold:      '#C9A961',
  goldBorder:'rgba(201,169,97,0.30)',
} as const

const TIER_INFO: Record<string, { name: string; price: string; features: string[] }> = {
  starter: {
    name:  'Starter',
    price: '$49/mo',
    features: ['Weekly MG report', 'Intervention recommendations', 'Priority support'],
  },
  operator: {
    name:  'Operator',
    price: '$149/mo',
    features: ['Full CE doctrine application', 'Custom governance design session', 'Monthly review call'],
  },
}

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  background: '#0D1828', border: '1px solid rgba(255,255,255,0.10)',
  color: '#EBF1FA', padding: '10px 14px',
  fontSize: '0.9rem', lineHeight: '1.5', outline: 'none',
  fontFamily: 'inherit',
}

export function SubscribeForm({ tier: tierKey }: { tier: string }) {
  const tier = TIER_INFO[tierKey] ?? TIER_INFO.starter

  const [name,   setName]   = useState('')
  const [email,  setEmail]  = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errMsg, setErrMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('loading')
    setErrMsg('')

    try {
      const res = await fetch('/api/maintenance-gravity/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), name: name.trim() || null, tier: tierKey }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(data.error ?? 'Something went wrong')
      }
      setStatus('success')
    } catch (err: unknown) {
      setStatus('error')
      setErrMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    }
  }

  return (
    <>
      <style>{`
        .sf-input:focus { border-color: rgba(201,169,97,0.45) !important; }
        .sf-btn { transition: opacity 150ms ease; cursor: pointer; font-family: inherit; }
        .sf-btn:hover:not(:disabled) { opacity: 0.85; }
        .sf-btn:disabled { opacity: 0.40; cursor: not-allowed; }
      `}</style>

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '64px 24px 80px' }}>

        <div style={{ marginBottom: 28 }}>
          <Link href="/maintenance-gravity" style={{
            fontSize: '0.68rem', color: P.dim, letterSpacing: '0.06em',
            textDecoration: 'underline', textDecorationColor: P.dimmer,
          }}>
            ← Back to Maintenance Gravity
          </Link>
        </div>

        <div style={{ marginBottom: 32 }}>
          <p style={{
            fontSize: '0.56rem', fontWeight: 700, letterSpacing: '0.40em',
            textTransform: 'uppercase', fontFamily: 'monospace',
            color: P.gold, margin: '0 0 10px',
          }}>
            Maintenance Gravity — {tier.name}
          </p>
          <h1 style={{
            fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 300,
            color: P.text, margin: '0 0 8px', letterSpacing: '-0.03em', lineHeight: 1.1,
          }}>
            Join the waitlist
          </h1>
          <p style={{ fontSize: '0.9rem', color: P.muted, margin: '0 0 6px', lineHeight: 1.6 }}>
            <strong style={{ color: P.text }}>{tier.price}</strong>
            {' — '}
            {tier.features.join(' · ')}
          </p>
          <p style={{ fontSize: '0.78rem', color: P.dim, margin: 0, lineHeight: 1.6 }}>
            We're building this now. Leave your email and we'll reach out when it's ready.
          </p>
        </div>

        {status === 'success' ? (
          <div style={{
            padding: '28px 24px', textAlign: 'center',
            background: 'rgba(47,182,126,0.07)',
            border: '1px solid rgba(47,182,126,0.25)',
          }}>
            <div style={{ fontSize: '1.6rem', marginBottom: 10, color: '#2FB67E' }}>✓</div>
            <p style={{ fontSize: '0.92rem', color: '#2FB67E', fontWeight: 600, margin: '0 0 8px' }}>
              You're on the list.
            </p>
            <p style={{ fontSize: '0.80rem', color: P.muted, margin: 0, lineHeight: 1.65 }}>
              We'll contact you at{' '}
              <strong style={{ color: P.text }}>{email}</strong>{' '}
              when {tier.name} is available.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{
            background: P.panel,
            border: `1px solid ${P.borderMid}`,
            borderTop: `2px solid ${P.goldBorder}`,
            padding: '28px 24px',
          }}>
            <div style={{ marginBottom: 14 }}>
              <label style={{
                display: 'block', fontSize: '0.68rem', color: P.dim,
                letterSpacing: '0.08em', marginBottom: 6,
                fontFamily: 'monospace', textTransform: 'uppercase',
              }}>
                Name (optional)
              </label>
              <input
                type="text"
                className="sf-input"
                style={inputStyle}
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={status === 'loading'}
              />
            </div>

            <div style={{ marginBottom: 22 }}>
              <label style={{
                display: 'block', fontSize: '0.68rem', color: P.dim,
                letterSpacing: '0.08em', marginBottom: 6,
                fontFamily: 'monospace', textTransform: 'uppercase',
              }}>
                Email address *
              </label>
              <input
                type="email"
                required
                className="sf-input"
                style={inputStyle}
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === 'loading'}
              />
            </div>

            {status === 'error' && (
              <p style={{ fontSize: '0.76rem', color: '#E05050', marginBottom: 12, lineHeight: 1.5 }}>
                {errMsg}
              </p>
            )}

            <button
              type="submit"
              className="sf-btn"
              style={{
                width: '100%', padding: '11px 0',
                fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.16em',
                textTransform: 'uppercase', border: 'none',
                color: '#03050A', background: P.gold,
              }}
              disabled={status === 'loading' || !email.trim()}
            >
              {status === 'loading' ? 'Joining...' : 'Join waitlist →'}
            </button>

            <p style={{
              marginTop: 12, fontSize: '0.68rem', color: P.dim,
              lineHeight: 1.5, textAlign: 'center',
            }}>
              No spam. We'll only email you when this tier is available.
            </p>
          </form>
        )}

      </div>
    </>
  )
}
