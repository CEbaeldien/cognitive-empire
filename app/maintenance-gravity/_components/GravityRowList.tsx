'use client'

const GRAVITY_ROWS = [
  'Automations exist without clear ownership',
  'Reviews become ceremonial',
  'Integrations break without detection',
  'Teams depend on systems they cannot explain',
  'Escalation paths are undefined',
  'Human approval exists without real authority or context',
  'Every new tool adds hidden complexity rather than removing it',
]

export function GravityRowList() {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#0D1524] overflow-hidden">
      {GRAVITY_ROWS.map((row, i) => (
        <div
          key={i}
          className="gravity-row flex items-center justify-between px-5 py-[13px] border-b border-white/[0.05] last:border-b-0 cursor-default"
        >
          <span className="gravity-row-text text-[#8B9AB3] text-[0.85rem] leading-relaxed">
            {row}
          </span>
          <span className="gravity-row-marker flex-shrink-0 ml-3 text-[#C5A26F] text-xs font-mono opacity-0">
            ›
          </span>
        </div>
      ))}
    </div>
  )
}
