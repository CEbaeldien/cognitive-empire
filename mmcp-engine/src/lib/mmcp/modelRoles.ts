// ============================================================
// MMCP ENGINE — Cognitive Role Assignments
// Stored in localStorage. Global (not session-specific).
// 7 roles; same model can fill multiple roles.
// Requires at least reasoning role to unlock the Reasoning layer.
// ============================================================

import type { ModelName } from '@/types/mmcp'

export type CognitiveRole =
  | 'reasoning'
  | 'challenge'
  | 'comparison'
  | 'synthesis'
  | 'polish'
  | 'coding'
  | 'memory_extraction'

export const COGNITIVE_ROLES: CognitiveRole[] = [
  'reasoning', 'challenge', 'comparison', 'synthesis',
  'polish', 'coding', 'memory_extraction',
]

export interface RoleMeta {
  label:       string
  description: string
}

export const ROLE_META: Record<CognitiveRole, RoleMeta> = {
  reasoning: {
    label:       'Reasoning Model',
    description: 'Builds the first serious answer from the mission brief.',
  },
  challenge: {
    label:       'Challenge Model',
    description: 'Attacks assumptions, finds contradictions, risks, and weak logic.',
  },
  comparison: {
    label:       'Comparison Model',
    description: 'Compares outputs and identifies agreement, conflict, gaps, and stronger arguments.',
  },
  synthesis: {
    label:       'Synthesis Model',
    description: 'Creates the final merged judgment from the mission, outputs, and comparison.',
  },
  polish: {
    label:       'Polish Model',
    description: 'Improves clarity and presentation without changing approved judgment.',
  },
  coding: {
    label:       'Coding / Execution Model',
    description: 'Turns approved judgment into implementation steps, code instructions, or action plans.',
  },
  memory_extraction: {
    label:       'Memory Extraction Model',
    description: 'Suggests what should be preserved, but cannot write canonical memory without approval.',
  },
}

const PREFIX = 'mmcp_role_'

export function setRole(role: CognitiveRole, model: ModelName): void {
  try { localStorage.setItem(`${PREFIX}${role}`, model) } catch {}
}

export function getRole(role: CognitiveRole): ModelName | null {
  try { return localStorage.getItem(`${PREFIX}${role}`) as ModelName | null }
  catch { return null }
}

export function clearRole(role: CognitiveRole): void {
  try { localStorage.removeItem(`${PREFIX}${role}`) } catch {}
}

export function getAllRoles(): Partial<Record<CognitiveRole, ModelName>> {
  const out: Partial<Record<CognitiveRole, ModelName>> = {}
  for (const r of COGNITIVE_ROLES) {
    const m = getRole(r)
    if (m) out[r] = m
  }
  return out
}

/** Minimally configured = at least reasoning role is assigned */
export function isMinimallyConfigured(): boolean {
  return !!getRole('reasoning')
}
