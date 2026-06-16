"use client";

import { useMemo, useState } from "react";
import { metrics, getInterpretation, interpretationBands } from "../../_data/metrics";

const SIZE = 280;
const CENTER = SIZE / 2;
const MAX_R = SIZE / 2 - 44;

function pointOnAxis(index: number, total: number, value: number) {
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
  const r = (value / 10) * MAX_R;
  return { x: CENTER + r * Math.cos(angle), y: CENTER + r * Math.sin(angle) };
}

function labelPoint(index: number, total: number) {
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
  const r = MAX_R + 22;
  return { x: CENTER + r * Math.cos(angle), y: CENTER + r * Math.sin(angle) };
}

export function MetricsTab() {
  const [scores, setScores] = useState<Record<string, number>>(() =>
    Object.fromEntries(metrics.map((m) => [m.id, m.default]))
  );

  const avg = useMemo(() => {
    const vals = Object.values(scores);
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }, [scores]);

  const band = getInterpretation(avg);

  const polygonPoints = metrics
    .map((m, i) => pointOnAxis(i, metrics.length, scores[m.id]))
    .map((p) => `${p.x},${p.y}`)
    .join(" ");

  function reset() {
    setScores(Object.fromEntries(metrics.map((m) => [m.id, m.default])));
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--ce-gold)" }}>
            Appendix B — Metrics That Matter
          </div>
          <div style={{ fontSize: 20, fontWeight: 600, color: "var(--ce-white)", marginTop: 4 }}>Doctrine Alignment Panel</div>
        </div>
        <button
          onClick={reset}
          style={{ fontSize: 12, padding: "8px 14px", borderRadius: 8, border: "1px solid var(--ce-border)", background: "transparent", color: "var(--ce-muted)", cursor: "pointer" }}
        >
          Reset Assessment
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 20 }} className="metrics-grid">
        <div className="command-card" style={{ padding: "24px 24px" }}>
          <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ce-gold)", marginBottom: 16 }}>
            Self-Assessment — Rate Your Current Systems (1–10)
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {metrics.map((m) => (
              <div key={m.id}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 13, color: "var(--ce-white)", fontWeight: 500 }}>{m.name}</span>
                  <span style={{ fontSize: 13, color: "var(--ce-gold)", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                    {scores[m.id]}<span style={{ color: "var(--ce-dim)", fontWeight: 400 }}>/10</span>
                  </span>
                </div>
                <div style={{ fontSize: 11.5, color: "var(--ce-dim)", marginBottom: 6 }}>{m.description}</div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={scores[m.id]}
                  onChange={(e) => setScores((s) => ({ ...s, [m.id]: Number(e.target.value) }))}
                  style={{ width: "100%", accentColor: "#c5a26f" }}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="command-card" style={{ padding: "24px 24px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ce-gold)", marginBottom: 8, alignSelf: "flex-start" }}>
            Coherence Score
          </div>

          <svg width={SIZE} height={SIZE} style={{ overflow: "visible" }}>
            {[0.25, 0.5, 0.75, 1].map((f) => (
              <polygon
                key={f}
                points={metrics
                  .map((_, i) => pointOnAxis(i, metrics.length, f * 10))
                  .map((p) => `${p.x},${p.y}`)
                  .join(" ")}
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth={1}
              />
            ))}
            {metrics.map((_, i) => {
              const p = pointOnAxis(i, metrics.length, 10);
              return <line key={i} x1={CENTER} y1={CENTER} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />;
            })}
            <polygon points={polygonPoints} fill="rgba(197,162,111,0.16)" stroke="#c5a26f" strokeWidth={2} />
            {metrics.map((m, i) => {
              const p = pointOnAxis(i, metrics.length, scores[m.id]);
              return <circle key={m.id} cx={p.x} cy={p.y} r={3} fill="#c5a26f" />;
            })}
            {metrics.map((m, i) => {
              const p = labelPoint(i, metrics.length);
              return (
                <text
                  key={m.id}
                  x={p.x}
                  y={p.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={8.5}
                  fill="#8b9ab3"
                >
                  {m.shortLabel}
                </text>
              );
            })}
          </svg>

          <div style={{ textAlign: "center", marginTop: 4 }}>
            <div style={{ fontSize: 56, fontWeight: 700, color: "var(--ce-white)", letterSpacing: "-0.03em" }}>{avg.toFixed(1)}</div>
            <div style={{ fontSize: 11, color: "var(--ce-gold)", letterSpacing: "0.08em" }}>{band.label.toUpperCase()}</div>
          </div>

          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--ce-border)", width: "100%" }}>
            {interpretationBands.map((b) => (
              <div key={b.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: b.label === band.label ? "var(--ce-gold)" : "var(--ce-dim)", padding: "3px 0" }}>
                <span>{b.min}–{b.max}</span>
                <span>{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 880px) {
          .metrics-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
