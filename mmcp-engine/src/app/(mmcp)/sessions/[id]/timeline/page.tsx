'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AUTHORITY_LEVELS } from '@/types/mmcp'
import type { AuditLog } from '@/types/mmcp'

const S = {
  bg:     '#05070B',
  text:   '#E6EDF7',
  accent: '#C5A26F',
  muted:  'rgba(230,237,247,0.45)',
  faint:  'rgba(230,237,247,0.18)',
  border: 'rgba(230,237,247,0.07)',
  panel:  'rgba(230,237,247,0.03)',
} as const

const EVENT_LABEL: Record<string, string> = {
  SESSION_CREATED:          'Session created',
  SESSION_STATUS_CHANGED:   'Session status changed',
  MISSION_CREATED:          'Mission defined',
  MISSION_STATUS_CHANGED:   'Mission status changed',
  OUTPUT_PASTED:            'Model output pasted',
  COMPARISON_SAVED:         'Comparison saved',
  COMPARISON_COMPLETED:     'Comparison completed',
  SYNTHESIS_CREATED:        'Synthesis created',
  SYNTHESIS_REVISED:        'Synthesis revised',
  APPROVAL_DECIDED:         'Approval decided',
  ACTION_CREATED:           'Action created',
  ACTION_STATUS_CHANGED:    'Action status changed',
  MEMORY_ITEM_CREATED:      'Memory item written',
  UNDEFINED_STATE_SURFACED: 'Undefined state surfaced',
  API_CALL_ATTEMPTED:       'API call attempted',
  API_CALL_COMPLETED:       'API call completed',
  API_CALL_FAILED:          'API call failed',
}

const ENTITY_LABEL: Record<string, string> = {
  mmcp_sessions:   'Session',
  mission_briefs:  'Mission',
  model_outputs:   'Output',
  oep_comparisons: 'Comparison',
  syntheses:       'Synthesis',
  approvals:       'Approval',
  actions:         'Action',
  memory_items:    'Memory',
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

function groupByDate(logs: AuditLog[]): { date: string; entries: AuditLog[] }[] {
  const groups: Map<string, AuditLog[]> = new Map()
  for (const log of logs) {
    const date = formatDate(log.logged_at)
    if (!groups.has(date)) groups.set(date, [])
    groups.get(date)!.push(log)
  }
  return Array.from(groups.entries()).map(([date, entries]) => ({ date, entries }))
}

export default function TimelinePage() {
  const { id }   = useParams<{ id: string }>()
  const [logs,    setLogs]    = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    const supabase = createClient()
    supabase
      .from('audit_logs')
      .select('*')
      .eq('session_id', id)
      .order('logged_at', { ascending: false })
      .then(({ data }) => {
        setLogs((data as AuditLog[]) ?? [])
        setLoading(false)
      })
  }, [id])

  const groups = groupByDate(logs)

  return (
    <div style={{ padding: '28px 24px', maxWidth: 720, fontFamily: 'system-ui, -apple-system, sans-serif', color: S.text }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: S.accent, margin: '0 0 8px' }}>
          Layer 10
        </p>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 6px' }}>Session Timeline</h1>
        <p style={{ fontSize: 14, color: S.muted, margin: 0 }}>
          Full audit log — every event in this cognition session, most recent first.
        </p>
      </div>

      {/* Count chip */}
      {!loading && logs.length > 0 && (
        <div style={{
          display:      'inline-flex',
          alignItems:   'center',
          padding:      '5px 12px',
          background:   S.panel,
          border:       `1px solid ${S.border}`,
          borderRadius: 20,
          fontSize:     13,
          color:        S.faint,
          marginBottom: 28,
        }}>
          {logs.length} event{logs.length !== 1 ? 's' : ''}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <p style={{ fontSize: 15, color: 'rgba(230,237,247,0.25)' }}>Loading…</p>
      ) : logs.length === 0 ? (
        <div style={{
          textAlign:    'center',
          padding:      '60px 24px',
          border:       `1px dashed ${S.border}`,
          borderRadius: 12,
        }}>
          <p style={{ fontSize: 16, color: 'rgba(230,237,247,0.2)', margin: 0 }}>No events recorded yet.</p>
          <p style={{ fontSize: 13, color: 'rgba(230,237,247,0.12)', marginTop: 8 }}>Events appear here as you work through the layers.</p>
        </div>
      ) : (
        <div>
          {groups.map(({ date, entries }) => (
            <div key={date} style={{ marginBottom: 32 }}>

              {/* Date header */}
              <div style={{
                display:     'flex',
                alignItems:  'center',
                gap:         12,
                marginBottom: 14,
              }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: S.faint, letterSpacing: '0.06em' }}>{date}</span>
                <div style={{ flex: 1, height: 1, background: S.border }} />
              </div>

              {/* Events */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {entries.map((log, idx) => {
                  const authMeta = log.authority_level ? AUTHORITY_LEVELS[log.authority_level] : null
                  const entity   = log.entity_type ? (ENTITY_LABEL[log.entity_type] ?? log.entity_type) : null
                  const eventLbl = EVENT_LABEL[log.event_type] ?? log.event_type

                  return (
                    <div
                      key={log.id}
                      style={{
                        display:      'flex',
                        alignItems:   'flex-start',
                        gap:          14,
                        padding:      '11px 14px',
                        borderRadius: 8,
                        background:   idx % 2 === 0 ? 'transparent' : 'rgba(230,237,247,0.015)',
                      }}
                    >
                      {/* Timeline dot */}
                      <div style={{
                        width:        8,
                        height:       8,
                        borderRadius: '50%',
                        background:   'rgba(197,162,111,0.4)',
                        flexShrink:   0,
                        marginTop:    5,
                      }} />

                      {/* Event content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                          <span style={{ fontSize: 14, fontWeight: 500, color: S.text }}>{eventLbl}</span>
                          {entity && (
                            <span style={{ fontSize: 11, color: S.faint, background: 'rgba(230,237,247,0.04)', border: `1px solid ${S.border}`, padding: '1px 7px', borderRadius: 10 }}>
                              {entity}
                            </span>
                          )}
                          {authMeta && (
                            <span style={{ fontSize: 11, color: S.accent, background: 'rgba(197,162,111,0.08)', border: '1px solid rgba(197,162,111,0.2)', padding: '1px 7px', borderRadius: 10 }}>
                              {authMeta.short}
                            </span>
                          )}
                        </div>

                        {/* Payload summary */}
                        {log.payload && Object.keys(log.payload).length > 0 && (
                          <div style={{ marginBottom: 4 }}>
                            {Object.entries(log.payload)
                              .filter(([k]) => !['session_id', 'principal_id'].includes(k))
                              .slice(0, 4)
                              .map(([k, v]) => (
                                <span key={k} style={{ fontSize: 12, color: 'rgba(230,237,247,0.3)', marginRight: 10 }}>
                                  {k}: <span style={{ color: 'rgba(230,237,247,0.45)' }}>{String(v).slice(0, 40)}</span>
                                </span>
                              ))
                            }
                          </div>
                        )}

                        <span style={{ fontSize: 12, color: 'rgba(230,237,247,0.2)', fontVariantNumeric: 'tabular-nums' }}>
                          {formatTime(log.logged_at)}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}
