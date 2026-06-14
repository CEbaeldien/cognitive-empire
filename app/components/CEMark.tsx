export function CEMark({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      {/* Circle ring */}
      <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="2" strokeOpacity="0.55" />
      {/* Crosshair ticks */}
      <line x1="50" y1="2"  x2="50" y2="9"  stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.35" />
      <line x1="50" y1="91" x2="50" y2="98" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.35" />
      <line x1="2"  y1="50" x2="9"  y2="50" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.35" />
      <line x1="91" y1="50" x2="98" y2="50" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.35" />
      {/* CE mark */}
      <g fill="currentColor">
        {/* C — back, top arm, bottom arm */}
        <rect x="14" y="25" width="12" height="50" />
        <rect x="14" y="25" width="48" height="11" />
        <rect x="14" y="64" width="48" height="11" />
        {/* E — back, top bar, mid bar (shorter), bottom bar */}
        <rect x="50" y="38" width="7"  height="24" />
        <rect x="50" y="38" width="22" height="6"  />
        <rect x="50" y="47" width="16" height="5"  />
        <rect x="50" y="56" width="22" height="6"  />
      </g>
    </svg>
  );
}
