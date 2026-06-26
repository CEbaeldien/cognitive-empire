'use client'

import { useEffect, useState } from 'react'
import { MODEL_META, type ModelName } from '@/types/mmcp'
import { COGNITIVE_ROLES, ROLE_META, setRole, getRole, type CognitiveRole } from '@/lib/mmcp/modelRoles'
import { getKeyMode, type KeyMode } from '@/lib/mmcp/keys'

const S = {
  bg:     '#05070B',
  text:   '#E6EDF7',
  accent: '#C5A26F',
  muted:  'rgba(230,237,247,0.45)',
  faint:  'rgba(230,237,247,0.18)',
  border: 'rgba(230,237,247,0.07)',
  panel:  'rgba(230,237,247,0.03)',
} as const

const ALL_MODELS: ModelName[] = ['claude', 'chatgpt', 'claude-code', 'codex', 'grok', 'gemini']
const BYOK_MODELS = new Set<ModelName>(['claude', 'chatgpt'])

const SELECT_STYLE = {
  background:       '#0D1117',
  color:            '#E6EDF7',
  border:           '1px solid rgba(230,237,247,0.15)',
  borderRadius:     '6px',
  padding:          '8px 12px',
  fontSize:         '14px',
  width:            '100%',
  cursor:           'pointer',
  appearance:       'none' as const,
  WebkitAppearance: 'none' as const,
  outline:          'none',
}

function KeyStatusChip({ model }: { model: ModelName | null }) {
  const [mode, setMode] = useState<KeyMode>(null)

  useEffect(() => {
    if (!model) { setMode(null); return }
    if (!BYOK_MODELS.has(model)) { setMode(null); return }
    setMode(getKeyMode(model))
  }, [model])

  if (!model) return null
  if (!BYOK_MODELS.has(model)) {
    return (
      <span style={{ fontSize: 11, color: S.faint, background: 'rgba(230,237,247,0.04)', border: `1px solid ${S.border}`, padding: '2px 8px', borderRadius: 12 }}>
        Manual
      </span>
    )
  }
  if (mode === 'local') {
    return (
      <span style={{ fontSize: 11, color: S.accent, background: 'rgba(197,162,111,0.1)', border: '1px solid rgba(197,162,111,0.25)', padding: '2px 8px', borderRadius: 12 }}>
        Connected
      </span>
    )
  }
  if (mode === 'session') {
    return (
      <span style={{ fontSize: 11, color: '#93c5fd', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', padding: '2px 8px', borderRadius: 12 }}>
        Session
      </span>
    )
  }
  return (
    <span style={{ fontSize: 11, color: 'rgba(248,113,113,0.8)', background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)', padding: '2px 8px', borderRadius: 12 }}>
      Missing
    </span>
  )
}

export default function ModelRolesPage() {
  const [assignments, setAssignments] = useState<Partial<Record<CognitiveRole, ModelName>>>({})
  const [saved, setSaved] = useState<Partial<Record<CognitiveRole, boolean>>>({})

  useEffect(() => {
    const loaded: Partial<Record<CognitiveRole, ModelName>> = {}
    for (const role of COGNITIVE_ROLES) {
      const m = getRole(role)
      if (m) loaded[role] = m
    }
    setAssignments(loaded)
  }, [])

  function handleAssign(role: CognitiveRole, model: ModelName | '') {
    if (!model) {
      const next = { ...assignments }
      delete next[role]
      setAssignments(next)
      return
    }
    setRole(role, model as ModelName)
    setAssignments(prev => ({ ...prev, [role]: model as ModelName }))
    setSaved(prev => ({ ...prev, [role]: true }))
    setTimeout(() => setSaved(prev => ({ ...prev, [role]: false })), 1500)
  }

  const configuredCount = COGNITIVE_ROLES.filter(r => assignments[r]).length

  return (
    <>
      <style>{`
        .role-card:hover { border-color: rgba(230,237,247,0.1) !important; }
      `}</style>

      <div style={{ padding: '32px 24px', maxWidth: 680, fontFamily: 'system-ui, -apple-system, sans-serif', color: S.text }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: S.accent, margin: '0 0 8px' }}>
            Layer 2
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 6px', color: S.text }}>Model Roles</h1>
          <p style={{ fontSize: 14, color: S.muted, margin: 0, lineHeight: 1.6 }}>
            Assign which model fills each cognitive role. The same model can fill multiple roles.
          </p>
        </div>

        {/* Progress */}
        <div style={{
          display:      'flex',
          alignItems:   'center',
          gap:          12,
          padding:      '10px 14px',
          background:   S.panel,
          border:       `1px solid ${S.border}`,
          borderRadius: 8,
          marginBottom: 28,
        }}>
          <div style={{ flex: 1, height: 4, background: 'rgba(230,237,247,0.07)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height:     '100%',
              width:      `${Math.round((configuredCount / COGNITIVE_ROLES.length) * 100)}%`,
              background: S.accent,
              borderRadius: 2,
              transition: 'width 0.3s ease',
            }} />
          </div>
          <span style={{ fontSize: 13, color: S.muted, whiteSpace: 'nowrap', flexShrink: 0 }}>
            {configuredCount} / {COGNITIVE_ROLES.length} assigned
          </span>
        </div>

        {/* Role cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {COGNITIVE_ROLES.map((role, idx) => {
            const meta    = ROLE_META[role]
            const current = assignments[role] ?? null

            return (
              <div
                key={role}
                className="role-card"
                style={{
                  border:       `1px solid ${current ? 'rgba(197,162,111,0.15)' : S.border}`,
                  borderRadius: 10,
                  background:   current ? 'rgba(197,162,111,0.02)' : S.panel,
                  overflow:     'hidden',
                  transition:   'border-color 0.15s ease',
                }}
              >
                <div style={{
                  display:        'flex',
                  alignItems:     'flex-start',
                  gap:            14,
                  padding:        '14px 16px',
                }}>
                  {/* Layer number */}
                  <div style={{
                    width:          28,
                    height:         28,
                    borderRadius:   '50%',
                    background:     current ? 'rgba(197,162,111,0.12)' : 'rgba(230,237,247,0.04)',
                    border:         `1px solid ${current ? 'rgba(197,162,111,0.25)' : S.border}`,
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    fontSize:       12,
                    fontWeight:     600,
                    color:          current ? S.accent : S.faint,
                    flexShrink:     0,
                    marginTop:      2,
                  }}>
                    {idx + 3}
                  </div>

                  {/* Role info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <p style={{ fontSize: 15, fontWeight: 600, color: S.text, margin: 0 }}>{meta.label}</p>
                      {saved[role] && (
                        <span style={{ fontSize: 12, color: S.accent }}>✓ Saved</span>
                      )}
                    </div>
                    <p style={{ fontSize: 13, color: S.faint, margin: '0 0 12px', lineHeight: 1.5 }}>
                      {meta.description}
                    </p>

                    {/* Model selector + key status */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ flex: 1, position: 'relative' }}>
                        <select
                          value={current ?? ''}
                          onChange={e => handleAssign(role, e.target.value as ModelName | '')}
                          style={SELECT_STYLE}
                        >
                          <option value="">— No model assigned —</option>
                          {ALL_MODELS.map(m => (
                            <option key={m} value={m}>{MODEL_META[m].label}</option>
                          ))}
                        </select>
                      </div>
                      <KeyStatusChip model={current} />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Note */}
        <p style={{ fontSize: 13, color: S.faint, marginTop: 24, lineHeight: 1.55 }}>
          Role assignments are saved in this browser. Only the Reasoning role is required to unlock cognition sessions.
        </p>

      </div>
    </>
  )
}
