import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { rateLimit, getClientIp } from '@/lib/rateLimit'

export const maxDuration = 10

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }

    const ip = getClientIp(req)
    if (!rateLimit(`mg-score-patch:${ip}`, 20, 10 * 60 * 1000)) {
      return NextResponse.json({ error: 'Too many requests. Try again in a few minutes.' }, { status: 429 })
    }

    const body = await req.json()
    const { email, name, testimonialPermission, testimonial, auditInterest } =
      body as Record<string, unknown>

    const update: Record<string, unknown> = {}

    if (email !== undefined) {
      if (typeof email !== 'string' || !email.includes('@') || email.length > 254) {
        return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
      }
      update.email = email.trim().toLowerCase().slice(0, 254)
    }
    if (name !== undefined) {
      update.name = typeof name === 'string' && name.trim() ? name.trim().slice(0, 200) : null
    }
    if (testimonialPermission !== undefined) {
      update.testimonial_permission = testimonialPermission === true
    }
    if (testimonial !== undefined) {
      update.testimonial = typeof testimonial === 'string' && testimonial.trim()
        ? testimonial.trim().slice(0, 280)
        : null
    }
    if (auditInterest !== undefined) {
      update.audit_interest = auditInterest === true
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    )

    const { error } = await supabase.from('mg_scores').update(update).eq('id', id)
    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    console.error('[mg-score-patch]', err)
    return NextResponse.json({ error: 'Failed to update score' }, { status: 500 })
  }
}
