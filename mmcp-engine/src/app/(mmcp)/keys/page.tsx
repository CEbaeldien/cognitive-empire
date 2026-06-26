'use client'

import { useEffect, useState } from 'react'
import { MODEL_META, type ModelName } from '@/types/mmcp'
import {
  setKey, setKeySession, clearKey, clearAllKeys, clearAllSessionKeys,
  getKeyMode, listLoadedModels, type KeyMode,
} from '@/lib/mmcp/keys'

const S = {
  bg:     '#05070B',
  text:   '#E6EDF7',
  accent: '#C5A26F',
  muted:  'rgba(230,237,247,0.45)',
  faint:  'rgba(230,237,247,0.18)',
  border: 'rgba(230,237,247,0.07)',
  panel:  'rgba(230,237,247,0.03)',
} as const

// Models that use our BYOK key vault
const API_MODELS: ModelName[] = ['claude', 'chatgpt']

// Models that are externally managed
const MANUAL_MODELS: ModelName[] = ['claude-code', 'codex', 'grok', 'gemini']

type LoadMode = 'local' | 'session'

function statusChip(mode: KeyMode) {
  if (mode === 'local')   return { label: 'Stored locally',  color: '#C5A26F', bg: 'rgba(197,162,111,0.1)' }
  if (mode === 'session') return { label: 'Session only',    color: '#93c5fd', bg: 'rgba(59,130,246,0.1)'  }
  return                         { label: 'Missing',         color: 'rgba(230,237,247,0.2)', bg: 'rgba(230,237,247,0.04)' }
}

