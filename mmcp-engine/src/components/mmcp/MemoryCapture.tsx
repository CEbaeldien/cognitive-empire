'use client'
// Memory capture — content is system-proposed (read-only).
// Principal can edit classification and tags only, then confirms with "Write to Memory".

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { logEvent, AUDIT_EVENT, AUDIT_ENTITY } from '@/lib/mmcp/audit'
import type { MemoryClassification } from '@/types/mmcp'

// ── Keyword extractor (exported for use in stage pages) ────────
const STOP = new Set([
  'the','a','an','in','on','at','to','for','of','and','or','but','with',
  'by','from','is','are','was','were','be','been','have','has','had',
  'do','does','did','will','would','could','should','may','can','must',
  'that','this','it','its','we','our','they','their','what','how','when',
  'which','who','not','no','any','all','some','as','than','then','also',
  'into','about','more','over','after','before','between','need','want',
])

export function extractKeywords(text: string, limit = 5): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !STOP.has(w))
    .filter((w, i, arr) => arr.indexOf(w) === i)
    .slice(0, limit)
    .join(', ')
}

// ── Classification options ─────────────────────────────────────
const CLASSIFICATIONS: { value: MemoryClassification; label: string }[] = [
  { value: 'general',  label: 'Insight'  },
  { value: 'pattern',  label: 'Pattern'  },
  { value: 'decision', label: 'Decision' },
  { value: 'doctrine', label: 'Doctrine' },
  { value: 'canon',    label: 'Canon'    },
]

// ── Props ──────────────────────────────────────────────────────
interface Props {
  sessionId:             string
  synthesisId?:          string | null
  content:               string               // system-proposed, READ-ONLY
  defaultClassification: MemoryClassification
  defaultTags?:          string               // comma-separated, pre-populated
  buttonLabel?:          string               // defaults to "Update Memory"
}

export function MemoryCapture({
  sessionId,
  synthesisId      = null,
  content,
  defaultClassification,
  defaultTags      = '',
  buttonLabel      = 'Update Memory',
}: Props) {
  const supabase = createClient()

  const [open,    setOpen]    = useState(false)
  const [classif, setClassif] = useState<MemoryClassification>(defaultClassification)
  const [tagsRaw, setTagsRaw] = useState(defaultTags)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)

  // Re-sync from props each time the form opens (parent state may have changed)
  useEffect(() => {
    if (open) {
      setClassif(defaultClassification)
      setTagsRaw(defaultTags)
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-clear confirmation toast
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
    setSaved(true)
  }

  return (
    <>
      <style>{`
        @keyframes mem-fade { 0%,65% { opacity:1; } 100% { opacity:0; } }
        .mem-trigger:hover  { background: rgba(197,162,111,0.07) !important; border-color: rgba(197,162,111,0.5) !important; }
        .mem-write:hover:not(:disabled) { opacity: 0.85; }
        .mem-cancel:hover   { border-color: rgba(230,237,247,0.2) !important; color: rgba(230,237,247,0.6) !important; }
      `}</style>

      <div style={{ marginTop: 20, fontFamily: 'system-ui, -apple-system, sans-serif' }}>

        {/* ── Trigger + confirmation ──────────────────────────── */}
        {!open && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
              <span style={{ fontSize: 16, lineHeight: 1 }}>⊕</span>
              {buttonLabel}
            </button>

            {saved && (
              <span style={{ fontSize: 13, color: '#C5A26F', animation: 'mem-fade 2.5s forwards' }}>
                ✓ Memory updated
              </span>
            )}
          </div>
        )}

        {/* ── Inline form ─────────────────────────────────────── */}
        {open && (
          <div style={{
            border:       '1px solid rgba(197,162,111,0.18)',
            borderRadius: 10,
            overflow:     'hidden',
          }}>

            {/* Form header */}
            <div style={{
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'space-between',
              padding:        '11px 14px',
              background:     'rgba(197,162,111,0.05)',
              borderBottom:   '1px solid rgba(197,162,111,0.1)',
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#C5A26F' }}>
                ⊕ Update Memory
              </span>
              <button
                onClick={() => setOpen(false)}
                style={{ fontSize: 20, lineHeight: 1, color: 'rgba(230,237,247,0.3)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}
              >
                ×
              </button>
            </div>

            {/* Read-only content preview */}
            <div style={{
              padding:      '11px 14px',
              background:   'rgba(230,237,247,0.015)',
              borderBottom: '1px solid rgba(230,237,247,0.05)',
              maxHeight:    180,
              overflowY:    'auto',
            }}>
              <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(230,237,247,0.25)', margin: '0 0 7px' }}>
                Content — system-generated
              </p>
              {content.trim() ? (
                <p style={{ fontSize: 14, color: 'rgba(230,237,247,0.5)', lineHeight: 1.65, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {content}
                </p>
              ) : (
                <p style={{ fontSize: 14, color: 'rgba(230,237,247,0.2)', margin: 0, fontStyle: 'italic' }}>
                  No content available yet
                </p>
              )}
            </div>

            {/* Editable: classification + tags */}
            <div style={{ padding: '11px 14px', display: 'flex', gap: 8, borderBottom: '1px solid rgba(230,237,247,0.05)' }}>
              <select
                value={classif}
                onChange={e => setClassif(e.target.value as MemoryClassification)}
                autoFocus
                style={{
                  background:       '#0D1117',
                  color:            '#E6EDF7',
                  border:           '1px solid rgba(230,237,247,0.15)',
                  borderRadius:     '6px',
                  padding:          '10px 14px',
                  fontSize:         '15px',
                  cursor:           'pointer',
                  appearance:       'none',
                  WebkitAppearance: 'none',
                  height:           44,
                  minWidth:         130,
                  outline:          'none',
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
            <div style={{ padding: '11px 14px', display: 'flex', gap: 8 }}>
              <button
                onClick={() => void handleSave()}
                disabled={saving || !content.trim()}
                className="mem-write"
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
                {saving ? 'Writing…' : 'Write to Memory'}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="mem-cancel"
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
