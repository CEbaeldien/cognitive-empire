import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { rateLimit, getClientIp } from '@/lib/rateLimit'

export const maxDuration = 10

const BANDS = [
  'Light',
  'Manageable Drag',
  'Operational Weight',
  'Fragility Zone',
  'Collapse Risk',
] as const

function cap(value: string, max: number): string {
  return value.slice(0, max)
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    if (!rateLimit(`mg-score:${ip}`, 5, 10 * 60 * 1000)) {
      return NextResponse.json({ error: 'Too many requests. Try again in a few minutes.' }, { status: 429 })
    }

    const body = await req.json()
    const { headline, dump, ownerless, loops, gravityScore, band, analysis, fastestWin } =
      body as Record<string, unknown>

    if (typeof gravityScore !== 'number' || !Number.isFinite(gravityScore) || gravityScore < 0 || gravityScore > 100) {
      return NextResponse.json({ error: 'Invalid gravity score' }, { status: 400 })
    }
    if (typeof band !== 'string' || !(BANDS as readonly string[]).includes(band)) {
      return NextResponse.json({ error: 'Invalid band' }, { status: 400 })
    }

    const safeOwnerless = typeof ownerless === 'number' && Number.isFinite(ownerless)
      ? Math.max(0, Math.min(9999, Math.round(ownerless)))
      : 0
    const safeLoops = typeof loops === 'number' && Number.isFinite(loops)
      ? Math.max(0, Math.min(9999, Math.round(loops)))
      : 0

    const context = cap(
      [typeof headline === 'string' ? headline : '', typeof dump === 'string' ? dump : '']
        .filter(Boolean)
        .join('\n\n'),
      4000,
    )

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    )

    const { data, error } = await supabase
      .from('mg_scores')
      .insert({
        gravity_score: Math.round(gravityScore),
        ownerless: safeOwnerless,
        loops: safeLoops,
        band,
        analysis: cap(typeof analysis === 'string' ? analysis : '', 1000),
        fastest_win: cap(typeof fastestWin === 'string' ? fastestWin : '', 500),
        context,
      })
      .select('id, created_at')
      .single()

    if (error) throw error

    return NextResponse.json({ id: data.id, createdAt: data.created_at })
  } catch (err: unknown) {
    console.error('[mg-score]', err)
    return NextResponse.json({ error: 'Failed to save score' }, { status: 500 })
  }
}
