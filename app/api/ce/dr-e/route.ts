export const runtime = 'edge'
export const maxDuration = 30

import { requireFounder } from '@/utils/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

function jsonErr(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function POST(request: NextRequest) {
  // Auth guard — re-throw Next.js redirects so the framework handles them
  try {
    await requireFounder()
  } catch (err) {
    if ((err as { digest?: string })?.digest?.startsWith('NEXT_REDIRECT')) throw err
    const msg = err instanceof Error ? err.message : String(err)
    return jsonErr(`Auth error: ${msg}`, 401)
  }

  let command: string
  try {
    const body = await request.json()
    command = body?.command
  } catch {
    return jsonErr('Invalid JSON body', 400)
  }

  if (!command?.trim()) {
    return jsonErr('Missing command', 400)
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return jsonErr('ANTHROPIC_API_KEY is not configured', 500)
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const [systemsRes, approvalsRes, memoriesRes, tasksRes] = await Promise.allSettled([
    supabase.from('runtime_systems').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('runtime_approvals').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('runtime_memories').select('*', { count: 'exact', head: true }),
    supabase.from('runtime_tasks').select('*', { count: 'exact', head: true }).eq('status', 'open'),
  ])

  const activeSystems = systemsRes.status   === 'fulfilled' ? (systemsRes.value.count   ?? 0) : 0
  const openApprovals = approvalsRes.status === 'fulfilled' ? (approvalsRes.value.count ?? 0) : 0
  const memoryCount   = memoriesRes.status  === 'fulfilled' ? (memoriesRes.value.count  ?? 0) : 0
  const openTasks     = tasksRes.status     === 'fulfilled' ? (tasksRes.value.count     ?? 0) : 0

  const systemPrompt =
    `You are Dr. E, the internal AI agent of Cognitive Empire Systems Ltd. ` +
    `Current CE Runtime state: ${activeSystems} active systems, ${openApprovals} open approvals, ${memoryCount} memory records, ${openTasks} open tasks. ` +
    `Respond with operational precision. No fluff.`

  let anthropicRes: Response
  try {
    anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        stream: true,
        system: systemPrompt,
        messages: [{ role: 'user', content: command }],
      }),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return jsonErr(`Anthropic fetch failed: ${msg}`, 502)
  }

  if (!anthropicRes.ok || !anthropicRes.body) {
    const errBody = await anthropicRes.text().catch(() => '(no body)')
    return jsonErr(`Anthropic ${anthropicRes.status} ${anthropicRes.statusText}: ${errBody}`, 502)
  }

  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  let fullResponse = ''

  const stream = new ReadableStream({
    async start(controller) {
      const reader = anthropicRes.body!.getReader()
      let buffer = ''

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const data = line.slice(6).trim()
            if (!data || data === '[DONE]') continue
            try {
              const event = JSON.parse(data)
              if (
                event.type === 'content_block_delta' &&
                event.delta?.type === 'text_delta' &&
                event.delta?.text
              ) {
                const text: string = event.delta.text
                fullResponse += text
                controller.enqueue(encoder.encode(text))
              }
            } catch { /* skip malformed SSE events */ }
          }
        }
      } finally {
        try {
          await supabase.from('dre_actions').insert({
            title: command.slice(0, 200),
            action_type: 'prepare_prompt',
            source_module: 'dr-e',
            risk_level: 'safe',
            status: 'executed',
            payload: { command, response: fullResponse },
          })
        } catch { /* non-fatal */ }

        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
