'use client'
// ── Screen 1: Dashboard ──────────────────────────────────────
// Lists all MMCP sessions with status, priority, last activity.
// Entry point: create new session or continue an existing one.

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { logEvent, AUDIT_EVENT, AUDIT_ENTITY } from '@/lib/mmcp/audit'
import type { MmcpSession, SessionPriority, InstanceScope, CreateSessionInput } from '@/types/mmcp'

// ── Design tokens ──────────────────────────────────────────────
const S = {
  bg:      '#060D1A',
  text:    '#E6EDF7',
  accent:  '#C5A26F',
  muted:   'rgba(230,237,247,0.45)',
  faint:   'rgba(230,237,247,0.18)',
  border:  'rgba(230,237,247,0.07)',
  panel:   'rgba(230,237,247,0.03)',
} as const

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  open:             { color: 'rgba(230,237,247,0.4)',  bg: 'rgba(230,237,247,0.05)' },
  active:           { color: '#93c5fd',                bg: 'rgba(59,130,246,0.12)'  },
  pending_approval: { color: '#C5A26F',                bg: 'rgba(197,162,111,0.1)'  },
  closed:           { color: 'rgba(230,237,247,0.2)',  bg: 'rgba(230,237,247,0.04)' },
  archived:         { color: 'rgba(230,237,247,0.15)', bg: 'rgba(230,237,247,0.03)' },
}

