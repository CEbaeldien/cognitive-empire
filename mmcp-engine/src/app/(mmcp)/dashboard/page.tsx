'use client'
// ── Screen 1: Dashboard ──────────────────────────────────────
// Lists all MMCP sessions with status, priority, last activity.
// Entry point: create new session or continue an existing one.

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { logEvent, AUDIT_EVENT, AUDIT_ENTITY } from '@/lib/mmcp/audit'
import type { MmcpSession, SessionPriority, InstanceScope, CreateSessionInput } from '@/types/mmcp'

const STATUS_COLOR: Record<string, string> = {
  open:             'text-white/40 bg-white/5',
  active:           'text-blue-300  bg-blue-900/30',
  pending_approval: 'text-[#c9a96e] bg-[#c9a96e]/10',
  closed:           'text-white/20 bg-white/5',
  archived:         'text-white/20 bg-white/5',
}

const PRIORITY_BADGE: Record<string, string> = {
  low:      'text-white/30',
  normal:   'text-white/50',
  high:     'text-amber-400',
  critical: 'text-red-400',
}

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()

  const [sessions, setSessions] = useState<MmcpSession[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [form, setForm] = useState<CreateSessionInput>({ title: '', priority: 'normal', instance_scope: 'public' })

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
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-white">Sessions</h1>
          <p className="text-sm text-white/40 mt-0.5">Active cognition cycles</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="px-4 py-2 text-sm bg-[#c9a96e]/10 border border-[#c9a96e]/30 text-[#c9a96e] rounded hover:bg-[#c9a96e]/20 transition-colors"
        >
          New Session
        </button>
      </div>

      {/* New session form */}
      {showNew && (
        <form
          onSubmit={handleCreate}
          className="mb-8 p-5 border border-[#c9a96e]/30 rounded-lg bg-[#c9a96e]/5"
        >
          <h2 className="text-sm font-medium text-[#c9a96e] mb-4">New Session</h2>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Session title"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#c9a96e]/50"
              required
            />
            <select
              value={form.priority}
              onChange={e => setForm(f => ({ ...f, priority: e.target.value as SessionPriority }))}
              className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c9a96e]/50"
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>

            {/* Instance scope toggle */}
            <div className="flex gap-2">
              {(['public', 'principal'] as InstanceScope[]).map(scope => (
                <button
                  key={scope}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, instance_scope: scope }))}
                  className={`flex-1 px-3 py-2 text-xs rounded border transition-colors ${
                    form.instance_scope === scope
                      ? scope === 'principal'
                        ? 'border-[#c9a96e]/50 bg-[#c9a96e]/10 text-[#c9a96e]'
                        : 'border-white/20 bg-white/8 text-white'
                      : 'border-white/8 text-white/35 hover:text-white/55'
                  }`}
                >
                  <span className="font-medium capitalize">{scope}</span>
                  <span className="block text-[10px] opacity-60 mt-0.5">
                    {scope === 'principal' ? 'Dr. E — CE doctrine injected' : 'Clean synthesis'}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 text-sm bg-[#c9a96e] text-black rounded font-medium hover:bg-[#b8934d] disabled:opacity-50 transition-colors"
            >
              {creating ? 'Creating…' : 'Create Session'}
            </button>
            <button
              type="button"
              onClick={() => setShowNew(false)}
              className="px-4 py-2 text-sm text-white/50 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Sessions list */}
      {loading ? (
        <p className="text-sm text-white/30">Loading…</p>
      ) : sessions.length === 0 ? (
        <div className="text-center py-20 border border-white/5 rounded-lg">
          <p className="text-white/30 text-sm">No sessions yet.</p>
          <p className="text-white/20 text-xs mt-1">Create one to begin a cognition cycle.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map(session => (
            <a
              key={session.id}
              href={`/sessions/${session.id}/mission`}
              className="flex items-center gap-4 p-4 border border-white/5 rounded-lg hover:border-white/15 hover:bg-white/2 transition-all group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white group-hover:text-white/90 truncate">{session.title}</p>
                <p className="text-xs text-white/30 mt-0.5">
                  {new Date(session.created_at).toLocaleDateString()}
                </p>
              </div>
              {session.instance_scope === 'principal' && (
                <span className="text-[10px] px-2 py-0.5 rounded text-[#c9a96e]/70 bg-[#c9a96e]/8 border border-[#c9a96e]/15">
                  Dr. E
                </span>
              )}
              <span className={`text-xs px-2 py-0.5 rounded ${PRIORITY_BADGE[session.priority]}`}>
                {session.priority}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLOR[session.status]}`}>
                {session.status.replace('_', ' ')}
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
