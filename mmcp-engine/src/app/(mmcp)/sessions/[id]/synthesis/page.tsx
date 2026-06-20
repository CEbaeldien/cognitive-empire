'use client'
// ── Screen 5: Synthesis + Approval ──────────────────────────
// Principal reads the comparison and writes the final synthesis.
// Approval gate: approve / revise / reject / escalate.
// Only after 'approve' can the Principal create action or memory item.
// R4 authority level always requires explicit Principal approval.
// Writes: syntheses → approvals → actions/memory_items + audit logs.

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { logEvent, assertR4HasApproval, AUDIT_EVENT, AUDIT_ENTITY } from '@/lib/mmcp/audit'
import {
  AUTHORITY_LEVELS,
  type Synthesis,
  type Approval,
  type OEPComparison,
  type AuthorityLevel,
  type ApprovalDecision,
  type ConfidenceLevel,
  type MemoryClassification,
} from '@/types/mmcp'

export default function SynthesisPage() {
  const { id: sessionId } = useParams<{ id: string }>()
  const supabase = createClient()

  const [missionId,   setMissionId]  = useState<string | null>(null)
  const [comparison,  setComparison] = useState<OEPComparison | null>(null)
  const [synthesis,   setSynthesis]  = useState<Synthesis | null>(null)
  const [approval,    setApproval]   = useState<Approval | null>(null)
  const [userId,      setUserId]     = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Synthesis form
  const [synthForm, setSynthForm] = useState({
    synthesis_text:     '',
    confidence_level:   'medium' as ConfidenceLevel,
    uncertainty_flags:  '',
    recommended_action: '',
  })

  // Approval form
  const [approvalForm, setApprovalForm] = useState({
    decision:        'approve' as ApprovalDecision,
    notes:           '',
    authority_level: 'R3' as AuthorityLevel,
  })

  // Post-approval: action form
  const [actionForm, setActionForm] = useState({ title: '', description: '', authority_level: 'R3' as AuthorityLevel })
  const [creatingAction, setCreatingAction] = useState(false)
  const [actionCreated, setActionCreated] = useState(false)

  // Post-approval: memory form
  const [memoryForm, setMemoryForm] = useState({ title: '', content: '', classification: 'decision' as MemoryClassification, tags: '' })
  const [creatingMemory, setCreatingMemory] = useState(false)
  const [memoryCreated, setMemoryCreated] = useState(false)

  // ── Load ─────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id ?? null)

      const { data: m } = await supabase
        .from('mission_briefs').select('id').eq('session_id', sessionId)
        .order('created_at', { ascending: false }).limit(1).single()
      if (!m) return
      setMissionId(m.id)

      const { data: cmp } = await supabase
        .from('oep_comparisons').select('*').eq('mission_id', m.id)
        .order('created_at', { ascending: false }).limit(1).single()
      setComparison(cmp ?? null)

      const { data: syn } = await supabase
        .from('syntheses').select('*').eq('mission_id', m.id)
        .order('created_at', { ascending: false }).limit(1).single()
      if (syn) {
        setSynthesis(syn)
        setSynthForm({
          synthesis_text:     syn.synthesis_text,
          confidence_level:   syn.confidence_level ?? 'medium',
          uncertainty_flags:  syn.uncertainty_flags ?? '',
          recommended_action: syn.recommended_action ?? '',
        })

        const { data: apr } = await supabase
          .from('approvals').select('*').eq('synthesis_id', syn.id)
          .order('decided_at', { ascending: false }).limit(1).single()
        setApproval(apr ?? null)
      }
    }
    load()
  }, [sessionId])

  // ── Save synthesis ───────────────────────────────────────
  async function saveSynthesis() {
    if (!missionId || !synthForm.synthesis_text.trim()) return
    setSaving(true)

    const payload = {
      session_id:         sessionId,
      mission_id:         missionId,
      oep_comparison_id:  comparison?.id ?? null,
      synthesis_text:     synthForm.synthesis_text.trim(),
      confidence_level:   synthForm.confidence_level,
      uncertainty_flags:  synthForm.uncertainty_flags.trim() || null,
      recommended_action: synthForm.recommended_action.trim() || null,
      status:             'pending_approval' as const,
    }

    let synId = synthesis?.id
    if (synthesis) {
      await supabase.from('syntheses').update(payload).eq('id', synthesis.id)
    } else {
      const { data } = await supabase.from('syntheses').insert(payload).select().single()
      synId = data?.id
      setSynthesis(data ?? null)
    }

    await logEvent({
      sessionId,
      eventType:      synthesis ? AUDIT_EVENT.SYNTHESIS_REVISED : AUDIT_EVENT.SYNTHESIS_CREATED,
      entityType:     AUDIT_ENTITY.SYNTHESIS,
      entityId:       synId,
      authorityLevel: 'R2',
    })
    setSaving(false)
  }

  // ── Record approval ──────────────────────────────────────
  async function recordApproval() {
    if (!synthesis || !userId) return
    setSaving(true)

    const { data: apr } = await supabase.from('approvals').insert({
      session_id:      sessionId,
      synthesis_id:    synthesis.id,
      principal_id:    userId,
      decision:        approvalForm.decision,
      notes:           approvalForm.notes.trim() || null,
      authority_level: approvalForm.authority_level,
      decided_at:      new Date().toISOString(),
    }).select().single()

    if (apr) {
      setApproval(apr)
      const newStatus =
        approvalForm.decision === 'approve' ? 'approved' :
        approvalForm.decision === 'reject'  ? 'rejected' :
        'pending_approval'
      await supabase.from('syntheses').update({ status: newStatus }).eq('id', synthesis.id)
      await logEvent({
        sessionId,
        eventType:      AUDIT_EVENT.APPROVAL_DECIDED,
        entityType:     AUDIT_ENTITY.APPROVAL,
        entityId:       apr.id,
        authorityLevel: approvalForm.authority_level,
        payload:        { decision: approvalForm.decision },
      })
    }
    setSaving(false)
  }

  // ── Create action (only after approval) ──────────────────
  async function createAction() {
    if (!synthesis || !approval) return
    if (actionForm.authority_level === 'R4') assertR4HasApproval(approval.id, 'create action')
    setCreatingAction(true)

    const { data: act } = await supabase.from('actions').insert({
      session_id:      sessionId,
      synthesis_id:    synthesis.id,
      approval_id:     approval.id,
      title:           actionForm.title.trim(),
      description:     actionForm.description.trim(),
      authority_level: actionForm.authority_level,
      status:          'pending',
      completed_at:    null,
    }).select().single()

    await logEvent({
      sessionId,
      eventType:      AUDIT_EVENT.ACTION_CREATED,
      entityType:     AUDIT_ENTITY.ACTION,
      entityId:       act?.id,
      authorityLevel: actionForm.authority_level,
      payload:        { title: actionForm.title },
    })
    setCreatingAction(false)
    setActionCreated(true)
  }

  // ── Create memory item (only after approval) ─────────────
  async function createMemory() {
    if (!synthesis || !approval) return
    setCreatingMemory(true)

    const tags = memoryForm.tags.split(',').map(t => t.trim()).filter(Boolean)

    const { data: mem } = await supabase.from('memory_items').insert({
      session_id:     sessionId,
      synthesis_id:   synthesis.id,
      approval_id:    approval.id,
      title:          memoryForm.title.trim(),
      content:        memoryForm.content.trim(),
      tags,
      classification: memoryForm.classification,
      exportable:     true,
    }).select().single()

    await logEvent({
      sessionId,
      eventType:      AUDIT_EVENT.MEMORY_ITEM_CREATED,
      entityType:     AUDIT_ENTITY.MEMORY_ITEM,
      entityId:       mem?.id,
      authorityLevel: 'R3',
      payload:        { title: memoryForm.title, classification: memoryForm.classification },
    })
    setCreatingMemory(false)
    setMemoryCreated(true)
  }

  const isApproved = approval?.decision === 'approve'

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-white">Synthesis + Approval</h1>
        <p className="text-sm text-white/40 mt-0.5">Consolidated brief. Principal decides. Nothing proceeds without approval.</p>
      </div>

      {/* Comparison reference */}
      {comparison && (
        <div className="p-4 bg-white/2 border border-white/8 rounded-lg space-y-2 text-xs">
          <p className="text-white/30 uppercase tracking-wider text-[10px]">Comparison Summary</p>
          {comparison.convergence_notes && <p><span className="text-[#c9a96e]/70">Convergence: </span><span className="text-white/60">{comparison.convergence_notes}</span></p>}
          {comparison.divergence_notes  && <p><span className="text-amber-400/70">Divergence: </span><span className="text-white/60">{comparison.divergence_notes}</span></p>}
          {comparison.blind_spots       && <p><span className="text-red-400/70">Blind Spots: </span><span className="text-white/60">{comparison.blind_spots}</span></p>}
          {comparison.risk_notes        && <p><span className="text-orange-400/70">Risks: </span><span className="text-white/60">{comparison.risk_notes}</span></p>}
        </div>
      )}

      {/* Synthesis form */}
      {!isApproved && (
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-white/70">Write Synthesis</h2>

          <div>
            <label className={LABEL}>Synthesis</label>
            <textarea
              value={synthForm.synthesis_text}
              onChange={e => setSynthForm(f => ({ ...f, synthesis_text: e.target.value }))}
              placeholder="Consolidated judgment from OEP. Preserve uncertainty."
              rows={8}
              className={INPUT}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Confidence</label>
              <select value={synthForm.confidence_level} onChange={e => setSynthForm(f => ({ ...f, confidence_level: e.target.value as ConfidenceLevel }))} className={INPUT}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className={LABEL}>Recommended Action</label>
              <input type="text" value={synthForm.recommended_action} onChange={e => setSynthForm(f => ({ ...f, recommended_action: e.target.value }))} placeholder="Optional" className={INPUT} />
            </div>
          </div>

          <div>
            <label className={LABEL}>Uncertainty Flags <span className="text-white/25 text-[10px]">not erased in synthesis</span></label>
            <textarea
              value={synthForm.uncertainty_flags}
              onChange={e => setSynthForm(f => ({ ...f, uncertainty_flags: e.target.value }))}
              placeholder="What remains unresolved or unclear?"
              rows={2}
              className={INPUT}
            />
          </div>

          <button onClick={saveSynthesis} disabled={saving || !synthForm.synthesis_text.trim()} className={BTN_GOLD}>
            {saving ? 'Saving…' : 'Save Synthesis'}
          </button>
        </section>
      )}

      {/* Approval gate */}
      {synthesis && !approval && (
        <section className="space-y-4 border-t border-white/8 pt-6">
          <h2 className="text-sm font-medium text-[#c9a96e]">Principal Decision</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Decision</label>
              <div className="flex gap-2">
                {(['approve', 'revise', 'reject', 'escalate'] as ApprovalDecision[]).map(d => (
                  <button key={d} type="button"
                    onClick={() => setApprovalForm(f => ({ ...f, decision: d }))}
                    className={`px-3 py-1.5 text-xs rounded border transition-colors ${
                      approvalForm.decision === d
                        ? d === 'approve' ? 'bg-[#c9a96e] text-black border-[#c9a96e]'
                        : 'bg-white/10 text-white border-white/20'
                        : 'border-white/10 text-white/40 hover:text-white/70'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={LABEL}>Authority Level</label>
              <select value={approvalForm.authority_level} onChange={e => setApprovalForm(f => ({ ...f, authority_level: e.target.value as AuthorityLevel }))} className={INPUT}>
                {(Object.entries(AUTHORITY_LEVELS) as [AuthorityLevel, typeof AUTHORITY_LEVELS[AuthorityLevel]][]).map(([level, meta]) => (
                  <option key={level} value={level}>{level} — {meta.label}</option>
                ))}
              </select>
              {approvalForm.authority_level === 'R4' && (
                <p className="text-xs text-red-400 mt-1">⚠ R4 — external/irreversible. This approval is your explicit authorisation.</p>
              )}
            </div>
          </div>

          <div>
            <label className={LABEL}>Notes</label>
            <textarea value={approvalForm.notes} onChange={e => setApprovalForm(f => ({ ...f, notes: e.target.value }))} rows={2} className={INPUT} placeholder="Reasoning, conditions, or caveats" />
          </div>

          <button onClick={recordApproval} disabled={saving} className={BTN_GOLD}>
            {saving ? 'Recording…' : 'Record Decision'}
          </button>
        </section>
      )}

      {/* Approval summary */}
      {approval && (
        <div className={`p-4 rounded-lg border ${isApproved ? 'border-[#c9a96e]/40 bg-[#c9a96e]/5' : 'border-white/10 bg-white/3'}`}>
          <p className="text-xs font-medium text-[#c9a96e] mb-1">Decision Recorded</p>
          <p className="text-sm text-white capitalize">{approval.decision} · {approval.authority_level}</p>
          {approval.notes && <p className="text-xs text-white/50 mt-1">{approval.notes}</p>}
        </div>
      )}

      {/* Post-approval: create action */}
      {isApproved && !actionCreated && (
        <section className="space-y-3 border-t border-white/8 pt-6">
          <h2 className="text-sm font-medium text-white/70">Create Action</h2>
          <input type="text" value={actionForm.title} onChange={e => setActionForm(f => ({ ...f, title: e.target.value }))} placeholder="Action title" className={INPUT} />
          <textarea value={actionForm.description} onChange={e => setActionForm(f => ({ ...f, description: e.target.value }))} placeholder="What needs to happen?" rows={3} className={INPUT} />
          <select value={actionForm.authority_level} onChange={e => setActionForm(f => ({ ...f, authority_level: e.target.value as AuthorityLevel }))} className={INPUT}>
            {(Object.keys(AUTHORITY_LEVELS) as AuthorityLevel[]).map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <button onClick={createAction} disabled={creatingAction || !actionForm.title.trim()} className={BTN_GHOST}>
            {creatingAction ? 'Creating…' : 'Create Action'}
          </button>
        </section>
      )}
      {actionCreated && <p className="text-xs text-[#c9a96e]">✓ Action created.</p>}

      {/* Post-approval: create memory item */}
      {isApproved && !memoryCreated && (
        <section className="space-y-3 border-t border-white/8 pt-6">
          <h2 className="text-sm font-medium text-white/70">Save to Memory</h2>
          <input type="text" value={memoryForm.title} onChange={e => setMemoryForm(f => ({ ...f, title: e.target.value }))} placeholder="Memory title" className={INPUT} />
          <textarea value={memoryForm.content} onChange={e => setMemoryForm(f => ({ ...f, content: e.target.value }))} placeholder="What should be remembered?" rows={4} className={INPUT} />
          <div className="flex gap-3">
            <select value={memoryForm.classification} onChange={e => setMemoryForm(f => ({ ...f, classification: e.target.value as MemoryClassification }))} className={INPUT}>
              {(['general', 'doctrine', 'pattern', 'decision', 'canon'] as MemoryClassification[]).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="text" value={memoryForm.tags} onChange={e => setMemoryForm(f => ({ ...f, tags: e.target.value }))} placeholder="Tags (comma-separated)" className={INPUT} />
          </div>
          <button onClick={createMemory} disabled={creatingMemory || !memoryForm.title.trim() || !memoryForm.content.trim()} className={BTN_GHOST}>
            {creatingMemory ? 'Saving…' : 'Save to Memory'}
          </button>
        </section>
      )}
      {memoryCreated && <p className="text-xs text-[#c9a96e]">✓ Memory item saved.</p>}
    </div>
  )
}

const LABEL = 'block text-[10px] text-white/40 uppercase tracking-wider mb-1'
const INPUT  = 'w-full bg-white/3 border border-white/8 rounded px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#c9a96e]/30 resize-none transition-colors'
const BTN_GOLD  = 'px-5 py-2 text-sm bg-[#c9a96e] text-black rounded font-medium hover:bg-[#b8934d] disabled:opacity-40 transition-colors'
const BTN_GHOST = 'px-4 py-2 text-sm border border-white/15 text-white/60 rounded hover:border-white/30 hover:text-white disabled:opacity-40 transition-colors'
