'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { logEvent, assertR4HasApproval, AUDIT_EVENT, AUDIT_ENTITY } from '@/lib/mmcp/audit'
import { getKey, setKey, hasKey } from '@/lib/mmcp/keys'
import { loadAttachments, saveAttachments, fileToAttachment, ACCEPTED_MIME, type Attachment } from '@/lib/mmcp/attachments'
import { MemoryCapture, extractKeywords } from '@/components/mmcp/MemoryCapture'
import { FocusSheet } from '@/components/mmcp/FocusSheet'
import {
  MODEL_META, AUTHORITY_LEVELS,
  type ModelName, type MissionBrief, type ModelOutput, type OEPComparison,
  type Synthesis, type Approval, type Action, type AuditLog,
  type AuthorityLevel, type ApprovalDecision, type ConfidenceLevel,
} from '@/types/mmcp'

// ── Visual tokens ──────────────────────────────────────────────────
const T = {
  bg:     '#05070B',
  card:   '#08101A',
  rail:   '#060C14',
  text:   '#E6EDF7',
  accent: '#C5A26F',
  muted:  'rgba(230,237,247,0.5)',
  faint:  'rgba(230,237,247,0.22)',
  ghost:  'rgba(230,237,247,0.07)',
  border: 'rgba(230,237,247,0.07)',
} as const

// Shared input style (used inside sheets only)
const INP: CSSProperties = {
  width: '100%', background: 'rgba(230,237,247,0.04)',
  border: '1px solid rgba(230,237,247,0.09)', borderRadius: 8,
  padding: '10px 13px', fontSize: 15, color: T.text, outline: 'none',
  resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.6,
}
const SEL: CSSProperties = {
  background: '#0D1117', color: T.text, border: '1px solid rgba(230,237,247,0.14)',
  borderRadius: 7, padding: '9px 12px', fontSize: 14, cursor: 'pointer',
  appearance: 'none', WebkitAppearance: 'none', outline: 'none', width: '100%',
}
const LBL: CSSProperties = {
  display: 'block', fontSize: 10, textTransform: 'uppercase' as const,
  letterSpacing: '0.12em', color: 'rgba(230,237,247,0.28)', marginBottom: 6,
}
const BTN_GOLD: CSSProperties = {
  height: 44, padding: '0 22px', background: T.accent, color: '#05070B',
  border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer',
}
const BTN_GHOST: CSSProperties = {
  height: 40, padding: '0 16px', background: 'transparent',
  border: '1px solid rgba(230,237,247,0.12)', borderRadius: 8,
  fontSize: 14, color: T.faint, cursor: 'pointer',
}
const BTN_OUTLINE_GOLD: CSSProperties = {
  height: 40, padding: '0 16px', background: 'rgba(197,162,111,0.08)',
  border: '1px solid rgba(197,162,111,0.28)', borderRadius: 8,
  fontSize: 14, color: T.accent, cursor: 'pointer',
}

// ── Types ──────────────────────────────────────────────────────────
type Stage = 'input' | 'reasoning' | 'challenge' | 'comparison' | 'synthesis' | 'approval' | 'complete'
type SheetId = string // 'principal-input' | 'mission-extract' | 'model:{name}' | 'comp:{field}' | 'synthesis' | 'exchange' | 'approval' | 'actions' | 'memory' | 'timeline' | 'layer:{name}'

type CompField = 'convergence_notes' | 'divergence_notes' | 'blind_spots' | 'contradictions' | 'risk_notes' | 'missing_assumptions'

const COMP_FIELDS: { key: CompField; label: string; hint: string }[] = [
  { key: 'convergence_notes',   label: 'Convergence',         hint: 'Where all models agree' },
  { key: 'divergence_notes',    label: 'Divergence',          hint: 'Where models differ' },
  { key: 'blind_spots',         label: 'Blind Spots',         hint: 'What no model covered' },
  { key: 'contradictions',      label: 'Contradictions',      hint: 'Direct conflicts' },
  { key: 'risk_notes',          label: 'Risk Notes',          hint: 'Risks surfaced' },
  { key: 'missing_assumptions', label: 'Missing Assumptions', hint: 'Unnamed assumptions' },
]

interface OutputDraft {
  prompt: string; output: string; savedId?: string
  running: boolean; saving: boolean; saved: boolean; error: string | null; tokenCount?: number
}

interface MissionDraft {
  title: string; context: string; objective: string; constraints: string
  models_selected: ModelName[]; reasoning_prompt: string; challenge_prompt: string
}

interface ExchangeMsg { role: 'principal' | 'model'; model?: ModelName; content: string; ts: number }

const REVISION_COMMANDS = [
  { label: 'Sharpen',           instruction: 'Make this synthesis sharper and more direct. Remove hedging while keeping real uncertainty.' },
  { label: 'Make practical',    instruction: 'Rewrite to emphasise concrete, actionable conclusions. What should actually happen?' },
  { label: 'Expose risks',      instruction: 'Revise to surface hidden risks, second-order effects, and what could go wrong.' },
  { label: 'Challenge it',      instruction: 'Act as an adversary. Find what is wrong or missing in these conclusions.' },
  { label: 'Ask for revision',  instruction: 'Improve flow, resolve contradictions, and strengthen the recommended action.' },
]

const API_MODELS = new Set<ModelName>(['claude', 'chatgpt'])
const PROXY: Partial<Record<ModelName, string>> = { claude: '/api/mmcp/run/claude', chatgpt: '/api/mmcp/run/chatgpt' }

const STAGE_LABELS: Record<Stage, string> = {
  input: 'Principal Input', reasoning: 'Reasoning', challenge: 'Challenge',
  comparison: 'Comparison', synthesis: 'Synthesis', approval: 'Approval', complete: 'Complete',
}

