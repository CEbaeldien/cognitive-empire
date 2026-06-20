// ============================================================
// MMCP ENGINE v1 — OpenAI (ChatGPT) proxy
// Key arrives in request body, is used once, never logged,
// never stored. Auth required — rejects without valid session.
// Model: gpt-4o
// ============================================================

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const OPENAI_API = 'https://api.openai.com/v1/chat/completions'
const MODEL      = 'gpt-4o'

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

  // ── Call OpenAI ────────────────────────────────────────────
  let res: Response
  try {
    res = await fetch(OPENAI_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        model:    MODEL,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error'
    return NextResponse.json({ error: `OpenAI unreachable: ${message}` }, { status: 502 })
  }

  // ── Parse provider response ────────────────────────────────
  const data = await res.json() as {
    choices?: { message: { content: string } }[]
    usage?:   { prompt_tokens: number; completion_tokens: number }
    error?:   { message: string }
  }

  if (!res.ok || data.error) {
    const msg = data.error?.message ?? `OpenAI error ${res.status}`
    return NextResponse.json({ error: msg }, { status: res.status })
  }

  const output     = data.choices?.[0]?.message?.content ?? ''
  const tokenCount = (data.usage?.prompt_tokens ?? 0) + (data.usage?.completion_tokens ?? 0)

  return NextResponse.json({ output, tokenCount })
}
