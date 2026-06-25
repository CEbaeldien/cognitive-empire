'use client'
// Inline "Save insight to memory" widget — added to each pipeline stage.
// synthesis_id and approval_id are nullable for pre-synthesis captures.

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { logEvent, AUDIT_EVENT, AUDIT_ENTITY } from '@/lib/mmcp/audit'
import type { MemoryClassification } from '@/types/mmcp'

const CLASSIFICATIONS: { value: MemoryClassification; label: string }[] = [
  { value: 'general',  label: 'Insight'  },
  { value: 'pattern',  label: 'Pattern'  },
  { value: 'decision', label: 'Decision' },
  { value: 'doctrine', label: 'Doctrine' },
  { value: 'canon',    label: 'Canon'    },
]

interface Props {
  sessionId:      string
  synthesisId?:   string | null
  defaultContent?: string
}

export function MemoryCapture({ sessionId, synthesisId = null, defaultContent = '' }: Props) {
  const supabase = createClient()

  const [open,    setOpen]    = useState(false)
  const [content, setContent] = useState('')
  const [classif, setClassif] = useState<MemoryClassification>('general')
  const [tagsRaw, setTagsRaw] = useState('')
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)

  // Pre-populate from parent state each time the form opens
  useEffect(() => {
    if (open) setContent(defaultContent)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-clear confirmation after 2.5 s
  useEffect(() => {
    if (!saved) return
    const t = setTimeout(() => setSaved(false), 2500)
    return () => clearTimeout(t)
  }, [saved])

  async function handleSave() {
    const trimmed = content.trim()
    if (!trimmed) return
    setSaving(true)

    const tags  = tagsRaw.split(',').map(t => t.trim()).filter(Boolean)
    const title = trimmed.substring(0, 80)

    const { data: mem } = await supabase
      .from('memory_items')
      .insert({
        session_id:     sessionId,
        synthesis_id:   synthesisId,
        approval_id:    null,
        title,
        content:        trimmed,
        tags,
        classification: classif,
        exportable:     false,
      })
      .select()
      .single()

    await logEvent({
      sessionId,
      eventType:      AUDIT_EVENT.MEMORY_ITEM_CREATED,
      entityType:     AUDIT_ENTITY.MEMORY_ITEM,
      entityId:       mem?.id,
      authorityLevel: 'R2',
      payload:        { classification: classif, pre_synthesis: synthesisId === null },
    })

    setSaving(false)
    setOpen(false)
    setContent('')
    setTagsRaw('')
    setClassif('general')
    setSaved(true)
  }

  return (
    <>
      <style>{`
        @keyframes mem-fade { 0%,60% { opacity:1; } 100% { opacity:0; } }
        .mem-save-btn:hover:not(:disabled) { opacity: 0.85; }
        .mem-cancel-btn:hover { border-color: rgba(230,237,247,0.18) !important; color: rgba(230,237,247,0.6) !important; }
        .mem-trigger:hover { background: rgba(197,162,111,0.06) !important; border-color: rgba(197,162,111,0.5) !important; }
      `}</style>

      <div style={{ marginTop: 28, fontFamily: 'system-ui, -apple-system, sans-serif' }}>

        {/* ── Trigger ──────────────────────────────────────────── */}
        {!open && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button
              onClick={() => setOpen(true)}
              className="mem-trigger"
              style={{
                display:      'flex',
                alignItems:   'center',
                gap:          7,
                height:       44,
                padding:      '0 16px',
                background:   'transparent',
                border:       '1px solid rgba(197,162,111,0.28)',
                borderRadius: 8,
                fontSize:     14,
                color:        '#C5A26F',
                cursor:       'pointer',
                transition:   'all 0.15s ease',
              }}
            >
              <span style={{ fontSize: 17, lineHeight: 1 }}>⊕</span>
              Save insight to memory
            </button>

            {saved && (
              <span style={{
                fontSize:  13,
                color:     '#C5A26F',
                animation: 'mem-fade 2.5s forwards',
              }}>
                ✓ Saved to memory
              </span>
            )}
          </div>
        )}

        {/* ── Inline form ──────────────────────────────────────── */}
        {open && (
          <div style={{
            padding:      16,
            background:   'rgba(197,162,111,0.04)',
            border:       '1px solid rgba(197,162,111,0.18)',
            borderRadius: 10,
          }}>
            {/* Form header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#C5A26F', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 15 }}>⊕</span> Save insight to memory
              </span>
              <button
                onClick={() => setOpen(false)}
                style={{
                  fontSize:   20,
                  lineHeight: 1,
                  color:      'rgba(230,237,247,0.3)',
                  background: 'none',
                  border:     'none',
                  cursor:     'pointer',
                  padding:    '2px 6px',
                }}
              >
                ×
              </button>
            </div>

            {/* Content */}
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="What insight should be preserved?"
              rows={4}
              autoFocus
              style={{
                width:        '100%',
                background:   'rgba(230,237,247,0.03)',
                border:       '1px solid rgba(230,237,247,0.07)',
                borderRadius: 6,
                padding:      '10px 12px',
                fontSize:     15,
                color:        '#E6EDF7',
                lineHeight:   1.6,
                resize:       'vertical',
                outline:      'none',
                boxSizing:    'border-box',
                marginBottom: 10,
              }}
            />

            {/* Classification + tags row */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <select
                value={classif}
                onChange={e => setClassif(e.target.value as MemoryClassification)}
                style={{
                  background:   'rgba(230,237,247,0.04)',
                  border:       '1px solid rgba(230,237,247,0.07)',
                  borderRadius: 6,
                  padding:      '0 12px',
                  fontSize:     14,
                  color:        '#E6EDF7',
                  outline:      'none',
                  height:       44,
                  minWidth:     130,
                }}
              >
                {CLASSIFICATIONS.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>

              <input
                type="text"
                value={tagsRaw}
                onChange={e => setTagsRaw(e.target.value)}
                placeholder="Tags, comma-separated"
                style={{
                  flex:         1,
                  background:   'rgba(230,237,247,0.04)',
                  border:       '1px solid rgba(230,237,247,0.07)',
                  borderRadius: 6,
                  padding:      '0 12px',
                  fontSize:     14,
                  color:        '#E6EDF7',
                  outline:      'none',
                  height:       44,
                }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => void handleSave()}
                disabled={saving || !content.trim()}
                className="mem-save-btn"
                style={{
                  height:       44,
                  padding:      '0 22px',
                  background:   '#C5A26F',
                  color:        '#060D1A',
                  border:       'none',
                  borderRadius: 8,
                  fontSize:     15,
                  fontWeight:   600,
                  cursor:       saving || !content.trim() ? 'not-allowed' : 'pointer',
                  opacity:      saving || !content.trim() ? 0.5 : 1,
                  transition:   'opacity 0.15s ease',
                }}
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="mem-cancel-btn"
                style={{
                  height:       44,
                  padding:      '0 16px',
                  background:   'transparent',
                  border:       '1px solid rgba(230,237,247,0.07)',
                  borderRadius: 8,
                  fontSize:     15,
                  color:        'rgba(230,237,247,0.35)',
                  cursor:       'pointer',
                  transition:   'all 0.15s ease',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

      </div>
    </>
  )
}
