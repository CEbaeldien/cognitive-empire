// ============================================================
// Dr. E — Client-side Key Vault
// Separate from mmcp-engine's vault (lib/mmcp/keys.ts) by
// necessity: cognitiveempire.com and orchestrator.cognitiveempire.com
// are different origins and cannot share localStorage.
// Never written to DB. Explicit revoke required to remove.
// ============================================================

const LS_PREFIX = 'dre_key_'

export type DreModel = 'claude' | 'chatgpt'

export function setKey(model: DreModel, key: string): void {
  localStorage.setItem(`${LS_PREFIX}${model}`, key)
}

export function getKey(model: DreModel): string | null {
  try {
    return localStorage.getItem(`${LS_PREFIX}${model}`)
  } catch {
    return null
  }
}

export function hasKey(model: DreModel): boolean {
  return !!getKey(model)
}

export function clearKey(model: DreModel): void {
  localStorage.removeItem(`${LS_PREFIX}${model}`)
}

export function clearAllKeys(): void {
  const targets: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k?.startsWith(LS_PREFIX)) targets.push(k)
  }
  targets.forEach(k => localStorage.removeItem(k))
}
