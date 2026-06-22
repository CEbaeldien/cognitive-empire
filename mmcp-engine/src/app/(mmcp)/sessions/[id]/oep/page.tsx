'use client'
// ── Screen 3: OEP Panel — v1 API-Router ─────────────────────
// Claude + ChatGPT: live API call via BYOK proxy route.
//   Key entered inline, stored in sessionStorage only, never DB.
//   After run, Principal reviews/edits output before saving.
// All other models: manual paste (v0 behaviour).
// Each save writes one model_output row + audit log — unchanged.

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { logEvent, AUDIT_EVENT, AUDIT_ENTITY } from '@/lib/mmcp/audit'
import { setKey, getKey, hasKey, clearKey } from '@/lib/mmcp/keys'
import { loadAttachments, formatBytes, type Attachment } from '@/lib/mmcp/attachments'
import { MODEL_META, type ModelName, type ModelOutput, type MissionBrief } from '@/types/mmcp'

// Models with API proxy support in v1
const API_MODELS = new Set<ModelName>(['claude', 'chatgpt'])

const PROXY_ROUTE: Partial<Record<ModelName, string>> = {
  claude:  '/api/mmcp/run/claude',
  chatgpt: '/api/mmcp/run/chatgpt',
}

interface OutputDraft {
  raw_output:   string
  input_prompt: string
  saved:        boolean
  saving:       boolean
  running:      boolean
  error:        string | null
  savedId?:     string
  tokenCount?:  number
}

