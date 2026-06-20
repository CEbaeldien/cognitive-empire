// ============================================================
// MMCP ENGINE v1 — Client-side Key Vault
// Keys are stored in sessionStorage only — never in DB, never
// sent to any server except as a one-shot body param to our own
// /api/mmcp/run/* proxy route. Tab close clears all keys.
// ============================================================

const PREFIX = 'mmcp_keys_'

function readBucket(sessionId: string): Record<string, string> {
  try {
    const raw = sessionStorage.getItem(`${PREFIX}${sessionId}`)
    return raw ? (JSON.parse(raw) as Record<string, string>) : {}
  } catch {
    return {}
  }
}

function writeBucket(sessionId: string, bucket: Record<string, string>): void {
  sessionStorage.setItem(`${PREFIX}${sessionId}`, JSON.stringify(bucket))
}

export function setKey(sessionId: string, model: string, key: string): void {
  const bucket = readBucket(sessionId)
  bucket[model] = key
  writeBucket(sessionId, bucket)
}

export function getKey(sessionId: string, model: string): string | null {
  return readBucket(sessionId)[model] ?? null
}

export function hasKey(sessionId: string, model: string): boolean {
  return !!getKey(sessionId, model)
}

export function clearKey(sessionId: string, model: string): void {
  const bucket = readBucket(sessionId)
  delete bucket[model]
  writeBucket(sessionId, bucket)
}

export function clearSessionKeys(sessionId: string): void {
  sessionStorage.removeItem(`${PREFIX}${sessionId}`)
}

export function clearAllKeys(): void {
  const targets: string[] = []
  for (let i = 0; i < sessionStorage.length; i++) {
    const k = sessionStorage.key(i)
    if (k?.startsWith(PREFIX)) targets.push(k)
  }
  targets.forEach(k => sessionStorage.removeItem(k))
}
