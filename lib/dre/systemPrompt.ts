import type { SupabaseClient } from '@supabase/supabase-js'

// ============================================================
// Dr. E — shared system prompt builder
// Used by both the Claude and ChatGPT proxy routes so runtime
// stats + memory context stay identical across models.
// ============================================================

interface MemoryItemRow {
  title: string
  content: string
  classification: string
}

export async function buildDrESystemPrompt(
  supabase: SupabaseClient,
  founderId: string
): Promise<string> {
  const [systemsRes, approvalsRes, memoriesRes, tasksRes, canonRes] = await Promise.allSettled([
    supabase.from('runtime_systems').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('runtime_approvals').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('runtime_memories').select('*', { count: 'exact', head: true }),
    supabase.from('runtime_tasks').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    // Explicitly scoped to the founder's own sessions, even though the
    // service-role client bypasses memory_items' RLS anyway — approved
    // canon is per-principal, and Dr. E should only ever see its own.
    supabase
      .from('memory_items')
      .select('title, content, classification, mmcp_sessions!inner(principal_id)')
      .eq('mmcp_sessions.principal_id', founderId)
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  const activeSystems = systemsRes.status   === 'fulfilled' ? (systemsRes.value.count   ?? 0) : 0
  const openApprovals = approvalsRes.status === 'fulfilled' ? (approvalsRes.value.count ?? 0) : 0
  const memoryCount    = memoriesRes.status === 'fulfilled' ? (memoriesRes.value.count  ?? 0) : 0
  const openTasks      = tasksRes.status    === 'fulfilled' ? (tasksRes.value.count     ?? 0) : 0

  const canonItems = canonRes.status === 'fulfilled' ? (canonRes.value.data as unknown as MemoryItemRow[] ?? []) : []

  let prompt =
    `You are Dr. E, the internal AI agent of Cognitive Empire Systems Ltd. ` +
    `Current CE Runtime state: ${activeSystems} active systems, ${openApprovals} open approvals, ${memoryCount} memory records, ${openTasks} open tasks. ` +
    `Respond with operational precision. No fluff.`

  if (canonItems.length > 0) {
    const canonList = canonItems
      .map(m => `- [${m.classification}] ${m.title}: ${m.content.slice(0, 240)}`)
      .join('\n')
    prompt += `\n\nApproved canon from prior MMCP sessions (most recent first) — treat as ground truth, do not contradict without flagging it explicitly:\n${canonList}`
  }

  return prompt
}
