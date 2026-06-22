// ============================================================
// MMCP ENGINE v1 — Anthropic (Claude) proxy
// Key arrives in request body, is used once, never logged,
// never stored. Auth required — rejects without valid session.
// Model: claude-sonnet-4-6
// Attachments: images → image blocks; PDFs → document blocks;
//              text/DOCX → appended to prompt text.
// ============================================================

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Attachment } from '@/lib/mmcp/attachments'

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'
const MODEL         = 'claude-sonnet-4-6'
const MAX_TOKENS    = 4096

type ContentBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }
  | { type: 'document'; source: { type: 'base64'; media_type: string; data: string } }

function buildContent(prompt: string, attachments: Attachment[]): ContentBlock[] {
  const blocks: ContentBlock[] = []

  for (const att of attachments) {
    if (att.type === 'image') {
      blocks.push({
        type: 'image',
        source: { type: 'base64', media_type: att.mimeType, data: att.base64 },
      })
    } else if (att.type === 'pdf') {
      blocks.push({
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: att.base64 },
      })
    }
  }

  // Text + DOCX: append content to prompt text
  const textAttachments = attachments.filter(a => a.type === 'text' || a.type === 'docx')
  let fullPrompt = prompt
  for (const att of textAttachments) {
    if (att.textContent) {
      fullPrompt += `\n\n<attachment name="${att.name}">\n${att.textContent}\n</attachment>`
    } else {
      fullPrompt += `\n\n[Attachment: ${att.name} (${att.type}) — binary format, cannot be read inline]`
    }
  }

  blocks.push({ type: 'text', text: fullPrompt })
  return blocks
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
        messages:   [{ role: 'user', content: buildContent(prompt, attachments) }],
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
    const msg = data.error?.message ?? `Anthropic error ${res.status}`
    return NextResponse.json({ error: msg }, { status: res.status })
  }

  const output     = data.content?.find(b => b.type === 'text')?.text ?? ''
  const tokenCount = (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0)

  return NextResponse.json({ output, tokenCount })
}
