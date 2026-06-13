import { DownloadButton }      from './DownloadButton'
import { IntelligenceSphere }  from './IntelligenceSphere'

/* ─────────────────────────────────────────────────────────
   KernelHero
   Two-column: left doctrine opening, right Intelligence Sphere.
   Sphere hidden on mobile/tablet (<lg), shown at lg+.
   Hero title uses hero-fade-up CSS animation (600ms, 100ms delay).
───────────────────────────────────────────────────────── */

export function KernelHero() {
  return (
    <div className="mb-20 border-b border-white/10 pb-16">
      <div className="flex flex-col lg:flex-row items-start gap-x-12 gap-y-10">

        {/* ── Left: doctrine text ───────────────────── */}
        <div className="flex-1 min-w-0">

          {/* Eyebrow */}
          <div className="uppercase tracking-[4px] text-xs text-[#8B9AB3] mb-5 select-none">
            COGNITIVE EMPIRE — PUBLIC MINI CANON
          </div>

          {/* Main headline — CSS animated on page load */}
          <h1 className="hero-title heading-serif text-[4.2rem] md:text-[5.2rem] leading-[0.88] tracking-[-3.5px] mb-7 text-[#F4F7FB]">
            Intelligence Is<br />
            Abundant.<br />
            <span className="text-[#C5A26F]">Judgment Is Power.</span>
          </h1>

          {/* Sub-title */}
          <p className="max-w-[26rem] text-xl tracking-[-0.3px] text-[#E6EDF7]">
            The Public Kernel for Intelligence-Abundant Systems
          </p>

          {/* Descriptor */}
          <div className="mt-5 max-w-md text-[#8B9AB3] leading-relaxed">
            A public doctrine for operators, builders, and institutions navigating
            intelligence-abundant systems.
          </div>

          {/* CTAs */}
          <div className="mt-9 flex flex-wrap items-center gap-x-4 gap-y-4">
            <a
              href="#prime-doctrine"
              className="inline-flex h-13 items-center justify-center rounded-2xl bg-[#C5A26F] px-8 text-sm font-semibold tracking-[-0.3px] text-[#05070B] transition-opacity hover:opacity-90 active:scale-[0.985]"
            >
              BEGIN READING
            </a>
            <a
              href="#eight-laws"
              className="inline-flex h-13 items-center justify-center rounded-2xl border border-white/20 px-7 text-sm font-medium tracking-[-0.2px] text-[#E6EDF7] hover:bg-white/5 transition-colors"
            >
              VIEW THE EIGHT LAWS
            </a>
            <DownloadButton variant="hero" />
          </div>

          {/* Meta row */}
          <div className="mt-8 flex items-center gap-x-5 text-xs text-[#5E6B80]">
            <div>Version: Public Mini Canon • 2026</div>
            <div className="hidden md:block">Status: Canonical public layer</div>
          </div>
        </div>

        {/* ── Right: Intelligence Sphere ────────────── */}
        <div className="hidden lg:flex flex-col items-center justify-start flex-shrink-0 w-[380px] pt-4">
          <IntelligenceSphere />
          <div className="mt-3 text-[9px] tracking-[2px] text-[#2A3548] uppercase select-none text-center">
            Intelligence Architecture · Node Visualization
          </div>
        </div>

      </div>
    </div>
  )
}
