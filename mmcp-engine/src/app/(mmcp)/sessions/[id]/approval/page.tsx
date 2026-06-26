'use client'
// ── Approval Page ────────────────────────────────────────────
// Dedicated decision gate. Fetches the latest synthesis for this session,
// displays it in full, then collects authority level + decision + optional notes.
// Routes after decision: approve → memory | revise → synthesis | reject → comparison

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { logEvent, AUDIT_EVENT, AUDIT_ENTITY } from '@/lib/mmcp/audit'
import {
  AUTHORITY_LEVELS,
  type Synthesis,
  type Approval,
  type AuthorityLevel,
  type ApprovalDecision,
} from '@/types/mmcp'

// ── Design tokens ──────────────────────────────────────────────
const S = {
  bg:     '#05070B',
  text:   '#E6EDF7',
  accent: '#C5A26F',
  muted:  'rgba(230,237,247,0.45)',
  faint:  'rgba(230,237,247,0.18)',
  border: 'rgba(230,237,247,0.07)',
  panel:  'rgba(230,237,247,0.03)',
} as const

const CONFIDENCE_STYLE: Record<string, { color: string; bg: string }> = {
  low:    { color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
  medium: { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)'  },
  high:   { color: '#4ade80', bg: 'rgba(74,222,128,0.1)'  },
}

export default function ApprovalPage() {
  const { id: sessionId } = useParams<{ id: string }>()
  const router   = useRouter()
  const supabase = createClient()

  const [synthesis, setSynthesis] = useState<Synthesis | null>(null)
  const [approval,  setApproval]  = useState<Approval | null>(null)
  const [userId,    setUserId]    = useState<string | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [deciding,  setDeciding]  = useState(false)

  const [authorityLevel, setAuthorityLevel] = useState<AuthorityLevel>('R4')
  const [notes,          setNotes]          = useState('')

  // ── Load synthesis + existing approval ────────────────────
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id ?? null)

      const { data: m } = await supabase
        .from('mission_briefs')
        .select('id')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!m) { setLoading(false); return }

      const { data: syn } = await supabase
        .from('syntheses')
        .select('*')
        .eq('mission_id', m.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (syn) {
        setSynthesis(syn)

        const { data: apr } = await supabase
          .from('approvals')
          .select('*')
          .eq('synthesis_id', syn.id)
          .order('decided_at', { ascending: false })
          .limit(1)
          .single()

        setApproval(apr ?? null)
      }

      setLoading(false)
    }
    load()
  }, [sessionId])

  // ── Record decision ────────────────────────────────────────
  async function decide(decision: ApprovalDecision) {
    if (!synthesis || !userId || deciding) return
    setDeciding(true)

    const { data: apr } = await supabase
      .from('approvals')
      .insert({
        session_id:      sessionId,
        synthesis_id:    synthesis.id,
        principal_id:    userId,
        decision,
        notes:           notes.trim() || null,
        authority_level: authorityLevel,
        decided_at:      new Date().toISOString(),
      })
      .select()
      .single()

    if (!apr) { setDeciding(false); return }

    const newStatus: 'approved' | 'revised' | 'rejected' =
      decision === 'approve' ? 'approved' :
      decision === 'revise'  ? 'revised'  :
      'rejected'

    await supabase.from('syntheses').update({ status: newStatus }).eq('id', synthesis.id)

    await logEvent({
      sessionId,
      eventType:      AUDIT_EVENT.APPROVAL_DECIDED,
      entityType:     AUDIT_ENTITY.APPROVAL,
      entityId:       apr.id,
      authorityLevel,
      payload:        { decision, synthesis_id: synthesis.id },
    })

    setDeciding(false)

    if (decision === 'approve') router.push(`/sessions/${sessionId}/memory`)
    else if (decision === 'revise') router.push(`/sessions/${sessionId}/synthesis`)
    else router.push(`/sessions/${sessionId}/comparison`)
  }

  // ── Loading ───────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ padding: 40, fontSize: 15, color: S.faint, fontFamily: 'system-ui, sans-serif' }}>
        Loading…
      </div>
    )
  }

  // ── No synthesis yet ──────────────────────────────────────
  if (!synthesis) {
    return (
      <div style={{
        padding:    '80px 32px',
        maxWidth:   560,
        textAlign:  'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        <p style={{ fontSize: 20, fontWeight: 600, color: S.text, margin: '0 0 10px' }}>
          No synthesis to approve yet
        </p>
        <p style={{ fontSize: 15, color: S.faint, margin: '0 0 32px' }}>
          Write and save a synthesis before recording a decision.
        </p>
        <a
          href={`/sessions/${sessionId}/synthesis`}
          style={{
            display:        'inline-flex',
            alignItems:     'center',
            height:         44,
            padding:        '0 20px',
            background:     'transparent',
            border:         `1px solid ${S.border}`,
            borderRadius:   8,
            fontSize:       15,
            color:          S.faint,
            textDecoration: 'none',
          }}
        >
          ← Go to Synthesis
        </a>
      </div>
    )
  }

  // ── Decision already recorded ─────────────────────────────
  if (approval) {
    const isApproved    = approval.decision === 'approve'
    const shortLabel    = AUTHORITY_LEVELS[approval.authority_level].short
    const decisionLabel =
      approval.decision === 'approve' ? 'Approved'           :
      approval.decision === 'revise'  ? 'Revision Requested' :
      approval.decision === 'reject'  ? 'Rejected'           :
      approval.decision

    return (
      <div style={{
        padding:    '32px 24px',
        maxWidth:   700,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        <div style={{
          padding:      24,
          border:       `1px solid ${isApproved ? 'rgba(197,162,111,0.35)' : S.border}`,
          borderRadius: 12,
          background:   isApproved ? 'rgba(197,162,111,0.04)' : S.panel,
          marginBottom: 20,
        }}>
          <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: S.accent, margin: '0 0 8px' }}>
            Decision Recorded
          </p>
          <p style={{ fontSize: 22, fontWeight: 600, color: S.text, margin: '0 0 4px' }}>
            {decisionLabel}
          </p>
          <p style={{ fontSize: 15, color: S.faint, margin: '0 0 10px' }}>
            {shortLabel} · {new Date(approval.decided_at).toLocaleString()}
          </p>
          {approval.notes && (
            <p style={{ fontSize: 15, color: S.muted, margin: 0, borderTop: `1px solid ${S.border}`, paddingTop: 12 }}>
              {approval.notes}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <a
            href={`/sessions/${sessionId}/synthesis`}
            style={{
              display:        'inline-flex',
              alignItems:     'center',
              height:         44,
              padding:        '0 20px',
              background:     'transparent',
              border:         `1px solid ${S.border}`,
              borderRadius:   8,
              fontSize:       15,
              color:          S.faint,
              textDecoration: 'none',
            }}
          >
            ← Synthesis
          </a>
          {isApproved && (
            <a
              href={`/sessions/${sessionId}/memory`}
              style={{
                display:        'inline-flex',
                alignItems:     'center',
                height:         44,
                padding:        '0 24px',
                background:     S.accent,
                border:         'none',
                borderRadius:   8,
                fontSize:       15,
                fontWeight:     600,
                color:          '#05070B',
                textDecoration: 'none',
              }}
            >
              Continue to Memory →
            </a>
          )}
        </div>
      </div>
    )
  }

  // ── Approval form ─────────────────────────────────────────
  const conf = synthesis.confidence_level ? CONFIDENCE_STYLE[synthesis.confidence_level] ?? null : null

  return (
    <>
      <style>{`
        .apv-pill:hover   { border-color: rgba(197,162,111,0.6) !important; color: #E6EDF7 !important; }
        .apv-approve:hover:not(:disabled) { opacity: 0.88; }
        .apv-revise:hover:not(:disabled)  { background: rgba(197,162,111,0.07) !important; }
        .apv-reject:hover:not(:disabled)  { background: rgba(248,113,113,0.07) !important; }
      `}</style>

      <div style={{
        padding:    '32px 24px 64px',
        maxWidth:   700,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color:      S.text,
      }}>

        {/* ── Page heading ─────────────────────────────────── */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: S.text, margin: 0 }}>
            Principal Decision
          </h1>
          <p style={{ fontSize: 15, color: S.faint, marginTop: 4 }}>
            Nothing proceeds without approval. This is final authority.
          </p>
        </div>

        {/* ── Synthesis display ─────────────────────────────── */}
        <div style={{
          padding:      24,
          border:       `1px solid ${S.border}`,
          borderRadius: 12,
          background:   S.panel,
          marginBottom: 32,
        }}>
          {/* Meta */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: S.faint }}>
              Synthesis
            </span>
            {conf && (
              <span style={{
                fontSize:     12,
                fontWeight:   600,
                padding:      '3px 10px',
                borderRadius: 20,
                color:        conf.color,
                background:   conf.bg,
              }}>
                {synthesis.confidence_level}
              </span>
            )}
          </div>

          {/* Full synthesis text — 16px, no truncation */}
          <p style={{
            fontSize:   16,
            lineHeight: 1.8,
            color:      S.text,
            margin:     0,
            whiteSpace: 'pre-wrap',
            wordBreak:  'break-word',
          }}>
            {synthesis.synthesis_text}
          </p>

          {/* Recommended action */}
          {synthesis.recommended_action && (
            <div style={{
              marginTop:    20,
              padding:      '12px 16px',
              background:   'rgba(197,162,111,0.05)',
              borderRadius: 8,
              borderLeft:   '3px solid rgba(197,162,111,0.4)',
            }}>
              <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: S.accent, margin: '0 0 5px' }}>
                Recommended Action
              </p>
              <p style={{ fontSize: 15, color: S.muted, margin: 0 }}>
                {synthesis.recommended_action}
              </p>
            </div>
          )}

          {/* Uncertainty flags */}
          {synthesis.uncertainty_flags && (
            <div style={{
              marginTop:    14,
              padding:      '12px 16px',
              background:   'rgba(248,113,113,0.04)',
              borderRadius: 8,
              borderLeft:   '3px solid rgba(248,113,113,0.3)',
            }}>
              <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(248,113,113,0.7)', margin: '0 0 5px' }}>
                Uncertainty Flags
              </p>
              <p style={{ fontSize: 15, color: S.muted, margin: 0 }}>
                {synthesis.uncertainty_flags}
              </p>
            </div>
          )}
        </div>

        {/* ── Authority level — pill row ─────────────────────── */}
        <div style={{ marginBottom: 28 }}>
          <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: S.faint, display: 'block', marginBottom: 14 }}>
            Authority Level
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(Object.entries(AUTHORITY_LEVELS) as [AuthorityLevel, typeof AUTHORITY_LEVELS[AuthorityLevel]][]).map(([level, meta]) => {
              const isSelected = authorityLevel === level
              return (
                <button
                  key={level}
                  onClick={() => setAuthorityLevel(level)}
                  className="apv-pill"
                  style={{
                    height:       44,
                    padding:      '0 18px',
                    border:       `1px solid ${isSelected ? S.accent : 'rgba(197,162,111,0.35)'}`,
                    borderRadius: 22,
                    background:   isSelected ? S.accent : '#0D1117',
                    cursor:       'pointer',
                    fontSize:     14,
                    fontWeight:   isSelected ? 700 : 500,
                    color:        isSelected ? '#05070B' : S.accent,
                    transition:   'all 0.12s ease',
                    whiteSpace:   'nowrap',
                  }}
                >
                  {meta.short}
                </button>
              )
            })}
          </div>
          {authorityLevel === 'R4' && (
            <p style={{ fontSize: 13, color: 'rgba(248,113,113,0.8)', marginTop: 12 }}>
              ⚠ Founder — external, irreversible, or financial. Tapping a decision button is your explicit authorisation.
            </p>
          )}
        </div>

        {/* ── Decision buttons — stacked, 56px ──────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>

          <button
            onClick={() => void decide('approve')}
            disabled={deciding}
            className="apv-approve"
            style={{
              height:        56,
              background:    '#C5A26F',
              color:         '#05070B',
              border:        'none',
              borderRadius:  10,
              fontSize:      16,
              fontWeight:    700,
              letterSpacing: '0.05em',
              cursor:        deciding ? 'not-allowed' : 'pointer',
              opacity:       deciding ? 0.6 : 1,
              transition:    'opacity 0.15s ease',
            }}
          >
            {deciding ? 'Recording…' : 'APPROVE'}
          </button>

          <button
            onClick={() => void decide('revise')}
            disabled={deciding}
            className="apv-revise"
            style={{
              height:        56,
              background:    '#05070B',
              color:         '#C5A26F',
              border:        '1px solid #C5A26F',
              borderRadius:  10,
              fontSize:      16,
              fontWeight:    600,
              letterSpacing: '0.05em',
              cursor:        deciding ? 'not-allowed' : 'pointer',
              opacity:       deciding ? 0.6 : 1,
              transition:    'all 0.15s ease',
            }}
          >
            REQUEST REVISION
          </button>

          <button
            onClick={() => void decide('reject')}
            disabled={deciding}
            className="apv-reject"
            style={{
              height:        56,
              background:    '#05070B',
              color:         '#ef4444',
              border:        '1px solid #ef4444',
              borderRadius:  10,
              fontSize:      16,
              fontWeight:    600,
              letterSpacing: '0.05em',
              cursor:        deciding ? 'not-allowed' : 'pointer',
              opacity:       deciding ? 0.6 : 1,
              transition:    'all 0.15s ease',
            }}
          >
            REJECT
          </button>
        </div>

        {/* ── Notes ─────────────────────────────────────────── */}
        <div>
          <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: S.faint, display: 'block', marginBottom: 10 }}>
            Decision notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Reasoning, conditions, or caveats"
            rows={3}
            style={{
              width:             '100%',
              background:        '#0D1117',
              border:            '1px solid rgba(230,237,247,0.15)',
              borderRadius:      '6px',
              padding:           '10px 14px',
              fontSize:          '15px',
              color:             '#E6EDF7',
              lineHeight:        1.6,
              resize:            'vertical',
              outline:           'none',
              boxSizing:         'border-box',
            }}
          />
        </div>

      </div>
    </>
  )
}
