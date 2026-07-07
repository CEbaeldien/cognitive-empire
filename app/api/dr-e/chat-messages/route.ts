import { requireFounder } from '@/utils/supabase/server'
import { createClient } from '@supabase/supabase-js'

// Minimum role: service_role (bypasses RLS on dre_chat_messages)

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export async function GET() {
  let founder: Awaited<ReturnType<typeof requireFounder>>
  try {
    founder = await requireFounder()
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await sb()
    .from('dre_chat_messages')
    .select('*')
    .eq('principal_id', founder.id)
    .order('created_at', { ascending: true })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ messages: data ?? [] })
}

export async function POST(request: Request) {
  let founder: Awaited<ReturnType<typeof requireFounder>>
  try {
    founder = await requireFounder()
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let role: string, content: string, model: string | null
  try {
    const body = await request.json()
    role = body?.role
    content = body?.content
    model = body?.model ?? null
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (role !== 'user' && role !== 'assistant') {
    return Response.json({ error: 'role must be user or assistant' }, { status: 400 })
  }
  if (!content?.trim()) {
    return Response.json({ error: 'content is required' }, { status: 400 })
  }

  const { data, error } = await sb()
    .from('dre_chat_messages')
    .insert({ principal_id: founder.id, role, model, content: content.trim() })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ message: data })
}
