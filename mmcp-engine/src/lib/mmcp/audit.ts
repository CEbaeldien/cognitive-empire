// ============================================================
// MMCP ENGINE — Audit Logger
// Governance infrastructure. Every state transition writes here.
// Failures are logged but never block the operation.
// No silent mutations. No invisible decisions.
// ============================================================

import { createClient } from '@/lib/supabase/client'
import {
  AUDIT_EVENT,
  AUDIT_ENTITY,
  type AuditEventType,
  type AuditEntityType,
  type AuthorityLevel,
} from '@/types/mmcp'


export { AUDIT_EVENT, AUDIT_ENTITY }

interface LogEventParams {
  sessionId?: string
  eventType: AuditEventType
  entityType: AuditEntityType
  entityId?: string
  authorityLevel?: AuthorityLevel
  payload?: Record<string, unknown>
}

/**
 * Write an audit record. Call this after every state transition.
 * Never throws — a logging failure must not block the operation that caused it.
 */
export async function logEvent(params: LogEventParams): Promise<void> {
  try {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.warn('[AUDIT] logEvent called without authenticated user', params)
      return
    }

    const { error } = await supabase.from('audit_logs').insert({
      session_id:      params.sessionId ?? null,
      principal_id:    user.id,
      event_type:      params.eventType,
      entity_type:     params.entityType,
      entity_id:       params.entityId ?? null,
      authority_level: params.authorityLevel ?? null,
      payload:         params.payload ?? null,
      logged_at:       new Date().toISOString(),
    })

    if (error) {
      console.error('[AUDIT] Failed to write audit log:', error, params)
    }
  } catch (err) {
    // Audit failures are logged to console, never thrown
    console.error('[AUDIT] Unexpected error in logEvent:', err, params)
  }
}

/**
 * Surface an undefined state. Surfaces to console + audit log.
 * Per doctrine: undefined state = investigate + surface, never act.
 */
export async function surfaceUndefinedState(
  context: string,
  details: Record<string, unknown>,
  sessionId?: string
): Promise<void> {
  console.warn('[MMCP] UNDEFINED STATE SURFACED:', context, details)

  await logEvent({
    sessionId,
    eventType:      AUDIT_EVENT.UNDEFINED_STATE_SURFACED,
    entityType:     AUDIT_ENTITY.SESSION,
    entityId:       sessionId,
    authorityLevel: 'R0',
    payload:        { context, ...details },
  })
}

/**
 * Assert that an R4 action has an approved synthesis linked.
 * If not, surface the undefined state and throw — R4 without approval is doctrine violation.
 */
export function assertR4HasApproval(approvalId: string | undefined, context: string): void {
  if (!approvalId) {
    const msg = `R4 action attempted without approval_id — ${context}`
    console.error('[MMCP] GOVERNANCE VIOLATION:', msg)
    throw new Error(msg)
  }
}
