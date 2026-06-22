// ============================================================
// MMCP ENGINE — Attachment Store
// Attachments are base64-encoded client-side and stored in
// localStorage keyed by sessionId. Never written to DB.
// Cleared explicitly or when keys are cleared.
// ============================================================

export type AttachmentType = 'text' | 'image' | 'pdf' | 'docx'

export interface Attachment {
  name:        string
  type:        AttachmentType
  mimeType:    string
  base64:      string       // full base64, no data: prefix
  textContent: string | null // pre-extracted text for TXT files
  size:        number
}

const PREFIX = 'mmcp_attach_'

export function saveAttachments(sessionId: string, attachments: Attachment[]): void {
  try {
    localStorage.setItem(`${PREFIX}${sessionId}`, JSON.stringify(attachments))
  } catch {
    // localStorage full — ignore
  }
}

export function loadAttachments(sessionId: string): Attachment[] {
  try {
    const raw = localStorage.getItem(`${PREFIX}${sessionId}`)
    return raw ? (JSON.parse(raw) as Attachment[]) : []
  } catch {
    return []
  }
}

export function clearAttachments(sessionId: string): void {
  localStorage.removeItem(`${PREFIX}${sessionId}`)
}

// ── File → Attachment conversion (runs in browser only) ────

const MIME_MAP: Record<string, { type: AttachmentType; ext: string }> = {
  'text/plain':                                                      { type: 'text',  ext: 'txt'  },
  'application/pdf':                                                 { type: 'pdf',   ext: 'pdf'  },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { type: 'docx', ext: 'docx' },
  'image/png':                                                       { type: 'image', ext: 'png'  },
  'image/jpeg':                                                      { type: 'image', ext: 'jpg'  },
}

export const ACCEPTED_MIME = Object.keys(MIME_MAP).join(',')

export function fileToAttachment(file: File): Promise<Attachment> {
  return new Promise((resolve, reject) => {
    const meta = MIME_MAP[file.type]
    if (!meta) { reject(new Error(`Unsupported file type: ${file.type}`)); return }

    const reader = new FileReader()

    if (meta.type === 'text') {
      reader.readAsText(file)
      reader.onload  = () => resolve({
        name:        file.name,
        type:        'text',
        mimeType:    file.type,
        base64:      btoa(reader.result as string),
        textContent: reader.result as string,
        size:        file.size,
      })
    } else {
      reader.readAsDataURL(file)
      reader.onload = () => {
        // strip "data:...;base64," prefix
        const dataUrl = reader.result as string
        const base64  = dataUrl.split(',')[1] ?? ''
        resolve({
          name:        file.name,
          type:        meta.type,
          mimeType:    file.type,
          base64,
          textContent: null,
          size:        file.size,
        })
      }
    }

    reader.onerror = () => reject(reader.error)
  })
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024)       return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