// ── Component ──────────────────────────────────────────────────────
export default function SessionWorkspace() {
  const { id: sessionId } = useParams<{ id: string }>()
  const supabase  = createClient()
  const fileRef   = useRef<HTMLInputElement>(null)
  const exchRef   = useRef<HTMLDivElement>(null)

  // Persisted data
  const [mission,     setMission]     = useState<MissionBrief | null>(null)
  const [outputs,     setOutputs]     = useState<ModelOutput[]>([])
  const [comparison,  setComparison]  = useState<OEPComparison | null>(null)
  const [synthesis,   setSynthesis]   = useState<Synthesis | null>(null)
  const [approval,    setApproval]    = useState<Approval | null>(null)
  const [actions,     setActions]     = useState<Action[]>([])
  const [memoryCount, setMemoryCount] = useState(0)
  const [auditLogs,   setAuditLogs]   = useState<AuditLog[]>([])
  const [userId,      setUserId]      = useState<string | null>(null)
  const [loading,     setLoading]     = useState(true)

  // Principal Input
  const [principalInput, setPrincipalInput] = useState('')
  const [attachments,    setAttachments]    = useState<Attachment[]>([])
  const [attachError,    setAttachError]    = useState<string | null>(null)

  // Mission extraction
  const [missionDraft,  setMissionDraft]  = useState<MissionDraft | null>(null)
  const [extracting,    setExtracting]    = useState(false)
  const [extractError,  setExtractError]  = useState<string | null>(null)
  const [savingMission, setSavingMission] = useState(false)

  // Output drafts per model
  const [outputDrafts, setOutputDrafts] = useState<Partial<Record<ModelName, OutputDraft>>>({})
  const [keyInputs,    setKeyInputs]    = useState<Partial<Record<ModelName, string>>>({})
  const [genReasoning, setGenReasoning] = useState('')
  const [genChallenge, setGenChallenge] = useState('')
  const [generatingPrompt, setGeneratingPrompt] = useState<'reasoning' | 'challenge' | null>(null)

  // Comparison form
  const [compForm,    setCompForm]    = useState<Record<CompField, string>>({ convergence_notes: '', divergence_notes: '', blind_spots: '', contradictions: '', risk_notes: '', missing_assumptions: '' })
  const [autofilling, setAutofilling] = useState(false)
  const [autofillErr, setAutofillErr] = useState<string | null>(null)
  const [savingComp,  setSavingComp]  = useState(false)

  // Synthesis
  const [synthText,    setSynthText]    = useState('')
  const [synthConf,    setSynthConf]    = useState<ConfidenceLevel>('medium')
  const [synthFlags,   setSynthFlags]   = useState('')
  const [synthAction,  setSynthAction]  = useState('')
  const [savingSynth,  setSavingSynth]  = useState(false)
  const [revisingWith, setRevisingWith] = useState<string | null>(null)

  // Approval
  const [apDecision,  setApDecision]  = useState<ApprovalDecision>('approve')
  const [apAuthority, setApAuthority] = useState<AuthorityLevel>('R3')
  const [apNotes,     setApNotes]     = useState('')
  const [savingAp,    setSavingAp]    = useState(false)

  // Actions
  const [actTitle,    setActTitle]    = useState('')
  const [actDesc,     setActDesc]     = useState('')
  const [actAuth,     setActAuth]     = useState<AuthorityLevel>('R3')
  const [creatingAct, setCreatingAct] = useState(false)

  // Exchange
  const [exchange,    setExchange]    = useState<ExchangeMsg[]>([])
  const [exchInput,   setExchInput]   = useState('')
  const [exchModel,   setExchModel]   = useState<ModelName>('claude')
  const [exchRunning, setExchRunning] = useState(false)

  // Sheet state
  const [openSheet, setOpenSheet] = useState<SheetId | null>(null)
  const closeSheet = () => setOpenSheet(null)

  // ── Load data ────────────────────────────────────────────────────
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
      setMission(m); setOutputs(outs); setComparison(cmp); setSynthesis(syn); setApproval(apr)
      setActions((actRes.data ?? []) as Action[])
      setMemoryCount(memRes.data?.length ?? 0)
      setAuditLogs((logRes.data ?? []) as AuditLog[])
      if (m) {
        const drafts: Partial<Record<ModelName, OutputDraft>> = {}
        for (const model of m.models_selected as ModelName[]) {
          const ex = outs.find(o => o.model_name === model)
          drafts[model] = ex ? { prompt: ex.input_prompt ?? '', output: ex.raw_output, savedId: ex.id, running: false, saving: false, saved: true, error: null, tokenCount: ex.token_count ?? undefined } : { prompt: '', output: '', running: false, saving: false, saved: false, error: null }
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
    setKey(model, k); setKeyInputs(p => ({ ...p, [model]: '' }))
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

  // ── Extract Mission Brief ─────────────────────────────────────────
  async function extractMission() {
    const key = getKey('claude')
    if (!key) { setExtractError('Claude key required — load it in BYOK Gate.'); return }
    if (!principalInput.trim()) { setExtractError('Add some input first.'); return }
    setExtracting(true); setExtractError(null)
    const prompt = `You are a mission brief extractor. Extract a structured mission brief from the principal input. Return ONLY valid JSON with keys: title (string), context (string), objective (string), constraints (string), models_selected (array from: "claude","chatgpt","grok","gemini","codex","claude-code"), reasoning_prompt (2-4 sentence ready-to-use prompt), challenge_prompt (2-4 sentence adversarial prompt).\n\nPrincipal Input:\n${principalInput}\n\nReturn only the JSON object.`
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
      setOpenSheet('mission-extract')
    } catch (e) { setExtractError(e instanceof Error ? e.message : 'Unexpected error') }
    setExtracting(false)
  }

  // ── Confirm mission ──────────────────────────────────────────────
  async function confirmMission() {
    if (!missionDraft || !missionDraft.title.trim()) return
    setSavingMission(true)
    const payload = { session_id: sessionId, title: missionDraft.title.trim(), context: missionDraft.context.trim() || null, objective: missionDraft.objective.trim(), constraints: missionDraft.constraints.trim() || null, models_selected: missionDraft.models_selected, status: 'active' as const }
    let m = mission
    if (m) { await supabase.from('mission_briefs').update(payload).eq('id', m.id) }
    else { const { data } = await supabase.from('mission_briefs').insert(payload).select().single(); m = data as MissionBrief; setMission(m) }
    if (m) {
      await logEvent({ sessionId, eventType: AUDIT_EVENT.MISSION_CREATED, entityType: AUDIT_ENTITY.MISSION, entityId: m.id, authorityLevel: 'R2', payload: { title: missionDraft.title } })
      const drafts: Partial<Record<ModelName, OutputDraft>> = {}
      for (const model of missionDraft.models_selected) drafts[model] = { prompt: '', output: '', running: false, saving: false, saved: false, error: null }
      setOutputDrafts(drafts)
    }
    setMissionDraft(null); setSavingMission(false); closeSheet()
  }

  // ── Generate prompt ──────────────────────────────────────────────
  async function generatePrompt(role: 'reasoning' | 'challenge') {
    const key = getKey('claude'); if (!key || !mission) return
    setGeneratingPrompt(role)
    const instruction = role === 'reasoning' ? 'Generate a focused analytical reasoning prompt.' : 'Generate an adversarial challenge prompt that attacks assumptions and surfaces risks.'
    const prompt = `${instruction}\n\nMission: ${mission.title}\nObjective: ${mission.objective}\nContext: ${mission.context ?? ''}\n\nReturn only the prompt text.`
    try {
      const res = await fetch('/api/mmcp/run/claude', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, prompt }) })
      const json = await res.json() as { output?: string; error?: string }
      if (res.ok && json.output) { role === 'reasoning' ? setGenReasoning(json.output.trim()) : setGenChallenge(json.output.trim()) }
    } catch {}
    setGeneratingPrompt(null)
  }

  // ── Run model ────────────────────────────────────────────────────
  async function runModel(model: ModelName) {
    if (!mission) return
    const draft  = outputDrafts[model]; const route = PROXY[model]; const key = getKey(model)
    if (!draft?.prompt.trim() || !key || !route) return
    setOutputDrafts(p => ({ ...p, [model]: { ...p[model]!, running: true, error: null } }))
    await logEvent({ sessionId, eventType: AUDIT_EVENT.API_CALL_ATTEMPTED, entityType: AUDIT_ENTITY.OUTPUT, authorityLevel: 'R2', payload: { model } })
    try {
      const res  = await fetch(route, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, prompt: draft.prompt, attachments, sessionId, missionId: mission.id }) })
      const json = await res.json() as { output?: string; tokenCount?: number; error?: string }
      if (!res.ok || json.error) {
        setOutputDrafts(p => ({ ...p, [model]: { ...p[model]!, running: false, error: json.error ?? `Error ${res.status}` } }))
        await logEvent({ sessionId, eventType: AUDIT_EVENT.API_CALL_FAILED, entityType: AUDIT_ENTITY.OUTPUT, authorityLevel: 'R2', payload: { model } })
        return
      }
      setOutputDrafts(p => ({ ...p, [model]: { ...p[model]!, running: false, output: json.output ?? '', saved: false, tokenCount: json.tokenCount, error: null } }))
      await logEvent({ sessionId, eventType: AUDIT_EVENT.API_CALL_COMPLETED, entityType: AUDIT_ENTITY.OUTPUT, authorityLevel: 'R2', payload: { model } })
    } catch (e) { setOutputDrafts(p => ({ ...p, [model]: { ...p[model]!, running: false, error: e instanceof Error ? e.message : 'Error' } })) }
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
    await logEvent({ sessionId, eventType: AUDIT_EVENT.OUTPUT_PASTED, entityType: AUDIT_ENTITY.OUTPUT, entityId: savedId, authorityLevel: 'R2', payload: { model } })
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
    const prompt = `Analyze these AI outputs and return JSON with exactly 6 keys: convergence_notes, divergence_notes, blind_spots, contradictions, risk_notes, missing_assumptions. Be terse. Return only valid JSON.\n\n${section}`
    try {
      const res  = await fetch('/api/mmcp/run/claude', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, prompt }) })
      const json = await res.json() as { output?: string; error?: string }
      if (!res.ok || json.error) { setAutofillErr(json.error ?? `Error ${res.status}`); setAutofilling(false); return }
      const match = (json.output ?? '').match(/\{[\s\S]*\}/)
      if (!match) { setAutofillErr('Unexpected response.'); setAutofilling(false); return }
      const parsed = JSON.parse(match[0]) as Partial<Record<CompField, string>>
      setCompForm(f => ({ ...f, ...Object.fromEntries(COMP_FIELDS.map(({ key: k }) => [k, parsed[k] ?? f[k]])) } as Record<CompField, string>))
    } catch (e) { setAutofillErr(e instanceof Error ? e.message : 'Error') }
    setAutofilling(false)
  }

  // ── Save comparison ──────────────────────────────────────────────
  async function saveComparison(markComplete: boolean) {
    const mId = mission?.id; if (!mId) return
    setSavingComp(true)
    const payload = { session_id: sessionId, mission_id: mId, ...Object.fromEntries(COMP_FIELDS.map(({ key: k }) => [k, compForm[k].trim() || null])), status: markComplete ? 'complete' as const : 'draft' as const }
    let compId = comparison?.id
    if (comparison) { await supabase.from('oep_comparisons').update(payload).eq('id', comparison.id) }
    else { const { data } = await supabase.from('oep_comparisons').insert(payload).select().single(); compId = data?.id }
    if (markComplete) { const { data } = await supabase.from('oep_comparisons').select('*').eq('session_id', sessionId).order('created_at', { ascending: false }).limit(1).single(); if (data) setComparison(data as OEPComparison) }
    await logEvent({ sessionId, eventType: markComplete ? AUDIT_EVENT.COMPARISON_COMPLETED : AUDIT_EVENT.COMPARISON_SAVED, entityType: AUDIT_ENTITY.COMPARISON, entityId: compId, authorityLevel: 'R2' })
    setSavingComp(false)
  }

  // ── Revise synthesis ─────────────────────────────────────────────
  async function reviseSynthesis(instruction: string) {
    const key = getKey('claude'); if (!key || !synthText.trim()) return
    setRevisingWith(instruction.slice(0, 20))
    const prompt = `${instruction}\n\nCurrent synthesis:\n${synthText}\n\nReturn only the revised synthesis text.`
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
    else { const { data } = await supabase.from('syntheses').insert(payload).select().single(); synId = data?.id }
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
      await supabase.from('syntheses').update({ status: apDecision === 'approve' ? 'approved' : apDecision === 'reject' ? 'rejected' : 'pending_approval' }).eq('id', synthesis.id)
      await logEvent({ sessionId, eventType: AUDIT_EVENT.APPROVAL_DECIDED, entityType: AUDIT_ENTITY.APPROVAL, entityId: apr.id, authorityLevel: apAuthority, payload: { decision: apDecision } })
    }
    setSavingAp(false); closeSheet()
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
    const ctx = [
      mission ? `Mission: ${mission.title}\nObjective: ${mission.objective}` : '',
      outputs.slice(0, 2).map(o => `[${o.model_name}]: ${o.raw_output.slice(0, 500)}`).join('\n'),
      exchange.slice(-4).map(m => `${m.role === 'principal' ? 'You' : 'Model'}: ${m.content}`).join('\n'),
      `You: ${msg}`,
    ].filter(Boolean).join('\n\n---\n')
    try {
      const res  = await fetch(route, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, prompt: ctx }) })
      const json = await res.json() as { output?: string; error?: string }
      if (res.ok && json.output) setExchange(p => [...p, { role: 'model', model: exchModel, content: json.output!, ts: Date.now() }])
    } catch {}
    setExchRunning(false)
    setTimeout(() => exchRef.current?.scrollTo({ top: 9999, behavior: 'smooth' }), 100)
  }

  // ── Derived ──────────────────────────────────────────────────────
  const savedCount   = outputs.length
  const compComplete = comparison?.status === 'complete'
  const isApproved   = approval?.decision === 'approve'
  const claudeKey    = hasKey('claude')
  const chatgptKey   = hasKey('chatgpt')
  const anyApiKey    = claudeKey || chatgptKey
  const singleModel  = claudeKey && !chatgptKey ? 'claude' : !claudeKey && chatgptKey ? 'chatgpt' : null
  const missionModels = (mission?.models_selected ?? []) as ModelName[]

  const stage: Stage = !mission ? 'input' : savedCount < 1 ? 'reasoning' : savedCount < 2 ? 'challenge' : !compComplete ? 'comparison' : !synthesis ? 'synthesis' : !approval ? 'approval' : 'complete'

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: T.faint, fontSize: 15 }}>
      Loading session…
    </div>
  )

  // ── CENTER STAGE CONTENT ─────────────────────────────────────────

  function renderCenter() {
    switch (stage) {

      // INPUT
      case 'input': return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 20, padding: '0 32px' }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.accent, margin: '0 0 8px', textAlign: 'center' }}>Principal Input</p>
            <p style={{ fontSize: 28, fontWeight: 600, color: T.text, margin: 0, textAlign: 'center', maxWidth: 480 }}>
              What are you reasoning about?
            </p>
            <p style={{ fontSize: 14, color: T.faint, textAlign: 'center', margin: '10px 0 0', lineHeight: 1.6, maxWidth: 400 }}>
              Paste messy notes, questions, or raw context. The system will extract a structured mission brief.
            </p>
          </div>
          {/* Preview card */}
          <div style={{ width: '100%', maxWidth: 520, border: `1px solid ${principalInput.trim() ? 'rgba(197,162,111,0.3)' : T.border}`, borderRadius: 12, background: T.card, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: T.faint }}>
                {principalInput.trim()
                  ? `${principalInput.trim().slice(0, 52)}${principalInput.length > 52 ? '…' : ''}`
                  : 'No input yet'}
              </span>
              <span style={{ fontSize: 11, color: T.faint, flexShrink: 0 }}>
                {principalInput.trim() ? `${principalInput.length} chars` : ''}
              </span>
            </div>
            <div style={{ padding: '12px 18px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <button onClick={() => setOpenSheet('principal-input')} style={{ ...BTN_OUTLINE_GOLD, fontSize: 14 }}>
                {principalInput.trim() ? 'Edit Input →' : 'Open Input →'}
              </button>
              <input ref={fileRef} type="file" accept={ACCEPTED_MIME} multiple style={{ display: 'none' }} onChange={e => void handleFiles(e.target.files)} />
              <button onClick={() => fileRef.current?.click()} style={{ ...BTN_GHOST }}>↑ Attach</button>
              {attachments.map(a => (
                <span key={a.name} style={{ fontSize: 11, color: T.faint, padding: '3px 8px', background: T.ghost, borderRadius: 20 }}>
                  {a.name}
                  <button onClick={() => { const n = attachments.filter(x => x.name !== a.name); setAttachments(n); saveAttachments(sessionId, n) }} style={{ marginLeft: 5, background: 'none', border: 'none', cursor: 'pointer', color: T.faint, fontSize: 12, padding: 0 }}>×</button>
                </span>
              ))}
            </div>
          </div>
          {extractError && <p style={{ fontSize: 13, color: '#f87171', textAlign: 'center' }}>{extractError}</p>}
          {!anyApiKey && <p style={{ fontSize: 13, color: 'rgba(197,162,111,0.45)', textAlign: 'center' }}>Load a Claude key in <a href="/keys" style={{ color: T.accent, textDecoration: 'none' }}>BYOK Gate</a> to enable auto-extraction.</p>}
        </div>
      )

      // REASONING / CHALLENGE — model cards grid
      case 'reasoning':
      case 'challenge': {
        const genPrompt    = stage === 'reasoning' ? genReasoning : genChallenge
        const isChallenge  = stage === 'challenge'
        const modelsToShow: ModelName[] = isChallenge && singleModel ? [singleModel] : missionModels
        const cols = modelsToShow.length <= 2 ? modelsToShow.length : 3
        return (
          <div style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Mission ref */}
            {mission && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <span style={{ fontSize: 12, color: T.faint }}>Mission:</span>
                <span style={{ fontSize: 14, color: T.muted, fontWeight: 500 }}>{mission.title}</span>
                <button onClick={() => setOpenSheet('layer:mission')} style={{ fontSize: 11, color: T.accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>→ view</button>
              </div>
            )}
            {isChallenge && singleModel && (
              <div style={{ padding: '8px 12px', background: 'rgba(197,162,111,0.05)', border: '1px solid rgba(197,162,111,0.18)', borderRadius: 8, fontSize: 13, color: 'rgba(197,162,111,0.6)', flexShrink: 0 }}>
                Single-model mode — {MODEL_META[singleModel].label} will challenge its own reasoning.
              </div>
            )}
            {/* Model card grid */}
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12, flex: 1, minHeight: 0 }}>
              {modelsToShow.map(model => {
                const draft  = outputDrafts[model]
                const isApi  = API_MODELS.has(model)
                const keyOk  = isApi && hasKey(model)
                const hasOut = !!draft?.saved
                const hasPrompt = !!(draft?.prompt.trim() || genPrompt)
                return (
                  <button
                    key={model}
                    onClick={() => setOpenSheet(`model:${model}`)}
                    style={{
                      background: hasOut ? 'rgba(197,162,111,0.04)' : T.card,
                      border: `1px solid ${hasOut ? 'rgba(197,162,111,0.25)' : T.border}`,
                      borderRadius: 12, padding: '18px 16px', cursor: 'pointer', textAlign: 'left',
                      display: 'flex', flexDirection: 'column', gap: 10, transition: 'all 0.12s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <p style={{ fontSize: 15, fontWeight: 600, color: T.text, margin: 0 }}>{MODEL_META[model].label}</p>
                      {hasOut && <span style={{ fontSize: 11, color: T.accent, background: 'rgba(197,162,111,0.1)', padding: '2px 8px', borderRadius: 10 }}>✓ saved</span>}
                    </div>
                    <p style={{ fontSize: 12, color: T.faint, margin: 0, lineHeight: 1.4 }}>{MODEL_META[model].role}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <StatusRow label="Key" value={isApi ? (keyOk ? 'ready' : 'missing') : 'manual'} ok={isApi ? keyOk : true} />
                      <StatusRow label="Prompt" value={hasPrompt ? 'ready' : 'not set'} ok={hasPrompt} />
                      <StatusRow label="Output" value={hasOut ? `saved${draft?.tokenCount ? ` · ${draft.tokenCount}t` : ''}` : draft?.output.trim() ? 'unsaved' : 'empty'} ok={hasOut} />
                    </div>
                    {draft?.running && <p style={{ fontSize: 12, color: T.accent, margin: 0 }}>⟳ Running…</p>}
                    {draft?.error && <p style={{ fontSize: 12, color: '#f87171', margin: 0 }}>{draft.error.slice(0, 60)}</p>}
                    <p style={{ fontSize: 12, color: 'rgba(197,162,111,0.5)', margin: 0, marginTop: 'auto' }}>Open →</p>
                  </button>
                )
              })}
            </div>
            {/* Generated prompt strip */}
            {genPrompt && (
              <div style={{ flexShrink: 0, padding: '10px 14px', background: T.ghost, border: `1px solid ${T.border}`, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 12, color: T.faint, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  Generated prompt: {genPrompt.slice(0, 80)}…
                </span>
                <button onClick={() => claudeKey && void generatePrompt(stage)} disabled={generatingPrompt !== null} style={{ ...BTN_OUTLINE_GOLD, height: 34, fontSize: 12, flexShrink: 0, opacity: generatingPrompt ? 0.5 : 1 }}>
                  {generatingPrompt ? '⟳' : '↺ Regenerate'}
                </button>
              </div>
            )}
          </div>
        )
      }

      // COMPARISON — 2×3 card grid
      case 'comparison': return (
        <div style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {autofillErr && <p style={{ fontSize: 13, color: '#f87171', margin: 0, flexShrink: 0 }}>{autofillErr}</p>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, flex: 1, minHeight: 0 }}>
            {COMP_FIELDS.map(field => {
              const val    = compForm[field.key].trim()
              const hasVal = !!val
              return (
                <button
                  key={field.key}
                  onClick={() => setOpenSheet(`comp:${field.key}`)}
                  style={{
                    background: hasVal ? 'rgba(197,162,111,0.03)' : T.card,
                    border: `1px solid ${hasVal ? 'rgba(197,162,111,0.22)' : T.border}`,
                    borderRadius: 12, padding: '16px 14px', cursor: 'pointer', textAlign: 'left',
                    display: 'flex', flexDirection: 'column', gap: 8, transition: 'all 0.12s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: hasVal ? T.accent : T.border, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{field.label}</span>
                  </div>
                  <p style={{ fontSize: 12, color: hasVal ? T.muted : T.faint, margin: 0, lineHeight: 1.5, flex: 1 }}>
                    {val ? `${val.slice(0, 90)}${val.length > 90 ? '…' : ''}` : field.hint}
                  </p>
                  <p style={{ fontSize: 11, color: 'rgba(197,162,111,0.45)', margin: 0 }}>Edit →</p>
                </button>
              )
            })}
          </div>
        </div>
      )

      // SYNTHESIS
      case 'synthesis': return (
        <div style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Synthesis preview card */}
          <button
            onClick={() => setOpenSheet('synthesis')}
            style={{
              background: synthText.trim() ? 'rgba(197,162,111,0.04)' : T.card,
              border: `1px solid ${synthText.trim() ? 'rgba(197,162,111,0.28)' : T.border}`,
              borderRadius: 12, padding: '20px', cursor: 'pointer', textAlign: 'left', width: '100%', flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: T.accent, margin: 0, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Synthesis Draft</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ fontSize: 11, color: T.faint, padding: '3px 9px', border: `1px solid ${T.border}`, borderRadius: 10 }}>{synthConf}</span>
                {synthesis && <span style={{ fontSize: 11, color: T.accent, padding: '3px 9px', background: 'rgba(197,162,111,0.1)', borderRadius: 10 }}>saved</span>}
              </div>
            </div>
            {synthText.trim()
              ? <p style={{ fontSize: 14, color: T.muted, margin: 0, lineHeight: 1.6 }}>{synthText.slice(0, 160)}{synthText.length > 160 ? '…' : ''}</p>
              : <p style={{ fontSize: 14, color: T.faint, margin: 0 }}>Open to write synthesis →</p>
            }
          </button>
          {/* Revision commands */}
          <div style={{ flexShrink: 0 }}>
            <p style={{ fontSize: 10, color: T.faint, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 8px' }}>Revise with AI</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {REVISION_COMMANDS.map(cmd => (
                <button
                  key={cmd.label}
                  onClick={() => void reviseSynthesis(cmd.instruction)}
                  disabled={!synthText.trim() || revisingWith !== null || !claudeKey}
                  style={{
                    padding: '7px 14px', fontSize: 13, color: T.muted, background: 'transparent',
                    border: `1px solid ${T.border}`, borderRadius: 20, cursor: 'pointer',
                    opacity: !synthText.trim() || !claudeKey ? 0.35 : 1, transition: 'all 0.12s ease',
                  }}
                >
                  {revisingWith && revisingWith === cmd.instruction.slice(0, 20) ? '⟳' : ''}{cmd.label}
                </button>
              ))}
            </div>
          </div>
          {/* Exchange thread summary */}
          {outputs.length > 0 && (
            <button onClick={() => setOpenSheet('exchange')} style={{ ...BTN_GHOST, textAlign: 'left', height: 'auto', padding: '10px 14px', borderRadius: 8 }}>
              <span style={{ fontSize: 12, color: T.faint }}>Live Exchange</span>
              <span style={{ fontSize: 11, color: 'rgba(230,237,247,0.2)', marginLeft: 8 }}>{exchange.length} messages</span>
              <span style={{ fontSize: 12, color: 'rgba(197,162,111,0.45)', marginLeft: 'auto' }}>Open →</span>
            </button>
          )}
        </div>
      )

      // APPROVAL
      case 'approval': return (
        <div style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 560, alignSelf: 'center', width: '100%' }}>
          {synthesis && (
            <div style={{ padding: '14px 16px', background: T.card, border: `1px solid ${T.border}`, borderRadius: 10 }}>
              <p style={{ fontSize: 11, color: T.faint, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Synthesis — {synthesis.confidence_level} confidence</p>
              <p style={{ fontSize: 14, color: T.muted, margin: 0, lineHeight: 1.6 }}>{synthesis.synthesis_text.slice(0, 200)}{synthesis.synthesis_text.length > 200 ? '…' : ''}</p>
            </div>
          )}
          <div>
            <label style={LBL}>Decision</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(['approve', 'revise', 'reject', 'escalate'] as ApprovalDecision[]).map(d => (
                <button key={d} onClick={() => setApDecision(d)} style={{ padding: '9px 18px', borderRadius: 8, fontSize: 14, fontWeight: apDecision === d ? 600 : 400, border: `1px solid ${apDecision === d ? (d === 'approve' ? 'rgba(197,162,111,0.8)' : d === 'reject' ? 'rgba(248,113,113,0.5)' : 'rgba(230,237,247,0.3)') : T.border}`, background: apDecision === d ? (d === 'approve' ? 'rgba(197,162,111,0.15)' : d === 'reject' ? 'rgba(248,113,113,0.08)' : 'rgba(230,237,247,0.05)') : 'transparent', color: apDecision === d ? (d === 'approve' ? T.accent : d === 'reject' ? '#f87171' : T.text) : T.faint, cursor: 'pointer', textTransform: 'capitalize' }}>
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={LBL}>Authority Level</label>
            <select value={apAuthority} onChange={e => setApAuthority(e.target.value as AuthorityLevel)} style={SEL}>
              {(Object.entries(AUTHORITY_LEVELS) as [AuthorityLevel, typeof AUTHORITY_LEVELS[AuthorityLevel]][]).map(([l, m]) => <option key={l} value={l}>{m.label}</option>)}
            </select>
            {apAuthority === 'R4' && <p style={{ fontSize: 12, color: '#f87171', marginTop: 6 }}>⚠ Founder authority. This is external, irreversible, or financial.</p>}
          </div>
          <div>
            <label style={LBL}>Notes</label>
            <textarea value={apNotes} onChange={e => setApNotes(e.target.value)} placeholder="Reasoning, conditions, or caveats" rows={2} style={{ ...INP }} />
          </div>
        </div>
      )

      // COMPLETE
      case 'complete': return (
        <div style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 560, alignSelf: 'center', width: '100%' }}>
          {approval && (
            <div style={{ padding: '12px 16px', background: 'rgba(197,162,111,0.08)', border: '1px solid rgba(197,162,111,0.28)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 16 }}>✓</span>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: T.accent, margin: 0 }}>{AUTHORITY_LEVELS[approval.authority_level].label}</p>
                {approval.notes && <p style={{ fontSize: 12, color: T.faint, margin: '3px 0 0' }}>{approval.notes}</p>}
              </div>
            </div>
          )}
          {/* Actions list */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <p style={{ fontSize: 12, color: T.faint, margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Actions ({actions.length})</p>
              <button onClick={() => setOpenSheet('actions')} style={{ ...BTN_OUTLINE_GOLD, height: 34, fontSize: 12 }}>+ Add Action</button>
            </div>
            {actions.slice(0, 4).map(a => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', border: `1px solid ${T.border}`, borderRadius: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: T.text, flex: 1 }}>{a.title}</span>
                <span style={{ fontSize: 10, color: T.faint, padding: '2px 7px', background: T.ghost, borderRadius: 10 }}>{AUTHORITY_LEVELS[a.authority_level].short}</span>
                <span style={{ fontSize: 10, color: a.status === 'complete' ? T.accent : T.faint, padding: '2px 7px', background: T.ghost, borderRadius: 10 }}>{a.status}</span>
              </div>
            ))}
            {actions.length > 4 && <p style={{ fontSize: 12, color: T.faint, margin: '6px 0 0' }}>+{actions.length - 4} more — open Actions</p>}
          </div>
          {/* Memory */}
          <MemoryCapture sessionId={sessionId} synthesisId={synthesis?.id ?? null} content={synthesis?.synthesis_text ?? ''} defaultClassification="canon" defaultTags={extractKeywords(synthesis?.recommended_action || synthesis?.synthesis_text || '', 4)} buttonLabel="Write to Memory" />
        </div>
      )

      default: return null
    }
  }

  // ── BOTTOM ACTION BAR ────────────────────────────────────────────

  function renderActionBar() {
    const canExtract = anyApiKey && principalInput.trim()
    switch (stage) {
      case 'input': return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => void extractMission()} disabled={extracting || !canExtract} style={{ ...BTN_GOLD, opacity: extracting || !canExtract ? 0.4 : 1, cursor: extracting || !canExtract ? 'not-allowed' : 'pointer' }}>
            {extracting ? '⟳ Extracting…' : '⚡ Extract Mission Brief'}
          </button>
          {mission && <button onClick={() => setOpenSheet('layer:mission')} style={{ ...BTN_GHOST }}>Mission exists — view →</button>}
        </div>
      )
      case 'reasoning': return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {claudeKey && !genReasoning && <button onClick={() => void generatePrompt('reasoning')} disabled={generatingPrompt !== null} style={{ ...BTN_GHOST }}>✦ Generate Reasoning Prompt</button>}
          <span style={{ fontSize: 13, color: T.faint }}>
            {savedCount === 0 ? 'Save at least one model output to continue' : `${savedCount} output${savedCount > 1 ? 's' : ''} saved`}
          </span>
          {savedCount >= 1 && <button onClick={() => {}} style={{ ...BTN_GOLD, marginLeft: 'auto' }}>Continue to Challenge →</button>}
        </div>
      )
      case 'challenge': return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {claudeKey && !genChallenge && <button onClick={() => void generatePrompt('challenge')} disabled={generatingPrompt !== null} style={{ ...BTN_GHOST }}>✦ Generate Challenge Prompt</button>}
          <span style={{ fontSize: 13, color: T.faint }}>
            {savedCount < 2 ? `${savedCount}/2 outputs saved` : 'Ready for comparison'}
          </span>
          {savedCount >= 2 && <button onClick={() => {}} style={{ ...BTN_GOLD, marginLeft: 'auto' }}>Continue to Comparison →</button>}
        </div>
      )
      case 'comparison': return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => void autoFill()} disabled={autofilling || outputs.length < 2} style={{ ...BTN_OUTLINE_GOLD, opacity: autofilling || outputs.length < 2 ? 0.4 : 1 }}>
            {autofilling ? '⟳ Analyzing…' : '⚡ Auto-fill'}
          </button>
          <button onClick={() => void saveComparison(false)} disabled={savingComp} style={{ ...BTN_GHOST }}>Save Draft</button>
          <button onClick={() => void saveComparison(true)} disabled={savingComp} style={{ ...BTN_GOLD, marginLeft: 'auto', opacity: savingComp ? 0.5 : 1 }}>Mark Complete →</button>
        </div>
      )
      case 'synthesis': return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => void saveSynthesis()} disabled={savingSynth || !synthText.trim()} style={{ ...BTN_GHOST, opacity: savingSynth || !synthText.trim() ? 0.4 : 1 }}>
            {savingSynth ? 'Saving…' : synthesis ? '↺ Update Draft' : 'Save Draft'}
          </button>
          {synthesis && <button onClick={() => {}} style={{ ...BTN_GOLD, marginLeft: 'auto' }}>Continue to Approval →</button>}
        </div>
      )
      case 'approval': return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => void recordApproval()} disabled={savingAp} style={{ ...BTN_GOLD, opacity: savingAp ? 0.5 : 1 }}>
            {savingAp ? 'Recording…' : 'Record Decision'}
          </button>
        </div>
      )
      case 'complete': return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => setOpenSheet('timeline')} style={{ ...BTN_GHOST }}>View Timeline</button>
        </div>
      )
    }
  }

  // ── SHEET CONTENT ────────────────────────────────────────────────

  function renderSheetContent(id: SheetId): { title: string; subtitle?: string; content: React.ReactNode; footer?: React.ReactNode } {

    // ── Principal Input sheet ──────────────────────────────────────
    if (id === 'principal-input') return {
      title: 'Principal Input',
      subtitle: 'What are you reasoning about?',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <textarea value={principalInput} onChange={e => setPrincipalInput(e.target.value)} placeholder={'Paste messy input, notes, rough thoughts, or questions.\n\nThe system will extract a structured mission brief.'} rows={14} style={{ ...INP }} autoFocus />
          <div>
            <input ref={fileRef} type="file" accept={ACCEPTED_MIME} multiple style={{ display: 'none' }} onChange={e => { void handleFiles(e.target.files); closeSheet() }} />
            <button onClick={() => fileRef.current?.click()} style={{ ...BTN_GHOST }}>↑ Attach files</button>
          </div>
          {attachments.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {attachments.map(a => (
                <span key={a.name} style={{ fontSize: 12, color: T.faint, padding: '4px 10px', background: T.ghost, border: `1px solid ${T.border}`, borderRadius: 20 }}>
                  {a.name}
                  <button onClick={() => { const n = attachments.filter(x => x.name !== a.name); setAttachments(n); saveAttachments(sessionId, n) }} style={{ marginLeft: 6, background: 'none', border: 'none', cursor: 'pointer', color: T.faint, fontSize: 13, padding: 0 }}>×</button>
                </span>
              ))}
            </div>
          )}
          {attachError && <p style={{ fontSize: 13, color: '#f87171' }}>{attachError}</p>}
        </div>
      ),
      footer: (
        <button onClick={closeSheet} style={{ ...BTN_GOLD }}>Save & Close</button>
      ),
    }

    // ── Mission Extract sheet ──────────────────────────────────────
    if (id === 'mission-extract' && missionDraft) return {
      title: 'Mission Brief — Review',
      subtitle: 'Extracted from principal input',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ padding: '8px 12px', background: 'rgba(197,162,111,0.06)', border: '1px solid rgba(197,162,111,0.18)', borderRadius: 8, fontSize: 13, color: 'rgba(197,162,111,0.7)' }}>
            Review and edit before confirming. This becomes the Mission Brief for this session.
          </div>
          {([['title', 'Title', 1], ['objective', 'Objective', 3], ['context', 'Context', 2], ['constraints', 'Constraints', 2]] as [keyof MissionDraft, string, number][]).map(([k, label, rows]) => (
            <div key={k}>
              <label style={LBL}>{label}</label>
              <textarea value={String(missionDraft[k] ?? '')} onChange={e => setMissionDraft(d => d && ({ ...d, [k]: e.target.value }))} rows={rows} style={{ ...INP }} />
            </div>
          ))}
          <div>
            <label style={LBL}>Models Selected</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(['claude', 'chatgpt', 'grok', 'gemini', 'codex', 'claude-code'] as ModelName[]).map(m => {
                const on = missionDraft.models_selected.includes(m)
                return (
                  <button key={m} onClick={() => setMissionDraft(d => { if (!d) return d; const sel = on ? d.models_selected.filter(x => x !== m) : [...d.models_selected, m]; return { ...d, models_selected: sel } })} style={{ padding: '6px 12px', fontSize: 13, borderRadius: 20, border: `1px solid ${on ? 'rgba(197,162,111,0.6)' : T.border}`, background: on ? 'rgba(197,162,111,0.12)' : 'transparent', color: on ? T.accent : T.faint, cursor: 'pointer' }}>
                    {MODEL_META[m].label}
                  </button>
                )
              })}
            </div>
          </div>
          {missionDraft.reasoning_prompt && (
            <div>
              <label style={LBL}>Generated Reasoning Prompt</label>
              <textarea value={missionDraft.reasoning_prompt} onChange={e => setMissionDraft(d => d && ({ ...d, reasoning_prompt: e.target.value }))} rows={3} style={{ ...INP }} />
            </div>
          )}
          {missionDraft.challenge_prompt && (
            <div>
              <label style={LBL}>Generated Challenge Prompt</label>
              <textarea value={missionDraft.challenge_prompt} onChange={e => setMissionDraft(d => d && ({ ...d, challenge_prompt: e.target.value }))} rows={3} style={{ ...INP }} />
            </div>
          )}
        </div>
      ),
      footer: (
        <>
          <button onClick={closeSheet} style={{ ...BTN_GHOST }}>Cancel</button>
          <button onClick={() => void confirmMission()} disabled={savingMission || !missionDraft?.title.trim()} style={{ ...BTN_GOLD, marginLeft: 'auto', opacity: savingMission || !missionDraft?.title.trim() ? 0.5 : 1 }}>
            {savingMission ? 'Saving…' : '✓ Confirm Mission Brief'}
          </button>
        </>
      ),
    }

    // ── Model sheet (prompt + output) ──────────────────────────────
    if (id.startsWith('model:')) {
      const model = id.slice(6) as ModelName
      const draft  = outputDrafts[model] ?? { prompt: '', output: '', running: false, saving: false, saved: false, error: null }
      const isApi  = API_MODELS.has(model)
      const keyOk  = isApi && hasKey(model)
      const genPr  = stage === 'reasoning' ? genReasoning : genChallenge
      return {
        title: MODEL_META[model].label,
        subtitle: stage === 'reasoning' ? 'Reasoning' : 'Challenge',
        content: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Key entry */}
            {isApi && !keyOk && (
              <div style={{ padding: '12px 14px', background: T.card, border: '1px solid rgba(197,162,111,0.2)', borderRadius: 8 }}>
                <label style={LBL}>API Key for {MODEL_META[model].label}</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="password" value={keyInputs[model] ?? ''} onChange={e => setKeyInputs(p => ({ ...p, [model]: e.target.value }))} onKeyDown={e => e.key === 'Enter' && loadModelKey(model)} placeholder={model === 'claude' ? 'sk-ant-…' : 'sk-…'} style={{ ...INP, fontFamily: 'monospace', fontSize: 13, flex: 1, marginBottom: 0 }} />
                  <button onClick={() => loadModelKey(model)} style={{ ...BTN_OUTLINE_GOLD }}>Load</button>
                </div>
              </div>
            )}
            {/* Generated prompt quick-use */}
            {genPr && (
              <div style={{ padding: '10px 12px', background: T.ghost, borderRadius: 8, border: `1px solid ${T.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: T.faint, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Generated {stage} prompt</span>
                  <button onClick={() => setOutputDrafts(p => ({ ...p, [model]: { ...(p[model] ?? { prompt: '', output: '', running: false, saving: false, saved: false, error: null }), prompt: genPr } }))} style={{ fontSize: 12, color: T.accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>↓ Use this</button>
                </div>
                <p style={{ fontSize: 13, color: T.muted, margin: 0, lineHeight: 1.5 }}>{genPr.slice(0, 200)}{genPr.length > 200 ? '…' : ''}</p>
              </div>
            )}
            {/* Prompt */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ ...LBL, marginBottom: 0 }}>Prompt</label>
                {claudeKey && <button onClick={() => void generatePrompt(stage === 'reasoning' ? 'reasoning' : 'challenge')} disabled={generatingPrompt !== null} style={{ fontSize: 12, color: T.accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>✦ {generatingPrompt ? 'Generating…' : 'Regenerate'}</button>}
              </div>
              <textarea value={draft.prompt} onChange={e => setOutputDrafts(p => ({ ...p, [model]: { ...p[model]!, prompt: e.target.value } }))} placeholder="Paste or write the prompt to send…" rows={5} style={{ ...INP }} />
            </div>
            {/* Run button */}
            {isApi && keyOk && (
              <button onClick={() => void runModel(model)} disabled={draft.running || !draft.prompt.trim()} style={{ ...BTN_GOLD, opacity: draft.running || !draft.prompt.trim() ? 0.4 : 1, cursor: draft.running || !draft.prompt.trim() ? 'not-allowed' : 'pointer' }}>
                {draft.running ? `Running ${MODEL_META[model].label}…` : `▶ Run ${MODEL_META[model].label}`}
              </button>
            )}
            {draft.error && <p style={{ fontSize: 13, color: '#f87171' }}>{draft.error}</p>}
            {/* Output */}
            <div>
              <label style={LBL}>Output {draft.tokenCount ? `· ${draft.tokenCount} tokens` : ''}</label>
              <textarea value={draft.output} onChange={e => setOutputDrafts(p => ({ ...p, [model]: { ...p[model]!, output: e.target.value, saved: false } }))} placeholder={draft.running ? 'Running…' : isApi ? 'Output appears here after running, or paste manually' : 'Paste output here'} rows={10} style={{ ...INP }} />
            </div>
          </div>
        ),
        footer: (
          <>
            {draft.saved && <span style={{ fontSize: 12, color: T.accent }}>✓ Saved</span>}
            <button onClick={() => void saveOutput(model)} disabled={!draft.output.trim() || draft.saving} style={{ ...BTN_GOLD, marginLeft: 'auto', opacity: !draft.output.trim() || draft.saving ? 0.4 : 1 }}>
              {draft.saving ? 'Saving…' : draft.saved ? '↺ Update Output' : '✓ Save Output'}
            </button>
          </>
        ),
      }
    }

    // ── Comparison field sheet ─────────────────────────────────────
    if (id.startsWith('comp:')) {
      const field = id.slice(5) as CompField
      const meta  = COMP_FIELDS.find(f => f.key === field)!
      return {
        title: meta.label,
        subtitle: 'Comparison Analysis',
        content: (
          <div>
            <p style={{ fontSize: 13, color: T.faint, margin: '0 0 16px', lineHeight: 1.6 }}>{meta.hint}</p>
            <textarea value={compForm[field]} onChange={e => setCompForm(f => ({ ...f, [field]: e.target.value }))} placeholder={meta.hint} autoFocus rows={16} style={{ ...INP }} />
          </div>
        ),
        footer: (
          <button onClick={closeSheet} style={{ ...BTN_GOLD, marginLeft: 'auto' }}>Save & Close</button>
        ),
      }
    }

    // ── Synthesis draft sheet ──────────────────────────────────────
    if (id === 'synthesis') return {
      title: 'Synthesis Draft',
      subtitle: 'Consolidated judgment',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <textarea value={synthText} onChange={e => setSynthText(e.target.value)} placeholder="Write the consolidated synthesis. Preserve uncertainty. Include recommended action." autoFocus rows={12} style={{ ...INP }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={LBL}>Confidence</label>
              <select value={synthConf} onChange={e => setSynthConf(e.target.value as ConfidenceLevel)} style={SEL}>
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
              </select>
            </div>
            <div>
              <label style={LBL}>Recommended Action</label>
              <input value={synthAction} onChange={e => setSynthAction(e.target.value)} placeholder="Optional" style={{ ...INP, marginBottom: 0 }} />
            </div>
          </div>
          <div>
            <label style={LBL}>Uncertainty Flags — never erased</label>
            <textarea value={synthFlags} onChange={e => setSynthFlags(e.target.value)} placeholder="What remains unresolved?" rows={3} style={{ ...INP }} />
          </div>
        </div>
      ),
      footer: (
        <button onClick={() => { void saveSynthesis(); closeSheet() }} disabled={savingSynth || !synthText.trim()} style={{ ...BTN_GOLD, opacity: savingSynth || !synthText.trim() ? 0.4 : 1 }}>
          {savingSynth ? 'Saving…' : synthesis ? 'Update Synthesis' : 'Save Synthesis'}
        </button>
      ),
    }

    // ── Live Exchange sheet ────────────────────────────────────────
    if (id === 'exchange') return {
      title: 'Live Exchange',
      subtitle: 'Follow-up with model after initial outputs',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div ref={exchRef} style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 200 }}>
            {exchange.length === 0 && <p style={{ fontSize: 14, color: T.faint }}>Ask a follow-up, request clarification, or correct the direction.</p>}
            {exchange.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'principal' ? 'flex-end' : 'flex-start' }}>
                <div style={{ maxWidth: '85%', padding: '10px 14px', background: msg.role === 'principal' ? 'rgba(197,162,111,0.1)' : T.card, border: `1px solid ${msg.role === 'principal' ? 'rgba(197,162,111,0.2)' : T.border}`, borderRadius: 10, fontSize: 14, color: T.text, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {exchRunning && <div style={{ padding: '10px 14px', background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 14, color: T.faint }}>⟳ Thinking…</div>}
          </div>
        </div>
      ),
      footer: (
        <div style={{ display: 'flex', gap: 10, width: '100%', alignItems: 'flex-end' }}>
          <select value={exchModel} onChange={e => setExchModel(e.target.value as ModelName)} style={{ ...SEL, width: 120, flexShrink: 0 }}>
            {(['claude', 'chatgpt'] as ModelName[]).map(m => <option key={m} value={m}>{MODEL_META[m].label}</option>)}
          </select>
          <textarea value={exchInput} onChange={e => setExchInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void sendExchange() } }} placeholder="Ask a follow-up… (Enter to send)" rows={2} style={{ ...INP, flex: 1, marginBottom: 0 }} />
          <button onClick={() => void sendExchange()} disabled={exchRunning || !exchInput.trim() || !hasKey(exchModel)} style={{ ...BTN_GOLD, flexShrink: 0, opacity: exchRunning || !exchInput.trim() || !hasKey(exchModel) ? 0.4 : 1 }}>Send</button>
        </div>
      ),
    }

    // ── Actions sheet ──────────────────────────────────────────────
    if (id === 'actions') return {
      title: 'Actions',
      subtitle: isApproved ? `${actions.length} action${actions.length !== 1 ? 's' : ''}` : 'Approval required',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {isApproved && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '14px', background: T.card, border: `1px solid ${T.border}`, borderRadius: 10 }}>
              <p style={{ fontSize: 12, color: T.faint, margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em' }}>New Action</p>
              <input value={actTitle} onChange={e => setActTitle(e.target.value)} placeholder="Action title" style={{ ...INP, marginBottom: 0 }} />
              <textarea value={actDesc} onChange={e => setActDesc(e.target.value)} placeholder="Description (optional)" rows={2} style={{ ...INP }} />
              <select value={actAuth} onChange={e => setActAuth(e.target.value as AuthorityLevel)} style={SEL}>
                {(Object.keys(AUTHORITY_LEVELS) as AuthorityLevel[]).map(l => <option key={l} value={l}>{AUTHORITY_LEVELS[l].label}</option>)}
              </select>
              <button onClick={() => void createAction()} disabled={creatingAct || !actTitle.trim()} style={{ ...BTN_GOLD, opacity: creatingAct || !actTitle.trim() ? 0.4 : 1 }}>
                {creatingAct ? 'Creating…' : '+ Create Action'}
              </button>
            </div>
          )}
          {!isApproved && <p style={{ fontSize: 14, color: T.faint }}>Record an approval decision before creating actions.</p>}
          {actions.map(a => (
            <div key={a.id} style={{ padding: '12px 14px', border: `1px solid ${T.border}`, borderRadius: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: a.description ? 4 : 0 }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: T.text, flex: 1 }}>{a.title}</span>
                <span style={{ fontSize: 11, color: T.faint, padding: '2px 7px', background: T.ghost, borderRadius: 10 }}>{AUTHORITY_LEVELS[a.authority_level].short}</span>
                <span style={{ fontSize: 11, color: a.status === 'complete' ? T.accent : T.faint, padding: '2px 7px', background: T.ghost, borderRadius: 10 }}>{a.status}</span>
              </div>
              {a.description && <p style={{ fontSize: 13, color: T.faint, margin: 0 }}>{a.description}</p>}
            </div>
          ))}
        </div>
      ),
    }

    // ── Memory sheet ───────────────────────────────────────────────
    if (id === 'memory') return {
      title: 'Memory',
      subtitle: isApproved ? `${memoryCount} item${memoryCount !== 1 ? 's' : ''}` : 'Approval required',
      content: (
        <div>
          {isApproved ? (
            <MemoryCapture sessionId={sessionId} synthesisId={synthesis?.id ?? null} content={synthesis?.synthesis_text ?? ''} defaultClassification="canon" defaultTags={extractKeywords(synthesis?.recommended_action || synthesis?.synthesis_text || '', 4)} buttonLabel="Write to Memory" />
          ) : (
            <p style={{ fontSize: 14, color: T.faint }}>Approval is required before canonical memory can be written. Record a decision in the Approval stage first.</p>
          )}
        </div>
      ),
    }

    // ── Timeline sheet ─────────────────────────────────────────────
    if (id === 'timeline') return {
      title: 'Session Timeline',
      subtitle: `${auditLogs.length} events`,
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {auditLogs.length === 0 && <p style={{ fontSize: 14, color: T.faint }}>No events yet.</p>}
          {auditLogs.map((log, i) => (
            <div key={log.id} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: i < auditLogs.length - 1 ? `1px solid ${T.border}` : 'none' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(197,162,111,0.4)', flexShrink: 0, marginTop: 6 }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: T.text, margin: 0 }}>{log.event_type.replace(/_/g, ' ').toLowerCase()}</p>
                <p style={{ fontSize: 11, color: T.faint, margin: '3px 0 0', fontVariantNumeric: 'tabular-nums' }}>{new Date(log.logged_at).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      ),
    }

    // ── Layer info sheets (from right stack) ───────────────────────
    if (id.startsWith('layer:')) {
      const layer = id.slice(6)
      const titleMap: Record<string, string> = { mission: 'Mission Brief', reasoning: 'Reasoning Outputs', challenge: 'Challenge Outputs', comparison: 'Comparison', synthesis: 'Synthesis', approval: 'Approval', memory: 'Memory', actions: 'Actions', timeline: 'Timeline' }
      return {
        title: titleMap[layer] ?? layer,
        content: (
          <div>
            {layer === 'mission' && mission && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[['Title', mission.title], ['Objective', mission.objective], ['Context', mission.context ?? '—'], ['Constraints', mission.constraints ?? '—']].map(([l, v]) => (
                  <div key={l}><label style={LBL}>{l}</label><p style={{ fontSize: 15, color: T.text, lineHeight: 1.6, margin: 0 }}>{v}</p></div>
                ))}
                <div><label style={LBL}>Models</label><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{(mission.models_selected as ModelName[]).map(m => <span key={m} style={{ fontSize: 13, padding: '4px 10px', background: 'rgba(197,162,111,0.08)', border: '1px solid rgba(197,162,111,0.2)', borderRadius: 20, color: T.accent }}>{MODEL_META[m].label}</span>)}</div></div>
              </div>
            )}
            {!mission && layer === 'mission' && <p style={{ color: T.faint, fontSize: 15 }}>No mission brief yet.</p>}
            {(layer === 'reasoning' || layer === 'challenge') && (
              <div>
                {outputs.length === 0 && <p style={{ color: T.faint, fontSize: 15 }}>No outputs saved yet.</p>}
                {outputs.map(o => (
                  <div key={o.id} style={{ marginBottom: 24 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: T.accent, margin: '0 0 10px' }}>{MODEL_META[o.model_name as ModelName]?.label ?? o.model_name}</p>
                    <pre style={{ fontSize: 14, color: T.text, lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0, fontFamily: 'inherit' }}>{o.raw_output}</pre>
                  </div>
                ))}
              </div>
            )}
            {layer === 'comparison' && (
              <div>
                {COMP_FIELDS.map(f => (
                  <div key={f.key} style={{ marginBottom: 20 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: T.accent, margin: '0 0 8px' }}>{f.label}</p>
                    <p style={{ fontSize: 14, color: compForm[f.key] ? T.text : T.faint, lineHeight: 1.6, margin: 0 }}>{compForm[f.key] || f.hint}</p>
                  </div>
                ))}
              </div>
            )}
            {layer === 'synthesis' && synthesis && (
              <div>
                <p style={{ fontSize: 15, color: T.text, lineHeight: 1.7, whiteSpace: 'pre-wrap', marginBottom: 12 }}>{synthesis.synthesis_text}</p>
                {synthesis.recommended_action && <div style={{ padding: '10px 14px', background: T.card, borderRadius: 8, marginTop: 12 }}><p style={{ fontSize: 11, color: T.faint, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Action</p><p style={{ fontSize: 14, color: T.accent, margin: 0 }}>{synthesis.recommended_action}</p></div>}
              </div>
            )}
          </div>
        ),
      }
    }

    return { title: 'Sheet', content: null }
  }

  // ── Layer dot color / status ──────────────────────────────────────
  function layerStatus(layer: string) {
    switch (layer) {
      case 'mission':    return mission ? 'complete' : 'empty'
      case 'reasoning':  return !mission ? 'locked' : savedCount >= 1 ? 'complete' : 'empty'
      case 'challenge':  return savedCount < 1 ? 'locked' : savedCount >= 2 ? 'complete' : 'empty'
      case 'comparison': return savedCount < 2 ? 'locked' : compComplete ? 'complete' : 'partial'
      case 'synthesis':  return !compComplete ? 'locked' : synthesis ? 'complete' : 'empty'
      case 'approval':   return !synthesis ? 'locked' : approval ? 'complete' : 'empty'
      case 'memory':     return memoryCount > 0 ? 'complete' : 'empty'
      case 'actions':    return actions.length > 0 ? 'complete' : 'empty'
      case 'timeline':   return auditLogs.length > 0 ? 'complete' : 'empty'
      default: return 'empty'
    }
  }
  function dotColor(s: string) {
    return s === 'complete' ? T.accent : s === 'partial' ? '#fbbf24' : s === 'locked' ? 'rgba(230,237,247,0.07)' : T.border
  }

  // ── RENDER ───────────────────────────────────────────────────────
  const activeSheet = openSheet ? renderSheetContent(openSheet) : null

  const RIGHT_LAYERS = [
    { id: 'mission', label: 'Mission', num: '3' },
    { id: 'reasoning', label: 'Reasoning', num: '4' },
    { id: 'challenge', label: 'Challenge', num: '5' },
    { id: 'comparison', label: 'Comparison', num: '6' },
    { id: 'synthesis', label: 'Synthesis', num: '7' },
    { id: 'approval', label: 'Approval', num: '8' },
    { id: 'memory', label: 'Memory', num: '9' },
    { id: 'actions', label: 'Actions', num: '' },
    { id: 'timeline', label: 'Timeline', num: '10' },
  ]

  return (
    <>
      <style>{`
        @keyframes ws-spin { to { transform: rotate(360deg); } }
        .ws-mc:hover:not(:disabled) { border-color: rgba(197,162,111,0.35) !important; background: rgba(197,162,111,0.06) !important; }
        .ws-sc:hover:not(:disabled) { border-color: rgba(197,162,111,0.22) !important; background: rgba(197,162,111,0.04) !important; }
        .ws-layer:hover { border-color: rgba(230,237,247,0.12) !important; background: rgba(230,237,247,0.03) !important; cursor: pointer; }
        .ws-rev:hover:not(:disabled) { border-color: rgba(197,162,111,0.3) !important; color: #C5A26F !important; }
        .ws-btn:hover:not(:disabled) { opacity: 0.8; }
        textarea, input, select { font-family: inherit; }
      `}</style>

      {/* ── FIXED VIEWPORT SHELL ───────────────────────────────── */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 60,
        background: T.bg, display: 'flex', flexDirection: 'column',
        fontFamily: 'system-ui, -apple-system, sans-serif', color: T.text,
      }}>
        {/* ── TOP BAR ────────────────────────────────────────────── */}
        <div style={{
          height: 48, flexShrink: 0, borderBottom: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px',
        }}>
          <a href="/dashboard" style={{ fontSize: 12, color: T.faint, textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>← Back</a>
          <div style={{ width: 1, height: 16, background: T.border, flexShrink: 0 }} />
          {/* Stage pill */}
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.accent, flexShrink: 0 }}>
            {STAGE_LABELS[stage]}
          </span>
          {/* Layer pills — compact */}
          <div style={{ display: 'flex', gap: 4, overflowX: 'auto', flex: 1, scrollbarWidth: 'none' }}>
            {RIGHT_LAYERS.map(l => {
              const s = layerStatus(l.id)
              const isLocked = s === 'locked'
              const isCurrent = l.id === stage || (stage === 'complete' && l.id === 'actions')
              return isLocked ? (
                <span key={l.id} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 10, border: `1px solid rgba(230,237,247,0.04)`, color: 'rgba(230,237,247,0.12)', whiteSpace: 'nowrap', flexShrink: 0 }}>{l.label}</span>
              ) : (
                <button key={l.id} onClick={() => setOpenSheet(`layer:${l.id}`)} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 10, border: `1px solid ${isCurrent ? 'rgba(197,162,111,0.4)' : s === 'complete' ? 'rgba(230,237,247,0.12)' : T.border}`, background: isCurrent ? 'rgba(197,162,111,0.12)' : 'transparent', color: isCurrent ? T.accent : s === 'complete' ? T.muted : T.faint, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>{l.label}</button>
              )
            })}
          </div>
          {/* Exchange shortcut */}
          {savedCount > 0 && (
            <button onClick={() => setOpenSheet('exchange')} style={{ fontSize: 11, color: T.faint, background: 'none', border: `1px solid ${T.border}`, borderRadius: 10, padding: '3px 10px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
              Exchange {exchange.length > 0 ? `(${exchange.length})` : ''}
            </button>
          )}
        </div>

        {/* ── BODY (center + right) ───────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

          {/* Center workspace */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {renderCenter()}
          </div>

          {/* Right layer stack */}
          <div style={{
            width: 220, borderLeft: `1px solid ${T.border}`, flexShrink: 0,
            overflowY: 'auto', overflowX: 'hidden', padding: '14px 0',
          }}>
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.accent, padding: '0 14px', margin: '0 0 10px' }}>Layers</p>
            {RIGHT_LAYERS.map(l => {
              const s = layerStatus(l.id)
              const isLocked = s === 'locked'
              const summary =
                l.id === 'mission'    ? (mission?.title?.slice(0, 28) ?? null) :
                l.id === 'reasoning'  ? (savedCount >= 1 ? `${savedCount} output${savedCount > 1 ? 's' : ''}` : null) :
                l.id === 'challenge'  ? (savedCount >= 2 ? `${savedCount} outputs` : null) :
                l.id === 'comparison' ? (compComplete ? 'Complete' : comparison ? 'Draft' : null) :
                l.id === 'synthesis'  ? (synthesis ? `${synthConf} conf.` : null) :
                l.id === 'approval'   ? (approval ? approval.decision : null) :
                l.id === 'memory'     ? (memoryCount > 0 ? `${memoryCount} item${memoryCount > 1 ? 's' : ''}` : null) :
                l.id === 'actions'    ? (actions.length > 0 ? `${actions.length} action${actions.length > 1 ? 's' : ''}` : null) :
                l.id === 'timeline'   ? (auditLogs.length > 0 ? `${auditLogs.length} events` : null) : null

              return (
                <div
                  key={l.id}
                  className={isLocked ? '' : 'ws-layer'}
                  onClick={isLocked ? undefined : () => setOpenSheet(`layer:${l.id}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 7, margin: '0 6px 1px', border: '1px solid transparent', transition: 'all 0.1s ease', opacity: isLocked ? 0.3 : 1 }}
                >
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor(s), flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 500, color: s === 'complete' ? T.text : T.faint, margin: 0 }}>
                      {l.num && <span style={{ fontSize: 9, color: 'rgba(230,237,247,0.2)', marginRight: 4 }}>{l.num}</span>}
                      {l.label}
                    </p>
                    {summary && <p style={{ fontSize: 10, color: 'rgba(230,237,247,0.22)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{summary}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── BOTTOM ACTION BAR ───────────────────────────────────── */}
        <div style={{
          height: 60, flexShrink: 0, borderTop: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', padding: '0 20px', gap: 10,
        }}>
          {renderActionBar()}
        </div>
      </div>

      {/* ── FOCUS SHEET ─────────────────────────────────────────── */}
      <FocusSheet
        open={!!openSheet && !!activeSheet}
        title={activeSheet?.title ?? ''}
        subtitle={activeSheet?.subtitle}
        onClose={closeSheet}
        footer={activeSheet?.footer}
      >
        {activeSheet?.content}
      </FocusSheet>
    </>
  )
}

// ── Tiny helper ───────────────────────────────────────────────────
function StatusRow({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 10, color: 'rgba(230,237,247,0.22)', width: 42, textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 12, color: ok ? 'rgba(197,162,111,0.75)' : 'rgba(230,237,247,0.3)' }}>{value}</span>
    </div>
  )
}
