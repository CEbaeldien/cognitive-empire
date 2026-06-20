'use client'
// ── Screen 2: Mission Brief ──────────────────────────────────
// Define what the Principal wants reasoned about.
// Select which Intelligence Models will receive the mission.
// Creates mission_brief + audit log on save.

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { logEvent, AUDIT_EVENT, AUDIT_ENTITY } from '@/lib/mmcp/audit'
import { MODEL_META, type ModelName, type MissionBrief, type CreateMissionInput } from '@/types/mmcp'

const ALL_MODELS = Object.entries(MODEL_META) as [ModelName, { label: string; role: string }][]

export default function MissionPage() {
  const { id: sessionId } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [existing, setExisting] = useState<MissionBrief | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Omit<CreateMissionInput, 'session_id'>>({
    title: '',
    context: '',
    objective: '',
    constraints: '',
    models_selected: ['claude', 'grok', 'chatgpt'],
  })

  // ── Load existing mission (if any) ────────────────────────
  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('mission_briefs')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (data) {
        setExisting(data)
        setForm({
          title:           data.title,
          context:         data.context ?? '',
          objective:       data.objective,
          constraints:     data.constraints ?? '',
          models_selected: data.models_selected as ModelName[],
        })
      }
    }
    load()
  }, [sessionId])

  // ── Toggle model selection ─────────────────────────────────
  function toggleModel(model: ModelName) {
    setForm(f => ({
      ...f,
      models_selected: f.models_selected.includes(model)
        ? f.models_selected.filter(m => m !== model)
        : [...f.models_selected, model],
    }))
  }

  // ── Save mission brief ─────────────────────────────────────
  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.objective.trim()) return
    if (form.models_selected.length < 1) return
    setSaving(true)

    const payload = {
      session_id:      sessionId,
      title:           form.title.trim(),
      context:         form.context?.trim() || null,
      objective:       form.objective.trim(),
      constraints:     form.constraints?.trim() || null,
      models_selected: form.models_selected,
      status:          'active' as const,
    }

    let missionId: string

    if (existing) {
      const { data, error } = await supabase
        .from('mission_briefs')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single()
      if (error || !data) { console.error(error); setSaving(false); return }
      missionId = data.id
    } else {
      const { data, error } = await supabase
        .from('mission_briefs')
        .insert(payload)
        .select()
        .single()
      if (error || !data) { console.error(error); setSaving(false); return }
      missionId = data.id
    }

    await logEvent({
      sessionId,
      eventType:      AUDIT_EVENT.MISSION_CREATED,
      entityType:     AUDIT_ENTITY.MISSION,
      entityId:       missionId,
      authorityLevel: 'R2',
      payload:        { title: form.title, models: form.models_selected },
    })

    router.push(`/sessions/${sessionId}/oep`)
  }

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-white">Mission Brief</h1>
        <p className="text-sm text-white/40 mt-0.5">Define the cognitive task. Be precise.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Title */}
        <Field label="Mission Title" required>
          <input
            type="text"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="E.g. Evaluate CE Signals V2 launch window"
            className={INPUT}
            required
          />
        </Field>

        {/* Context */}
        <Field label="Context" hint="Background and situational framing">
          <textarea
            value={form.context}
            onChange={e => setForm(f => ({ ...f, context: e.target.value }))}
            placeholder="What's the current situation? What's already decided?"
            rows={3}
            className={INPUT}
          />
        </Field>

        {/* Objective */}
        <Field label="Objective" required hint="What decision or output is needed?">
          <textarea
            value={form.objective}
            onChange={e => setForm(f => ({ ...f, objective: e.target.value }))}
            placeholder="What question needs answering? What's the deliverable?"
            rows={3}
            className={INPUT}
            required
          />
        </Field>

        {/* Constraints */}
        <Field label="Constraints" hint="Non-negotiables, limits, what's out of scope">
          <textarea
            value={form.constraints}
            onChange={e => setForm(f => ({ ...f, constraints: e.target.value }))}
            placeholder="E.g. No new infrastructure spend. Must work at grill pace."
            rows={2}
            className={INPUT}
          />
        </Field>

        {/* Model selector */}
        <Field label="Intelligence Models" required hint="Select at least one. Each output stays independent.">
          <div className="grid grid-cols-2 gap-2">
            {ALL_MODELS.map(([model, meta]) => {
              const selected = form.models_selected.includes(model)
              return (
                <button
                  key={model}
                  type="button"
                  onClick={() => toggleModel(model)}
                  className={`text-left px-3 py-2.5 rounded border transition-all ${
                    selected
                      ? 'border-[#c9a96e]/50 bg-[#c9a96e]/8 text-white'
                      : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white/60'
                  }`}
                >
                  <p className="text-xs font-medium">{meta.label}</p>
                  <p className="text-[11px] text-white/30 mt-0.5 leading-tight">{meta.role}</p>
                </button>
              )
            })}
          </div>
        </Field>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving || form.models_selected.length === 0}
            className="px-5 py-2 text-sm bg-[#c9a96e] text-black rounded font-medium hover:bg-[#b8934d] disabled:opacity-40 transition-colors"
          >
            {saving ? 'Saving…' : existing ? 'Update & Continue' : 'Save & Continue →'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-1.5">
        <label className="text-xs font-medium text-white/60 uppercase tracking-wider">
          {label}
          {required && <span className="text-[#c9a96e] ml-0.5">*</span>}
        </label>
        {hint && <span className="text-xs text-white/25">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

const INPUT =
  'w-full bg-white/5 border border-white/10 rounded px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#c9a96e]/40 resize-none transition-colors'
