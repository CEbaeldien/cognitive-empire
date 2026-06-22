'use client'
// ── Key Management Panel ─────────────────────────────────────
// View, add, and revoke API keys stored in localStorage.
// Keys are per-model, global across sessions.
// Never written to DB. Explicit revoke required to remove.

import { useEffect, useState } from 'react'
import { MODEL_META, type ModelName } from '@/types/mmcp'
import { setKey, hasKey, clearKey, clearAllKeys, listLoadedModels } from '@/lib/mmcp/keys'

const API_MODELS: ModelName[] = ['claude', 'chatgpt']

export default function KeysPage() {
  const [loaded, setLoaded] = useState<Set<string>>(new Set())
  const [inputs, setInputs] = useState<Partial<Record<ModelName, string>>>({})
  const [saved, setSaved] = useState<Partial<Record<ModelName, boolean>>>({})

  // Read localStorage on mount (client only)
  useEffect(() => {
    setLoaded(new Set(listLoadedModels()))
  }, [])

  function handleLoad(model: ModelName) {
    const raw = (inputs[model] ?? '').trim()
    if (!raw) return
    setKey(model, raw)
    setLoaded(new Set(listLoadedModels()))
    setInputs(prev => ({ ...prev, [model]: '' }))
    setSaved(prev => ({ ...prev, [model]: true }))
    setTimeout(() => setSaved(prev => ({ ...prev, [model]: false })), 1800)
  }

  function handleRevoke(model: ModelName) {
    clearKey(model)
    setLoaded(new Set(listLoadedModels()))
  }

  function handleClearAll() {
    clearAllKeys()
    setLoaded(new Set())
  }

  return (
    <div className="p-8 max-w-xl mx-auto">
      <div className="mb-8">
        <h1 className="text-lg font-semibold text-white">API Key Management</h1>
        <p className="text-sm text-white/40 mt-1">
          Keys are stored in your browser&apos;s localStorage. They persist across reloads and tabs
          on this device. They are never sent to our database.
        </p>
      </div>

      <div className="space-y-4">
        {API_MODELS.map(model => {
          const meta      = MODEL_META[model]
          const isLoaded  = loaded.has(model)
          const wasSaved  = saved[model]

          return (
            <div
              key={model}
              className={`border rounded-lg p-4 transition-colors ${
                isLoaded ? 'border-[#c9a96e]/25 bg-[#c9a96e]/3' : 'border-white/8 bg-white/2'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-white">{meta.label}</p>
                  <p className="text-xs text-white/30 mt-0.5">{meta.role}</p>
                </div>
                <div className="flex items-center gap-2">
                  {isLoaded ? (
                    <>
                      <span className="text-[10px] text-[#c9a96e] bg-[#c9a96e]/10 px-2 py-0.5 rounded">
                        key loaded
                      </span>
                      <button
                        onClick={() => handleRevoke(model)}
                        className="text-xs text-white/30 hover:text-red-400 transition-colors"
                      >
                        Revoke
                      </button>
                    </>
                  ) : (
                    <span className="text-[10px] text-white/20 bg-white/5 px-2 py-0.5 rounded">
                      no key
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="password"
                  value={inputs[model] ?? ''}
                  onChange={e => setInputs(prev => ({ ...prev, [model]: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && handleLoad(model)}
                  placeholder={
                    isLoaded
                      ? `Replace ${meta.label} key…`
                      : model === 'claude'
                      ? 'sk-ant-…'
                      : 'sk-…'
                  }
                  className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[#c9a96e]/30 font-mono transition-colors"
                />
                <button
                  onClick={() => handleLoad(model)}
                  disabled={!inputs[model]?.trim()}
                  className="px-4 py-2 text-xs bg-[#c9a96e]/15 border border-[#c9a96e]/30 text-[#c9a96e] rounded hover:bg-[#c9a96e]/25 disabled:opacity-30 transition-colors"
                >
                  {wasSaved ? 'Saved ✓' : isLoaded ? 'Replace' : 'Load'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {loaded.size > 0 && (
        <div className="mt-8 pt-6 border-t border-white/6">
          <button
            onClick={handleClearAll}
            className="text-xs text-white/25 hover:text-red-400 transition-colors"
          >
            Revoke all keys
          </button>
        </div>
      )}

      <p className="mt-6 text-xs text-white/15">
        Keys are written to localStorage on this device only. Clearing browser data or revoking
        here removes them permanently.
      </p>
    </div>
  )
}
