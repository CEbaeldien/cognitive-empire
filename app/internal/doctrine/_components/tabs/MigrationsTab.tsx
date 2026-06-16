"use client";

import { useState } from "react";
import { migrationStages, migrationFlow, migrationFlowNotes } from "../../_data/migrations";

export function MigrationsTab() {
  const [activeStage, setActiveStage] = useState<number | null>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div>
        <div style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--ce-gold)" }}>
          Part I — Structural Shift
        </div>
        <div style={{ fontSize: 20, fontWeight: 600, color: "var(--ce-white)", marginTop: 4 }}>Bottleneck Migration</div>
        <div style={{ fontSize: 13, color: "var(--ce-muted)", marginTop: 6, maxWidth: 560, lineHeight: 1.6 }}>
          When one constraint collapses, another becomes dominant. The system does not become free — it becomes
          unstable until the new constraint is governed.
        </div>
      </div>

      {/* Structural flow board */}
      <div className="command-card" style={{ padding: "26px 24px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 0,
            alignItems: "stretch",
          }}
        >
          {migrationFlow.map((stage, i) => (
            <div key={stage.id} style={{ display: "flex", alignItems: "center" }}>
              <button
                onClick={() => setActiveStage(i)}
                style={{
                  flex: 1,
                  textAlign: "center",
                  background: activeStage === i ? "var(--ce-gold-soft)" : "var(--ce-panel-elevated)",
                  border: `1px solid ${activeStage === i ? "var(--ce-gold-border)" : "var(--ce-border)"}`,
                  borderRadius: 14,
                  padding: "18px 10px",
                  cursor: "pointer",
                  transition: "all 200ms ease",
                }}
              >
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ce-white)", letterSpacing: "0.01em" }}>
                  {stage.label.toUpperCase()}
                </div>
                <div style={{ fontSize: 11, color: "var(--ce-muted)", marginTop: 4 }}>{stage.sub}</div>
                <div
                  style={{
                    marginTop: 10,
                    display: "inline-block",
                    fontSize: 9.5,
                    letterSpacing: "0.04em",
                    padding: "3px 9px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.04)",
                    color: "var(--ce-gold)",
                  }}
                >
                  {stage.tag.toUpperCase()}
                </div>
              </button>
              {i < migrationFlow.length - 1 && (
                <div
                  style={{
                    flexShrink: 0,
                    width: 28,
                    textAlign: "center",
                    color: "var(--ce-dim)",
                    fontSize: 16,
                  }}
                >
                  →
                </div>
              )}
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 20,
            paddingTop: 16,
            borderTop: "1px solid var(--ce-border)",
            fontSize: 13,
            color: "var(--ce-muted)",
            lineHeight: 1.6,
          }}
        >
          {activeStage != null ? migrationFlowNotes[activeStage] : (
            <span>
              <strong style={{ color: "var(--ce-gold)" }}>Law II in action:</strong> select a stage to see the
              structural reading. Bottleneck Migration is not disruption — it is constraint redistribution.
            </span>
          )}
        </div>
      </div>

      {/* Core migrations list */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ce-white)", marginBottom: 12 }}>
          Core Structural Migrations
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 1, border: "1px solid var(--ce-border)", borderRadius: 14, overflow: "hidden" }}>
          {migrationStages.map((m, i) => (
            <div
              key={m.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto 1fr 2fr",
                alignItems: "center",
                gap: 14,
                padding: "14px 18px",
                background: i % 2 === 0 ? "var(--ce-panel)" : "var(--ce-navy)",
              }}
              className="migration-row"
            >
              <div style={{ fontSize: 13.5, color: "var(--ce-muted)", textAlign: "right" }}>{m.from}</div>
              <div style={{ color: "var(--ce-gold)", fontSize: 13 }}>→</div>
              <div style={{ fontSize: 13.5, color: "var(--ce-white)", fontWeight: 600 }}>{m.to}</div>
              <div style={{ fontSize: 12, color: "var(--ce-dim)", lineHeight: 1.5 }}>{m.note}</div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .migration-row {
            grid-template-columns: 1fr !important;
            text-align: left !important;
            gap: 4px !important;
          }
          .migration-row > div:first-child { text-align: left !important; }
        }
      `}</style>
    </div>
  );
}
