/* ─────────────────────────────────────────────────────────
   DownloadButton
   Variant "nav"  → compact pill button in TopNav
   Variant "hero" → outlined hero CTA button
   Links to /downloads/ce-public-kernel.pdf
───────────────────────────────────────────────────────── */

interface DownloadButtonProps {
  variant?: 'nav' | 'hero'
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M8 10.5L4.5 7h2V2h3v5h2L8 10.5z" />
      <path d="M2 13h12v1.5H2V13z" />
    </svg>
  )
}

function PdfIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 0h6l4 4v11a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V1a1 1 0 0 1 1-1h1zm6 0v4h4L10 0zM6 8h1v3h-.9v-2.3l-.4.6H5l-.4-.6V11H3.7V8H5l.5.9.5-.9zm3.4 2.3c.3 0 .6-.1.8-.3.2-.2.3-.5.3-.9s-.1-.7-.3-.9c-.2-.2-.5-.3-.8-.3H8v2.4h1.4zm-.3-.9h-.2V8.9h.2c.1 0 .2 0 .3.1.1.1.1.2.1.4s0 .3-.1.4c-.1 0-.2.1-.3 0zm2.3.9h1.2v.8h-2.1V8h.9v2.3z" />
    </svg>
  )
}

export function DownloadButton({ variant = 'nav' }: DownloadButtonProps) {
  if (variant === 'hero') {
    return (
      <a
        href="/downloads/ce-public-kernel.pdf"
        className="inline-flex h-14 items-center justify-center gap-x-2 rounded-2xl border border-[#C5A26F]/50 px-6 text-sm font-medium tracking-wider text-[#C5A26F] transition-colors hover:bg-[#C5A26F]/10 print-hidden"
      >
        <PdfIcon className="h-4 w-4" />
        <span>DOWNLOAD PDF</span>
      </a>
    )
  }

  return (
    <a
      href="/downloads/ce-public-kernel.pdf"
      className="flex items-center gap-x-2.5 rounded-2xl border border-[#C5A26F]/60 bg-[#C5A26F]/5 px-6 py-2.5 text-xs font-medium tracking-[1.5px] text-[#C5A26F] transition-all hover:bg-[#C5A26F] hover:text-[#05070B] print-hidden"
    >
      <DownloadIcon className="h-3.5 w-3.5" />
      <span>DOWNLOAD PDF</span>
    </a>
  )
}
