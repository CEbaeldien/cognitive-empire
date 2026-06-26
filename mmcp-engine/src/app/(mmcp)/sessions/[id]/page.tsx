'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { logEvent, assertR4HasApproval, AUDIT_EVENT, AUDIT_ENTITY } from '@/lib/mmcp/audit'
import { getKey, setKey, hasKey } from '@/lib/mmcp/keys'
import {
  loadAttachments, saveAttachments, fileToAttachment,
  ACCEPTED_MIME, type Attachment,
} from '@/lib/mmcp/attachments'
import { MemoryCapture, extractKeywords } from '@/components/mmcp/MemoryCapture'
import {
  MODEL_META, AUTHORITY_LEVELS,
  type ModelName, type MissionBrief, type ModelOutput, type OEPComparison,
  type Synthesis, type Approval, type Action, type AuditLog,
  type AuthorityLevel, type ApprovalDecision, type ConfidenceLevel,
} from '@/types/mmcp'

// ── Design tokens ─────────────────────────────────────────────────
const S = {
  bg:      '#05070B',
  card:    '#0A0E16',
  text:    '#E6EDF7',
  accent:  '#C5A26F',
  muted:   'rgba(230,237,247,0.45)',
  faint:   'rgba(230,237,247,0.18)',
  border:  'rgba(230,237,247,0.07)',
  panel:   'rgba(230,237,247,0.03)',
} as const

const INPUT_STYLE: CSSProperties = {
  width: '100%', background: 'rgba(230,237,247,0.04)', border: `1px solid ${S.border}`,
  borderRadius: 8, padding: '10px 13px', fontSize: 15, color: S.text,
  outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.6,
}
const SELECT_STYLE: CSSProperties = {
  background: '#0D1117', color: S.text, border: `1px solid rgba(230,237,247,0.15)`,
  borderRadius: 6, padding: '9px 12px', fontSize: 14, cursor: 'pointer',
  appearance: 'none', WebkitAppearance: 'none', outline: 'none', width: '100%',
}
const BTN_GOLD: CSSProperties = {
  padding: '0 20px', height: 44, background: S.accent, color: '#05070B',
  border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer',
}
const BTN_GHOST: CSSProperties = {
  padding: '0 16px', height: 40, background: 'transparent', border: `1px solid ${S.border}`,
  borderRadius: 8, fontSize: 14, color: S.muted, cursor: 'pointer',
}
const LABEL: CSSProperties = {
  display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em',
  color: S.faint, marginBottom: 7,
}

// ── Types ─────────────────────────────────────────────────────────
type SheetId = 'mission' | 'reasoning' | 'challenge' | 'comparison' | 'synthesis' | 'approval' | 'memory' | 'actions' | 'timeline'

interface OutputDraft {
  prompt: string; output: string; savedId?: string
  running: boolean; saving: boolean; saved: boolean; error: string | null; tokenCount?: number
}

interface ExchangeMsg { role: 'principal' | 'model'; model?: ModelName; content: string; ts: number }

interface MissionDraft {
  title: string; context: string; objective: string; constraints: string
  models_selected: ModelName[]; reasoning_prompt: string; challenge_prompt: string
}

type CompField = 'convergence_notes' | 'divergence_notes' | 'blind_spots' | 'contradictions' | 'risk_notes' | 'missing_assumptions'

const COMP_FIELDS: { key: CompField; label: string; hint: string }[] = [
  { key: 'convergence_notes',   label: 'Convergence',         hint: 'What did all models agree on?' },
  { key: 'divergence_notes',    label: 'Divergence',          hint: 'Where did models differ?' },
  { key: 'blind_spots',         label: 'Blind Spots',         hint: 'What did no model cover?' },
  { key: 'contradictions',      label: 'Contradictions',      hint: 'Direct conflicts between outputs' },
  { key: 'risk_notes',          label: 'Risk Notes',          hint: 'Risks surfaced by comparison' },
  { key: 'missing_assumptions', label: 'Missing Assumptions', hint: 'Assumptions no model named' },
]

const REVISION_COMMANDS = [
  { label: 'Sharpen this',              instruction: 'Make this synthesis sharper, more direct, and remove hedging language while preserving uncertainty flags.' },
  { label: 'Make it practical',         instruction: 'Rewrite this synthesis to emphasize concrete, actionable conclusions. What should actually happen?' },
  { label: 'Expose risks',             instruction: 'Revise this synthesis to surface hidden risks, second-order effects, and what could go wrong.' },
  { label: 'Challenge this synthesis', instruction: 'Act as an adversary. Challenge the core conclusions of this synthesis. What is it missing or getting wrong?' },
  { label: 'Ask for revision',          instruction: 'Refine this synthesis. Improve the logical flow, resolve any internal contradictions, and strengthen the recommended action.' },
]

const API_MODELS = new Set<ModelName>(['claude', 'chatgpt'])
const PROXY: Partial<Record<ModelName, string>> = { claude: '/api/mmcp/run/claude', chatgpt: '/api/mmcp/run/chatgpt' }

