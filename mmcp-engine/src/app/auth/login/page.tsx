'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (otpError) {
      setError(otpError.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0a0c0f] flex items-center justify-center">
      <div className="w-full max-w-sm px-6">
        <div className="mb-8 text-center">
          <p className="text-[10px] text-[#c9a96e] uppercase tracking-widest mb-2">MMCP Engine</p>
          <h1 className="text-lg font-semibold text-white">Principal Access</h1>
          <p className="text-sm text-white/40 mt-1">Magic link authentication</p>
        </div>

        {sent ? (
          <div className="text-center">
            <p className="text-sm text-white/70">Check your email for a sign-in link.</p>
            <p className="text-xs text-white/30 mt-2">{email}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#c9a96e]/40 transition-colors"
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full py-3 text-sm bg-[#c9a96e] text-black rounded font-medium hover:bg-[#b8934d] disabled:opacity-40 transition-colors"
            >
              {loading ? 'Sending…' : 'Send Magic Link'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
