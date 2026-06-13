'use client'

import { useEffect, useRef, type ReactNode } from 'react'

/* ─────────────────────────────────────────────────────────
   ScrollReveal
   IntersectionObserver-driven fade-up animation.
   threshold: 0.1 — translateY 20px→0, 500ms ease.
   prefers-reduced-motion: CSS handles it (sr-panel starts
   at opacity:1 in reduced-motion via globals.css).
───────────────────────────────────────────────────────── */

interface ScrollRevealProps {
  children: ReactNode
  className?: string
}

export function ScrollReveal({ children, className = '' }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('sr-revealed')
          observer.unobserve(el)
        }
      },
      { threshold: 0.1 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className={`sr-panel ${className}`}>
      {children}
    </div>
  )
}
