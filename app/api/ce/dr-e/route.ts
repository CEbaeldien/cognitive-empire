export const runtime = 'edge'
export const maxDuration = 30

import { requireFounder } from '@/utils/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  await requireFounder()

  const { command } = await request.json()
  if (!command?.trim()) {
    return new Response('Missing command', { status: 400 })
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

  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
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

  if (!anthropicRes.ok || !anthropicRes.body) {
    return new Response('Anthropic API error', { status: 502 })
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
