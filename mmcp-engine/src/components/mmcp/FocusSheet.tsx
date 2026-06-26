'use client'

import { useEffect, type CSSProperties } from 'react'

interface FocusSheetProps {
  open: boolean
  title: string
  subtitle?: string
  onClose: () => void
  width?: number
  footer?: React.ReactNode
  children: React.ReactNode
}

export function FocusSheet({ open, title, subtitle, onClose, width = 560, footer, children }: FocusSheetProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 500,
          background: 'rgba(5,7,11,0.72)',
          opacity: open ? 1 : 0,
          transition: 'opacity 0.18s ease',
          pointerEvents: open ? 'auto' : 'none',
        }}
      />
      {/* Sheet */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 501,
        width: `min(${width}px, 100vw)`,
        background: '#070D17',
        borderLeft: '1px solid rgba(230,237,247,0.08)',
        display: 'flex', flexDirection: 'column',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '-16px 0 60px rgba(0,0,0,0.7)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px', flexShrink: 0,
          borderBottom: '1px solid rgba(230,237,247,0.07)',
        }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#E6EDF7', margin: 0, lineHeight: 1.3 }}>{title}</p>
            {subtitle && (
              <p style={{ fontSize: 10, color: 'rgba(230,237,247,0.3)', margin: '4px 0 0', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 6, border: '1px solid rgba(230,237,247,0.09)',
              background: 'transparent', color: 'rgba(230,237,247,0.35)',
              fontSize: 19, lineHeight: 1, cursor: 'pointer', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >×</button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '20px 20px 32px' }}>
          {children}
        </div>

        {/* Optional footer */}
        {footer && (
          <div style={{
            borderTop: '1px solid rgba(230,237,247,0.07)', padding: '12px 20px',
            flexShrink: 0, display: 'flex', gap: 10, alignItems: 'center',
          }}>
            {footer}
          </div>
        )}
      </div>
    </>
  )
}
