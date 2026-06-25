'use client'
// ── Screen 4: Comparison Panel ───────────────────────────────
// Principal records structured adversarial comparison of outputs.
// Preserves disagreement — does NOT synthesize yet.

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { logEvent, AUDIT_EVENT, AUDIT_ENTITY } from '@/lib/mmcp/audit'
import { getKey } from '@/lib/mmcp/keys'
import type { OEPComparison, ModelOutput } from '@/types/mmcp'
import { MemoryCapture } from '@/components/mmcp/MemoryCapture'

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

type ComparisonFormFields = {
  convergence_notes:   string
  divergence_notes:    string
  blind_spots:         string
  contradictions:      string
  risk_notes:          string
  missing_assumptions: string
}

const COMPARISON_FIELDS: {
  key:   keyof ComparisonFormFields
  label: string
  hint:  string
}[] = [
  { key: 'convergence_notes',   label: 'Convergence',         hint: 'What did all models agree on?'                      },
  { key: 'divergence_notes',    label: 'Divergence',          hint: 'Where did models differ significantly?'              },
  { key: 'blind_spots',         label: 'Blind Spots',         hint: 'What did no model cover or raise?'                  },
  { key: 'contradictions',      label: 'Contradictions',      hint: 'Direct conflicts between model outputs'              },
  { key: 'risk_notes',          label: 'Risk Notes',          hint: 'Risks surfaced by the comparison itself'             },
  { key: 'missing_assumptions', label: 'Missing Assumptions', hint: 'Assumptions no model named explicitly'               },
]

