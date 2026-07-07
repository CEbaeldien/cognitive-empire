import { requireFounder } from '@/utils/supabase/server'
import { createClient } from '@supabase/supabase-js'

// Minimum role: service_role (writes mmcp_sessions/mission_briefs — tables
// owned by the separately-deployed mmcp-engine app, same Supabase project)

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export async function POST(request: Request) {
  let founder: Awaited<ReturnType<typeof requireFounder>>
  try {
    founder = await requireFounder()
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let messages: { role: 'user' | 'assistant'; content: string }[]
  try {
    const body = await request.json()
    messages = Array.isArray(body?.messages) ? body.messages : []
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const firstUserMessage = messages.find(m => m.role === 'user')?.content?.trim()
  if (!firstUserMessage) {
    return Response.json({ error: 'No conversation to escalate' }, { status: 400 })
  }

  const title = firstUserMessage.slice(0, 80)
  const transcript = messages
    .map(m => `${m.role === 'user' ? 'Principal' : 'Dr. E'}: ${m.content}`)
    .join('\n\n')

  const supabase = sb()

  const { data: session, error: sessionErr } = await supabase
    .from('mmcp_sessions')
    .insert({
      principal_id: founder.id,
      title,
      status: 'active',
      priority: 'normal',
      instance_scope: 'principal',
    })
    .select()
    .single()

  if (sessionErr || !session) {
    return Response.json({ error: sessionErr?.message ?? 'Failed to create session' }, { status: 500 })
  }

  const { error: missionErr } = await supabase
    .from('mission_briefs')
    .insert({
      session_id: session.id,
      title,
      context: transcript,
      objective: firstUserMessage,
      models_selected: ['claude', 'chatgpt'],
      status: 'active',
    })

  if (missionErr) {
    return Response.json({ error: missionErr.message }, { status: 500 })
  }

  try {
    await supabase.from('dre_actions').insert({
      title: `Escalated to MMCP: ${title}`,
      action_type: 'trigger_workflow',
      source_module: 'dr-e',
      risk_level: 'safe',
      status: 'executed',
      payload: { session_id: session.id },
    })
  } catch { /* non-fatal */ }

  return Response.json({ sessionId: session.id })
}
