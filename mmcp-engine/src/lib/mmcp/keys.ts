// ============================================================
// MMCP ENGINE — Client-side Key Vault
// localStorage  = persists across reloads and tabs (default)
// sessionStorage = clears when the tab closes (session-only)
// Keys are per-model, global across sessions — enter once.
// Never written to DB. Explicit revoke required to remove.
// ============================================================

const LS_PREFIX = 'mmcp_key_'   // local
const SS_PREFIX = 'mmcp_skey_'  // session-only

export type KeyMode = 'local' | 'session' | null

// ── Write ─────────────────────────────────────────────────────

export function setKey(model: string, key: string): void {
  localStorage.setItem(`${LS_PREFIX}${model}`, key)
  try { sessionStorage.removeItem(`${SS_PREFIX}${model}`) } catch {}
}

export function setKeySession(model: string, key: string): void {
  try {
    sessionStorage.setItem(`${SS_PREFIX}${model}`, key)
    localStorage.removeItem(`${LS_PREFIX}${model}`)
  } catch {}
}

// ── Read ──────────────────────────────────────────────────────

/** Returns the key regardless of where it's stored. */
export function getKey(model: string): string | null {
  try {
    return sessionStorage.getItem(`${SS_PREFIX}${model}`)
        ?? localStorage.getItem(`${LS_PREFIX}${model}`)
  } catch {
    return localStorage.getItem(`${LS_PREFIX}${model}`)
  }
}

export function hasKey(model: string): boolean {
  return !!getKey(model)
}

export function getKeyMode(model: string): KeyMode {
  try {
    if (sessionStorage.getItem(`${SS_PREFIX}${model}`)) return 'session'
  } catch {}
  if (localStorage.getItem(`${LS_PREFIX}${model}`)) return 'local'
  return null
}

// ── Revoke ────────────────────────────────────────────────────

export function clearKey(model: string): void {
  localStorage.removeItem(`${LS_PREFIX}${model}`)
  try { sessionStorage.removeItem(`${SS_PREFIX}${model}`) } catch {}
}

export function clearAllKeys(): void {
  const ls: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k?.startsWith(LS_PREFIX)) ls.push(k)
  }
  ls.forEach(k => localStorage.removeItem(k))
  clearAllSessionKeys()
}

export function clearAllSessionKeys(): void {
  try {
    const targets: string[] = []
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i)
      if (k?.startsWith(SS_PREFIX)) targets.push(k)
    }
    targets.forEach(k => sessionStorage.removeItem(k))
  } catch {}
}

// ── List ──────────────────────────────────────────────────────

export function listLoadedModels(): string[] {
  const models = new Set<string>()
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k?.startsWith(LS_PREFIX)) models.add(k.slice(LS_PREFIX.length))
  }
  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i)
      if (k?.startsWith(SS_PREFIX)) models.add(k.slice(SS_PREFIX.length))
    }
  } catch {}
  return Array.from(models)
}