export default function OEPPage() {
  const { id: sessionId } = useParams<{ id: string }>()
  const router  = useRouter()
  const supabase = createClient()

  const [mission, setMission] = useState<MissionBrief | null>(null)
  const [outputs, setOutputs] = useState<Record<ModelName, OutputDraft>>({} as Record<ModelName, OutputDraft>)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  // Per-model key entry state (ephemeral UI — not persisted)
  const [keyInputs, setKeyInputs] = useState<Partial<Record<ModelName, string>>>({})
  // Whether each panel is showing the key entry UI
  const [showKeyEntry, setShowKeyEntry] = useState<Partial<Record<ModelName, boolean>>>({})

  // ── Load mission + existing outputs ───────────────────────
  useEffect(() => {
    async function load() {
      const { data: m } = await supabase
        .from('mission_briefs')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!m) return
      setMission(m)

      const drafts: Record<string, OutputDraft> = {}
      for (const model of m.models_selected as ModelName[]) {
        drafts[model] = {
          raw_output:   '',
          input_prompt: '',
          saved:        false,
          saving:       false,
          running:      false,
          error:        null,
        }
      }

      const { data: existing } = await supabase
        .from('model_outputs')
        .select('*')
        .eq('mission_id', m.id)

      if (existing) {
        for (const row of existing as ModelOutput[]) {
          if (drafts[row.model_name]) {
            drafts[row.model_name] = {
              raw_output:   row.raw_output,
              input_prompt: row.input_prompt ?? '',
              saved:        true,
              saving:       false,
              running:      false,
              error:        null,
              savedId:      row.id,
              tokenCount:   row.token_count ?? undefined,
            }
          }
        }
      }

      setOutputs(drafts as Record<ModelName, OutputDraft>)

      // Load attachments from localStorage
      setAttachments(loadAttachments(sessionId))

      // Initialise key-entry visibility: show if API model and no key loaded yet
      const visibility: Partial<Record<ModelName, boolean>> = {}
      for (const model of m.models_selected as ModelName[]) {
        if (API_MODELS.has(model)) {
          visibility[model] = !hasKey(model)
        }
      }
      setShowKeyEntry(visibility)
    }
    load()
  }, [sessionId])

  // ── Load key into localStorage ────────────────────────────
  function loadKey(model: ModelName) {
    const raw = (keyInputs[model] ?? '').trim()
    if (!raw) return
    setKey(model, raw)
    setKeyInputs(prev => ({ ...prev, [model]: '' }))
    setShowKeyEntry(prev => ({ ...prev, [model]: false }))
  }

  // ── Revoke key ────────────────────────────────────────────
  function revokeKey(model: ModelName) {
    clearKey(model)
    setShowKeyEntry(prev => ({ ...prev, [model]: true }))
    setOutputs(prev => ({ ...prev, [model]: { ...prev[model], error: null } }))
  }

  // ── Run API call ──────────────────────────────────────────
  async function runModel(model: ModelName) {
    if (!mission) return
    const draft   = outputs[model]
    const prompt  = draft.input_prompt.trim()
    const key     = getKey(model)
    const route   = PROXY_ROUTE[model]

    if (!prompt) {
      setOutputs(prev => ({ ...prev, [model]: { ...prev[model], error: 'Prompt is required to run the API.' } }))
      return
    }
    if (!key || !route) return

    setOutputs(prev => ({ ...prev, [model]: { ...prev[model], running: true, error: null } }))

    // Audit: attempted (payload never contains key)
    await logEvent({
      sessionId,
      eventType:      AUDIT_EVENT.API_CALL_ATTEMPTED,
      entityType:     AUDIT_ENTITY.OUTPUT,
      authorityLevel: 'R2',
      payload:        { model, mission_id: mission.id, prompt_length: prompt.length },
    })

    try {
      const res = await fetch(route, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ key, prompt, attachments, sessionId, missionId: mission.id }),
      })

      const json = await res.json() as { output?: string; tokenCount?: number; error?: string }

      if (!res.ok || json.error) {
        const errMsg = json.error ?? `Error ${res.status}`
        setOutputs(prev => ({ ...prev, [model]: { ...prev[model], running: false, error: errMsg } }))
        await logEvent({
          sessionId,
          eventType:      AUDIT_EVENT.API_CALL_FAILED,
          entityType:     AUDIT_ENTITY.OUTPUT,
          authorityLevel: 'R2',
          payload:        { model, mission_id: mission.id, error_status: res.status },
        })
        return
      }

      setOutputs(prev => ({
        ...prev,
        [model]: {
          ...prev[model],
          raw_output:  json.output ?? '',
          running:     false,
          saved:       false,
          tokenCount:  json.tokenCount,
          error:       null,
        },
      }))

      await logEvent({
        sessionId,
        eventType:      AUDIT_EVENT.API_CALL_COMPLETED,
        entityType:     AUDIT_ENTITY.OUTPUT,
        authorityLevel: 'R2',
        payload:        { model, mission_id: mission.id, token_count: json.tokenCount },
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unexpected error'
      setOutputs(prev => ({ ...prev, [model]: { ...prev[model], running: false, error: msg } }))
      await logEvent({
        sessionId,
        eventType:      AUDIT_EVENT.API_CALL_FAILED,
        entityType:     AUDIT_ENTITY.OUTPUT,
        authorityLevel: 'R2',
        payload:        { model, mission_id: mission.id, error_status: 0 },
      })
    }
  }

  // ── Save output to DB ─────────────────────────────────────
  async function saveOutput(model: ModelName) {
    if (!mission) return
    const draft = outputs[model]
    if (!draft.raw_output.trim()) return

    setOutputs(prev => ({ ...prev, [model]: { ...prev[model], saving: true } }))

    const payload = {
      session_id:   sessionId,
      mission_id:   mission.id,
      model_name:   model,
      raw_output:   draft.raw_output.trim(),
      input_prompt: draft.input_prompt.trim() || null,
      token_count:  draft.tokenCount ?? null,
      pasted_at:    new Date().toISOString(),
    }

    let savedId = draft.savedId

    if (savedId) {
      await supabase.from('model_outputs').update(payload).eq('id', savedId)
    } else {
      const { data } = await supabase
        .from('model_outputs')
        .insert(payload)
        .select()
        .single()
      savedId = data?.id
    }

    await logEvent({
      sessionId,
      eventType:      AUDIT_EVENT.OUTPUT_PASTED,
      entityType:     AUDIT_ENTITY.OUTPUT,
      entityId:       savedId,
      authorityLevel: 'R2',
      payload:        { model, mission_id: mission.id },
    })

    setOutputs(prev => ({
      ...prev,
      [model]: { ...prev[model], saving: false, saved: true, savedId },
    }))
  }

  // ── Counts ─────────────────────────────────────────────────
  const savedCount = Object.values(outputs).filter(o => o.saved).length
  const modelCount = Object.keys(outputs).length
  const canProceed = savedCount >= 2

  if (!mission) {
    return (
      <div className="p-8 text-sm text-white/30">
        No mission found.{' '}
        <a href={`/sessions/${sessionId}/mission`} className="text-[#c9a96e] hover:underline">
          Create one first.
        </a>
      </div>
    )
  }

  const models = mission.models_selected as ModelName[]

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">OEP — Output Exchange</h1>
          <p className="text-sm text-white/40 mt-0.5">
            {savedCount}/{modelCount} saved.{' '}
            <span className="text-white/20">Claude + ChatGPT run via API. Others: paste manually.</span>
          </p>
        </div>
        {canProceed && (
          <button
            onClick={() => router.push(`/sessions/${sessionId}/comparison`)}
            className="px-4 py-2 text-sm bg-[#c9a96e] text-black rounded font-medium hover:bg-[#b8934d] transition-colors"
          >
            Run Comparison →
          </button>
        )}
      </div>

      {/* Mission reference */}
      <div className="mb-5 p-3 bg-white/3 border border-white/8 rounded text-xs text-white/50">
        <span className="text-white/30">Mission: </span>{mission.objective}
      </div>

      {/* Attachment indicators */}
      {attachments.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-1.5">
          {attachments.map(a => (
            <div
              key={a.name}
              title={`${a.name} — ${formatBytes(a.size)}`}
              className="flex items-center gap-1.5 px-2 py-1 bg-[#c9a96e]/6 border border-[#c9a96e]/20 rounded text-[10px] text-[#c9a96e]/70"
            >
              <span className="uppercase font-medium">{a.type}</span>
              <span className="text-[#c9a96e]/40 truncate max-w-[120px]">{a.name}</span>
            </div>
          ))}
          <span className="text-[10px] text-white/20 self-center ml-1">
            {attachments.length} attachment{attachments.length > 1 ? 's' : ''} — passed to API models
          </span>
        </div>
      )}

      {/* Model panels */}
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${Math.min(models.length, 3)}, 1fr)` }}
      >
        {models.map(model => {
          const meta    = MODEL_META[model]
          const draft   = outputs[model] ?? { raw_output: '', input_prompt: '', saved: false, saving: false, running: false, error: null }
          const isApi   = API_MODELS.has(model)
          const keyReady = isApi && hasKey(model) && !showKeyEntry[model]

          return (
            <div
              key={model}
              className={`flex flex-col border rounded-lg transition-colors ${
                draft.saved
                  ? 'border-[#c9a96e]/30 bg-[#c9a96e]/3'
                  : 'border-white/8 bg-white/2'
              }`}
            >
              {/* Panel header */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-white/8">
                <div>
                  <p className="text-xs font-medium text-white">{meta.label}</p>
                  <p className="text-[11px] text-white/30">{meta.role}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {isApi && keyReady && (
                    <span className="text-[10px] text-[#c9a96e]/70 bg-[#c9a96e]/8 px-1.5 py-0.5 rounded">
                      🔑 key loaded
                    </span>
                  )}
                  {isApi && !keyReady && (
                    <span className="text-[10px] text-white/25 bg-white/5 px-1.5 py-0.5 rounded">
                      api
                    </span>
                  )}
                  {draft.saved && (
                    <span className="text-[10px] text-[#c9a96e] bg-[#c9a96e]/10 px-1.5 py-0.5 rounded">
                      saved
                    </span>
                  )}
                </div>
              </div>

              {/* Key entry — API models only, when key not loaded */}
              {isApi && showKeyEntry[model] && (
                <div className="px-3 pt-3 pb-2 border-b border-white/6">
                  <label className="text-[10px] text-white/30 uppercase tracking-wider mb-1 block">
                    {meta.label} API Key
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={keyInputs[model] ?? ''}
                      onChange={e => setKeyInputs(prev => ({ ...prev, [model]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && loadKey(model)}
                      placeholder={model === 'claude' ? 'sk-ant-…' : 'sk-…'}
                      className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[#c9a96e]/30 font-mono"
                    />
                    <button
                      onClick={() => loadKey(model)}
                      disabled={!keyInputs[model]?.trim()}
                      className="px-3 py-1.5 text-xs bg-[#c9a96e]/15 border border-[#c9a96e]/30 text-[#c9a96e] rounded hover:bg-[#c9a96e]/25 disabled:opacity-30 transition-colors"
                    >
                      Load
                    </button>
                  </div>
                  <p className="text-[10px] text-white/20 mt-1">
                    Stored in localStorage. Persists across reloads. Revoke from{' '}
                    <a href="/keys" className="underline hover:text-white/40">key management</a>.
                  </p>
                </div>
              )}

              {/* Key loaded — revoke link */}
              {isApi && keyReady && (
                <div className="px-3 pt-2 flex justify-end">
                  <button
                    onClick={() => revokeKey(model)}
                    className="text-[10px] text-white/25 hover:text-white/50 transition-colors"
                  >
                    Clear key
                  </button>
                </div>
              )}

              {/* Prompt */}
              <div className="px-3 pt-2">
                <label className="text-[10px] text-white/30 uppercase tracking-wider">
                  {isApi ? 'Prompt (required to run)' : 'Prompt used (optional)'}
                </label>
                <textarea
                  value={draft.input_prompt}
                  onChange={e =>
                    setOutputs(prev => ({
                      ...prev,
                      [model]: { ...prev[model], input_prompt: e.target.value, saved: false },
                    }))
                  }
                  placeholder={
                    isApi
                      ? 'Write the prompt to send to this model…'
                      : 'What prompt did you send to this model?'
                  }
                  rows={3}
                  className="w-full mt-1 bg-transparent border-0 text-xs text-white/50 placeholder:text-white/20 focus:outline-none resize-none"
                />
              </div>

              {/* Run button — API models only, when key is ready */}
              {isApi && keyReady && (
                <div className="px-3 pb-1">
                  <button
                    onClick={() => runModel(model)}
                    disabled={draft.running || !draft.input_prompt.trim()}
                    className="w-full py-1.5 text-xs bg-white/5 border border-white/12 text-white/70 rounded hover:bg-white/8 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    {draft.running ? `Running ${meta.label}…` : `Run ${meta.label} →`}
                  </button>
                </div>
              )}

              {/* Error */}
              {draft.error && (
                <div className="mx-3 mt-1.5 px-2.5 py-2 bg-red-950/40 border border-red-800/40 rounded text-xs text-red-300">
                  {draft.error}
                  {isApi && (
                    <button
                      onClick={() => revokeKey(model)}
                      className="ml-2 underline text-red-400/70 hover:text-red-300"
                    >
                      Re-enter key
                    </button>
                  )}
                </div>
              )}

              {/* Output */}
              <div className="px-3 pt-2 flex-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-white/30 uppercase tracking-wider">
                    {isApi ? 'Output (review + edit before saving)' : 'Model output'}
                  </label>
                  {draft.tokenCount != null && (
                    <span className="text-[10px] text-white/20">{draft.tokenCount.toLocaleString()} tokens</span>
                  )}
                </div>
                <textarea
                  value={draft.raw_output}
                  onChange={e =>
                    setOutputs(prev => ({
                      ...prev,
                      [model]: { ...prev[model], raw_output: e.target.value, saved: false },
                    }))
                  }
                  placeholder={
                    draft.running
                      ? 'Running…'
                      : isApi
                      ? `${meta.label} output will appear here after running…`
                      : `Paste ${meta.label}'s response here…`
                  }
                  rows={12}
                  className="w-full mt-1 bg-transparent border-0 text-xs text-white/80 placeholder:text-white/20 focus:outline-none resize-none"
                />
              </div>

              {/* Save button */}
              <div className="px-3 pb-3 pt-1">
                <button
                  onClick={() => saveOutput(model)}
                  disabled={!draft.raw_output.trim() || draft.saving || draft.running}
                  className="w-full py-1.5 text-xs border border-[#c9a96e]/30 text-[#c9a96e] rounded hover:bg-[#c9a96e]/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  {draft.saving ? 'Saving…' : draft.saved ? '↺ Update' : 'Save Output'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {!canProceed && modelCount > 0 && (
        <p className="mt-4 text-xs text-white/30 text-center">
          Save at least 2 outputs to enable comparison.
        </p>
      )}
    </div>
  )
}
