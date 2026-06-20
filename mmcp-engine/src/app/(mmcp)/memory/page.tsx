'use client'
// ── Screen 6: Memory / Canon ─────────────────────────────────
// All approved memory items across all sessions (global view).
// Filterable by classification. Exportable as JSON dossier.
// No item appears here without an approval — enforced by FK schema.

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { MemoryItem, MemoryClassification } from '@/types/mmcp'

const CLASSIFICATIONS: MemoryClassification[] = ['general', 'doctrine', 'pattern', 'decision', 'canon']

const CLASS_STYLE: Record<MemoryClassification, string> = {
  general:  'text-white/40  bg-white/5',
  doctrine: 'text-[#c9a96e] bg-[#c9a96e]/10',
  pattern:  'text-blue-300  bg-blue-900/20',
  decision: 'text-amber-300 bg-amber-900/20',
  canon:    'text-[#c9a96e] bg-[#c9a96e]/15 font-semibold',
}

export default function MemoryPage() {
  const supabase = createClient()

  const [items, setItems] = useState<MemoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<MemoryClassification | 'all'>('all')
  const [search, setSearch] = useState('')

  // ── Load memory items ──────────────────────────────────────
  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('memory_items')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) console.error('[Memory] load:', error)
      setItems((data ?? []) as MemoryItem[])
      setLoading(false)
    }
    load()
  }, [])

  // ── Filter + search ────────────────────────────────────────
  const visible = items.filter(item => {
    const matchClass = filter === 'all' || item.classification === filter
    const matchSearch = !search.trim() ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.content.toLowerCase().includes(search.toLowerCase()) ||
      item.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
    return matchClass && matchSearch
  })

  // ── Export dossier ─────────────────────────────────────────
  function exportDossier() {
    const exportable = visible.filter(i => i.exportable)
    const blob = new Blob(
      [JSON.stringify({ exported_at: new Date().toISOString(), count: exportable.length, items: exportable }, null, 2)],
      { type: 'application/json' }
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mmcp-canon-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-white">Memory / Canon</h1>
          <p className="text-sm text-white/40 mt-0.5">Approved outcomes only. {items.length} total items.</p>
        </div>
        <button
          onClick={exportDossier}
          disabled={visible.length === 0}
          className="px-3 py-1.5 text-xs border border-[#c9a96e]/30 text-[#c9a96e] rounded hover:bg-[#c9a96e]/10 disabled:opacity-30 transition-colors"
        >
          Export Dossier ↓
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 text-xs rounded transition-colors ${filter === 'all' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}
        >
          All ({items.length})
        </button>
        {CLASSIFICATIONS.map(c => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`px-3 py-1 text-xs rounded transition-colors ${filter === c ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60'}`}
          >
            {c} ({items.filter(i => i.classification === c).length})
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search title, content, or tags…"
        className="w-full mb-5 bg-white/3 border border-white/8 rounded px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#c9a96e]/30 transition-colors"
      />

      {/* Items */}
      {loading ? (
        <p className="text-sm text-white/30">Loading…</p>
      ) : visible.length === 0 ? (
        <div className="text-center py-20 border border-white/5 rounded-lg">
          <p className="text-white/30 text-sm">No memory items yet.</p>
          <p className="text-white/20 text-xs mt-1">Approved syntheses create memory items.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map(item => (
            <div key={item.id} className="p-4 border border-white/8 rounded-lg hover:border-white/15 transition-colors">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="text-sm text-white font-medium">{item.title}</h3>
                <span className={`flex-shrink-0 text-[10px] px-2 py-0.5 rounded ${CLASS_STYLE[item.classification]}`}>
                  {item.classification}
                </span>
              </div>
              <p className="text-xs text-white/55 leading-relaxed mb-2">{item.content}</p>
              {item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {item.tags.map(tag => (
                    <span key={tag} className="text-[10px] text-white/30 bg-white/5 px-2 py-0.5 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-white/20 mt-2">
                {new Date(item.created_at).toLocaleDateString()}
                {!item.exportable && ' · private'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
