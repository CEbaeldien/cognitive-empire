import { DownloadButton } from './DownloadButton'

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
              {/* CE emblem — final locked logo */}
              <a href="/" aria-label="Cognitive Empire home">
                {/*
                  Crop window: mark spans native x≈289–1158 (869px wide), y≈77–656 (579px tall).
                  At img width=60px: scale=60/1448=0.0414.
                  Mark at scale: x=12–48px, y=3.2–27.2px.
                  Container 40×36px; left=-10 centers x (12-10=2 to 48-10=38), top=5 centers y.
                */}
                <div
                  style={{
                    width: 40,
                    height: 36,
                    overflow: 'hidden',
                    position: 'relative',
                    flexShrink: 0,
                  }}
                >
                  <img
                    src="/brand/ce_logo_presentation_exact.svg"
                    alt=""
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      width: 60,
                      height: 'auto',
                      left: -10,
                      top: 5,
                    }}
                  />
                </div>
              </a>
              <a href="/" className="font-semibold tracking-[-0.6px] text-xl text-[#F4F7FB] hover:text-white transition-colors">
                Cognitive Empire
              </a>
            </div>
            <div className="hidden md:block rounded-full border border-white/10 px-3.5 py-1 text-[10px] tracking-[2.5px] text-[#8B9AB3] select-none">
              PUBLIC MINI CANON
            </div>
          </div>

          {/* Right: section anchors + download CTA */}
          <div className="flex items-center gap-x-8 text-sm">
            <a
              href="#prime-doctrine"
              className="hidden md:inline text-[#8B9AB3] hover:text-[#C5A26F] transition-colors duration-150"
            >
              Prime
            </a>
            <a
              href="#eight-laws"
              className="hidden md:inline text-[#8B9AB3] hover:text-[#C5A26F] transition-colors duration-150"
            >
              Laws
            </a>
            <a
              href="#signals"
              className="hidden md:inline text-[#8B9AB3] hover:text-[#C5A26F] transition-colors duration-150"
            >
              Signals
            </a>
            <DownloadButton variant="nav" />
          </div>

        </div>
      </div>
    </nav>
  )
}
