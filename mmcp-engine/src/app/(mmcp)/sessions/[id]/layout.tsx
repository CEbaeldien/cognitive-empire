'use client'

import Link from 'next/link'
import { usePathname, useParams } from 'next/navigation'

const STEPS = [
  { slug: 'mission',    label: '1. Mission' },
  { slug: 'oep',        label: '2. OEP' },
  { slug: 'comparison', label: '3. Comparison' },
  { slug: 'synthesis',  label: '4. Synthesis' },
  { slug: 'memory',     label: '5. Memory' },
]

export default function SessionLayout({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>()
  const pathname = usePathname()

  return (
    <div className="flex flex-col min-h-full">
      <nav className="flex items-center gap-1 px-6 py-3 border-b border-white/5 overflow-x-auto">
        {STEPS.map(step => {
          const href = `/sessions/${id}/${step.slug}`
          const isActive = pathname === href
          return (
            <Link
              key={step.slug}
              href={href}
              className={`whitespace-nowrap px-3 py-1.5 text-xs rounded transition-colors ${
                isActive
                  ? 'text-[#c9a96e] bg-[#c9a96e]/10 border border-[#c9a96e]/20'
                  : 'text-white/35 hover:text-white/60'
              }`}
            >
              {step.label}
            </Link>
          )
        })}
      </nav>
      <div className="flex-1">
        {children}
      </div>
    </div>
  )
}