// ── Main component ─────────────────────────────────────────────────
export default function SessionWorkspace() {
  const { id: sessionId } = useParams<{ id: string }>()
  const supabase  = createClient()
  const fileRef   = useRef<HTMLInputElement>(null)
  const exchRef   = useRef<HTMLDivElement>(null)

  // ── Persisted state ──────────────────────────────────────────────
  const [mission,      setMission]      = useState<MissionBrief | null>(null)
  const [outputs,      setOutputs]      = useState<ModelOutput[]>([])
  const [comparison,   setComparison]   = useState<OEPComparison | null>(null)
  const [synthesis,    setSynthesis]    = useState<Synthesis | null>(null)
  const [approval,     setApproval]     = useState<Approval | null>(null)
  const [actions,      setActions]      = useState<Action[]>([])
  const [memoryCount,  setMemoryCount]  = useState(0)
  const [auditLogs,    setAuditLogs]    = useState<AuditLog[]>([])
  const [userId,       setUserId]       = useState<string | null>(null)
  const [loading,      setLoading]      = useState(true)

  // ── Principal input + attachments ────────────────────────────────
  const [principalInput, setPrincipalInput] = useState('')
  const [attachments,    setAttachments]    = useState<Attachment[]>([])
  const [attachError,    setAttachError]    = useState<string | null>(null)

  // ── Mission extraction ───────────────────────────────────────────
  const [missionDraft,  setMissionDraft]  = useState<MissionDraft | null>(null)
  const [extracting,    setExtracting]    = useState(false)
  const [extractError,  setExtractError]  = useState<string | null>(null)
  const [savingMission, setSavingMission] = useState(false)

  // ── Output drafts (per model) ────────────────────────────────────
  const [outputDrafts, setOutputDrafts] = useState<Partial<Record<ModelName, OutputDraft>>>({})
  const [keyInputs,    setKeyInputs]    = useState<Partial<Record<ModelName, string>>>({})
  const [keyVisible,   setKeyVisible]   = useState<Partial<Record<ModelName, boolean>>>({})

  // ── Comparison form ──────────────────────────────────────────────
  const [compForm,     setCompForm]     = useState<Record<CompField, string>>({ convergence_notes: '', divergence_notes: '', blind_spots: '', contradictions: '', risk_notes: '', missing_assumptions: '' })
  const [compOpen,     setCompOpen]     = useState<CompField | null>('convergence_notes')
  const [autofilling,  setAutofilling]  = useState(false)
  const [autofillErr,  setAutofillErr]  = useState<string | null>(null)
  const [savingComp,   setSavingComp]   = useState(false)

  // ── Synthesis form ───────────────────────────────────────────────
  const [synthText,    setSynthText]    = useState('')
  const [synthConf,    setSynthConf]    = useState<ConfidenceLevel>('medium')
  const [synthFlags,   setSynthFlags]   = useState('')
  const [synthAction,  setSynthAction]  = useState('')
  const [savingSynth,  setSavingSynth]  = useState(false)
  const [revisingWith, setRevisingWith] = useState<string | null>(null)

  // ── Approval form ────────────────────────────────────────────────
  const [apDecision, setApDecision]  = useState<ApprovalDecision>('approve')
  const [apAuthority, setApAuthority] = useState<AuthorityLevel>('R3')
  const [apNotes,    setApNotes]     = useState('')
  const [savingAp,   setSavingAp]    = useState(false)

  // ── Action form ──────────────────────────────────────────────────
  const [actTitle,    setActTitle]    = useState('')
  const [actDesc,     setActDesc]     = useState('')
  const [actAuth,     setActAuth]     = useState<AuthorityLevel>('R3')
  const [creatingAct, setCreatingAct] = useState(false)

  // ── Exchange ─────────────────────────────────────────────────────
  const [exchange,     setExchange]    = useState<ExchangeMsg[]>([])
  const [exchInput,    setExchInput]   = useState('')
  const [exchModel,    setExchModel]   = useState<ModelName>('claude')
  const [exchRunning,  setExchRunning] = useState(false)

  // ── Generated prompts ────────────────────────────────────────────
  const [genReasoning,    setGenReasoning]    = useState('')
  const [genChallenge,    setGenChallenge]    = useState('')
  const [generatingPrompt, setGeneratingPrompt] = useState<'reasoning' | 'challenge' | null>(null)

  // ── UI state ─────────────────────────────────────────────────────
  const [openSheet, setOpenSheet] = useState<SheetId | null>(null)
  const [isMobile,  setIsMobile]  = useState(false)

  useEffect(() => {
    function check() { setIsMobile(window.innerWidth < 900) }
    check(); window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // ── Load all data ─────────────────────────────────────────────────
  useEffect(() => {
    if (!sessionId) return
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id ?? null)

      const [mRes, oRes, cRes, sRes, aRes, actRes, memRes, logRes] = await Promise.all([
        supabase.from('mission_briefs').select('*').eq('session_id', sessionId).order('created_at', { ascending: false }).limit(1).single(),
        supabase.from('model_outputs').select('*').eq('session_id', sessionId),
        supabase.from('oep_comparisons').select('*').eq('session_id', sessionId).order('created_at', { ascending: false }).limit(1).single(),
        supabase.from('syntheses').select('*').eq('session_id', sessionId).order('created_at', { ascending: false }).limit(1).single(),
        supabase.from('approvals').select('*').eq('session_id', sessionId).order('decided_at', { ascending: false }).limit(1).single(),
        supabase.from('actions').select('*').eq('session_id', sessionId).order('created_at', { ascending: false }),
        supabase.from('memory_items').select('id').eq('session_id', sessionId),
        supabase.from('audit_logs').select('*').eq('session_id', sessionId).order('logged_at', { ascending: false }).limit(50),
      ])

      const m   = mRes.data  as MissionBrief | null
      const outs = (oRes.data ?? []) as ModelOutput[]
      const cmp  = cRes.data  as OEPComparison | null
      const syn  = sRes.data  as Synthesis | null
      const apr  = aRes.data  as Approval | null

      setMission(m)
      setOutputs(outs)
      setComparison(cmp)
      setSynthesis(syn)
      setApproval(apr)
      setActions((actRes.data ?? []) as Action[])
      setMemoryCount(memRes.data?.length ?? 0)
      setAuditLogs((logRes.data ?? []) as AuditLog[])

      if (m) {
        const drafts: Partial<Record<ModelName, OutputDraft>> = {}
        for (const model of m.models_selected as ModelName[]) {
          const existing = outs.find(o => o.model_name === model)
          drafts[model] = existing
            ? { prompt: existing.input_prompt ?? '', output: existing.raw_output, savedId: existing.id, running: false, saving: false, saved: true, error: null, tokenCount: existing.token_count ?? undefined }
            : { prompt: '', output: '', running: false, saving: false, saved: false, error: null }
        }
        setOutputDrafts(drafts)
        if (syn) { setSynthText(syn.synthesis_text); setSynthConf(syn.confidence_level ?? 'medium'); setSynthFlags(syn.uncertainty_flags ?? ''); setSynthAction(syn.recommended_action ?? '') }
        if (cmp) setCompForm({ convergence_notes: cmp.convergence_notes ?? '', divergence_notes: cmp.divergence_notes ?? '', blind_spots: cmp.blind_spots ?? '', contradictions: cmp.contradictions ?? '', risk_notes: cmp.risk_notes ?? '', missing_assumptions: cmp.missing_assumptions ?? '' })
      }

      setAttachments(loadAttachments(sessionId))
      setLoading(false)
    }
    void load()
  }, [sessionId])

  // ── Key helpers ──────────────────────────────────────────────────
  function loadModelKey(model: ModelName) {
    const k = (keyInputs[model] ?? '').trim(); if (!k) return
    setKey(model, k)
    setKeyInputs(p => ({ ...p, [model]: '' }))
    setKeyVisible(p => ({ ...p, [model]: false }))
  }

  // ── File attach ──────────────────────────────────────────────────
  async function handleFiles(files: FileList | null) {
    if (!files?.length) return; setAttachError(null)
    const next = [...attachments]
    for (const f of Array.from(files)) {
      try { const a = await fileToAttachment(f); const i = next.findIndex(x => x.name === a.name); if (i >= 0) next[i] = a; else next.push(a) }
      catch (e) { setAttachError(e instanceof Error ? e.message : 'Could not read file') }
    }
    setAttachments(next); saveAttachments(sessionId, next)
    if (fileRef.current) fileRef.current.value = ''
  }

  // ── Extract Mission Brief ────────────────────────────────────────
  async function extractMission() {
    const key = getKey('claude')
    if (!key) { setExtractError('Claude key required. Load it in BYOK Gate first.'); return }
    if (!principalInput.trim()) { setExtractError('Add some input first.'); return }
    setExtracting(true); setExtractError(null)

    const prompt = `You are a mission brief extractor. Extract a structured mission brief from the following principal input. Return ONLY valid JSON with these keys: title (string), context (string), objective (string), constraints (string), models_selected (array of: "claude","chatgpt","grok","gemini","codex","claude-code"), reasoning_prompt (a ready-to-use reasoning prompt, 2-4 sentences), challenge_prompt (a ready-to-use adversarial challenge prompt, 2-4 sentences).

Principal Input:
${principalInput}

Return only the JSON object, no explanation.`

    try {
      const res  = await fetch('/api/mmcp/run/claude', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, prompt }) })
      const json = await res.json() as { output?: string; error?: string }
      if (!res.ok || json.error) { setExtractError(json.error ?? `Error ${res.status}`); setExtracting(false); return }
      const match = (json.output ?? '').match(/\{[\s\S]*\}/)
      if (!match) { setExtractError('Could not parse extraction. Try again.'); setExtracting(false); return }
      const parsed = JSON.parse(match[0]) as MissionDraft
      setMissionDraft({ title: parsed.title ?? '', context: parsed.context ?? '', objective: parsed.objective ?? '', constraints: parsed.constraints ?? '', models_selected: (parsed.models_selected ?? ['claude', 'chatgpt']) as ModelName[], reasoning_prompt: parsed.reasoning_prompt ?? '', challenge_prompt: parsed.challenge_prompt ?? '' })
      if (parsed.reasoning_prompt) setGenReasoning(parsed.reasoning_prompt)
      if (parsed.challenge_prompt) setGenChallenge(parsed.challenge_prompt)
    } catch (e) { setExtractError(e instanceof Error ? e.message : 'Unexpected error') }
    setExtracting(false)
  }

  // ── Confirm Mission Brief ────────────────────────────────────────
  async function confirmMission() {
    if (!missionDraft || !missionDraft.title.trim() || !missionDraft.objective.trim()) return
    setSavingMission(true)
    const payload = { session_id: sessionId, title: missionDraft.title.trim(), context: missionDraft.context.trim() || null, objective: missionDraft.objective.trim(), constraints: missionDraft.constraints.trim() || null, models_selected: missionDraft.models_selected, status: 'active' as const }
    let m = mission
    if (m) {
      await supabase.from('mission_briefs').update(payload).eq('id', m.id)
    } else {
      const { data } = await supabase.from('mission_briefs').insert(payload).select().single()
      m = data as MissionBrief
      setMission(m)
    }
    if (m) {
      await logEvent({ sessionId, eventType: AUDIT_EVENT.MISSION_CREATED, entityType: AUDIT_ENTITY.MISSION, entityId: m.id, authorityLevel: 'R2', payload: { title: missionDraft.title, models: missionDraft.models_selected } })
      const drafts: Partial<Record<ModelName, OutputDraft>> = {}
      for (const model of missionDraft.models_selected) drafts[model] = { prompt: '', output: '', running: false, saving: false, saved: false, error: null }
      setOutputDrafts(drafts)
    }
    setMissionDraft(null); setSavingMission(false)
  }

  // ── Generate prompt ──────────────────────────────────────────────
  async function generatePrompt(role: 'reasoning' | 'challenge') {
    const key = getKey('claude'); if (!key) return
    if (!mission) return
    setGeneratingPrompt(role)
    const instruction = role === 'reasoning'
      ? `Generate a clear, focused reasoning prompt for the following mission. The prompt should ask the model to analyze, reason through, and provide a well-structured response. 3-5 sentences.`
      : `Generate an adversarial challenge prompt. The model should attack the mission's assumptions, find contradictions, surface risks, and expose what could be wrong. 3-5 sentences.`
    const prompt = `${instruction}\n\nMission Title: ${mission.title}\nObjective: ${mission.objective}\nContext: ${mission.context ?? ''}\nConstraints: ${mission.constraints ?? ''}\n\nReturn only the prompt text, no explanation.`
    try {
      const res = await fetch('/api/mmcp/run/claude', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, prompt }) })
      const json = await res.json() as { output?: string; error?: string }
      if (res.ok && json.output) { if (role === 'reasoning') setGenReasoning(json.output.trim()); else setGenChallenge(json.output.trim()) }
    } catch {}
    setGeneratingPrompt(null)
  }

  // ── Run model ────────────────────────────────────────────────────
  async function runModel(model: ModelName) {
    if (!mission) return
    const draft  = outputDrafts[model]
    const route  = PROXY[model]
    const key    = getKey(model)
    const prompt = (draft?.prompt ?? '').trim()
    if (!prompt || !key || !route) return
    setOutputDrafts(p => ({ ...p, [model]: { ...p[model]!, running: true, error: null } }))
    await logEvent({ sessionId, eventType: AUDIT_EVENT.API_CALL_ATTEMPTED, entityType: AUDIT_ENTITY.OUTPUT, authorityLevel: 'R2', payload: { model, mission_id: mission.id } })
    try {
      const res  = await fetch(route, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, prompt, attachments, sessionId, missionId: mission.id }) })
      const json = await res.json() as { output?: string; tokenCount?: number; error?: string }
      if (!res.ok || json.error) {
        setOutputDrafts(p => ({ ...p, [model]: { ...p[model]!, running: false, error: json.error ?? `Error ${res.status}` } }))
        await logEvent({ sessionId, eventType: AUDIT_EVENT.API_CALL_FAILED, entityType: AUDIT_ENTITY.OUTPUT, authorityLevel: 'R2', payload: { model, error_status: res.status } })
        return
      }
      setOutputDrafts(p => ({ ...p, [model]: { ...p[model]!, running: false, output: json.output ?? '', saved: false, tokenCount: json.tokenCount, error: null } }))
      await logEvent({ sessionId, eventType: AUDIT_EVENT.API_CALL_COMPLETED, entityType: AUDIT_ENTITY.OUTPUT, authorityLevel: 'R2', payload: { model, mission_id: mission.id } })
    } catch (e) {
      setOutputDrafts(p => ({ ...p, [model]: { ...p[model]!, running: false, error: e instanceof Error ? e.message : 'Unexpected error' } }))
    }
  }

  // ── Save output ──────────────────────────────────────────────────
  async function saveOutput(model: ModelName) {
    if (!mission) return
    const draft = outputDrafts[model]; if (!draft?.output.trim()) return
    setOutputDrafts(p => ({ ...p, [model]: { ...p[model]!, saving: true } }))
    const payload = { session_id: sessionId, mission_id: mission.id, model_name: model, raw_output: draft.output.trim(), input_prompt: draft.prompt.trim() || null, token_count: draft.tokenCount ?? null, pasted_at: new Date().toISOString() }
    let savedId = draft.savedId
    if (savedId) { await supabase.from('model_outputs').update(payload).eq('id', savedId) }
    else { const { data } = await supabase.from('model_outputs').insert(payload).select().single(); savedId = data?.id }
    await logEvent({ sessionId, eventType: AUDIT_EVENT.OUTPUT_PASTED, entityType: AUDIT_ENTITY.OUTPUT, entityId: savedId, authorityLevel: 'R2', payload: { model, mission_id: mission.id } })
    const { data: outs } = await supabase.from('model_outputs').select('*').eq('session_id', sessionId)
    setOutputs((outs ?? []) as ModelOutput[])
    setOutputDrafts(p => ({ ...p, [model]: { ...p[model]!, saving: false, saved: true, savedId } }))
  }

  // ── Auto-fill comparison ─────────────────────────────────────────
  async function autoFill() {
    if (outputs.length < 2) { setAutofillErr('Save at least 2 outputs first.'); return }
    const key = getKey('claude'); if (!key) { setAutofillErr('Claude key required.'); return }
    setAutofilling(true); setAutofillErr(null)
    const section = outputs.map(o => `=== ${o.model_name.toUpperCase()} ===\n${o.raw_output}`).join('\n\n')
    const prompt = `Analyze these AI model outputs and return a JSON object with exactly these 6 keys: convergence_notes, divergence_notes, blind_spots, contradictions, risk_notes, missing_assumptions. Be analytical and terse. Return ONLY valid JSON.\n\nOUTPUTS:\n${section}`
    try {
      const res  = await fetch('/api/mmcp/run/claude', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, prompt }) })
      const json = await res.json() as { output?: string; error?: string }
      if (!res.ok || json.error) { setAutofillErr(json.error ?? `Error ${res.status}`); setAutofilling(false); return }
      const match = (json.output ?? '').match(/\{[\s\S]*\}/)
      if (!match) { setAutofillErr('Unexpected response format.'); setAutofilling(false); return }
      const parsed = JSON.parse(match[0]) as Partial<Record<CompField, string>>
      setCompForm(f => ({ ...f, ...Object.fromEntries(Object.entries(parsed).map(([k, v]) => [k, v ?? f[k as CompField]])) } as Record<CompField, string>))
    } catch (e) { setAutofillErr(e instanceof Error ? e.message : 'Unexpected error') }
    setAutofilling(false)
  }

  // ── Save comparison ──────────────────────────────────────────────
  async function saveComparison(markComplete: boolean) {
    const mId = mission?.id; if (!mId) return
    setSavingComp(true)
    const payload = { session_id: sessionId, mission_id: mId, ...Object.fromEntries(Object.entries(compForm).map(([k, v]) => [k, v.trim() || null])), status: markComplete ? 'complete' as const : 'draft' as const }
    let compId = comparison?.id
    if (comparison) { await supabase.from('oep_comparisons').update(payload).eq('id', comparison.id) }
    else { const { data } = await supabase.from('oep_comparisons').insert(payload).select().single(); compId = data?.id; setComparison(data ?? null) }
    if (markComplete) { const { data } = await supabase.from('oep_comparisons').select('*').eq('session_id', sessionId).order('created_at', { ascending: false }).limit(1).single(); if (data) setComparison(data as OEPComparison) }
    await logEvent({ sessionId, eventType: markComplete ? AUDIT_EVENT.COMPARISON_COMPLETED : AUDIT_EVENT.COMPARISON_SAVED, entityType: AUDIT_ENTITY.COMPARISON, entityId: compId, authorityLevel: 'R2' })
    setSavingComp(false)
  }

  // ── Revise synthesis with AI ─────────────────────────────────────
  async function reviseSynthesis(instruction: string) {
    const key = getKey('claude'); if (!key || !synthText.trim()) return
    setRevisingWith(instruction.slice(0, 20))
    const prompt = `You are a synthesis editor. ${instruction}\n\nCurrent synthesis:\n${synthText}\n\nReturn only the revised synthesis text.`
    try {
      const res  = await fetch('/api/mmcp/run/claude', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, prompt }) })
      const json = await res.json() as { output?: string; error?: string }
      if (res.ok && json.output) setSynthText(json.output.trim())
    } catch {}
    setRevisingWith(null)
  }

  // ── Save synthesis ───────────────────────────────────────────────
  async function saveSynthesis() {
    if (!mission?.id || !synthText.trim()) return
    setSavingSynth(true)
    const payload = { session_id: sessionId, mission_id: mission.id, oep_comparison_id: comparison?.id ?? null, synthesis_text: synthText.trim(), confidence_level: synthConf, uncertainty_flags: synthFlags.trim() || null, recommended_action: synthAction.trim() || null, status: 'pending_approval' as const }
    let synId = synthesis?.id
    if (synthesis) { await supabase.from('syntheses').update(payload).eq('id', synthesis.id) }
    else { const { data } = await supabase.from('syntheses').insert(payload).select().single(); synId = data?.id; setSynthesis(data ?? null) }
    await logEvent({ sessionId, eventType: synthesis ? AUDIT_EVENT.SYNTHESIS_REVISED : AUDIT_EVENT.SYNTHESIS_CREATED, entityType: AUDIT_ENTITY.SYNTHESIS, entityId: synId, authorityLevel: 'R2' })
    const { data } = await supabase.from('syntheses').select('*').eq('session_id', sessionId).order('created_at', { ascending: false }).limit(1).single()
    if (data) setSynthesis(data as Synthesis)
    setSavingSynth(false)
  }

  // ── Record approval ──────────────────────────────────────────────
  async function recordApproval() {
    if (!synthesis || !userId) return
    setSavingAp(true)
    const { data: apr } = await supabase.from('approvals').insert({ session_id: sessionId, synthesis_id: synthesis.id, principal_id: userId, decision: apDecision, notes: apNotes.trim() || null, authority_level: apAuthority, decided_at: new Date().toISOString() }).select().single()
    if (apr) {
      setApproval(apr as Approval)
      const newStatus = apDecision === 'approve' ? 'approved' : apDecision === 'reject' ? 'rejected' : 'pending_approval'
      await supabase.from('syntheses').update({ status: newStatus }).eq('id', synthesis.id)
      await logEvent({ sessionId, eventType: AUDIT_EVENT.APPROVAL_DECIDED, entityType: AUDIT_ENTITY.APPROVAL, entityId: apr.id, authorityLevel: apAuthority, payload: { decision: apDecision } })
    }
    setSavingAp(false)
  }

  // ── Create action ────────────────────────────────────────────────
  async function createAction() {
    if (!synthesis || !approval || !actTitle.trim()) return
    if (actAuth === 'R4') assertR4HasApproval(approval.id, 'create action')
    setCreatingAct(true)
    const { data: act } = await supabase.from('actions').insert({ session_id: sessionId, synthesis_id: synthesis.id, approval_id: approval.id, title: actTitle.trim(), description: actDesc.trim(), authority_level: actAuth, status: 'pending', completed_at: null }).select().single()
    if (act) { setActions(prev => [act as Action, ...prev]); await logEvent({ sessionId, eventType: AUDIT_EVENT.ACTION_CREATED, entityType: AUDIT_ENTITY.ACTION, entityId: act.id, authorityLevel: actAuth, payload: { title: actTitle } }) }
    setActTitle(''); setActDesc(''); setCreatingAct(false)
  }

  // ── Exchange send ────────────────────────────────────────────────
  async function sendExchange() {
    const msg = exchInput.trim(); if (!msg) return
    const key = getKey(exchModel); if (!key) return
    const route = PROXY[exchModel]; if (!route) return
    setExchange(p => [...p, { role: 'principal', content: msg, ts: Date.now() }])
    setExchInput(''); setExchRunning(true)
    const context = [
      mission ? `Mission: ${mission.title}\nObjective: ${mission.objective}` : '',
      outputs.map(o => `[${o.model_name}]: ${o.raw_output.slice(0, 500)}`).join('\n'),
      exchange.slice(-4).map(m => `${m.role === 'principal' ? 'Principal' : 'Model'}: ${m.content}`).join('\n'),
      `Principal: ${msg}`,
    ].filter(Boolean).join('\n\n---\n')
    try {
      const res  = await fetch(route, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, prompt: context }) })
      const json = await res.json() as { output?: string; error?: string }
      if (res.ok && json.output) setExchange(p => [...p, { role: 'model', model: exchModel, content: json.output!, ts: Date.now() }])
    } catch {}
    setExchRunning(false)
    setTimeout(() => exchRef.current?.scrollTo({ top: 9999, behavior: 'smooth' }), 100)
  }

  // ── Derived ──────────────────────────────────────────────────────
  const savedOutputs = outputs
  const savedCount   = savedOutputs.length
  const compComplete = comparison?.status === 'complete'
  const isApproved   = approval?.decision === 'approve'
  const claudeKey    = hasKey('claude')
  const chatgptKey   = hasKey('chatgpt')
  const anyApiKey    = claudeKey || chatgptKey
  const singleModel  = claudeKey && !chatgptKey ? 'claude' : !claudeKey && chatgptKey ? 'chatgpt' : null

  // Derived models list from mission
  const missionModels = (mission?.models_selected ?? []) as ModelName[]

  // Stage detection
  const stage = !mission ? 'input' : savedCount < 1 ? 'reasoning' : savedCount < 2 ? 'challenge' : !compComplete ? 'comparison' : !synthesis ? 'synthesis' : !approval ? 'approval' : 'complete'

  // Layer status helper
  function layerStatus(layer: SheetId): 'locked' | 'empty' | 'partial' | 'complete' {
    switch (layer) {
      case 'mission':    return !mission ? 'empty' : 'complete'
      case 'reasoning':  return !mission ? 'locked' : savedCount >= 1 ? 'complete' : 'empty'
      case 'challenge':  return savedCount < 1 ? 'locked' : savedCount >= 2 ? 'complete' : 'empty'
      case 'comparison': return savedCount < 2 ? 'locked' : compComplete ? 'complete' : 'partial'
      case 'synthesis':  return !compComplete ? 'locked' : synthesis ? 'complete' : 'empty'
      case 'approval':   return !synthesis ? 'locked' : approval ? 'complete' : 'empty'
      case 'memory':     return memoryCount > 0 ? 'complete' : 'empty'
      case 'actions':    return actions.length > 0 ? 'complete' : 'empty'
      case 'timeline':   return auditLogs.length > 0 ? 'complete' : 'empty'
    }
  }

  // Layer dot color
  function dotColor(s: ReturnType<typeof layerStatus>) {
    if (s === 'complete') return S.accent
    if (s === 'partial')  return '#fbbf24'
    if (s === 'locked')   return 'rgba(230,237,247,0.1)'
    return S.border
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, color: S.faint, fontSize: 15 }}>Loading…</div>
  )

  // ── Render ──────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .ws-btn:hover:not(:disabled) { opacity: 0.82; }
        .ws-layer:hover { border-color: rgba(230,237,247,0.12) !important; background: rgba(230,237,247,0.04) !important; cursor: pointer; }
        .ws-comp-header:hover { background: rgba(230,237,247,0.03) !important; }
        .ws-exch:hover { border-color: rgba(197,162,111,0.2) !important; }
        .ws-rev:hover:not(:disabled) { background: rgba(197,162,111,0.1) !important; border-color: rgba(197,162,111,0.3) !important; }
        textarea { font-family: inherit; }
      `}</style>

      <div style={{ display: 'flex', flex: 1, minHeight: 0, position: 'relative', fontFamily: 'system-ui, -apple-system, sans-serif', color: S.text }}>

        {/* ── CENTER WORKSPACE ───────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: isMobile ? '20px 16px 120px' : '28px 28px 60px', minWidth: 0 }}>

          {/* ── PRINCIPAL INPUT ──────────────────────────────── */}
          <div style={{ marginBottom: 28 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: S.accent, margin: '0 0 8px' }}>
              Principal Input
            </p>
            <textarea
              value={principalInput}
              onChange={e => setPrincipalInput(e.target.value)}
              placeholder={'What are you reasoning about?\n\nPaste messy input, notes, rough thoughts, or questions. The system will extract a structured mission brief.'}
              rows={5}
              style={{ ...INPUT_STYLE, marginBottom: 10 }}
            />
            {/* Attachments */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <input ref={fileRef} type="file" accept={ACCEPTED_MIME} multiple style={{ display: 'none' }} onChange={e => void handleFiles(e.target.files)} />
              <button onClick={() => fileRef.current?.click()} style={{ ...BTN_GHOST, fontSize: 13, height: 36 }}>
                ↑ Attach files
              </button>
              {attachments.map(a => (
                <div key={a.name} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'rgba(197,162,111,0.06)', border: '1px solid rgba(197,162,111,0.2)', borderRadius: 20, fontSize: 12, color: 'rgba(197,162,111,0.8)' }}>
                  <span style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: 10 }}>{a.type}</span>
                  <span>{a.name}</span>
                  <button onClick={() => { const n = attachments.filter(x => x.name !== a.name); setAttachments(n); saveAttachments(sessionId, n) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(197,162,111,0.4)', fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
                </div>
              ))}
            </div>
            {attachError && <p style={{ fontSize: 13, color: '#f87171', marginTop: 6 }}>{attachError}</p>}

            {/* Extract button */}
            <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                onClick={() => void extractMission()}
                disabled={extracting || !principalInput.trim()}
                className="ws-btn"
                style={{ ...BTN_GOLD, opacity: extracting || !principalInput.trim() ? 0.4 : 1, cursor: extracting || !principalInput.trim() ? 'not-allowed' : 'pointer' }}
              >
                {extracting ? '⟳ Extracting…' : '⚡ Extract Mission Brief'}
              </button>
              {mission && (
                <button onClick={() => setOpenSheet('mission')} style={{ ...BTN_GHOST, fontSize: 13, height: 36 }}>
                  Edit mission →
                </button>
              )}
              {!anyApiKey && (
                <span style={{ fontSize: 13, color: 'rgba(197,162,111,0.5)' }}>
                  → Load a key in <a href="/keys" style={{ color: S.accent, textDecoration: 'none' }}>BYOK Gate</a> to enable auto-extraction
                </span>
              )}
            </div>
            {extractError && <p style={{ fontSize: 13, color: '#f87171', marginTop: 8 }}>{extractError}</p>}
          </div>

          {/* ── MISSION DRAFT CARD ───────────────────────────── */}
          {missionDraft && (
            <div style={{ marginBottom: 28, border: `1px solid rgba(197,162,111,0.3)`, borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(197,162,111,0.06)', borderBottom: '1px solid rgba(197,162,111,0.15)' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: S.accent, margin: 0 }}>⚡ Extracted Mission Brief — review and confirm</p>
                <button onClick={() => setMissionDraft(null)} style={{ fontSize: 20, lineHeight: 1, color: S.faint, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}>×</button>
              </div>
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label style={LABEL}>Title</label>
                <input value={missionDraft.title} onChange={e => setMissionDraft(d => d && ({ ...d, title: e.target.value }))} style={{ ...INPUT_STYLE, marginBottom: 0 }} />
                <label style={LABEL}>Objective</label>
                <textarea value={missionDraft.objective} onChange={e => setMissionDraft(d => d && ({ ...d, objective: e.target.value }))} rows={3} style={INPUT_STYLE} />
                <label style={LABEL}>Context</label>
                <textarea value={missionDraft.context} onChange={e => setMissionDraft(d => d && ({ ...d, context: e.target.value }))} rows={2} style={INPUT_STYLE} />
                <label style={LABEL}>Constraints</label>
                <textarea value={missionDraft.constraints} onChange={e => setMissionDraft(d => d && ({ ...d, constraints: e.target.value }))} rows={2} style={INPUT_STYLE} />
                <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                  <button onClick={() => void confirmMission()} disabled={savingMission} className="ws-btn" style={{ ...BTN_GOLD, opacity: savingMission ? 0.5 : 1 }}>
                    {savingMission ? 'Saving…' : '✓ Confirm Mission Brief'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── STAGE CONTENT ────────────────────────────────── */}

          {/* REASONING */}
          {(stage === 'reasoning' || stage === 'challenge') && mission && missionModels.length > 0 && (
            <StageCard label={stage === 'reasoning' ? 'Layer 4 — Reasoning' : 'Layer 5 — Challenge'} accent={stage === 'reasoning'}>
              {/* Single-model notice */}
              {singleModel && stage === 'challenge' && (
                <div style={{ padding: '8px 12px', background: 'rgba(197,162,111,0.06)', border: '1px solid rgba(197,162,111,0.2)', borderRadius: 8, marginBottom: 14, fontSize: 13, color: 'rgba(197,162,111,0.7)' }}>
                  Single-model mode — {MODEL_META[singleModel].label} will challenge itself with an adversarial role prompt.
                </div>
              )}

              {missionModels.filter(model => stage === 'reasoning' ? true : stage === 'challenge' ? savedOutputs.length > 0 : false).map((model, idx) => {
                const draft   = outputDrafts[model] ?? { prompt: '', output: '', running: false, saving: false, saved: false, error: null }
                const isApi   = API_MODELS.has(model)
                const keyOk   = isApi && hasKey(model)
                const genPr   = stage === 'reasoning' ? genReasoning : genChallenge
                const setGenPr = stage === 'reasoning' ? setGenReasoning : setGenChallenge
                // For single-model challenge mode, use the same model
                const isSelfChallenge = stage === 'challenge' && singleModel === model && savedOutputs.some(o => o.model_name === model)

                if (stage === 'challenge' && !isSelfChallenge && savedOutputs.some(o => o.model_name === model) && savedOutputs.length < 2) return null // skip already-saved reasoning model in challenge stage if it's not self-challenge

                return (
                  <div key={`${model}-${idx}`} style={{ border: `1px solid ${S.border}`, borderRadius: 10, overflow: 'hidden', marginBottom: idx < missionModels.length - 1 ? 12 : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: `1px solid ${S.border}` }}>
                      <div>
                        <span style={{ fontSize: 14, fontWeight: 600, color: draft.saved ? S.accent : S.text }}>{MODEL_META[model].label}</span>
                        {isSelfChallenge && <span style={{ fontSize: 11, color: 'rgba(197,162,111,0.5)', marginLeft: 8 }}>self-challenge</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {draft.saved && <span style={{ fontSize: 11, color: S.accent, background: 'rgba(197,162,111,0.1)', padding: '2px 8px', borderRadius: 4 }}>✓ saved</span>}
                        {isApi && keyOk && <span style={{ fontSize: 11, color: S.faint, background: 'rgba(230,237,247,0.04)', padding: '2px 8px', borderRadius: 4 }}>key ready</span>}
                        {isApi && !keyOk && (
                          <button onClick={() => setKeyVisible(p => ({ ...p, [model]: !p[model] }))} style={{ fontSize: 11, color: S.faint, background: 'none', border: `1px solid ${S.border}`, borderRadius: 4, padding: '2px 8px', cursor: 'pointer' }}>
                            {keyVisible[model] ? '× Cancel' : 'Load key'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Inline key entry */}
                    {isApi && !keyOk && keyVisible[model] && (
                      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${S.border}`, display: 'flex', gap: 8 }}>
                        <input type="password" value={keyInputs[model] ?? ''} onChange={e => setKeyInputs(p => ({ ...p, [model]: e.target.value }))} onKeyDown={e => e.key === 'Enter' && loadModelKey(model)} placeholder={model === 'claude' ? 'sk-ant-…' : 'sk-…'} style={{ ...INPUT_STYLE, fontFamily: 'monospace', fontSize: 13, minHeight: 40, padding: '8px 12px', flex: 1, marginBottom: 0 }} />
                        <button onClick={() => loadModelKey(model)} style={{ ...BTN_GHOST, height: 40, flexShrink: 0 }}>Load</button>
                      </div>
                    )}

                    <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {/* Generated prompt area */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <label style={LABEL}>{stage === 'reasoning' ? 'Reasoning Prompt' : 'Challenge Prompt'}</label>
                          {claudeKey && (
                            <button onClick={() => void generatePrompt(stage === 'reasoning' ? 'reasoning' : 'challenge')} disabled={generatingPrompt !== null} style={{ fontSize: 12, color: S.accent, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}>
                              {generatingPrompt === (stage === 'reasoning' ? 'reasoning' : 'challenge') ? '⟳ Generating…' : '✦ Generate'}
                            </button>
                          )}
                        </div>
                        <textarea
                          value={idx === 0 ? genPr : (stage === 'reasoning' ? genReasoning : genChallenge)}
                          onChange={e => idx === 0 ? setGenPr(e.target.value) : (stage === 'reasoning' ? setGenReasoning(e.target.value) : setGenChallenge(e.target.value))}
                          placeholder={stage === 'reasoning' ? 'Reasoning prompt — edit or generate above' : 'Challenge prompt — adversarial by nature'}
                          rows={3}
                          style={{ ...INPUT_STYLE }}
                        />
                        {/* Sync generated prompt to output draft when it changes */}
                      </div>

                      {/* Use generated prompt */}
                      {(idx === 0 ? genPr : stage === 'reasoning' ? genReasoning : genChallenge) && (
                        <button
                          onClick={() => { const p = idx === 0 ? genPr : (stage === 'reasoning' ? genReasoning : genChallenge); setOutputDrafts(prev => ({ ...prev, [model]: { ...(prev[model] ?? { prompt: '', output: '', running: false, saving: false, saved: false, error: null }), prompt: p } })) }}
                          style={{ fontSize: 13, color: S.accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}
                        >
                          ↓ Use this prompt →
                        </button>
                      )}

                      {/* Prompt textarea (the actual one sent to model) */}
                      <div>
                        <label style={LABEL}>Prompt to send</label>
                        <textarea
                          value={draft.prompt}
                          onChange={e => setOutputDrafts(p => ({ ...p, [model]: { ...p[model]!, prompt: e.target.value, saved: false } }))}
                          placeholder="Paste or write the prompt to send to this model…"
                          rows={3}
                          style={INPUT_STYLE}
                        />
                      </div>

                      {/* Run button */}
                      {isApi && keyOk && (
                        <button onClick={() => void runModel(model)} disabled={draft.running || !draft.prompt.trim()} className="ws-btn" style={{ height: 44, background: 'rgba(197,162,111,0.08)', border: '1px solid rgba(197,162,111,0.25)', borderRadius: 8, fontSize: 15, fontWeight: 600, color: draft.running || !draft.prompt.trim() ? S.faint : S.accent, cursor: draft.running || !draft.prompt.trim() ? 'not-allowed' : 'pointer', opacity: draft.running || !draft.prompt.trim() ? 0.5 : 1 }}>
                          {draft.running ? `Running ${MODEL_META[model].label}…` : `▶ Run ${MODEL_META[model].label}`}
                        </button>
                      )}

                      {draft.error && <p style={{ fontSize: 13, color: '#f87171' }}>{draft.error}</p>}

                      {/* Output */}
                      <div>
                        <label style={LABEL}>Output (review + edit before saving)</label>
                        <textarea
                          value={draft.output}
                          onChange={e => setOutputDrafts(p => ({ ...p, [model]: { ...p[model]!, output: e.target.value, saved: false } }))}
                          placeholder={draft.running ? 'Running…' : isApi ? `${MODEL_META[model].label} output appears here after running, or paste manually` : `Paste ${MODEL_META[model].label}'s response here`}
                          rows={6}
                          style={{ ...INPUT_STYLE, color: S.text }}
                        />
                      </div>

                      <button onClick={() => void saveOutput(model)} disabled={!draft.output.trim() || draft.saving || draft.running} className="ws-btn" style={{ ...BTN_GHOST, opacity: !draft.output.trim() || draft.saving || draft.running ? 0.4 : 1, cursor: !draft.output.trim() || draft.saving || draft.running ? 'not-allowed' : 'pointer' }}>
                        {draft.saving ? 'Saving…' : draft.saved ? '↺ Update' : '✓ Save Output'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </StageCard>
          )}

          {/* COMPARISON */}
          {stage === 'comparison' && (
            <StageCard label="Layer 6 — Comparison">
              <button onClick={() => void autoFill()} disabled={autofilling || outputs.length < 2} className="ws-btn" style={{ width: '100%', height: 48, background: autofilling ? 'rgba(197,162,111,0.08)' : S.accent, color: autofilling ? S.accent : '#05070B', border: autofilling ? '1px solid rgba(197,162,111,0.3)' : 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: autofilling || outputs.length < 2 ? 'not-allowed' : 'pointer', opacity: outputs.length < 2 ? 0.4 : 1, marginBottom: 12 }}>
                {autofilling ? '⟳ Analyzing with Claude…' : '⚡ Auto-fill Comparison'}
              </button>
              {autofillErr && <p style={{ fontSize: 13, color: '#f87171', marginBottom: 12 }}>{autofillErr}</p>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 16 }}>
                {COMP_FIELDS.map(field => {
                  const isOpen = compOpen === field.key
                  const isEmpty = !compForm[field.key].trim()
                  return (
                    <div key={field.key} style={{ border: `1px solid ${isOpen ? 'rgba(197,162,111,0.2)' : S.border}`, borderRadius: 8, overflow: 'hidden', background: isOpen ? 'rgba(197,162,111,0.02)' : S.panel }}>
                      <button className="ws-comp-header" onClick={() => setCompOpen(isOpen ? null : field.key)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', minHeight: 48 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {!isEmpty && <span style={{ fontSize: 11, color: S.accent }}>✓</span>}
                          <span style={{ fontSize: 14, fontWeight: isOpen ? 600 : 400, color: isOpen ? S.text : S.muted }}>{field.label}</span>
                          {!isOpen && !isEmpty && <span style={{ fontSize: 13, color: S.faint }}>{compForm[field.key].slice(0, 55)}{compForm[field.key].length > 55 ? '…' : ''}</span>}
                          {!isOpen && isEmpty && <span style={{ fontSize: 13, color: 'rgba(230,237,247,0.2)' }}>{field.hint}</span>}
                        </div>
                        <span style={{ fontSize: 14, color: S.faint, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease', flexShrink: 0 }}>↓</span>
                      </button>
                      {isOpen && (
                        <div style={{ padding: '0 14px 14px' }}>
                          <textarea value={compForm[field.key]} onChange={e => setCompForm(f => ({ ...f, [field.key]: e.target.value }))} placeholder={field.hint} autoFocus rows={4} style={INPUT_STYLE} />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => void saveComparison(false)} disabled={savingComp} style={{ ...BTN_GHOST }}>Save Draft</button>
                <button onClick={() => void saveComparison(true)} disabled={savingComp} className="ws-btn" style={{ ...BTN_GOLD, opacity: savingComp ? 0.5 : 1 }}>Mark Complete →</button>
              </div>
            </StageCard>
          )}

          {/* SYNTHESIS */}
          {stage === 'synthesis' && (
            <StageCard label="Layer 7 — Synthesis">
              {/* Revision commands */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                {REVISION_COMMANDS.map(cmd => (
                  <button key={cmd.label} onClick={() => void reviseSynthesis(cmd.instruction)} disabled={!synthText.trim() || revisingWith !== null || !claudeKey} className="ws-rev" style={{ padding: '6px 12px', fontSize: 13, color: S.muted, background: 'transparent', border: `1px solid ${S.border}`, borderRadius: 20, cursor: !synthText.trim() || !claudeKey ? 'not-allowed' : 'pointer', opacity: !synthText.trim() || !claudeKey ? 0.4 : 1, transition: 'all 0.12s ease', whiteSpace: 'nowrap' }}>
                    {revisingWith && revisingWith === cmd.instruction.slice(0, 20) ? '⟳ Revising…' : cmd.label}
                  </button>
                ))}
              </div>
              <label style={LABEL}>Synthesis</label>
              <textarea value={synthText} onChange={e => setSynthText(e.target.value)} placeholder="Consolidated judgment from model outputs. Preserve uncertainty." rows={8} style={{ ...INPUT_STYLE, marginBottom: 12 }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={LABEL}>Confidence</label>
                  <select value={synthConf} onChange={e => setSynthConf(e.target.value as ConfidenceLevel)} style={SELECT_STYLE}>
                    <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label style={LABEL}>Recommended Action</label>
                  <input value={synthAction} onChange={e => setSynthAction(e.target.value)} placeholder="Optional" style={{ ...INPUT_STYLE, marginBottom: 0 }} />
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={LABEL}>Uncertainty Flags <span style={{ color: 'rgba(230,237,247,0.2)', fontSize: 10 }}>never erased</span></label>
                <textarea value={synthFlags} onChange={e => setSynthFlags(e.target.value)} placeholder="What remains unresolved?" rows={2} style={INPUT_STYLE} />
              </div>
              <button onClick={() => void saveSynthesis()} disabled={savingSynth || !synthText.trim()} className="ws-btn" style={{ ...BTN_GOLD, opacity: savingSynth || !synthText.trim() ? 0.4 : 1 }}>
                {savingSynth ? 'Saving…' : synthesis ? 'Update Synthesis' : 'Save Synthesis'}
              </button>
            </StageCard>
          )}

          {/* APPROVAL */}
          {stage === 'approval' && synthesis && !approval && (
            <StageCard label="Layer 8 — Approval">
              <div style={{ padding: '10px 14px', background: S.panel, border: `1px solid ${S.border}`, borderRadius: 8, marginBottom: 16, fontSize: 14, color: S.muted, lineHeight: 1.6 }}>
                <p style={{ fontSize: 11, color: S.faint, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Synthesis</p>
                {synthesis.synthesis_text.slice(0, 200)}{synthesis.synthesis_text.length > 200 ? '…' : ''}
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                {(['approve', 'revise', 'reject', 'escalate'] as ApprovalDecision[]).map(d => (
                  <button key={d} onClick={() => setApDecision(d)} style={{ padding: '8px 16px', borderRadius: 8, fontSize: 14, border: `1px solid ${apDecision === d ? (d === 'approve' ? 'rgba(197,162,111,0.8)' : d === 'reject' ? 'rgba(248,113,113,0.6)' : 'rgba(230,237,247,0.3)') : S.border}`, background: apDecision === d ? (d === 'approve' ? 'rgba(197,162,111,0.15)' : d === 'reject' ? 'rgba(248,113,113,0.1)' : 'rgba(230,237,247,0.05)') : 'transparent', color: apDecision === d ? (d === 'approve' ? S.accent : d === 'reject' ? '#f87171' : S.text) : S.faint, cursor: 'pointer', textTransform: 'capitalize', fontWeight: apDecision === d ? 600 : 400 }}>
                    {d}
                  </button>
                ))}
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={LABEL}>Authority Level</label>
                <select value={apAuthority} onChange={e => setApAuthority(e.target.value as AuthorityLevel)} style={SELECT_STYLE}>
                  {(Object.entries(AUTHORITY_LEVELS) as [AuthorityLevel, typeof AUTHORITY_LEVELS[AuthorityLevel]][]).map(([l, m]) => <option key={l} value={l}>{m.label}</option>)}
                </select>
                {apAuthority === 'R4' && <p style={{ fontSize: 13, color: '#f87171', marginTop: 6 }}>⚠ Founder — external, irreversible, or financial. This is your explicit authorisation.</p>}
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={LABEL}>Notes</label>
                <textarea value={apNotes} onChange={e => setApNotes(e.target.value)} placeholder="Reasoning, conditions, or caveats" rows={2} style={INPUT_STYLE} />
              </div>
              <button onClick={() => void recordApproval()} disabled={savingAp} className="ws-btn" style={{ ...BTN_GOLD, opacity: savingAp ? 0.5 : 1 }}>
                {savingAp ? 'Recording…' : 'Record Decision'}
              </button>
            </StageCard>
          )}

          {/* COMPLETE */}
          {stage === 'complete' && approval && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ padding: '12px 16px', background: 'rgba(197,162,111,0.08)', border: '1px solid rgba(197,162,111,0.3)', borderRadius: 10, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 18 }}>✓</span>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: S.accent, margin: 0 }}>Approved — {AUTHORITY_LEVELS[approval.authority_level].label}</p>
                  {approval.notes && <p style={{ fontSize: 13, color: S.faint, margin: '3px 0 0' }}>{approval.notes}</p>}
                </div>
              </div>
              {/* Create action */}
              <StageCard label="Actions">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                  <input value={actTitle} onChange={e => setActTitle(e.target.value)} placeholder="Action title" style={{ ...INPUT_STYLE, marginBottom: 0 }} />
                  <textarea value={actDesc} onChange={e => setActDesc(e.target.value)} placeholder="Description (optional)" rows={2} style={INPUT_STYLE} />
                  <select value={actAuth} onChange={e => setActAuth(e.target.value as AuthorityLevel)} style={SELECT_STYLE}>
                    {(Object.keys(AUTHORITY_LEVELS) as AuthorityLevel[]).map(l => <option key={l} value={l}>{AUTHORITY_LEVELS[l].label}</option>)}
                  </select>
                  <button onClick={() => void createAction()} disabled={creatingAct || !actTitle.trim()} className="ws-btn" style={{ ...BTN_GHOST, opacity: creatingAct || !actTitle.trim() ? 0.4 : 1 }}>
                    {creatingAct ? 'Creating…' : '+ Create Action'}
                  </button>
                </div>
                {actions.length > 0 && actions.map(a => (
                  <div key={a.id} style={{ padding: '10px 12px', border: `1px solid ${S.border}`, borderRadius: 8, marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14, color: S.text, fontWeight: 500 }}>{a.title}</span>
                      <span style={{ fontSize: 11, color: S.faint, background: S.panel, padding: '2px 7px', borderRadius: 10 }}>{AUTHORITY_LEVELS[a.authority_level].short}</span>
                      <span style={{ fontSize: 11, color: S.faint, background: S.panel, padding: '2px 7px', borderRadius: 10 }}>{a.status}</span>
                    </div>
                    {a.description && <p style={{ fontSize: 13, color: S.faint, margin: '4px 0 0' }}>{a.description}</p>}
                  </div>
                ))}
              </StageCard>
              {/* Memory */}
              <div style={{ marginTop: 16 }}>
                <MemoryCapture sessionId={sessionId} synthesisId={synthesis?.id ?? null} content={synthesis?.synthesis_text ?? ''} defaultClassification="canon" defaultTags={extractKeywords(synthesis?.recommended_action || synthesis?.synthesis_text || '', 4)} buttonLabel="Write to Memory" />
              </div>
            </div>
          )}

          {/* ── EXCHANGE THREAD ──────────────────────────────── */}
          {savedCount > 0 && (
            <div style={{ marginTop: 32, borderTop: `1px solid ${S.border}`, paddingTop: 24 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: S.accent, margin: '0 0 14px' }}>
                Live Exchange
              </p>
              {exchange.length === 0 && (
                <p style={{ fontSize: 14, color: 'rgba(230,237,247,0.2)', marginBottom: 14 }}>Ask a follow-up, request clarification, or correct the direction.</p>
              )}
              <div ref={exchRef} style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16, maxHeight: 320, overflowY: 'auto' }}>
                {exchange.map((msg, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'principal' ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth: '80%', padding: '10px 14px', background: msg.role === 'principal' ? 'rgba(197,162,111,0.1)' : S.panel, border: `1px solid ${msg.role === 'principal' ? 'rgba(197,162,111,0.25)' : S.border}`, borderRadius: 10, fontSize: 14, color: S.text, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      {msg.content}
                    </div>
                    <p style={{ fontSize: 11, color: S.faint, margin: '3px 6px 0' }}>{msg.role === 'principal' ? 'You' : (msg.model ? MODEL_META[msg.model].label : 'Model')}</p>
                  </div>
                ))}
                {exchRunning && <div style={{ padding: '10px 14px', background: S.panel, border: `1px solid ${S.border}`, borderRadius: 10, fontSize: 14, color: S.faint }}>⟳ Thinking…</div>}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <select value={exchModel} onChange={e => setExchModel(e.target.value as ModelName)} style={{ ...SELECT_STYLE, width: 130, flexShrink: 0 }}>
                  {(['claude', 'chatgpt'] as ModelName[]).map(m => <option key={m} value={m}>{MODEL_META[m].label}</option>)}
                </select>
                <textarea value={exchInput} onChange={e => setExchInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void sendExchange() } }} placeholder="Ask a follow-up… (Enter to send)" rows={2} style={{ ...INPUT_STYLE, flex: 1, marginBottom: 0 }} />
                <button onClick={() => void sendExchange()} disabled={exchRunning || !exchInput.trim() || !hasKey(exchModel)} className="ws-btn" style={{ ...BTN_GHOST, flexShrink: 0, height: 'auto', opacity: exchRunning || !exchInput.trim() || !hasKey(exchModel) ? 0.4 : 1 }}>Send</button>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT LAYER STACK ────────────────────────────── */}
        {!isMobile && (
          <div style={{ width: 280, borderLeft: `1px solid ${S.border}`, padding: '20px 0', overflowY: 'auto', flexShrink: 0 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: S.accent, padding: '0 16px', marginBottom: 12 }}>
              Layer Stack
            </p>
            {([
              { id: 'mission',    label: 'Mission Brief',     num: 3 },
              { id: 'reasoning',  label: 'Reasoning',         num: 4 },
              { id: 'challenge',  label: 'Challenge',         num: 5 },
              { id: 'comparison', label: 'Comparison',        num: 6 },
              { id: 'synthesis',  label: 'Synthesis',         num: 7 },
              { id: 'approval',   label: 'Approval',          num: 8 },
              { id: 'memory',     label: 'Memory',            num: 9 },
              { id: 'actions',    label: 'Actions',           num: '' },
              { id: 'timeline',   label: 'Timeline',          num: 10 },
            ] as { id: SheetId; label: string; num: number | string }[]).map(item => {
              const status = layerStatus(item.id)
              const isLocked = status === 'locked'
              const summary =
                item.id === 'mission'    ? (mission?.title ?? null) :
                item.id === 'reasoning'  ? (savedCount >= 1 ? `${savedCount} output${savedCount > 1 ? 's' : ''} saved` : null) :
                item.id === 'challenge'  ? (savedCount >= 2 ? `${savedCount} outputs` : null) :
                item.id === 'comparison' ? (compComplete ? 'Complete' : comparison ? 'Draft' : null) :
                item.id === 'synthesis'  ? (synthesis ? `${synthConf} confidence` : null) :
                item.id === 'approval'   ? (approval ? `${approval.decision}` : null) :
                item.id === 'memory'     ? (memoryCount > 0 ? `${memoryCount} item${memoryCount > 1 ? 's' : ''}` : null) :
                item.id === 'actions'    ? (actions.length > 0 ? `${actions.length} action${actions.length > 1 ? 's' : ''}` : null) :
                item.id === 'timeline'   ? (auditLogs.length > 0 ? `${auditLogs.length} events` : null) : null

              return (
                <div
                  key={item.id}
                  className={isLocked ? '' : 'ws-layer'}
                  onClick={isLocked ? undefined : () => setOpenSheet(item.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
                    border: `1px solid transparent`, borderRadius: 8, margin: '0 8px 2px',
                    cursor: isLocked ? 'default' : 'pointer', transition: 'all 0.12s ease',
                    opacity: isLocked ? 0.35 : 1,
                  }}
                >
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor(status), flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: status === 'complete' ? S.text : S.muted, margin: 0 }}>
                      {item.num && <span style={{ fontSize: 10, color: S.faint, marginRight: 4 }}>{item.num}</span>}
                      {item.label}
                    </p>
                    {summary && <p style={{ fontSize: 11, color: S.faint, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{summary}</p>}
                  </div>
                  {!isLocked && <span style={{ fontSize: 12, color: 'rgba(230,237,247,0.2)', flexShrink: 0 }}>→</span>}
                </div>
              )
            })}
          </div>
        )}

        {/* ── MOBILE LAYER TOGGLE ──────────────────────────── */}
        {isMobile && (
          <button onClick={() => setOpenSheet('timeline')} style={{ position: 'fixed', bottom: 80, right: 16, width: 44, height: 44, borderRadius: '50%', background: S.card, border: `1px solid ${S.border}`, color: S.faint, fontSize: 18, cursor: 'pointer', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>☰</button>
        )}

        {/* ── FOCUS SHEET OVERLAY ──────────────────────────── */}
        {openSheet && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(5,7,11,0.97)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Sheet header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: `1px solid ${S.border}`, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor(layerStatus(openSheet)) }} />
                <p style={{ fontSize: 16, fontWeight: 600, color: S.text, margin: 0, textTransform: 'capitalize' }}>{openSheet.replace('-', ' ')}</p>
              </div>
              <button onClick={() => setOpenSheet(null)} style={{ fontSize: 24, lineHeight: 1, color: S.faint, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 8px' }}>×</button>
            </div>
            {/* Sheet body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 60px' }}>
              {openSheet === 'mission' && (
                <div>
                  <p style={{ fontSize: 11, color: S.faint, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16 }}>Mission Brief</p>
                  {mission ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {[
                        { key: 'title', label: 'Title', value: mission.title },
                        { key: 'objective', label: 'Objective', value: mission.objective },
                        { key: 'context', label: 'Context', value: mission.context ?? '' },
                        { key: 'constraints', label: 'Constraints', value: mission.constraints ?? '' },
                      ].map(f => (
                        <div key={f.key}><label style={LABEL}>{f.label}</label><p style={{ fontSize: 15, color: S.text, lineHeight: 1.6, margin: 0 }}>{f.value || <span style={{ color: S.faint }}>—</span>}</p></div>
                      ))}
                      <div><label style={LABEL}>Models</label><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{(mission.models_selected as ModelName[]).map(m => <span key={m} style={{ fontSize: 13, padding: '4px 10px', background: 'rgba(197,162,111,0.08)', border: '1px solid rgba(197,162,111,0.2)', borderRadius: 20, color: S.accent }}>{MODEL_META[m].label}</span>)}</div></div>
                    </div>
                  ) : <p style={{ color: S.faint, fontSize: 15 }}>No mission yet. Use Principal Input to extract or create one.</p>}
                </div>
              )}

              {(openSheet === 'reasoning' || openSheet === 'challenge') && (
                <div>
                  {savedOutputs.filter(o => openSheet === 'reasoning' ? true : savedOutputs.indexOf(o) > 0 || savedOutputs.length < 2).map(o => (
                    <div key={o.id} style={{ marginBottom: 24 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: S.accent, margin: '0 0 10px' }}>{MODEL_META[o.model_name as ModelName]?.label ?? o.model_name}</p>
                      {o.input_prompt && <div style={{ marginBottom: 12, padding: '10px 14px', background: S.panel, border: `1px solid ${S.border}`, borderRadius: 8 }}><p style={{ fontSize: 11, color: S.faint, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Prompt</p><p style={{ fontSize: 14, color: S.muted, lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>{o.input_prompt}</p></div>}
                      <pre style={{ fontSize: 15, color: S.text, lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0, fontFamily: 'inherit' }}>{o.raw_output}</pre>
                    </div>
                  ))}
                  {savedOutputs.length === 0 && <p style={{ color: S.faint, fontSize: 15 }}>No outputs saved yet.</p>}
                </div>
              )}

              {openSheet === 'comparison' && (
                <div>
                  {COMP_FIELDS.map(f => (
                    <div key={f.key} style={{ marginBottom: 20 }}>
                      <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: S.accent, margin: '0 0 8px' }}>{f.label}</p>
                      <p style={{ fontSize: 15, color: compForm[f.key] ? S.text : S.faint, lineHeight: 1.6, margin: 0 }}>{compForm[f.key] || f.hint}</p>
                    </div>
                  ))}
                </div>
              )}

              {openSheet === 'synthesis' && (
                <div>
                  {synthesis ? (
                    <div>
                      <p style={{ fontSize: 15, color: S.text, lineHeight: 1.7, whiteSpace: 'pre-wrap', marginBottom: 16 }}>{synthesis.synthesis_text}</p>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                        <span style={{ fontSize: 13, color: S.faint }}>Confidence: {synthesis.confidence_level}</span>
                        {synthesis.recommended_action && <span style={{ fontSize: 13, color: S.accent }}>→ {synthesis.recommended_action}</span>}
                      </div>
                      {synthesis.uncertainty_flags && <div style={{ padding: '10px 14px', background: S.panel, border: `1px solid ${S.border}`, borderRadius: 8 }}><p style={{ fontSize: 11, color: S.faint, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Uncertainty Flags</p><p style={{ fontSize: 14, color: S.muted, margin: 0 }}>{synthesis.uncertainty_flags}</p></div>}
                    </div>
                  ) : <p style={{ color: S.faint, fontSize: 15 }}>No synthesis yet.</p>}
                </div>
              )}

              {openSheet === 'approval' && (
                <div>
                  {approval ? (
                    <div style={{ padding: '16px', background: isApproved ? 'rgba(197,162,111,0.08)' : S.panel, border: `1px solid ${isApproved ? 'rgba(197,162,111,0.3)' : S.border}`, borderRadius: 10 }}>
                      <p style={{ fontSize: 15, fontWeight: 600, color: isApproved ? S.accent : S.text, margin: '0 0 8px', textTransform: 'capitalize' }}>{approval.decision} · {AUTHORITY_LEVELS[approval.authority_level].label}</p>
                      {approval.notes && <p style={{ fontSize: 14, color: S.muted, margin: 0 }}>{approval.notes}</p>}
                    </div>
                  ) : (
                    synthesis ? <p style={{ color: S.faint, fontSize: 15 }}>Synthesis saved. Return to workspace to record your decision.</p>
                    : <p style={{ color: S.faint, fontSize: 15 }}>Complete synthesis first.</p>
                  )}
                </div>
              )}

              {openSheet === 'memory' && (
                <div>
                  {isApproved ? (
                    <MemoryCapture sessionId={sessionId} synthesisId={synthesis?.id ?? null} content={synthesis?.synthesis_text ?? ''} defaultClassification="canon" defaultTags={extractKeywords(synthesis?.recommended_action || synthesis?.synthesis_text || '', 4)} buttonLabel="Write to Memory" />
                  ) : (
                    <p style={{ color: S.faint, fontSize: 15 }}>Approval required before canonical memory can be written.</p>
                  )}
                  {memoryCount > 0 && <p style={{ fontSize: 14, color: S.muted, marginTop: 20 }}>{memoryCount} memory item{memoryCount > 1 ? 's' : ''} exist for this session.</p>}
                </div>
              )}

              {openSheet === 'actions' && (
                <div>
                  {actions.length === 0 ? <p style={{ color: S.faint, fontSize: 15 }}>No actions created yet.</p> : actions.map(a => (
                    <div key={a.id} style={{ padding: '12px 14px', border: `1px solid ${S.border}`, borderRadius: 8, marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: S.text }}>{a.title}</span>
                        <span style={{ fontSize: 11, color: S.faint, background: S.panel, padding: '2px 7px', borderRadius: 10 }}>{AUTHORITY_LEVELS[a.authority_level].short}</span>
                        <span style={{ fontSize: 11, color: a.status === 'complete' ? S.accent : S.faint, background: S.panel, padding: '2px 7px', borderRadius: 10 }}>{a.status}</span>
                      </div>
                      {a.description && <p style={{ fontSize: 13, color: S.faint, margin: 0 }}>{a.description}</p>}
                    </div>
                  ))}
                </div>
              )}

              {openSheet === 'timeline' && (
                <div>
                  {auditLogs.length === 0 ? <p style={{ color: S.faint, fontSize: 15 }}>No events yet.</p> : auditLogs.map((log, i) => (
                    <div key={log.id} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: i < auditLogs.length - 1 ? `1px solid ${S.border}` : 'none' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(197,162,111,0.4)', flexShrink: 0, marginTop: 6 }} />
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 500, color: S.text, margin: 0 }}>{log.event_type.replace(/_/g, ' ').toLowerCase()}</p>
                        <p style={{ fontSize: 11, color: S.faint, margin: '3px 0 0', fontVariantNumeric: 'tabular-nums' }}>{new Date(log.logged_at).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// ── Sub-components ─────────────────────────────────────────────────

function StageCard({ label, accent = false, children }: { label: string; accent?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28, border: `1px solid ${accent ? 'rgba(197,162,111,0.2)' : 'rgba(230,237,247,0.07)'}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '10px 16px', background: accent ? 'rgba(197,162,111,0.04)' : 'rgba(230,237,247,0.02)', borderBottom: `1px solid ${accent ? 'rgba(197,162,111,0.15)' : 'rgba(230,237,247,0.07)'}` }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: accent ? '#C5A26F' : 'rgba(230,237,247,0.4)', margin: 0 }}>{label}</p>
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  )
}
