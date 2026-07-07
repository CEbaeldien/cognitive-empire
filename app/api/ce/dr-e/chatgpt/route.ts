import { requireFounder } from '@/utils/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { buildDrESystemPrompt } from '@/lib/dre/systemPrompt'

export const runtime = 'edge'
export const maxDuration = 30

type ChatMessage = { role: 'user' | 'assistant'; content: string }

function jsonErr(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function POST(request: Request) {
  let founder: Awaited<ReturnType<typeof requireFounder>>
  try {
    founder = await requireFounder()
  } catch {
    return jsonErr('Unauthorized', 401)
  }

  let key: string, messages: ChatMessage[]
  try {
    const body = await request.json()
    key = body?.key?.trim() ?? ''
    messages = Array.isArray(body?.messages) ? body.messages : []
  } catch {
    return jsonErr('Invalid JSON body', 400)
  }

  if (!key) return jsonErr('ChatGPT API key required — add it in Settings.', 400)
  if (!messages.length || messages[messages.length - 1]?.role !== 'user') {
    return jsonErr('Missing user message', 400)
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const systemPrompt = await buildDrESystemPrompt(supabase, founder.id)

  let openaiRes: Response
  try {
    openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        stream: true,
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
      }),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return jsonErr(`OpenAI fetch failed: ${msg}`, 502)
  }

  if (!openaiRes.ok || !openaiRes.body) {
    const errBody = await openaiRes.text().catch(() => '(no body)')
    return jsonErr(`OpenAI ${openaiRes.status} ${openaiRes.statusText}: ${errBody}`, 502)
  }

  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  let fullResponse = ''
  const lastUserMessage = messages[messages.length - 1].content

  const stream = new ReadableStream({
    async start(controller) {
      const reader = openaiRes.body!.getReader()
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
              const text: string | undefined = event.choices?.[0]?.delta?.content
              if (text) {
                fullResponse += text
                controller.enqueue(encoder.encode(text))
              }
            } catch { /* skip malformed SSE events */ }
          }
        }
      } finally {
        try {
          await supabase.from('dre_actions').insert({
            title: lastUserMessage.slice(0, 200),
            action_type: 'prepare_prompt',
            source_module: 'dr-e',
            risk_level: 'safe',
            status: 'executed',
            payload: { model: 'chatgpt', messages, response: fullResponse },
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
