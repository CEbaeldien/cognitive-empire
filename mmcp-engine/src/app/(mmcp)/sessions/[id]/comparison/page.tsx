'use client'
// ── Screen 4: Comparison Panel ───────────────────────────────
// Principal records structured adversarial comparison of outputs.
// Preserves disagreement — does NOT synthesize yet.
// Fields: convergence, divergence, blind spots, contradictions,
//         risk notes, missing assumptions.
// Saves oep_comparisons row + audit log.

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { logEvent, AUDIT_EVENT, AUDIT_ENTITY } from '@/lib/mmcp/audit'
import { getKey } from '@/lib/mmcp/keys'
import type { OEPComparison, ModelOutput } from '@/types/mmcp'

type ComparisonFormFields = {
  convergence_notes: string
  divergence_notes: string
  blind_spots: string
  contradictions: string
  risk_notes: string
  missing_assumptions: string
}

const COMPARISON_FIELDS: {
  key: keyof ComparisonFormFields
  label: string
  hint: string
  rows: number
}[] = [
  { key: 'convergence_notes',   label: 'Convergence',          hint: 'What did all models agree on?',                rows: 3 },
  { key: 'divergence_notes',    label: 'Divergence',           hint: 'Where did models differ significantly?',        rows: 3 },
  { key: 'blind_spots',         label: 'Blind Spots',          hint: 'What did no model cover or raise?',             rows: 3 },
  { key: 'contradictions',      label: 'Contradictions',       hint: 'Direct conflicts between model outputs',        rows: 2 },
  { key: 'risk_notes',          label: 'Risk Notes',           hint: 'Risks surfaced by the comparison itself',       rows: 2 },
  { key: 'missing_assumptions', label: 'Missing Assumptions',  hint: 'Assumptions no model named explicitly',         rows: 2 },
]

export default function ComparisonPage() {
  const { id: sessionId } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [missionId, setMissionId] = useState<string | null>(null)
  const [outputs, setOutputs] = useState<ModelOutput[]>([])
  const [existing, setExisting] = useState<OEPComparison | null>(null)
  const [saving, setSaving] = useState(false)
  const [autofilling, setAutofilling] = useState(false)
  const [autofillError, setAutofillError] = useState<string | null>(null)
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
      const res = await fetch('/api/mmcp/run/claude', {
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

      // Parse the JSON from Claude's output
      const raw = json.output ?? ''
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
      const { data } = await supabase
        .from('oep_comparisons')
        .insert(payload)
        .select()
        .single()
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

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-white">Comparison Panel</h1>
        <p className="text-sm text-white/40 mt-0.5">
          Record what the outputs reveal in aggregate. Preserve disagreement.
        </p>
      </div>

      {/* Output reference strip */}
      {outputs.length > 0 && (
        <div className="mb-6 grid grid-cols-3 gap-3">
          {outputs.map(o => (
            <div key={o.id} className="p-3 bg-white/3 border border-white/8 rounded">
              <p className="text-[10px] font-medium text-[#c9a96e] uppercase tracking-wider mb-1">
                {o.model_name}
              </p>
              <p className="text-xs text-white/50 line-clamp-3">{o.raw_output}</p>
            </div>
          ))}
        </div>
      )}

      {/* Auto-fill */}
      <div className="mb-5 flex items-center gap-3">
        <button
          onClick={() => void autoFill()}
          disabled={autofilling || outputs.length < 2}
          className="px-4 py-2 text-sm border border-[#c9a96e]/30 text-[#c9a96e] rounded hover:bg-[#c9a96e]/8 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          {autofilling ? 'Analyzing…' : '⚡ Auto-fill with Claude'}
        </button>
        <span className="text-xs text-white/25">
          Requires Claude key. Populates all fields — review before completing.
        </span>
      </div>
      {autofillError && (
        <div className="mb-4 px-3 py-2 bg-red-950/40 border border-red-800/40 rounded text-xs text-red-300">
          {autofillError}
        </div>
      )}

      {/* Comparison form */}
      <div className="space-y-4">
        {COMPARISON_FIELDS.map(field => (
          <div key={field.key}>
            <div className="flex items-baseline gap-2 mb-1.5">
              <label className="text-xs font-medium text-white/60 uppercase tracking-wider">
                {field.label}
              </label>
              <span className="text-xs text-white/25">{field.hint}</span>
            </div>
            <textarea
              value={form[field.key]}
              onChange={e =>
                setForm(f => ({ ...f, [field.key]: e.target.value }))
              }
              rows={field.rows}
              placeholder={field.hint}
              className="w-full bg-white/3 border border-white/8 rounded px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#c9a96e]/30 resize-none transition-colors"
            />
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={() => handleSave(false)}
          disabled={saving}
          className="px-4 py-2 text-sm border border-white/15 text-white/60 rounded hover:border-white/30 hover:text-white disabled:opacity-40 transition-colors"
        >
          Save Draft
        </button>
        <button
          onClick={() => handleSave(true)}
          disabled={saving}
          className="px-5 py-2 text-sm bg-[#c9a96e] text-black rounded font-medium hover:bg-[#b8934d] disabled:opacity-40 transition-colors"
        >
          {saving ? 'Saving…' : 'Mark Complete & Synthesise →'}
        </button>
      </div>
    </div>
  )
}
