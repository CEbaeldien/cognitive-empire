'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { MmcpSession } from '@/types/mmcp'

const S = {
  bg:     '#05070B',
  text:   '#E6EDF7',
  accent: '#C5A26F',
  muted:  'rgba(230,237,247,0.45)',
  faint:  'rgba(230,237,247,0.18)',
  border: 'rgba(230,237,247,0.07)',
} as const

const NAV_ITEMS = [
  { href: '/dashboard',    label: 'Sessions'    },
  { href: '/model-roles',  label: 'Model Roles' },
  { href: '/memory',       label: 'Memory'      },
  { href: '/keys',         label: 'BYOK Gate'   },
]

function formatTimer(ms: number): string {
  const s   = Math.floor(ms / 1000)
  const h   = Math.floor(s / 3600)
  const m   = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export default function MmcpLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()

  const [checking, setChecking] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [session,  setSession]  = useState<MmcpSession | null>(null)
  const [elapsed,  setElapsed]  = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Parse session id from URL
  const sessionMatch = pathname.match(/\/sessions\/([^/]+)/)
  const sessionId    = sessionMatch?.[1] ?? null

  // Auth guard
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.replace('/auth/login')
      else setChecking(false)
    })
  }, [router])

  // Responsive breakpoint
  useEffect(() => {
    function check() { setIsMobile(window.innerWidth < 768) }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Fetch session for header
  useEffect(() => {
    if (!sessionId) { setSession(null); return }
    const supabase = createClient()
    supabase
      .from('mmcp_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()
      .then(({ data }) => setSession((data as MmcpSession) ?? null))
  }, [sessionId])

  // Live timer
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (!session?.created_at) { setElapsed(0); return }
    const start = new Date(session.created_at).getTime()
    const tick  = () => setElapsed(Date.now() - start)
    tick()
    timerRef.current = setInterval(tick, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [session?.created_at])

  if (checking) {
    return (
      <div style={{ minHeight: '100vh', background: S.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
        <p style={{ fontSize: 15, color: S.faint }}>Verifying access…</p>
      </div>
    )
  }

  return (
    <>
      <style>{`
        @keyframes pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        .mmcp-nav-link:hover { background: rgba(230,237,247,0.06) !important; color: #E6EDF7 !important; }
        .mmcp-tab:hover { color: #C5A26F !important; }
      `}</style>

      <div style={{ minHeight: '100vh', background: S.bg, display: 'flex', flexDirection: 'column', color: S.text, fontFamily: 'system-ui, -apple-system, sans-serif' }}>

        {/* ── Sticky header ────────────────────────────────────── */}
        <header style={{
          position:       'sticky',
          top:            0,
          zIndex:         50,
          background:     S.bg,
          borderBottom:   `1px solid ${S.border}`,
          height:         52,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          padding:        '0 20px',
          flexShrink:     0,
        }}>
          {/* Left — session title or brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            {session ? (
              <>
                <Link href="/dashboard" style={{ fontSize: 13, color: S.faint, textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  ← Sessions
                </Link>
                <span style={{ color: S.border, flexShrink: 0 }}>·</span>
                <span style={{ fontSize: 15, fontWeight: 600, color: S.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {session.title}
                </span>
              </>
            ) : (
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: S.accent }}>
                MMCP Engine
              </span>
            )}
          </div>

          {/* Center — live timer */}
          {session ? (
            <span style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums', color: S.muted, letterSpacing: '0.06em', flexShrink: 0 }}>
              {formatTimer(elapsed)}
            </span>
          ) : <span />}

          {/* Right — LIVE badge */}
          {session ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: S.accent, animation: 'pulse-dot 2s ease-in-out infinite' }} />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: S.accent }}>LIVE</span>
            </div>
          ) : <span />}
        </header>

        {/* ── Body ──────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>

          {/* Sidebar — desktop */}
          {!isMobile && (
            <nav style={{
              width:         200,
              borderRight:   `1px solid ${S.border}`,
              padding:       '24px 10px',
              display:       'flex',
              flexDirection: 'column',
              gap:           2,
              flexShrink:    0,
            }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: S.accent, padding: '0 10px', marginBottom: 12 }}>
                MMCP
              </p>
              {NAV_ITEMS.map(item => {
                const active = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="mmcp-nav-link"
                    style={{
                      display:        'flex',
                      alignItems:     'center',
                      padding:        '10px 10px',
                      borderRadius:   7,
                      fontSize:       15,
                      color:          active ? S.text : S.muted,
                      background:     active ? 'rgba(230,237,247,0.06)' : 'transparent',
                      textDecoration: 'none',
                      minHeight:      44,
                      transition:     'all 0.12s ease',
                    }}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          )}

          {/* Main content */}
          <main style={{
            flex:          1,
            overflowY:     'auto',
            overflowX:     'hidden',
            minWidth:      0,
            paddingBottom: isMobile ? 72 : 0,
          }}>
            {children}
          </main>
        </div>

        {/* ── Bottom tab bar — mobile ───────────────────────────── */}
        {isMobile && (
          <nav style={{
            position:   'fixed',
            bottom:     0, left: 0, right: 0,
            height:     64,
            background: '#0A0E16',
            borderTop:  `1px solid ${S.border}`,
            display:    'flex',
            alignItems: 'stretch',
            zIndex:     100,
          }}>
            {NAV_ITEMS.map(item => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="mmcp-tab"
                  style={{
                    flex:           1,
                    display:        'flex',
                    flexDirection:  'column',
                    alignItems:     'center',
                    justifyContent: 'center',
                    gap:            3,
                    fontSize:       10,
                    fontWeight:     active ? 600 : 400,
                    color:          active ? S.accent : S.faint,
                    textDecoration: 'none',
                    transition:     'color 0.12s ease',
                  }}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        )}

      </div>
    </>
  )
}
