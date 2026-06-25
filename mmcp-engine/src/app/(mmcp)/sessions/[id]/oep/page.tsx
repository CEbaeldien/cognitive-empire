'use client'
// ── Screen 3: OEP Panel — v1 API-Router ─────────────────────
// Claude + ChatGPT: live API call via BYOK proxy route.
//   Key entered inline, stored in sessionStorage only, never DB.
//   After run, Principal reviews/edits output before saving.
// All other models: manual paste (v0 behaviour).

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { logEvent, AUDIT_EVENT, AUDIT_ENTITY } from '@/lib/mmcp/audit'
import { setKey, getKey, hasKey, clearKey } from '@/lib/mmcp/keys'
import { loadAttachments, formatBytes, type Attachment } from '@/lib/mmcp/attachments'
import { MODEL_META, type ModelName, type ModelOutput, type MissionBrief } from '@/types/mmcp'
import { MemoryCapture } from '@/components/mmcp/MemoryCapture'

const API_MODELS = new Set<ModelName>(['claude', 'chatgpt'])

const PROXY_ROUTE: Partial<Record<ModelName, string>> = {
  claude:  '/api/mmcp/run/claude',
  chatgpt: '/api/mmcp/run/chatgpt',
}

// ── Design tokens ──────────────────────────────────────────────
const S = {
  bg:      '#060D1A',
  text:    '#E6EDF7',
  accent:  '#C5A26F',
  muted:   'rgba(230,237,247,0.45)',
  faint:   'rgba(230,237,247,0.18)',
  border:  'rgba(230,237,247,0.07)',
  panel:   'rgba(230,237,247,0.03)',
  saved:   'rgba(197,162,111,0.08)',
  savedBorder: 'rgba(197,162,111,0.25)',
} as const

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
  const router   = useRouter()
  const supabase = createClient()

  const [mission,      setMission]     = useState<MissionBrief | null>(null)
  const [outputs,      setOutputs]     = useState<Record<ModelName, OutputDraft>>({} as Record<ModelName, OutputDraft>)
  const [attachments,  setAttachments] = useState<Attachment[]>([])
  const [keyInputs,    setKeyInputs]   = useState<Partial<Record<ModelName, string>>>({})
  const [showKeyEntry, setShowKeyEntry] = useState<Partial<Record<ModelName, boolean>>>({})
  const [expanded,     setExpanded]    = useState<Set<ModelName>>(new Set())

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
        drafts[model] = { raw_output: '', input_prompt: '', saved: false, saving: false, running: false, error: null }
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
      setAttachments(loadAttachments(sessionId))

      const visibility: Partial<Record<ModelName, boolean>> = {}
      for (const model of m.models_selected as ModelName[]) {
        if (API_MODELS.has(model)) visibility[model] = !hasKey(model)
      }
      setShowKeyEntry(visibility)
    }
    load()
  }, [sessionId])

  function loadKey(model: ModelName) {
    const raw = (keyInputs[model] ?? '').trim()
    if (!raw) return
    setKey(model, raw)
    setKeyInputs(prev => ({ ...prev, [model]: '' }))
    setShowKeyEntry(prev => ({ ...prev, [model]: false }))
  }

  function revokeKey(model: ModelName) {
    clearKey(model)
    setShowKeyEntry(prev => ({ ...prev, [model]: true }))
    setOutputs(prev => ({ ...prev, [model]: { ...prev[model], error: null } }))
  }

  function toggleExpanded(model: ModelName) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(model)) next.delete(model)
      else next.add(model)
      return next
    })
  }

  async function runModel(model: ModelName) {
    if (!mission) return
    const draft  = outputs[model]
    const prompt = draft.input_prompt.trim()
    const key    = getKey(model)
    const route  = PROXY_ROUTE[model]

    if (!prompt) {
      setOutputs(prev => ({ ...prev, [model]: { ...prev[model], error: 'Prompt is required to run the API.' } }))
      return
    }
    if (!key || !route) return

    setOutputs(prev => ({ ...prev, [model]: { ...prev[model], running: true, error: null } }))

    await logEvent({
      sessionId,
      eventType:      AUDIT_EVENT.API_CALL_ATTEMPTED,
      entityType:     AUDIT_ENTITY.OUTPUT,
      authorityLevel: 'R2',
      payload:        { model, mission_id: mission.id, prompt_length: prompt.length },
    })

    try {
      const res  = await fetch(route, {
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
        [model]: { ...prev[model], raw_output: json.output ?? '', running: false, saved: false, tokenCount: json.tokenCount, error: null },
      }))
      // Auto-expand when output arrives
      setExpanded(prev => { const n = new Set(prev); n.add(model); return n })

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
      const { data } = await supabase.from('model_outputs').insert(payload).select().single()
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

    setOutputs(prev => ({ ...prev, [model]: { ...prev[model], saving: false, saved: true, savedId } }))
  }

  const savedCount = Object.values(outputs).filter(o => o.saved).length
  const modelCount = Object.keys(outputs).length
  const canProceed = savedCount >= 2

  if (!mission) {
    return (
      <div style={{ padding: 40, fontSize: 15, color: 'rgba(230,237,247,0.3)' }}>
        No mission found.{' '}
        <a href={`/sessions/${sessionId}/mission`} style={{ color: S.accent, textDecoration: 'none' }}>
          Create one first.
        </a>
      </div>
    )
  }

  const models = mission.models_selected as ModelName[]

  return (
    <>
      <style>{`
        .oep-card:hover { border-color: rgba(230,237,247,0.12) !important; }
        .oep-btn-run:hover:not(:disabled) { background: rgba(197,162,111,0.15) !important; }
        .oep-btn-save:hover:not(:disabled) { background: rgba(197,162,111,0.12) !important; }
        .oep-expand:hover { color: #C5A26F !important; }
        .oep-link:hover { opacity: 0.7; }
      `}</style>

      <div style={{ padding: '28px 24px', maxWidth: 1400, fontFamily: 'system-ui, -apple-system, sans-serif' }}>

        {/* ── Header ───────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 600, color: S.text, margin: 0 }}>OEP — Output Exchange</h1>
            <p style={{ fontSize: 15, color: S.faint, marginTop: 4 }}>
              {savedCount}/{modelCount} saved
              <span style={{ color: S.border, marginLeft: 8 }}>·</span>
              <span style={{ color: 'rgba(230,237,247,0.25)', marginLeft: 8 }}>Claude + ChatGPT run via API. Others: paste manually.</span>
            </p>
          </div>
          {canProceed && (
            <button
              onClick={() => router.push(`/sessions/${sessionId}/comparison`)}
              style={{
                padding:      '0 20px',
                height:       44,
                background:   S.accent,
                color:        '#05070B',
                border:       'none',
                borderRadius: 8,
                fontSize:     15,
                fontWeight:   600,
                cursor:       'pointer',
                whiteSpace:   'nowrap',
                flexShrink:   0,
              }}
            >
              Run Comparison →
            </button>
          )}
        </div>

        {/* ── Mission context ──────────────────────────────────── */}
        <div style={{
          marginBottom: 20,
          padding:      '12px 14px',
          background:   S.panel,
          border:       `1px solid ${S.border}`,
          borderRadius: 8,
          fontSize:     14,
          color:        S.faint,
          lineHeight:   1.5,
        }}>
          <span style={{ fontSize: 12, color: 'rgba(230,237,247,0.25)', marginRight: 8 }}>Mission:</span>
          {mission.objective}
        </div>

        {/* ── Attachment chips ─────────────────────────────────── */}
        {attachments.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            {attachments.map(a => (
              <div
                key={a.name}
                title={`${a.name} — ${formatBytes(a.size)}`}
                style={{
                  display:      'flex',
                  alignItems:   'center',
                  gap:          6,
                  padding:      '4px 10px',
                  background:   'rgba(197,162,111,0.05)',
                  border:       `1px solid rgba(197,162,111,0.18)`,
                  borderRadius: 20,
                  fontSize:     12,
                  color:        'rgba(197,162,111,0.7)',
                }}
              >
                <span style={{ fontWeight: 700, textTransform: 'uppercase' }}>{a.type}</span>
                <span style={{ color: 'rgba(197,162,111,0.4)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {a.name}
                </span>
              </div>
            ))}
            <span style={{ fontSize: 12, color: 'rgba(230,237,247,0.2)', alignSelf: 'center', marginLeft: 4 }}>
              {attachments.length} attachment{attachments.length > 1 ? 's' : ''} — passed to API models
            </span>
          </div>
        )}

        {/* ── Model cards grid ─────────────────────────────────── */}
        <div style={{
          display:             'grid',
          gridTemplateColumns: `repeat(${Math.min(models.length, 3)}, 1fr)`,
          gap:                 16,
        }}>
          {models.map(model => {
            const meta      = MODEL_META[model]
            const draft     = outputs[model] ?? { raw_output: '', input_prompt: '', saved: false, saving: false, running: false, error: null }
            const isApi     = API_MODELS.has(model)
            const keyReady  = isApi && hasKey(model) && !showKeyEntry[model]
            const isExpanded = expanded.has(model)
            const hasOutput  = draft.raw_output.trim().length > 0
            const longOutput = draft.raw_output.length > 200

            return (
              <div
                key={model}
                className="oep-card"
                style={{
                  display:      'flex',
                  flexDirection: 'column',
                  border:       `1px solid ${draft.saved ? S.savedBorder : S.border}`,
                  background:   draft.saved ? S.saved : S.panel,
                  borderRadius: 10,
                  transition:   'border-color 0.15s ease',
                }}
              >
                {/* Card header */}
                <div style={{
                  display:       'flex',
                  alignItems:    'center',
                  justifyContent: 'space-between',
                  padding:       '12px 16px',
                  borderBottom:  `1px solid ${S.border}`,
                }}>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 600, color: S.text, margin: 0 }}>{meta.label}</p>
                    <p style={{ fontSize: 13, color: S.faint, margin: '2px 0 0' }}>{meta.role}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {isApi && keyReady && (
                      <span style={{ fontSize: 11, color: S.accent, background: 'rgba(197,162,111,0.08)', padding: '3px 8px', borderRadius: 4 }}>
                        🔑 key ready
                      </span>
                    )}
                    {isApi && !keyReady && (
                      <span style={{ fontSize: 11, color: S.faint, background: 'rgba(230,237,247,0.04)', padding: '3px 8px', borderRadius: 4 }}>
                        API
                      </span>
                    )}
                    {draft.saved && (
                      <span style={{ fontSize: 11, color: S.accent, background: 'rgba(197,162,111,0.1)', padding: '3px 8px', borderRadius: 4 }}>
                        ✓ saved
                      </span>
                    )}
                  </div>
                </div>

                {/* Key entry — API models when key not loaded */}
                {isApi && showKeyEntry[model] && (
                  <div style={{ padding: '12px 16px 10px', borderBottom: `1px solid ${S.border}` }}>
                    <label style={{ fontSize: 11, color: S.faint, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>
                      {meta.label} API Key
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="password"
                        value={keyInputs[model] ?? ''}
                        onChange={e => setKeyInputs(prev => ({ ...prev, [model]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && loadKey(model)}
                        placeholder={model === 'claude' ? 'sk-ant-…' : 'sk-…'}
                        style={{
                          flex:        1,
                          background:  'rgba(230,237,247,0.04)',
                          border:      `1px solid ${S.border}`,
                          borderRadius: 6,
                          padding:     '9px 12px',
                          fontSize:    13,
                          color:       S.text,
                          fontFamily:  'monospace',
                          outline:     'none',
                          minHeight:   44,
                        }}
                      />
                      <button
                        onClick={() => loadKey(model)}
                        disabled={!keyInputs[model]?.trim()}
                        style={{
                          padding:      '0 16px',
                          background:   'rgba(197,162,111,0.12)',
                          border:       `1px solid rgba(197,162,111,0.3)`,
                          borderRadius: 6,
                          fontSize:     13,
                          color:        S.accent,
                          cursor:       'pointer',
                          minHeight:    44,
                          opacity:      keyInputs[model]?.trim() ? 1 : 0.4,
                        }}
                      >
                        Load
                      </button>
                    </div>
                    <p style={{ fontSize: 12, color: 'rgba(230,237,247,0.2)', marginTop: 6 }}>
                      Stored in localStorage only. Revoke from{' '}
                      <a href="/keys" className="oep-link" style={{ color: S.faint, textDecoration: 'underline' }}>key management</a>.
                    </p>
                  </div>
                )}

                {/* Clear key link */}
                {isApi && keyReady && (
                  <div style={{ padding: '8px 16px 0', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => revokeKey(model)}
                      style={{ fontSize: 12, color: S.faint, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      Clear key
                    </button>
                  </div>
                )}

                {/* Prompt */}
                <div style={{ padding: '12px 16px 0' }}>
                  <label style={{ fontSize: 11, color: S.faint, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {isApi ? 'Prompt (required to run)' : 'Prompt used (optional)'}
                  </label>
                  <textarea
                    value={draft.input_prompt}
                    onChange={e => setOutputs(prev => ({ ...prev, [model]: { ...prev[model], input_prompt: e.target.value, saved: false } }))}
                    placeholder={isApi ? 'Write the prompt to send to this model…' : 'What prompt did you send to this model?'}
                    rows={3}
                    style={{
                      width:      '100%',
                      marginTop:  8,
                      background: 'transparent',
                      border:     'none',
                      fontSize:   15,
                      color:      S.muted,
                      lineHeight: 1.5,
                      resize:     'none',
                      outline:    'none',
                      boxSizing:  'border-box',
                    }}
                  />
                </div>

                {/* Run button — API + key ready */}
                {isApi && keyReady && (
                  <div style={{ padding: '6px 16px 0' }}>
                    <button
                      onClick={() => runModel(model)}
                      disabled={draft.running || !draft.input_prompt.trim()}
                      className="oep-btn-run"
                      style={{
                        width:        '100%',
                        height:       48,
                        background:   'rgba(197,162,111,0.08)',
                        border:       `1px solid rgba(197,162,111,0.25)`,
                        borderRadius: 8,
                        fontSize:     15,
                        fontWeight:   600,
                        color:        draft.running || !draft.input_prompt.trim() ? S.faint : S.accent,
                        cursor:       draft.running || !draft.input_prompt.trim() ? 'not-allowed' : 'pointer',
                        opacity:      draft.running || !draft.input_prompt.trim() ? 0.5 : 1,
                        transition:   'background 0.15s ease',
                      }}
                    >
                      {draft.running ? `Running ${meta.label}…` : `Run ${meta.label} →`}
                    </button>
                  </div>
                )}

                {/* Error */}
                {draft.error && (
                  <div style={{
                    margin:       '10px 16px 0',
                    padding:      '10px 14px',
                    background:   'rgba(180,30,30,0.15)',
                    border:       '1px solid rgba(180,30,30,0.3)',
                    borderRadius: 6,
                    fontSize:     14,
                    color:        '#f87171',
                  }}>
                    {draft.error}
                    {isApi && (
                      <button
                        onClick={() => revokeKey(model)}
                        style={{ marginLeft: 8, fontSize: 13, color: 'rgba(248,113,113,0.7)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        Re-enter key
                      </button>
                    )}
                  </div>
                )}

                {/* Output section */}
                <div style={{ padding: '12px 16px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <label style={{ fontSize: 11, color: S.faint, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      {isApi ? 'Output (review + edit before saving)' : 'Model output'}
                    </label>
                    {draft.tokenCount != null && (
                      <span style={{ fontSize: 12, color: 'rgba(230,237,247,0.25)' }}>
                        {draft.tokenCount.toLocaleString()} tokens
                      </span>
                    )}
                  </div>

                  {/* Output with expand/collapse */}
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      overflow:   'hidden',
                      maxHeight:  isExpanded ? 8000 : 108,
                      transition: 'max-height 0.3s ease-in-out',
                    }}>
                      <textarea
                        value={draft.raw_output}
                        onChange={e => setOutputs(prev => ({ ...prev, [model]: { ...prev[model], raw_output: e.target.value, saved: false } }))}
                        placeholder={
                          draft.running
                            ? 'Running…'
                            : isApi
                            ? `${meta.label} output will appear here after running…`
                            : `Paste ${meta.label}'s response here…`
                        }
                        rows={isExpanded ? 16 : 4}
                        style={{
                          width:      '100%',
                          background: 'transparent',
                          border:     'none',
                          fontSize:   15,
                          color:      S.text,
                          lineHeight: 1.6,
                          resize:     'none',
                          outline:    'none',
                          boxSizing:  'border-box',
                        }}
                      />
                    </div>

                    {/* Expand affordance — shown when collapsed and has long output */}
                    {!isExpanded && hasOutput && longOutput && (
                      <div
                        style={{
                          position:   'absolute',
                          bottom:     0, left: 0, right: 0,
                          height:     52,
                          background: `linear-gradient(to bottom, transparent, #060D1A)`,
                          display:    'flex',
                          alignItems: 'flex-end',
                          justifyContent: 'center',
                          paddingBottom:  6,
                          cursor:     'pointer',
                        }}
                        onClick={() => toggleExpanded(model)}
                      >
                        <span
                          className="oep-expand"
                          style={{ fontSize: 13, color: S.faint, display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          ↓ Tap to expand
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Collapse button — when expanded */}
                  {isExpanded && hasOutput && (
                    <button
                      onClick={() => toggleExpanded(model)}
                      style={{
                        width:      '100%',
                        padding:    '6px 0',
                        background: 'none',
                        border:     'none',
                        fontSize:   13,
                        color:      S.faint,
                        cursor:     'pointer',
                        marginTop:  4,
                      }}
                    >
                      ↑ Collapse
                    </button>
                  )}
                </div>

                {/* Save button */}
                <div style={{ padding: '12px 16px 16px', marginTop: 'auto' }}>
                  <button
                    onClick={() => saveOutput(model)}
                    disabled={!draft.raw_output.trim() || draft.saving || draft.running}
                    className="oep-btn-save"
                    style={{
                      width:        '100%',
                      height:       44,
                      background:   'transparent',
                      border:       `1px solid ${draft.saved ? S.savedBorder : 'rgba(197,162,111,0.3)'}`,
                      borderRadius: 8,
                      fontSize:     15,
                      fontWeight:   500,
                      color:        S.accent,
                      cursor:       !draft.raw_output.trim() || draft.saving || draft.running ? 'not-allowed' : 'pointer',
                      opacity:      !draft.raw_output.trim() || draft.saving || draft.running ? 0.4 : 1,
                      transition:   'background 0.15s ease',
                    }}
                  >
                    {draft.saving ? 'Saving…' : draft.saved ? '↺ Update' : 'Save Output'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {!canProceed && modelCount > 0 && (
          <p style={{ marginTop: 20, fontSize: 14, color: 'rgba(230,237,247,0.25)', textAlign: 'center' }}>
            Save at least 2 outputs to enable comparison.
          </p>
        )}

        <MemoryCapture
          sessionId={sessionId}
          defaultContent={mission.objective}
        />

      </div>
    </>
  )
}