export default function ComparisonPage() {
  const { id: sessionId } = useParams<{ id: string }>()
  const router  = useRouter()
  const supabase = createClient()

  const [missionId,     setMissionId]     = useState<string | null>(null)
  const [outputs,       setOutputs]       = useState<ModelOutput[]>([])
  const [existing,      setExisting]      = useState<OEPComparison | null>(null)
  const [saving,        setSaving]        = useState(false)
  const [autofilling,   setAutofilling]   = useState(false)
  const [autofillError, setAutofillError] = useState<string | null>(null)
  const [openField,     setOpenField]     = useState<keyof ComparisonFormFields | null>('convergence_notes')
  const [modalOutput,   setModalOutput]   = useState<ModelOutput | null>(null)
  const [form, setForm] = useState<ComparisonFormFields>({
    convergence_notes:   '',
    divergence_notes:    '',
    blind_spots:         '',
    contradictions:      '',
    risk_notes:          '',
    missing_assumptions: '',
  })

  // ── Load mission + outputs + existing comparison ───────────
  useEffect(() => {
    async function load() {
      const { data: m } = await supabase
        .from('mission_briefs')
        .select('id')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!m) return
      setMissionId(m.id)

      const { data: outs } = await supabase
        .from('model_outputs')
        .select('*')
        .eq('mission_id', m.id)
      setOutputs((outs ?? []) as ModelOutput[])

      const { data: cmp } = await supabase
        .from('oep_comparisons')
        .select('*')
        .eq('mission_id', m.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (cmp) {
        setExisting(cmp)
        setForm({
          convergence_notes:   cmp.convergence_notes   ?? '',
          divergence_notes:    cmp.divergence_notes    ?? '',
          blind_spots:         cmp.blind_spots         ?? '',
          contradictions:      cmp.contradictions      ?? '',
          risk_notes:          cmp.risk_notes          ?? '',
          missing_assumptions: cmp.missing_assumptions ?? '',
        })
      }
    }
    load()
  }, [sessionId])

  // ── Auto-fill comparison via Claude ───────────────────────
  async function autoFill() {
    if (outputs.length < 2) {
      setAutofillError('Need at least 2 saved outputs to auto-fill.')
      return
    }
    const key = getKey('claude')
    if (!key) {
      setAutofillError('Claude API key not loaded. Add it in Key Management first.')
      return
    }

    setAutofilling(true)
    setAutofillError(null)

    const outputSection = outputs
      .map(o => `=== ${o.model_name.toUpperCase()} ===\n${o.raw_output}`)
      .join('\n\n')

    const prompt = `You are a structured analysis assistant. I will give you multiple AI model outputs for the same mission prompt. Your job is to analyze them and return a structured JSON object with exactly these 6 keys:

- convergence_notes: What did all models agree on? Key shared conclusions.
- divergence_notes: Where did models differ significantly? Highlight the most important disagreements.
- blind_spots: What did no model cover or raise that seems relevant?
- contradictions: Direct conflicts or mutually exclusive claims between outputs.
- risk_notes: Risks surfaced by the comparison itself (not just from individual outputs).
- missing_assumptions: Assumptions no model named explicitly but appear to be present.

Be analytical, terse, and specific. Do not pad. Return ONLY valid JSON — no explanation before or after.

MODEL OUTPUTS:
${outputSection}`

    try {
      const res  = await fetch('/api/mmcp/run/claude', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ key, prompt }),
      })
      const json = await res.json() as { output?: string; error?: string }

      if (!res.ok || json.error) {
        setAutofillError(json.error ?? `Error ${res.status}`)
        setAutofilling(false)
        return
      }

      const raw       = json.output ?? ''
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        setAutofillError('Claude returned an unexpected format. Try again.')
        setAutofilling(false)
        return
      }

      const parsed = JSON.parse(jsonMatch[0]) as Partial<ComparisonFormFields>
      setForm(f => ({
        convergence_notes:   parsed.convergence_notes   ?? f.convergence_notes,
        divergence_notes:    parsed.divergence_notes    ?? f.divergence_notes,
        blind_spots:         parsed.blind_spots         ?? f.blind_spots,
        contradictions:      parsed.contradictions      ?? f.contradictions,
        risk_notes:          parsed.risk_notes          ?? f.risk_notes,
        missing_assumptions: parsed.missing_assumptions ?? f.missing_assumptions,
      }))
    } catch (err) {
      setAutofillError(err instanceof Error ? err.message : 'Unexpected error')
    }
    setAutofilling(false)
  }

  // ── Save comparison ────────────────────────────────────────
  async function handleSave(markComplete: boolean) {
    if (!missionId) return
    setSaving(true)

    const payload = {
      session_id: sessionId,
      mission_id: missionId,
      ...Object.fromEntries(
        Object.entries(form).map(([k, v]) => [k, (v as string).trim() || null])
      ),
      status: markComplete ? 'complete' as const : 'draft' as const,
    }

    let compId = existing?.id
    if (existing) {
      await supabase.from('oep_comparisons').update(payload).eq('id', existing.id)
    } else {
      const { data } = await supabase.from('oep_comparisons').insert(payload).select().single()
      compId = data?.id
    }

    await logEvent({
      sessionId,
      eventType:      markComplete ? AUDIT_EVENT.COMPARISON_COMPLETED : AUDIT_EVENT.COMPARISON_SAVED,
      entityType:     AUDIT_ENTITY.COMPARISON,
      entityId:       compId,
      authorityLevel: 'R2',
      payload:        { status: payload.status, mission_id: missionId },
    })

    setSaving(false)
    if (markComplete) router.push(`/sessions/${sessionId}/synthesis`)
  }

  const allFilled = COMPARISON_FIELDS.every(f => form[f.key].trim().length > 0)

  return (
    <>
      <style>{`
        .cmp-output-card:hover { border-color: rgba(197,162,111,0.3) !important; background: rgba(197,162,111,0.04) !important; cursor: pointer; }
        .cmp-field-header:hover { background: rgba(230,237,247,0.03) !important; }
        .cmp-btn-draft:hover:not(:disabled) { border-color: rgba(230,237,247,0.25) !important; color: #E6EDF7 !important; }
      `}</style>

      {/* ── Model output preview modal ────────────────────────── */}
      {modalOutput && (
        <div
          style={{
            position:       'fixed',
            inset:          0,
            background:     'rgba(6,13,26,0.95)',
            zIndex:         200,
            display:        'flex',
            flexDirection:  'column',
            padding:        '20px 0 0',
          }}
          onClick={() => setModalOutput(null)}
        >
          <div
            style={{ flex: 1, overflow: 'auto', padding: '0 24px 100px' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingTop: 4 }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: S.accent, margin: 0 }}>
                {modalOutput.model_name.toUpperCase()}
              </p>
              <button
                onClick={() => setModalOutput(null)}
                style={{ fontSize: 22, color: S.faint, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', lineHeight: 1 }}
              >
                ×
              </button>
            </div>
            <pre style={{ fontSize: 15, color: S.text, lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0, fontFamily: 'inherit' }}>
              {modalOutput.raw_output}
            </pre>
          </div>
        </div>
      )}

      <div style={{
        padding:    '28px 24px 120px',
        maxWidth:   860,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>

        {/* ── Header ───────────────────────────────────────────── */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: S.text, margin: 0 }}>Comparison Panel</h1>
          <p style={{ fontSize: 15, color: S.faint, marginTop: 4 }}>
            Record what the outputs reveal in aggregate. Preserve disagreement.
          </p>
        </div>

        {/* ── Model output preview strip ────────────────────────── */}
        {outputs.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: S.faint, marginBottom: 10 }}>
              Model Outputs — tap to read
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(outputs.length, 3)}, 1fr)`, gap: 10 }}>
              {outputs.map(o => (
                <div
                  key={o.id}
                  className="cmp-output-card"
                  onClick={() => setModalOutput(o)}
                  style={{
                    padding:      '12px 14px',
                    background:   S.panel,
                    border:       `1px solid ${S.border}`,
                    borderRadius: 8,
                    transition:   'all 0.15s ease',
                  }}
                >
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: S.accent, margin: '0 0 6px' }}>
                    {o.model_name}
                  </p>
                  <p style={{
                    fontSize:   14,
                    color:      S.faint,
                    lineHeight: 1.5,
                    overflow:   'hidden',
                    display:    '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    margin:     0,
                  }}>
                    {o.raw_output}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Auto-fill ─────────────────────────────────────────── */}
        <div style={{ marginBottom: 24 }}>
          <button
            onClick={() => void autoFill()}
            disabled={autofilling || outputs.length < 2}
            style={{
              width:        '100%',
              height:       52,
              background:   autofilling ? 'rgba(197,162,111,0.08)' : S.accent,
              color:        autofilling ? S.accent : '#05070B',
              border:       `1px solid ${autofilling ? 'rgba(197,162,111,0.3)' : 'transparent'}`,
              borderRadius: 10,
              fontSize:     16,
              fontWeight:   700,
              cursor:       autofilling || outputs.length < 2 ? 'not-allowed' : 'pointer',
              opacity:      outputs.length < 2 ? 0.4 : 1,
              transition:   'all 0.15s ease',
              letterSpacing: '0.01em',
            }}
          >
            {autofilling ? 'Analyzing with Claude…' : '⚡ Auto-fill Comparison with Claude'}
          </button>
          <p style={{ fontSize: 13, color: 'rgba(230,237,247,0.25)', marginTop: 8, textAlign: 'center' }}>
            Requires Claude key in Key Management. Populates all fields — review before completing.
          </p>
        </div>

        {autofillError && (
          <div style={{
            marginBottom: 20,
            padding:      '10px 14px',
            background:   'rgba(180,30,30,0.15)',
            border:       '1px solid rgba(180,30,30,0.3)',
            borderRadius: 8,
            fontSize:     14,
            color:        '#f87171',
          }}>
            {autofillError}
          </div>
        )}

        {/* ── Accordion fields ─────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {COMPARISON_FIELDS.map(field => {
            const isOpen  = openField === field.key
            const isEmpty = !form[field.key].trim()

            return (
              <div
                key={field.key}
                style={{
                  border:       `1px solid ${isOpen ? 'rgba(197,162,111,0.2)' : S.border}`,
                  borderRadius: 8,
                  overflow:     'hidden',
                  background:   isOpen ? 'rgba(197,162,111,0.03)' : S.panel,
                  transition:   'all 0.15s ease',
                }}
              >
                {/* Field header — tappable */}
                <button
                  className="cmp-field-header"
                  onClick={() => setOpenField(isOpen ? null : field.key)}
                  style={{
                    width:          '100%',
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'space-between',
                    padding:        '14px 16px',
                    background:     'transparent',
                    border:         'none',
                    cursor:         'pointer',
                    textAlign:      'left',
                    minHeight:      52,
                    transition:     'background 0.12s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {!isEmpty && (
                      <span style={{ fontSize: 11, color: S.accent, flexShrink: 0 }}>✓</span>
                    )}
                    <div>
                      <span style={{ fontSize: 15, fontWeight: isOpen ? 600 : 400, color: isOpen ? S.text : S.muted }}>
                        {field.label}
                      </span>
                      {!isOpen && !isEmpty && (
                        <span style={{ fontSize: 13, color: S.faint, marginLeft: 10 }}>
                          {form[field.key].substring(0, 60)}{form[field.key].length > 60 ? '…' : ''}
                        </span>
                      )}
                      {!isOpen && isEmpty && (
                        <span style={{ fontSize: 13, color: 'rgba(230,237,247,0.2)', marginLeft: 10 }}>
                          {field.hint}
                        </span>
                      )}
                    </div>
                  </div>
                  <span style={{ fontSize: 16, color: S.faint, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease', flexShrink: 0 }}>
                    ↓
                  </span>
                </button>

                {/* Expanded textarea */}
                {isOpen && (
                  <div style={{ padding: '0 16px 16px' }}>
                    <p style={{ fontSize: 13, color: 'rgba(230,237,247,0.3)', marginBottom: 8 }}>
                      {field.hint}
                    </p>
                    <textarea
                      value={form[field.key]}
                      onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                      placeholder={field.hint}
                      autoFocus
                      rows={5}
                      style={{
                        width:        '100%',
                        background:   'rgba(230,237,247,0.03)',
                        border:       `1px solid ${S.border}`,
                        borderRadius: 6,
                        padding:      '10px 12px',
                        fontSize:     15,
                        color:        S.text,
                        lineHeight:   1.6,
                        resize:       'vertical',
                        outline:      'none',
                        boxSizing:    'border-box',
                        minHeight:    96,
                      }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* ── Completion status ─────────────────────────────────── */}
        <p style={{ marginTop: 20, fontSize: 14, color: 'rgba(230,237,247,0.25)', textAlign: 'center' }}>
          {COMPARISON_FIELDS.filter(f => form[f.key].trim()).length} of {COMPARISON_FIELDS.length} fields completed
          {allFilled && <span style={{ color: S.accent, marginLeft: 8 }}>— ready to synthesise</span>}
        </p>

        <MemoryCapture
          sessionId={sessionId}
          defaultContent={form.convergence_notes || form.divergence_notes || ''}
        />

      </div>

      {/* ── Fixed save bar ────────────────────────────────────── */}
      <div style={{
        position:   'fixed',
        bottom:     0,
        left:       0,
        right:      0,
        zIndex:     100,
        background: 'rgba(6,13,26,0.97)',
        borderTop:  `1px solid ${S.border}`,
        padding:    '14px 24px',
        display:    'flex',
        gap:        12,
        alignItems: 'center',
        justifyContent: 'flex-end',
      }}>
        <button
          onClick={() => handleSave(false)}
          disabled={saving}
          className="cmp-btn-draft"
          style={{
            padding:      '0 20px',
            height:       44,
            background:   'transparent',
            border:       `1px solid ${S.border}`,
            borderRadius: 8,
            fontSize:     15,
            color:        S.faint,
            cursor:       saving ? 'not-allowed' : 'pointer',
            opacity:      saving ? 0.5 : 1,
            transition:   'all 0.15s ease',
          }}
        >
          Save Draft
        </button>
        <button
          onClick={() => handleSave(true)}
          disabled={saving}
          style={{
            padding:      '0 24px',
            height:       44,
            background:   S.accent,
            color:        '#05070B',
            border:       'none',
            borderRadius: 8,
            fontSize:     15,
            fontWeight:   600,
            cursor:       saving ? 'not-allowed' : 'pointer',
            opacity:      saving ? 0.5 : 1,
            transition:   'opacity 0.15s ease',
          }}
        >
          {saving ? 'Saving…' : 'Mark Complete & Synthesise →'}
        </button>
      </div>
    </>
  )
}