export default function KeysPage() {
  const [modes,     setModes]     = useState<Record<string, KeyMode>>({})
  const [inputs,    setInputs]    = useState<Partial<Record<ModelName, string>>>({})
  const [loadModes, setLoadModes] = useState<Partial<Record<ModelName, LoadMode>>>({})
  const [saved,     setSaved]     = useState<Partial<Record<ModelName, boolean>>>({})

  function refresh() {
    const next: Record<string, KeyMode> = {}
    for (const m of [...API_MODELS, ...MANUAL_MODELS]) {
      next[m] = getKeyMode(m)
    }
    setModes(next)
  }

  useEffect(() => { refresh() }, [])

  function handleLoad(model: ModelName) {
    const raw = (inputs[model] ?? '').trim()
    if (!raw) return
    const mode = loadModes[model] ?? 'local'
    if (mode === 'session') setKeySession(model, raw)
    else setKey(model, raw)
    refresh()
    setInputs(prev => ({ ...prev, [model]: '' }))
    setSaved(prev => ({ ...prev, [model]: true }))
    setTimeout(() => setSaved(prev => ({ ...prev, [model]: false })), 1800)
  }

  function handleRevoke(model: ModelName) {
    clearKey(model)
    refresh()
  }

  function handleClearLocal() {
    clearAllKeys()
    refresh()
  }

  function handleClearSession() {
    clearAllSessionKeys()
    refresh()
  }

  const hasAnyLocal   = API_MODELS.some(m => modes[m] === 'local')
  const hasAnySession = API_MODELS.some(m => modes[m] === 'session')

  return (
    <>
      <style>{`
        .byok-card:hover { border-color: rgba(230,237,247,0.1) !important; }
        .byok-load:hover:not(:disabled) { background: rgba(197,162,111,0.2) !important; }
        .byok-revoke:hover { color: #f87171 !important; }
        .byok-clear:hover  { color: #f87171 !important; }
        .byok-mode-btn:hover { border-color: rgba(230,237,247,0.18) !important; }
      `}</style>

      <div style={{ padding: '32px 24px', maxWidth: 600, fontFamily: 'system-ui, -apple-system, sans-serif', color: S.text }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: S.accent, margin: '0 0 8px' }}>
            Layer 1
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 6px', color: S.text }}>BYOK Gate</h1>
          <p style={{ fontSize: 14, color: S.muted, margin: 0, lineHeight: 1.6 }}>
            Bring your own API keys. Keys stay in this browser — never sent to any server.
          </p>
        </div>

        {/* Warning */}
        <div style={{
          padding:      '12px 14px',
          background:   'rgba(197,162,111,0.06)',
          border:       '1px solid rgba(197,162,111,0.2)',
          borderRadius: 8,
          marginBottom: 28,
          display:      'flex',
          gap:          10,
          alignItems:   'flex-start',
        }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>⚠</span>
          <p style={{ fontSize: 13, color: 'rgba(230,237,247,0.6)', margin: 0, lineHeight: 1.55 }}>
            Keys are stored locally in this browser unless session-only mode is used. Session-only keys are cleared when this tab closes.
          </p>
        </div>

        {/* API key models */}
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: S.faint, marginBottom: 12 }}>
          API Keys
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
          {API_MODELS.map(model => {
            const meta  = MODEL_META[model]
            const mode  = modes[model] ?? null
            const chip  = statusChip(mode)
            const lMode = loadModes[model] ?? 'local'

            return (
              <div
                key={model}
                className="byok-card"
                style={{
                  border:       `1px solid ${mode ? 'rgba(197,162,111,0.2)' : S.border}`,
                  borderRadius: 10,
                  background:   mode ? 'rgba(197,162,111,0.03)' : S.panel,
                  overflow:     'hidden',
                  transition:   'border-color 0.15s ease',
                }}
              >
                {/* Card header */}
                <div style={{
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'space-between',
                  padding:        '12px 14px',
                  borderBottom:   `1px solid ${S.border}`,
                }}>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 600, color: S.text, margin: 0 }}>{meta.label}</p>
                    <p style={{ fontSize: 12, color: S.faint, margin: '2px 0 0' }}>{meta.role}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      fontSize:     12,
                      padding:      '3px 10px',
                      borderRadius: 20,
                      color:        chip.color,
                      background:   chip.bg,
                      whiteSpace:   'nowrap',
                    }}>
                      {chip.label}
                    </span>
                    {mode && (
                      <button
                        onClick={() => handleRevoke(model)}
                        className="byok-revoke"
                        style={{ fontSize: 12, color: S.faint, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', transition: 'color 0.15s ease' }}
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                </div>

                {/* Key input area */}
                <div style={{ padding: '12px 14px' }}>
                  {/* Mode toggle */}
                  <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                    {(['local', 'session'] as LoadMode[]).map(m => (
                      <button
                        key={m}
                        onClick={() => setLoadModes(prev => ({ ...prev, [model]: m }))}
                        className="byok-mode-btn"
                        style={{
                          padding:      '5px 12px',
                          borderRadius: 6,
                          fontSize:     12,
                          border:       `1px solid ${lMode === m ? (m === 'session' ? 'rgba(59,130,246,0.4)' : 'rgba(197,162,111,0.4)') : S.border}`,
                          background:   lMode === m ? (m === 'session' ? 'rgba(59,130,246,0.08)' : 'rgba(197,162,111,0.08)') : 'transparent',
                          color:        lMode === m ? (m === 'session' ? '#93c5fd' : S.accent) : S.faint,
                          cursor:       'pointer',
                          transition:   'all 0.12s ease',
                        }}
                      >
                        {m === 'local' ? 'Store locally' : 'Session only'}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="password"
                      value={inputs[model] ?? ''}
                      onChange={e => setInputs(prev => ({ ...prev, [model]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && handleLoad(model)}
                      placeholder={
                        mode
                          ? `Replace ${meta.label} key…`
                          : model === 'claude' ? 'sk-ant-…' : 'sk-…'
                      }
                      style={{
                        flex:         1,
                        background:   '#0D1117',
                        border:       `1px solid ${S.border}`,
                        borderRadius: 6,
                        padding:      '9px 12px',
                        fontSize:     13,
                        color:        S.text,
                        outline:      'none',
                        fontFamily:   'monospace',
                        minHeight:    40,
                      }}
                    />
                    <button
                      onClick={() => handleLoad(model)}
                      disabled={!inputs[model]?.trim()}
                      className="byok-load"
                      style={{
                        padding:      '0 18px',
                        height:       40,
                        background:   'rgba(197,162,111,0.12)',
                        border:       '1px solid rgba(197,162,111,0.3)',
                        borderRadius: 6,
                        fontSize:     13,
                        color:        S.accent,
                        cursor:       inputs[model]?.trim() ? 'pointer' : 'not-allowed',
                        opacity:      inputs[model]?.trim() ? 1 : 0.4,
                        transition:   'all 0.15s ease',
                        whiteSpace:   'nowrap',
                        flexShrink:   0,
                      }}
                    >
                      {saved[model] ? '✓ Saved' : mode ? 'Replace' : 'Load'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* External / manual models */}
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: S.faint, marginBottom: 12 }}>
          Externally Managed
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 36 }}>
          {MANUAL_MODELS.map(model => {
            const meta = MODEL_META[model]
            return (
              <div
                key={model}
                style={{
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'space-between',
                  padding:        '10px 14px',
                  border:         `1px solid ${S.border}`,
                  borderRadius:   8,
                  background:     S.panel,
                }}
              >
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500, color: S.muted, margin: 0 }}>{meta.label}</p>
                  <p style={{ fontSize: 12, color: S.faint, margin: '2px 0 0' }}>{meta.role}</p>
                </div>
                <span style={{ fontSize: 12, color: S.faint, background: 'rgba(230,237,247,0.04)', border: `1px solid ${S.border}`, padding: '3px 10px', borderRadius: 20 }}>
                  Manual
                </span>
              </div>
            )
          })}
        </div>

        {/* Clear actions */}
        {(hasAnyLocal || hasAnySession) && (
          <div style={{ borderTop: `1px solid ${S.border}`, paddingTop: 20, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {hasAnyLocal && (
              <button
                onClick={handleClearLocal}
                className="byok-clear"
                style={{ fontSize: 13, color: S.faint, background: 'none', border: 'none', cursor: 'pointer', padding: 0, transition: 'color 0.15s ease' }}
              >
                Clear all local keys
              </button>
            )}
            {hasAnySession && (
              <button
                onClick={handleClearSession}
                className="byok-clear"
                style={{ fontSize: 13, color: S.faint, background: 'none', border: 'none', cursor: 'pointer', padding: 0, transition: 'color 0.15s ease' }}
              >
                Clear session keys
              </button>
            )}
          </div>
        )}

      </div>
    </>
  )
}
