'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function MmcpLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.replace('/auth/login')
      else setChecking(false)
    })
  }, [router])

  if (checking) {
    return (
      <div className="min-h-screen bg-[#0a0c0f] flex items-center justify-center">
        <p className="text-xs text-white/20">Verifying access…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0c0f] flex">
      <nav className="w-52 border-r border-white/5 flex flex-col py-6 px-4 gap-1 shrink-0">
        <p className="text-[10px] text-[#c9a96e] uppercase tracking-widest px-2 mb-3">MMCP Engine</p>
        <NavLink href="/dashboard" active={pathname === '/dashboard'}>Sessions</NavLink>
        <NavLink href="/memory" active={pathname === '/memory'}>Memory / Canon</NavLink>
      </nav>
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={`px-2 py-1.5 text-sm rounded transition-colors ${
        active ? 'text-white bg-white/8' : 'text-white/40 hover:text-white/70 hover:bg-white/4'
      }`}
    >
      {children}
    </Link>
  )
}
