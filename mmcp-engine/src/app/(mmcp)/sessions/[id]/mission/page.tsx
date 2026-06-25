'use client'
// ── Screen 2: Mission Brief ──────────────────────────────────
// Define what the Principal wants reasoned about.
// Select which Intelligence Models will receive the mission.
// Creates mission_brief + audit log on save.

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { logEvent, AUDIT_EVENT, AUDIT_ENTITY } from '@/lib/mmcp/audit'
import { MODEL_META, type ModelName, type MissionBrief, type CreateMissionInput } from '@/types/mmcp'
import {
  fileToAttachment, saveAttachments, loadAttachments, ACCEPTED_MIME, formatBytes,
  type Attachment,
} from '@/lib/mmcp/attachments'
import { MemoryCapture, extractKeywords } from '@/components/mmcp/MemoryCapture'

const ALL_MODELS = Object.entries(MODEL_META) as [ModelName, { label: string; role: string }][]

export default function MissionPage() {
  const { id: sessionId } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [existing, setExisting] = useState<MissionBrief | null>(null)
  const [saving, setSaving] = useState(false)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [attachError, setAttachError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
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

      // Load any previously attached files from localStorage
      setAttachments(loadAttachments(sessionId))
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

  // ── Handle file attachment ────────────────────────────────
  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setAttachError(null)
    const next = [...attachments]
    for (const file of Array.from(files)) {
      try {
        const att = await fileToAttachment(file)
        const idx = next.findIndex(a => a.name === att.name)
        if (idx >= 0) next[idx] = att  // replace on re-upload
        else next.push(att)
      } catch (err) {
        setAttachError(err instanceof Error ? err.message : 'Could not read file')
      }
    }
    setAttachments(next)
    saveAttachments(sessionId, next)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function removeAttachment(name: string) {
    const next = attachments.filter(a => a.name !== name)
    setAttachments(next)
    saveAttachments(sessionId, next)
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

        {/* Attachments */}
        <Field label="Attachments" hint="PDF, DOCX, TXT, PNG, JPG — passed inline to API models">
          <div
            className="border border-dashed border-white/15 rounded px-3 py-3 cursor-pointer hover:border-white/25 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); e.stopPropagation() }}
            onDrop={e => { e.preventDefault(); void handleFiles(e.dataTransfer.files) }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_MIME}
              multiple
              className="hidden"
              onChange={e => void handleFiles(e.target.files)}
            />
            {attachments.length === 0 ? (
              <p className="text-xs text-white/25 text-center select-none">
                Click to attach files, or drag and drop
              </p>
            ) : (
              <div className="space-y-1.5">
                {attachments.map(a => (
                  <div key={a.name} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] text-[#c9a96e]/70 bg-[#c9a96e]/8 px-1.5 py-0.5 rounded uppercase shrink-0">
                        {a.type}
                      </span>
                      <span className="text-xs text-white/60 truncate">{a.name}</span>
                      <span className="text-[10px] text-white/20 shrink-0">{formatBytes(a.size)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); removeAttachment(a.name) }}
                      className="text-[10px] text-white/20 hover:text-red-400 transition-colors shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <p className="text-[10px] text-white/20 pt-1">Click to add more</p>
              </div>
            )}
          </div>
          {attachError && (
            <p className="text-xs text-red-400 mt-1">{attachError}</p>
          )}
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

      <MemoryCapture
        sessionId={sessionId}
        content={[form.title, form.objective, form.constraints].filter(Boolean).join('\n\n')}
        defaultClassification="decision"
        defaultTags={extractKeywords(form.objective)}
      />
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
