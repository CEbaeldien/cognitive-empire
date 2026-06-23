import { requireFounder } from '@/utils/supabase/server'
import Link from 'next/link'

export default async function CEAdminPage() {
  await requireFounder()

  return (
    <div style={{ background: '#05070B', minHeight: '100vh', color: '#E6EDF7', fontFamily: 'var(--font-geist-sans), sans-serif', padding: '2.5rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <p style={{ color: '#C5A26F', fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          Cognitive Empire Systems
        </p>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 600, marginBottom: '2rem' }}>CE Admin</h1>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Link href="/ce-admin/dr-e" style={{ padding: '1rem 1.25rem', border: '1px solid rgba(230,237,247,0.1)', color: '#E6EDF7', textDecoration: 'none' }}>Dr. E</Link>
          <Link href="/ce-admin/runtime" style={{ padding: '1rem 1.25rem', border: '1px solid rgba(230,237,247,0.1)', color: '#E6EDF7', textDecoration: 'none' }}>CE Runtime</Link>
          <Link href="/ce-admin/signals" style={{ padding: '1rem 1.25rem', border: '1px solid rgba(230,237,247,0.1)', color: '#E6EDF7', textDecoration: 'none' }}>Signals Admin</Link>
          <Link href="/mmcp" style={{ padding: '1rem 1.25rem', border: '1px solid rgba(230,237,247,0.1)', color: '#E6EDF7', textDecoration: 'none' }}>MMCP</Link>
        </nav>
      </div>
    </div>
  )
}
