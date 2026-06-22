// ============================================================
// MMCP ENGINE v1 — OpenAI (ChatGPT) proxy
// Key arrives in request body, is used once, never logged,
// never stored. Auth required — rejects without valid session.
// Model: gpt-4o
// Attachments: images → vision content parts; text/PDFs/DOCX
//              → appended to prompt text.
// ============================================================

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Attachment } from '@/lib/mmcp/attachments'

const OPENAI_API = 'https://api.openai.com/v1/chat/completions'
const MODEL      = 'gpt-4o'

type TextPart   = { type: 'text'; text: string }
type ImagePart  = { type: 'image_url'; image_url: { url: string; detail: 'high' } }
type ContentPart = TextPart | ImagePart

function buildContent(prompt: string, attachments: Attachment[]): ContentPart[] {
  const parts: ContentPart[] = []

  for (const att of attachments) {
    if (att.type === 'image') {
      parts.push({
        type: 'image_url',
        image_url: { url: `data:${att.mimeType};base64,${att.base64}`, detail: 'high' },
      })
    }
  }

  // Append text content and notes for non-image attachments
  let fullPrompt = prompt
  for (const att of attachments) {
    if (att.type === 'text' && att.textContent) {
      fullPrompt += `\n\n<attachment name="${att.name}">\n${att.textContent}\n</attachment>`
    } else if (att.type === 'pdf') {
      fullPrompt += `\n\n[Attachment: ${att.name} (PDF) — cannot be read inline by this model. Consider pasting key sections as text.]`
    } else if (att.type === 'docx') {
      fullPrompt += `\n\n[Attachment: ${att.name} (DOCX) — cannot be read inline. Consider pasting content as text.]`
    }
  }

  parts.push({ type: 'text', text: fullPrompt })
  return parts
}

export async function POST(request: NextRequest) {
  // ── Auth check ─────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Parse body ─────────────────────────────────────────────
  let key: string, prompt: string, attachments: Attachment[]
  try {
    const body = await request.json() as { key?: string; prompt?: string; attachments?: Attachment[] }
    key         = body.key?.trim()    ?? ''
    prompt      = body.prompt?.trim() ?? ''
    attachments = body.attachments    ?? []
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
        messages: [{ role: 'user', content: buildContent(prompt, attachments) }],
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
