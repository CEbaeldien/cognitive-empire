// ============================================================
// MMCP ENGINE v1 — Anthropic (Claude) proxy
// Key arrives in request body, is used once, never logged,
// never stored. Auth required — rejects without valid session.
// Model: claude-sonnet-4-6
// ============================================================

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'
const MODEL         = 'claude-sonnet-4-6'
const MAX_TOKENS    = 4096

export async function POST(request: NextRequest) {
  // ── Auth check ─────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Parse body ─────────────────────────────────────────────
  let key: string, prompt: string
  try {
    const body = await request.json() as { key?: string; prompt?: string }
    key    = body.key?.trim()    ?? ''
    prompt = body.prompt?.trim() ?? ''
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!key || !prompt) {
    return NextResponse.json({ error: 'key and prompt are required' }, { status: 400 })
  }

  // ── Call Anthropic ─────────────────────────────────────────
  let res: Response
  try {
    res = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'x-api-key':         key,
        'anthropic-version': '2023-06-01',
        'content-type':      'application/json',
      },
      body: JSON.stringify({
        model:      MODEL,
        max_tokens: MAX_TOKENS,
        messages:   [{ role: 'user', content: prompt }],
      }),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error'
    return NextResponse.json({ error: `Anthropic unreachable: ${message}` }, { status: 502 })
  }

  // ── Parse provider response ────────────────────────────────
  const data = await res.json() as {
    content?: { type: string; text: string }[]
    usage?:   { input_tokens: number; output_tokens: number }
    error?:   { message: string }
  }

  if (!res.ok || data.error) {
    // Surface the provider's error message — key is not included in it
    const msg = data.error?.message ?? `Anthropic error ${res.status}`
    return NextResponse.json({ error: msg }, { status: res.status })
  }

  const output     = data.content?.find(b => b.type === 'text')?.text ?? ''
  const tokenCount = (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0)

  return NextResponse.json({ output, tokenCount })
}
