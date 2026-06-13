/* ─────────────────────────────────────────────────────────
   ClosingDoctrine — Section 21
   Command seal treatment: circular ring frame, CE emblem,
   prime doctrine in full serif, classification mark.
───────────────────────────────────────────────────────── */
import { CEMark } from '@/app/components/CEMark';

export function ClosingDoctrine() {
  return (
    <section
      id="closing"
      className="section-shell mt-24 border-t border-white/10 pt-20 pb-8"
    >
      {/* Eyebrow */}
      <div className="text-center uppercase tracking-[3.5px] text-xs text-[#5E6B80] mb-12 select-none">
        CLOSING DOCTRINE — COMMAND SEAL
      </div>

      {/* ── Seal ──────────────────────────────────────── */}
      <div className="command-seal-ring mx-auto">

        {/* Inner content */}
        <div className="flex flex-col items-center justify-center text-center px-10">

          <div className="mb-5 text-[#C5A26F]">
            <CEMark className="w-20 h-20 block mx-auto" />
          </div>

          {/* Doctrine lines */}
          <div className="heading-serif text-3xl tracking-[-0.8px] leading-tight text-[#F4F7FB] mb-1">
            Intelligence is abundant.
          </div>
          <div className="heading-serif text-3xl tracking-[-0.8px] leading-tight text-[#C5A26F]">
            Judgment is power.
          </div>

          {/* Divider */}
          <div className="mt-7 mb-6 w-16 h-px bg-[#C5A26F]/30" />

          {/* Classification mark */}
          <div className="text-[9px] tracking-[3px] text-[#5E6B80] uppercase select-none">
            COGNITIVE EMPIRE
          </div>
          <div className="text-[9px] tracking-[3px] text-[#3A4558] uppercase select-none mt-1">
            PUBLIC MINI CANON · 2026
          </div>
        </div>
      </div>

      {/* Outer footer mark */}
      <div className="mt-12 text-center text-[9px] tracking-[2.5px] text-[#2A3548] uppercase select-none">
        CLASSIFICATION: PUBLIC · DOCTRINE VERSION 1.0.0
      </div>
    </section>
  )
}
