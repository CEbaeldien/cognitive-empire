'use client'
// ── Screen 6: Session Memory ─────────────────────────────────
// Memory items scoped to this session.
// No item appears here without an approval — enforced by FK schema.

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { MemoryItem, MemoryClassification } from '@/types/mmcp'

const CLASS_STYLE: Record<MemoryClassification, string> = {
  general:  'text-white/40  bg-white/5',
  doctrine: 'text-[#c9a96e] bg-[#c9a96e]/10',
  pattern:  'text-blue-300  bg-blue-900/20',
  decision: 'text-amber-300 bg-amber-900/20',
  canon:    'text-[#c9a96e] bg-[#c9a96e]/15 font-semibold',
}

export default function SessionMemoryPage() {
  const { id: sessionId } = useParams<{ id: string }>()
  const supabase = createClient()

  const [items, setItems] = useState<MemoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('memory_items')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })

      if (error) console.error('[SessionMemory] load:', error)
      setItems((data ?? []) as MemoryItem[])
      setLoading(false)
    }
    load()
  }, [sessionId])

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-white">Session Memory</h1>
        <p className="text-sm text-white/40 mt-0.5">
          Approved outcomes for this session. {items.length} item{items.length !== 1 ? 's' : ''}.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-white/30">Loading…</p>
      ) : items.length === 0 ? (
        <div className="text-center py-20 border border-white/5 rounded-lg">
          <p className="text-white/30 text-sm">No memory items yet.</p>
          <p className="text-white/20 text-xs mt-1">Approve a synthesis and save to memory.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="p-4 border border-white/8 rounded-lg">
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
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
