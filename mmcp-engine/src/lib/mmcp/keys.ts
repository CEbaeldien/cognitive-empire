// ============================================================
// MMCP ENGINE — Client-side Key Vault
// Keys are stored in localStorage (persist across tabs/reloads).
// Keys are per-model, global across sessions — enter once, reuse.
// Never written to DB. Explicit revoke required to remove.
// Revoke all keys on logout via clearAllKeys().
// ============================================================

const PREFIX = 'mmcp_key_'

export function setKey(model: string, key: string): void {
  localStorage.setItem(`${PREFIX}${model}`, key)
}

export function getKey(model: string): string | null {
  try {
    return localStorage.getItem(`${PREFIX}${model}`)
  } catch {
    return null
  }
}

export function hasKey(model: string): boolean {
  return !!getKey(model)
}

export function clearKey(model: string): void {
  localStorage.removeItem(`${PREFIX}${model}`)
}

export function clearAllKeys(): void {
  const targets: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k?.startsWith(PREFIX)) targets.push(k)
  }
  targets.forEach(k => localStorage.removeItem(k))
}

export function listLoadedModels(): string[] {
  const models: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k?.startsWith(PREFIX)) models.push(k.slice(PREFIX.length))
  }
  return models
}
