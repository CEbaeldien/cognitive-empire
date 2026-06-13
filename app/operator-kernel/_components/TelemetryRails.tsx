import type { ReactNode } from 'react'

/* ─────────────────────────────────────────────────────────
   TelemetryRails
   Fixed left + right ambient status rails.
   Visible at 2xl breakpoint only. Static values.
   Not connected to live data.
───────────────────────────────────────────────────────── */

function TelemetryItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="telemetry-item">
      <div className="telemetry-label">{label}</div>
      <div className="telemetry-value">{children}</div>
    </div>
  )
}

export function TelemetryRails() {
  return (
    <>
      {/* ── Left Rail ────────────────────────────────── */}
      <div className="telemetry-rail-left hidden 2xl:flex print:hidden">
        <TelemetryItem label="Canon Status">
          <span className="flex items-center gap-1.5">
            <span className="telemetry-live-dot" />
            <span className="text-[#00D8FF]">LIVE</span>
          </span>
        </TelemetryItem>
        <TelemetryItem label="Version">
          1.0.0
        </TelemetryItem>
        <TelemetryItem label="Last Update">
          <span style={{ fontSize: '8.5px' }}>Jun 13 2026</span>
        </TelemetryItem>
        <TelemetryItem label="Classification">
          <span className="text-[#C5A26F]">PUBLIC</span>
        </TelemetryItem>
      </div>

      {/* ── Right Rail ───────────────────────────────── */}
      <div className="telemetry-rail-right hidden 2xl:flex print:hidden">
        <TelemetryItem label="Operator Mode">
          <span>
            READ{' '}
            <span style={{ color: '#2A3548' }}>/</span>{' '}
            LEARN
          </span>
        </TelemetryItem>
        <TelemetryItem label="System Status">
          <span className="text-[#00D8FF]">NOMINAL</span>
        </TelemetryItem>
        <TelemetryItem label="Signal Quality">
          <div>
            <span className="text-[#00D8FF]">89%</span>
            <div className="telemetry-bar-track">
              <div className="telemetry-bar-fill" style={{ width: '89%' }} />
            </div>
          </div>
        </TelemetryItem>
        <TelemetryItem label="Context Window">
          <span style={{ fontSize: '8.5px', letterSpacing: '0.5px' }}>128K TOKENS</span>
        </TelemetryItem>
      </div>
    </>
  )
}
