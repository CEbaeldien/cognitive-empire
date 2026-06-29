import { DownloadButton } from './DownloadButton'
import { CEMark } from '@/app/components/CEMark'

/* ─────────────────────────────────────────────────────────
   TopNav
   Sticky sovereign navigation.
   Desktop: wordmark + badge + section links + download CTA.
   Mobile:  wordmark + badge only (links collapse).
───────────────────────────────────────────────────────── */

export function TopNav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#05070B]/95 backdrop-blur-2xl print:hidden">
      <div className="max-w-screen-2xl mx-auto px-8">
        <div className="flex h-20 items-center justify-between">

          {/* Left: logo + wordmark + badge */}
          <div className="flex items-center gap-x-4">
            <div className="flex items-center gap-x-3">
              <a href="/" aria-label="Cognitive Empire home">
                <span className="text-[#F4F7FB]">
                  <CEMark className="w-9 h-9" />
                </span>
              </a>
              <a href="/" className="font-semibold tracking-[-0.6px] text-xl text-[#F4F7FB] hover:text-white transition-colors">
                Cognitive Empire
              </a>
            </div>
            <div className="hidden md:block rounded-full border border-white/10 px-3.5 py-1 text-[10px] tracking-[2.5px] text-[#8B9AB3] select-none">
              OPS KERNEL
            </div>
          </div>

          {/* Right: download CTA */}
          <div className="flex items-center gap-x-6 text-sm">
            <span className="hidden md:inline text-[10px] tracking-[2px] text-[#2A3548] font-mono uppercase select-none">
              15 Modules
            </span>
            <DownloadButton variant="nav" />
          </div>

        </div>
      </div>
    </nav>
  )
}
