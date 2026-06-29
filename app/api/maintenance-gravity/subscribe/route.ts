import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 10

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, name, tier } = body as { email?: string; name?: string; tier?: string }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    const safeTier = ['starter', 'operator'].includes(tier ?? '') ? tier! : 'starter'

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const { error } = await supabase.from('mg_waitlist').insert({
      email: email.trim().toLowerCase(),
      name:  typeof name === 'string' && name.trim() ? name.trim() : null,
      tier:  safeTier,
    })

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ ok: true, duplicate: true })
      }
      throw error
    }

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    console.error('[mg-subscribe]', err)
    return NextResponse.json({ error: 'Failed to join waitlist' }, { status: 500 })
  }
}