const PRIORITY_COLOR: Record<string, string> = {
  low:      'rgba(230,237,247,0.25)',
  normal:   'rgba(230,237,247,0.45)',
  high:     '#fbbf24',
  critical: '#f87171',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs  < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export default function DashboardPage() {
  const router  = useRouter()
  const supabase = createClient()

  const [sessions,  setSessions]  = useState<MmcpSession[]>([])
  const [loading,   setLoading]   = useState(true)
  const [creating,  setCreating]  = useState(false)
  const [showSheet, setShowSheet] = useState(false)
  const [userId,    setUserId]    = useState<string | null>(null)
  const [form, setForm] = useState<CreateSessionInput>({
    title:          '',
    priority:       'normal',
    instance_scope: 'public',
  })

  // ── Load sessions ──────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id ?? null)

      const { data, error } = await supabase
        .from('mmcp_sessions')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) console.error('[Dashboard] load sessions:', error)
      else setSessions(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  // ── Create session ─────────────────────────────────────────
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !userId) return
    setCreating(true)

    const { data: session, error } = await supabase
      .from('mmcp_sessions')
      .insert({
        principal_id:   userId,
        title:          form.title.trim(),
        priority:       form.priority,
        instance_scope: form.instance_scope,
        status:         'open',
        closed_at:      null,
      })
      .select()
      .single()

    if (error || !session) {
      console.error('[Dashboard] create session:', error)
      setCreating(false)
      return
    }

    await logEvent({
      sessionId:      session.id,
      eventType:      AUDIT_EVENT.SESSION_CREATED,
      entityType:     AUDIT_ENTITY.SESSION,
      entityId:       session.id,
      authorityLevel: 'R2',
      payload:        { title: session.title, priority: session.priority },
    })

    router.push(`/sessions/${session.id}/mission`)
  }

  // ── Render ─────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes sheet-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .dash-card:hover { border-color: rgba(230,237,247,0.14) !important; background: rgba(230,237,247,0.025) !important; }
        .dash-fab:hover { transform: scale(1.06); }
        .dash-scope-btn:hover { border-color: rgba(230,237,247,0.2) !important; }
      `}</style>

      {/* ── Bottom sheet backdrop ─────────────────────────────── */}
      {showSheet && (
        <div
          style={{
            position:   'fixed',
            inset:      0,
            background: 'rgba(6,13,26,0.75)',
            zIndex:     90,
          }}
          onClick={() => setShowSheet(false)}
        />
      )}

      {/* ── Bottom sheet ─────────────────────────────────────── */}
      <div style={{
        position:     'fixed',
        bottom:       0,
        left:         0,
        right:        0,
        zIndex:       100,
        background:   '#07111F',
        borderTop:    `1px solid ${S.border}`,
        borderRadius: '14px 14px 0 0',
        padding:      '0 24px 40px',
        transform:    showSheet ? 'translateY(0)' : 'translateY(100%)',
        transition:   'transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)',
        maxHeight:    '85vh',
        overflowY:    'auto',
      }}>
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 20px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(230,237,247,0.15)' }} />
        </div>

        <h2 style={{ fontSize: 18, fontWeight: 600, color: S.text, margin: '0 0 20px' }}>New Session</h2>

        <form onSubmit={handleCreate}>
          {/* Title */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: S.faint, display: 'block', marginBottom: 8 }}>
              Session Title
            </label>
            <input
              type="text"
              placeholder="What is this cognition cycle about?"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              required
              autoFocus={showSheet}
              style={{
                width:        '100%',
                background:   'rgba(230,237,247,0.04)',
                border:       `1px solid ${S.border}`,
                borderRadius: 8,
                padding:      '12px 14px',
                fontSize:     15,
                color:        S.text,
                outline:      'none',
                boxSizing:    'border-box',
                minHeight:    48,
              }}
            />
          </div>

          {/* Priority */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: S.faint, display: 'block', marginBottom: 8 }}>
              Priority
            </label>
            <select
              value={form.priority}
              onChange={e => setForm(f => ({ ...f, priority: e.target.value as SessionPriority }))}
              style={{
                background:       '#0D1117',
                color:            '#E6EDF7',
                border:           '1px solid rgba(230,237,247,0.15)',
                borderRadius:     '6px',
                padding:          '10px 14px',
                fontSize:         '15px',
                width:            '100%',
                cursor:           'pointer',
                appearance:       'none',
                WebkitAppearance: 'none',
                minHeight:        44,
                outline:          'none',
              }}
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          {/* Instance scope */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: S.faint, display: 'block', marginBottom: 8 }}>
              Instance Scope
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['public', 'principal'] as InstanceScope[]).map(scope => (
                <button
                  key={scope}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, instance_scope: scope }))}
                  className="dash-scope-btn"
                  style={{
                    flex:         1,
                    padding:      '10px 12px',
                    background:   form.instance_scope === scope
                      ? scope === 'principal' ? 'rgba(197,162,111,0.1)' : 'rgba(230,237,247,0.06)'
                      : 'transparent',
                    border: `1px solid ${form.instance_scope === scope
                      ? scope === 'principal' ? 'rgba(197,162,111,0.4)' : 'rgba(230,237,247,0.2)'
                      : S.border}`,
                    borderRadius: 8,
                    fontSize:     15,
                    color:        form.instance_scope === scope
                      ? scope === 'principal' ? S.accent : S.text
                      : S.faint,
                    cursor:       'pointer',
                    textAlign:    'center',
                    minHeight:    56,
                    transition:   'all 0.15s ease',
                  }}
                >
                  <div style={{ fontWeight: form.instance_scope === scope ? 600 : 400, textTransform: 'capitalize' }}>
                    {scope}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(230,237,247,0.3)', marginTop: 2 }}>
                    {scope === 'principal' ? 'Dr. E — CE doctrine injected' : 'Clean synthesis'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="submit"
              disabled={creating || !form.title.trim()}
              style={{
                flex:         1,
                height:       48,
                background:   S.accent,
                color:        '#05070B',
                border:       'none',
                borderRadius: 8,
                fontSize:     15,
                fontWeight:   600,
                cursor:       creating || !form.title.trim() ? 'not-allowed' : 'pointer',
                opacity:      creating || !form.title.trim() ? 0.5 : 1,
                transition:   'opacity 0.15s ease',
              }}
            >
              {creating ? 'Creating…' : 'Create Session'}
            </button>
            <button
              type="button"
              onClick={() => setShowSheet(false)}
              style={{
                padding:      '0 20px',
                height:       48,
                background:   'transparent',
                border:       `1px solid ${S.border}`,
                borderRadius: 8,
                fontSize:     15,
                color:        S.faint,
                cursor:       'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* ── Page body ─────────────────────────────────────────── */}
      <div style={{
        padding:    '32px 24px 100px',
        maxWidth:   860,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: S.text, margin: 0 }}>Sessions</h1>
          <p style={{ fontSize: 15, color: S.faint, marginTop: 4 }}>Active cognition cycles</p>
        </div>

        {/* Sessions list */}
        {loading ? (
          <p style={{ fontSize: 15, color: 'rgba(230,237,247,0.25)' }}>Loading…</p>
        ) : sessions.length === 0 ? (
          <div style={{
            textAlign:    'center',
            padding:      '60px 24px',
            border:       `1px dashed ${S.border}`,
            borderRadius: 12,
          }}>
            <p style={{ fontSize: 16, color: 'rgba(230,237,247,0.25)', margin: 0 }}>No sessions yet.</p>
            <p style={{ fontSize: 14, color: 'rgba(230,237,247,0.15)', marginTop: 8 }}>Tap the + button to begin a cognition cycle.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sessions.map(session => {
              const st  = STATUS_STYLE[session.status] ?? STATUS_STYLE.open
              return (
                <a
                  key={session.id}
                  href={`/sessions/${session.id}/mission`}
                  className="dash-card"
                  style={{
                    display:        'flex',
                    alignItems:     'center',
                    gap:            14,
                    padding:        '14px 16px',
                    border:         `1px solid ${S.border}`,
                    borderRadius:   10,
                    background:     S.panel,
                    textDecoration: 'none',
                    minHeight:      60,
                    transition:     'all 0.15s ease',
                  }}
                >
                  {/* Left: title + meta */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 16, fontWeight: 500, color: S.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {session.title}
                    </p>
                    <p style={{ fontSize: 13, color: S.faint, margin: '3px 0 0' }}>
                      {timeAgo(session.created_at)}
                      {session.instance_scope === 'principal' && (
                        <span style={{ marginLeft: 8, color: S.accent }}>Dr. E</span>
                      )}
                    </p>
                  </div>

                  {/* Priority */}
                  <span style={{ fontSize: 13, fontWeight: 500, color: PRIORITY_COLOR[session.priority], flexShrink: 0 }}>
                    {session.priority}
                  </span>

                  {/* Status badge */}
                  <span style={{
                    fontSize:     12,
                    padding:      '4px 10px',
                    borderRadius: 20,
                    color:        st.color,
                    background:   st.bg,
                    whiteSpace:   'nowrap',
                    flexShrink:   0,
                  }}>
                    {session.status.replace('_', ' ')}
                  </span>

                  {/* Arrow */}
                  <span style={{ fontSize: 16, color: S.faint, flexShrink: 0 }}>→</span>
                </a>
              )
            })}
          </div>
        )}
      </div>

      {/* ── FAB — New Session ─────────────────────────────────── */}
      <button
        onClick={() => setShowSheet(true)}
        className="dash-fab"
        aria-label="New session"
        style={{
          position:     'fixed',
          bottom:       28,
          right:        24,
          width:        56,
          height:       56,
          borderRadius: '50%',
          background:   S.accent,
          color:        '#05070B',
          border:       'none',
          fontSize:     28,
          fontWeight:   300,
          lineHeight:   1,
          cursor:       'pointer',
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'center',
          boxShadow:    '0 4px 20px rgba(197,162,111,0.3)',
          zIndex:       80,
          transition:   'transform 0.2s ease',
        }}
      >
        +
      </button>
    </>
  )
}
