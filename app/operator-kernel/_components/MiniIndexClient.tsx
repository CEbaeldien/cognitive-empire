'use client'

import { useEffect, useState } from 'react'

/* ─────────────────────────────────────────────────────────
   MiniIndexClient
   Desktop left-rail navigation with active section
   highlighting via scroll position tracking.
   Keyboard shortcut: ? → jump to Eight Laws.
───────────────────────────────────────────────────────── */

type NavEntry =
  | { kind: 'link';    id: string; label: string; cmd?: true }
  | { kind: 'divider'; id: string; label: string }

const NAV_ITEMS: NavEntry[] = [
  // ── Command Center ──────────────────────────────────
  { kind: 'link',    id: 'cmd-header',           label: 'Command Center',        cmd: true },
  { kind: 'link',    id: 'module-mission',        label: 'M-01 — Mission',        cmd: true },
  { kind: 'link',    id: 'module-signals',        label: 'M-02 — Signals',        cmd: true },
  { kind: 'link',    id: 'module-gravity',        label: 'M-03 — Gravity',        cmd: true },
  { kind: 'link',    id: 'module-approvals',      label: 'M-04 — Approvals',      cmd: true },
  { kind: 'link',    id: 'module-ops',            label: 'M-05 — Ops Depth',      cmd: true },
  { kind: 'link',    id: 'module-memory',         label: 'M-06 — Memory',         cmd: true },
  { kind: 'link',    id: 'module-review',         label: 'M-07 — Review',         cmd: true },
  // ── Canon ────────────────────────────────────────────
  { kind: 'divider', id: '__canon__',             label: 'Canon' },
  { kind: 'link',    id: 'prime-doctrine',        label: '01 — Prime Doctrine'     },
  { kind: 'link',    id: 'judgment',              label: '02 — Judgment'           },
  { kind: 'link',    id: 'eight-laws',            label: '03 — The Eight Laws'     },
  { kind: 'link',    id: 'signal-noise',          label: '04 — Signal vs. Noise'   },
  { kind: 'link',    id: 'bottleneck',            label: '05 — Bottleneck'         },
  { kind: 'link',    id: 'modular',               label: '06 — Modular Cognition'  },
  { kind: 'link',    id: 'half-life',             label: '07 — Decision Half-Life' },
  { kind: 'link',    id: 'failure-modes',         label: '08 — Failure Modes'      },
  { kind: 'link',    id: 'governance',            label: '09 — Governance'         },
  { kind: 'link',    id: 'strategic-imperfection',label: '10 — Str. Imperfection'  },
  { kind: 'link',    id: 'agentic-commerce',      label: '11 — Agentic Commerce'   },
  { kind: 'link',    id: 'agent-engine',          label: '12 — Agent Engine'       },
  { kind: 'link',    id: 'great-filter',          label: '13 — Great Filter'       },
  { kind: 'link',    id: 'renaissance',           label: '14 — Renaissance'        },
  { kind: 'link',    id: 'maintenance',           label: '15 — Maintenance'        },
  { kind: 'link',    id: 'survivable',            label: '16 — Survivable'         },
  { kind: 'link',    id: 'direction',             label: '17 — Direction'          },
  { kind: 'link',    id: 'physical',              label: '18 — Physical'           },
  { kind: 'link',    id: 'second-order',          label: '19 — Second-Order'       },
  { kind: 'link',    id: 'signals',               label: '20 — Signals'            },
  { kind: 'link',    id: 'closing',               label: '21 — Closing'            },
]

export function MiniIndexClient() {
  const [activeId, setActiveId] = useState<string>('')

  /* Active section tracking via scroll position */
  useEffect(() => {
    const OFFSET = 160

    const detectActive = () => {
      let current = ''
      for (const item of NAV_ITEMS) {
        if (item.kind !== 'link') continue
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
      aria-label="Contents"
      className="hidden xl:block w-72 flex-shrink-0 border-r border-white/10 pt-14 pl-9 pr-6 sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto text-sm print:hidden"
    >
      <nav>
        <div className="uppercase tracking-[2.5px] text-[10px] text-[#5E6B80] mb-5 pl-1 select-none">
          CONTENTS
        </div>
        <div className="space-y-[2px]">
          {NAV_ITEMS.map((item) => {
            if (item.kind === 'divider') {
              return (
                <div
                  key={item.id}
                  style={{
                    padding: '7px 4px 3px',
                    marginTop: 10,
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    fontSize: 8,
                    letterSpacing: '3px',
                    color: '#2A3548',
                    textTransform: 'uppercase',
                    fontFamily: 'monospace',
                    userSelect: 'none',
                  }}
                >
                  {item.label}
                </div>
              )
            }

            const isActive = activeId === item.id
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="mini-index-link block py-[5px]"
                data-active={isActive ? 'true' : undefined}
                style={item.cmd && !isActive ? { color: '#4A5570' } : undefined}
              >
                {item.label}
              </a>
            )
          })}
        </div>
      </nav>
    </aside>
  )
}
