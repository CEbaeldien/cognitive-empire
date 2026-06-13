'use client'

import { useEffect, useState } from 'react'

/* ─────────────────────────────────────────────────────────
   MiniIndexClient
   Desktop left-rail navigation with active section
   highlighting via scroll position tracking.
   Keyboard shortcut: ? → jump to Eight Laws.
───────────────────────────────────────────────────────── */

const NAV_ITEMS = [
  { id: 'prime-doctrine',       label: '01 — The Prime Doctrine' },
  { id: 'judgment',             label: '02 — Judgment Is Power' },
  { id: 'eight-laws',           label: '03 — The Eight Laws' },
  { id: 'signal-noise',         label: '04 — Signal vs. Noise' },
  { id: 'bottleneck',           label: '05 — Bottleneck Migration' },
  { id: 'modular',              label: '06 — Modular Cognition' },
  { id: 'half-life',            label: '07 — Decision Half-Life' },
  { id: 'failure-modes',        label: '08 — Failure Modes of Abundance' },
  { id: 'governance',           label: '09 — Governance Under Abundance' },
  { id: 'strategic-imperfection', label: '10 — Strategic Imperfection' },
  { id: 'agentic-commerce',     label: '11 — Agentic Commerce' },
  { id: 'agent-engine',         label: '12 — Agent Engine Optimization' },
  { id: 'great-filter',         label: '13 — The Great Filter' },
  { id: 'renaissance',          label: '14 — The Renaissance Operator' },
  { id: 'maintenance',          label: '15 — Maintenance Gravity' },
  { id: 'survivable',           label: '16 — Survivable Systems' },
  { id: 'direction',            label: '17 — Direction Without Prediction' },
  { id: 'physical',             label: '18 — Physical Constraints' },
  { id: 'second-order',         label: '19 — Second-Order Effects' },
  { id: 'signals',              label: '20 — Signals Application' },
  { id: 'closing',              label: '21 — Closing Doctrine' },
] as const

export function MiniIndexClient() {
  const [activeId, setActiveId] = useState<string>('')

  /* Active section tracking via scroll position */
  useEffect(() => {
    const OFFSET = 160

    const detectActive = () => {
      let current = ''
      for (const item of NAV_ITEMS) {
        const el = document.getElementById(item.id)
        if (!el) continue
        if (el.getBoundingClientRect().top <= OFFSET) {
          current = item.id
        }
      }
      setActiveId(current)
    }

    window.addEventListener('scroll', detectActive, { passive: true })
    detectActive()
    return () => window.removeEventListener('scroll', detectActive)
  }, [])

  /* Keyboard shortcut: ? → jump to Eight Laws */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === '?' && (document.activeElement as HTMLElement)?.tagName === 'BODY') {
        e.preventDefault()
        document.getElementById('eight-laws')?.scrollIntoView({ behavior: 'smooth' })
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  return (
    <aside
      aria-label="Doctrine contents"
      className="hidden xl:block w-72 flex-shrink-0 border-r border-white/10 pt-14 pl-9 pr-6 sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto text-sm print:hidden"
    >
      <nav>
        <div className="uppercase tracking-[2.5px] text-[10px] text-[#5E6B80] mb-5 pl-1 select-none">
          CONTENTS
        </div>
        <div className="space-y-[3px]">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="mini-index-link block py-[5px]"
              data-active={activeId === item.id ? 'true' : undefined}
            >
              {item.label}
            </a>
          ))}
        </div>
      </nav>
    </aside>
  )
}
