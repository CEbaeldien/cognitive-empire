'use client'

import { useEffect, useRef, type ReactNode } from 'react'

interface GravityScrollRevealProps {
  children: ReactNode
  className?: string
  delay?: number
}

export function GravityScrollReveal({ children, className = '', delay = 0 }: GravityScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (delay > 0) {
      el.style.transitionDelay = `${delay}ms`
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('gr-revealed')
          observer.unobserve(el)
        }
      },
      { threshold: 0.08 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [delay])

  return (
    <div ref={ref} className={`gr-panel ${className}`}>
      {children}
    </div>
  )
}
