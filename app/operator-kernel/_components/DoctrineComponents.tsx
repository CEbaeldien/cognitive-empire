import type { ReactNode } from 'react'

/* ═══════════════════════════════════════════════════════
   SectionShell
════════════════════════════════════════════════════════ */
interface SectionShellProps {
  id: string
  className?: string
  children: ReactNode
}

export function SectionShell({ id, className = '', children }: SectionShellProps) {
  return (
    <section id={id} className={`section-shell ${className}`}>
      {children}
    </section>
  )
}

/* ═══════════════════════════════════════════════════════
   CanonPlate
════════════════════════════════════════════════════════ */
interface CanonPlateProps {
  children: ReactNode
  className?: string
  centered?: boolean
}

export function CanonPlate({ children, className = '', centered = false }: CanonPlateProps) {
  return (
    <div className={`canon-plate p-7 ${centered ? 'text-center' : ''} ${className}`}>
      {children}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   CommandFrame
   Gold 1px border + 24px corner bracket arms, CSS only.
════════════════════════════════════════════════════════ */
interface CommandFrameProps {
  children: ReactNode
  className?: string
}

export function CommandFrame({ children, className = '' }: CommandFrameProps) {
  return (
    <div className={`command-frame ${className}`}>
      <span className="cf-corner cf-tl" aria-hidden="true" />
      <span className="cf-corner cf-tr" aria-hidden="true" />
      <span className="cf-corner cf-bl" aria-hidden="true" />
      <span className="cf-corner cf-br" aria-hidden="true" />
      {children}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   LawCard
   Eight Laws 2×4 premium grid card.
════════════════════════════════════════════════════════ */
interface LawCardProps {
  numeral: string
  title: string
  description: string
}

export function LawCard({ numeral, title, description }: LawCardProps) {
  return (
    <div className="law-card ce-card rounded-2xl p-7 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="font-mono text-[#C5A26F] text-xs tracking-[3.5px]">{numeral}</span>
        <span className="h-px flex-1 bg-white/8" />
      </div>
      <div className="font-semibold tracking-tight text-[#F4F7FB] leading-snug">{title}</div>
      <p className="text-[#8B9AB3] leading-relaxed text-sm">{description}</p>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   MigrationBoard
   Section 05 — Bottleneck Migration.
════════════════════════════════════════════════════════ */
const MIGRATIONS = [
  { from: 'Production',  to: 'SELECTION'     },
  { from: 'Execution',   to: 'OWNERSHIP'     },
  { from: 'Access',      to: 'ORCHESTRATION' },
  { from: 'Building',    to: 'GOVERNANCE'    },
  { from: 'Analysis',    to: 'RESPONSIBILITY' },
  { from: 'Creation',    to: 'CONTINUITY'    },
  { from: 'Visibility',  to: 'VERIFIABILITY' },
  { from: 'Speed',       to: 'SURVIVABILITY' },
]

export function MigrationBoard() {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0D1524] p-2 text-sm">
      {MIGRATIONS.map((row) => (
        <div key={row.from} className="migration-row flex justify-between items-center px-5 py-[13px]">
          <div className="text-[#E6EDF7]">{row.from}</div>
          <div className="font-mono text-[#C5A26F] text-xs tracking-widest">→ {row.to}</div>
        </div>
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   SignalQuestionCard
   Section 20 — The Four Questions.
════════════════════════════════════════════════════════ */
interface SignalQuestionCardProps {
  num: string
  question: string
}

export function SignalQuestionCard({ num, question }: SignalQuestionCardProps) {
  return (
    <div className="ce-card rounded-2xl p-6 flex gap-4">
      <span className="font-mono text-[#00D8FF] text-xs tracking-[2px] flex-shrink-0 mt-0.5">{num}</span>
      <span className="text-[#E6EDF7] leading-relaxed text-sm">{question}</span>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   StatExtract
   Section 01 right column — 4 structural shifts.
════════════════════════════════════════════════════════ */
interface StatExtractProps {
  verb: string
  change: string
}

export function StatExtract({ verb, change }: StatExtractProps) {
  return (
    <div className="stat-extract">
      <div className="stat-verb">{verb}</div>
      <div className="stat-change">{change}</div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   DoctrineChip
   Canon-extracted tag chips for Section 08.
════════════════════════════════════════════════════════ */
interface DoctrineChipProps {
  label: string
  type: 'danger' | 'warning' | 'info' | 'gold'
}

export function DoctrineChip({ label, type }: DoctrineChipProps) {
  return (
    <div className="doctrine-chip" data-type={type}>
      {label}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   DoctrinePanel
   Alternating treatment for sections 09–19.
   variant 'a': gold left border on ce-panel
   variant 'b': cyan left border on elevated panel
════════════════════════════════════════════════════════ */
interface DoctrinePanelProps {
  num: string
  id: string
  title: string
  content: string
  variant: 'a' | 'b'
}

export function DoctrinePanel({ num, id, title, content, variant }: DoctrinePanelProps) {
  return (
    <section id={id} className="section-shell">
      <div className={`doctrine-panel-${variant}`}>
        <div className="flex items-baseline gap-x-3 mb-3">
          <span className="section-number text-5xl font-semibold">{num}</span>
          <h3 className="font-semibold text-xl tracking-tight text-[#F4F7FB]">{title}</h3>
        </div>
        <div className="doctrine-prose">
          <p>{content}</p>
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════
   ModularCognitionViz
   Section 06 — node-graph abstract visualization.
════════════════════════════════════════════════════════ */
export function ModularCognitionViz() {
  return (
    <svg viewBox="0 0 220 130" aria-hidden="true" className="w-full max-w-[220px] opacity-70">
      {/* Connection lines */}
      <line x1="110" y1="65" x2="38"  y2="30"  stroke="rgba(0,216,255,0.25)" strokeWidth="0.7" strokeDasharray="3 3" />
      <line x1="110" y1="65" x2="38"  y2="100" stroke="rgba(0,216,255,0.25)" strokeWidth="0.7" strokeDasharray="3 3" />
      <line x1="110" y1="65" x2="182" y2="30"  stroke="rgba(0,216,255,0.25)" strokeWidth="0.7" strokeDasharray="3 3" />
      <line x1="110" y1="65" x2="182" y2="100" stroke="rgba(0,216,255,0.25)" strokeWidth="0.7" strokeDasharray="3 3" />
      <line x1="110" y1="65" x2="110" y2="10"  stroke="rgba(197,162,111,0.30)" strokeWidth="0.7" />
      {/* Peripheral nodes */}
      <circle cx="38"  cy="30"  r="5.5" fill="rgba(0,216,255,0.08)"  stroke="rgba(0,216,255,0.35)" strokeWidth="0.8" />
      <circle cx="38"  cy="100" r="5.5" fill="rgba(0,216,255,0.08)"  stroke="rgba(0,216,255,0.35)" strokeWidth="0.8" />
      <circle cx="182" cy="30"  r="5.5" fill="rgba(0,216,255,0.08)"  stroke="rgba(0,216,255,0.35)" strokeWidth="0.8" />
      <circle cx="182" cy="100" r="5.5" fill="rgba(0,216,255,0.08)"  stroke="rgba(0,216,255,0.35)" strokeWidth="0.8" />
      <circle cx="110" cy="10"  r="4.5" fill="rgba(197,162,111,0.12)" stroke="rgba(197,162,111,0.50)" strokeWidth="0.8" />
      {/* Central hub */}
      <circle cx="110" cy="65" r="11"  fill="rgba(0,216,255,0.10)"  stroke="rgba(0,216,255,0.55)" strokeWidth="1.2" />
      <circle cx="110" cy="65" r="4"   fill="rgba(0,216,255,0.60)" />
    </svg>
  )
}

/* ═══════════════════════════════════════════════════════
   DecisionHalfLifeViz
   Section 07 — decay curve abstract visualization.
════════════════════════════════════════════════════════ */
export function DecisionHalfLifeViz() {
  return (
    <svg viewBox="0 0 220 110" aria-hidden="true" className="w-full max-w-[220px] opacity-70">
      {/* Axes */}
      <line x1="18" y1="10" x2="18"  y2="94" stroke="rgba(255,255,255,0.08)" strokeWidth="0.6" />
      <line x1="18" y1="94" x2="210" y2="94" stroke="rgba(255,255,255,0.08)" strokeWidth="0.6" />
      {/* Zone label lines */}
      <line x1="18" y1="50" x2="210" y2="50" stroke="rgba(197,162,111,0.10)" strokeWidth="0.5" strokeDasharray="4 4" />
      {/* Slow decay curve (hold) */}
      <path d="M 18,18 C 60,18 130,46 210,52" fill="none" stroke="rgba(197,162,111,0.45)" strokeWidth="1.2" />
      {/* Fast decay curve (adapt) */}
      <path d="M 18,18 C 40,28 80,76 210,88" fill="none" stroke="rgba(0,216,255,0.35)" strokeWidth="1.0" strokeDasharray="2 2" />
      {/* Branching dot */}
      <circle cx="18" cy="18" r="3" fill="rgba(255,255,255,0.55)" />
      {/* End dots */}
      <circle cx="210" cy="52" r="2.5" fill="rgba(197,162,111,0.70)" />
      <circle cx="210" cy="88" r="2.5" fill="rgba(0,216,255,0.60)" />
    </svg>
  )
}
