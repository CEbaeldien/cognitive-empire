'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import { usePathname, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const S = {
  bg:     '#05070B',
  text:   '#E6EDF7',
  accent: '#C5A26F',
  muted:  'rgba(230,237,247,0.45)',
  faint:  'rgba(230,237,247,0.18)',
  border: 'rgba(230,237,247,0.07)',
} as const

type LayerState = 'locked' | 'available' | 'active' | 'complete'

interface Layer {
  label:    string
  slug:     string   // last path segment
  route:    string   // actual href suffix (may differ from slug for shared routes)
}

const LAYERS: Layer[] = [
  { label: 'Mission',    slug: 'mission',    route: 'mission'    },
  { label: 'Reasoning',  slug: 'oep',        route: 'oep'        },
  { label: 'Challenge',  slug: 'oep',        route: 'oep'        },
  { label: 'Comparison', slug: 'comparison', route: 'comparison' },
  { label: 'Synthesis',  slug: 'synthesis',  route: 'synthesis'  },
  { label: 'Approval',   slug: 'approval',   route: 'approval'   },
  { label: 'Memory',     slug: 'memory',     route: 'memory'     },
  { label: 'Timeline',   slug: 'timeline',   route: 'timeline'   },
]

interface GateState {
  hasMission:     boolean
  outputCount:    number
  hasComparison:  boolean
  hasSynthesis:   boolean
  hasApproval:    boolean
  memoryCount:    number
  loading:        boolean
}

function deriveLayerState(layer: Layer, gate: GateState, isActive: boolean): LayerState {
  if (isActive)                     return 'active'
  switch (layer.label) {
    case 'Mission':
      return gate.hasMission ? 'complete' : 'available'
    case 'Reasoning':
      if (!gate.hasMission)         return 'locked'
      return gate.outputCount >= 1  ? 'complete' : 'available'
    case 'Challenge':
      if (!gate.hasMission || gate.outputCount < 1) return 'locked'
      return gate.outputCount >= 2  ? 'complete' : 'available'
    case 'Comparison':
      if (gate.outputCount < 2)     return 'locked'
      return gate.hasComparison     ? 'complete' : 'available'
    case 'Synthesis':
      if (!gate.hasComparison)      return 'locked'
      return gate.hasSynthesis      ? 'complete' : 'available'
    case 'Approval':
      if (!gate.hasSynthesis)       return 'locked'
      return gate.hasApproval       ? 'complete' : 'available'
    case 'Memory':
      return gate.memoryCount > 0   ? 'complete' : 'available'
    case 'Timeline':
      return 'available'
    default:
      return 'available'
  }
}

function layerPillStyle(state: LayerState): CSSProperties {
  const base: CSSProperties = {
    display:        'flex',
    alignItems:     'center',
    gap:            5,
    padding:        '6px 12px',
    borderRadius:   20,
    fontSize:       12,
    fontWeight:     500,
    whiteSpace:     'nowrap',
    cursor:         state === 'locked' ? 'default' : 'pointer',
    textDecoration: 'none',
    transition:     'all 0.12s ease',
    flexShrink:     0,
    userSelect:     'none',
  }
  switch (state) {
    case 'active':
      return { ...base, background: 'rgba(197,162,111,0.15)', border: '1px solid rgba(197,162,111,0.4)', color: S.accent }
    case 'complete':
      return { ...base, background: 'rgba(230,237,247,0.05)', border: '1px solid rgba(230,237,247,0.12)', color: S.muted }
    case 'available':
      return { ...base, background: 'transparent', border: `1px solid ${S.border}`, color: S.faint }
    case 'locked':
      return { ...base, background: 'transparent', border: `1px solid rgba(230,237,247,0.04)`, color: 'rgba(230,237,247,0.15)', pointerEvents: 'none' }
  }
}

export default function SessionLayout({ children }: { children: React.ReactNode }) {
  const { id }   = useParams<{ id: string }>()
  const pathname = usePathname()

  const [gate, setGate] = useState<GateState>({
    hasMission:    false,
    outputCount:   0,
    hasComparison: false,
    hasSynthesis:  false,
    hasApproval:   false,
    memoryCount:   0,
    loading:       true,
  })

  useEffect(() => {
    if (!id) return
    const supabase = createClient()

    async function load() {
      const [
        missionRes,
        outputsRes,
        comparisonRes,
        synthesisRes,
        approvalRes,
        memoryRes,
      ] = await Promise.all([
        supabase.from('mission_briefs').select('id').eq('session_id', id).limit(1),
        supabase.from('model_outputs').select('id').eq('session_id', id),
        supabase.from('oep_comparisons').select('id').eq('session_id', id).eq('status', 'complete').limit(1),
        supabase.from('syntheses').select('id').eq('session_id', id).limit(1),
        supabase.from('approvals').select('id').eq('session_id', id).eq('decision', 'approve').limit(1),
        supabase.from('memory_items').select('id').eq('session_id', id),
      ])

      setGate({
        hasMission:    (missionRes.data?.length ?? 0) > 0,
        outputCount:   outputsRes.data?.length ?? 0,
        hasComparison: (comparisonRes.data?.length ?? 0) > 0,
        hasSynthesis:  (synthesisRes.data?.length ?? 0) > 0,
        hasApproval:   (approvalRes.data?.length ?? 0) > 0,
        memoryCount:   memoryRes.data?.length ?? 0,
        loading:       false,
      })
    }

    void load()
  }, [id])

  // Determine active layer from pathname
  const activeSlug = pathname.split('/').at(-1) ?? ''

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>

      {/* ── Layer nav strip ───────────────────────────────────── */}
      <nav style={{
        display:          'flex',
        alignItems:       'center',
        gap:              6,
        padding:          '10px 16px',
        borderBottom:     `1px solid ${S.border}`,
        overflowX:        'auto',
        scrollbarWidth:   'none',
        flexShrink:       0,
      }}>
        <style>{`nav::-webkit-scrollbar { display: none; }`}</style>

        {LAYERS.map((layer, idx) => {
          const isActive = activeSlug === layer.route && layer.label === LAYERS.find(l => l.route === layer.route && activeSlug === l.route)?.label
            ? (() => {
                // For OEP (shared route), both Reasoning and Challenge show as active when on /oep
                return activeSlug === layer.route
              })()
            : activeSlug === layer.route

          const state  = gate.loading ? 'available' : deriveLayerState(layer, gate, isActive)
          const href   = `/sessions/${id}/${layer.route}`
          const pill   = layerPillStyle(state)

          const dot: CSSProperties = {
            width:        6,
            height:       6,
            borderRadius: '50%',
            background:   state === 'active'   ? S.accent
                        : state === 'complete' ? 'rgba(230,237,247,0.35)'
                        : 'rgba(230,237,247,0.1)',
            flexShrink:   0,
          }

          return state === 'locked' ? (
            <div key={`${layer.label}-${idx}`} style={pill}>
              <div style={dot} />
              {layer.label}
            </div>
          ) : (
            <Link key={`${layer.label}-${idx}`} href={href} style={pill}>
              <div style={dot} />
              {layer.label}
            </Link>
          )
        })}
      </nav>

      {/* ── Page content ──────────────────────────────────────── */}
      <div style={{ flex: 1 }}>
        {children}
      </div>

    </div>
  )
}
