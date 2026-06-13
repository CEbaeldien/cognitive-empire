/* ─────────────────────────────────────────────────────────
   IntelligenceSphere
   SVG + CSS only. No canvas, no Three.js.
   Layers: star field → sphere boundary → latitude rings
   → longitude arcs (CSS 60s rotation) → node points.
───────────────────────────────────────────────────────── */

const STARS: [number, number, number, number][] = [
  [18, 28, 0.9, 0.28], [52, 68, 0.6, 0.22], [88, 16, 1.0, 0.32], [128, 44, 0.7, 0.26],
  [188, 10, 0.9, 0.30], [258, 26, 0.5, 0.20], [318, 46, 0.8, 0.28], [368, 22, 0.6, 0.24],
  [390, 88, 1.0, 0.32], [375, 148, 0.7, 0.26], [394, 205, 0.9, 0.28], [380, 268, 0.5, 0.20],
  [360, 328, 0.8, 0.28], [325, 370, 0.6, 0.24], [275, 390, 1.0, 0.30], [205, 394, 0.7, 0.26],
  [145, 382, 0.9, 0.28], [84, 360, 0.5, 0.20], [26, 325, 0.8, 0.28], [10, 265, 0.6, 0.24],
  [16, 205, 1.0, 0.30], [10, 145, 0.7, 0.26], [30, 85, 0.9, 0.28], [42, 308, 0.5, 0.18],
  [108, 198, 0.6, 0.16], [165, 84, 0.8, 0.26], [228, 308, 0.7, 0.22], [308, 175, 0.9, 0.28],
  [355, 255, 0.6, 0.22], [285, 345, 0.8, 0.26], [165, 335, 0.5, 0.18], [238, 155, 0.7, 0.24],
  [325, 105, 0.9, 0.28], [105, 125, 0.6, 0.20], [185, 255, 0.8, 0.22],
]

/* node points at latitude–boundary intersections */
const NODES: [number, number, number, number][] = [
  /* poles */
  [200, 40, 3.5, 0.75], [200, 360, 2.8, 0.55],
  /* equator */
  [40, 200, 2.8, 0.58], [360, 200, 3.2, 0.65],
  /* ±30° lat */
  [45, 120, 2.2, 0.42], [355, 120, 2.2, 0.42],
  [45, 280, 2.2, 0.42], [355, 280, 2.2, 0.42],
  /* ±60° lat */
  [120, 62, 2.0, 0.38], [280, 62, 2.0, 0.38],
  [120, 338, 1.8, 0.34], [280, 338, 1.8, 0.34],
]

export function IntelligenceSphere() {
  return (
    <div className="intelligence-sphere print:hidden" aria-hidden="true">
      <svg
        viewBox="0 0 400 400"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
      >
        <defs>
          <clipPath id="sphere-clip">
            <circle cx="200" cy="200" r="158" />
          </clipPath>
          <radialGradient id="sphere-fill" cx="38%" cy="30%" r="68%">
            <stop offset="0%"   stopColor="rgba(0,90,180,0.09)" />
            <stop offset="60%"  stopColor="rgba(0,20,50,0.06)"  />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <filter id="ng" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* ── Star field ─────────────────────────────── */}
        {STARS.map(([x, y, r, o], i) => (
          <circle key={i} cx={x} cy={y} r={r} fill={`rgba(255,255,255,${o})`} />
        ))}

        {/* ── Atmosphere glow ────────────────────────── */}
        <circle cx="200" cy="200" r="174" fill="none" stroke="rgba(0,216,255,0.04)" strokeWidth="10" />
        <circle cx="200" cy="200" r="165" fill="none" stroke="rgba(0,216,255,0.07)" strokeWidth="3"  />

        {/* ── Sphere interior fill ───────────────────── */}
        <circle cx="200" cy="200" r="160" fill="url(#sphere-fill)" />

        {/* ── Sphere boundary ────────────────────────── */}
        <circle cx="200" cy="200" r="160" fill="none" stroke="rgba(0,216,255,0.22)" strokeWidth="1" />

        {/* ── Clipped internals ──────────────────────── */}
        <g clipPath="url(#sphere-clip)">

          {/* Latitude rings (static — they don't change when globe spins) */}
          {/* equator */}
          <ellipse cx="200" cy="200" rx="160" ry="32" fill="none" stroke="rgba(0,216,255,0.15)" strokeWidth="0.8" />
          {/* ±30° */}
          <ellipse cx="200" cy="120" rx="138" ry="28" fill="none" stroke="rgba(0,216,255,0.15)" strokeWidth="0.8" />
          <ellipse cx="200" cy="280" rx="138" ry="28" fill="none" stroke="rgba(0,216,255,0.15)" strokeWidth="0.8" />
          {/* ±60° */}
          <ellipse cx="200" cy="62"  rx="80"  ry="16" fill="none" stroke="rgba(0,216,255,0.11)" strokeWidth="0.7" />
          <ellipse cx="200" cy="338" rx="80"  ry="16" fill="none" stroke="rgba(0,216,255,0.11)" strokeWidth="0.7" />

          {/* Longitude arcs (6 meridians at 30° steps, slowly rotating) */}
          <g
            style={{
              transformOrigin: '200px 200px',
              animation: 'sphere-spin 60s linear infinite',
            }}
          >
            {([0, 30, 60, 90, 120, 150] as const).map((deg) => (
              <ellipse
                key={deg}
                cx="200" cy="200"
                rx="6" ry="158"
                fill="none"
                stroke="rgba(0,216,255,0.15)"
                strokeWidth="0.8"
                transform={`rotate(${deg}, 200, 200)`}
              />
            ))}
          </g>
        </g>

        {/* ── Node points at intersections ───────────── */}
        {NODES.map(([x, y, r, o], i) => (
          <circle key={i} cx={x} cy={y} r={r} fill={`rgba(0,216,255,${o})`} filter="url(#ng)" />
        ))}
      </svg>
    </div>
  )
}
