"use client";

import { useState } from "react";
import { laws, getLaw } from "../../_data/laws";

export function LawsTab() {
  const [openId, setOpenId] = useState<number | null>(null);
  const openLaw = openId != null ? getLaw(openId) : undefined;

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--ce-gold)" }}>
          Part I — Structural Shift
        </div>
        <div style={{ fontSize: 20, fontWeight: 600, color: "var(--ce-white)", marginTop: 4 }}>The Immutable Laws</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 14 }}>
        {laws.map((law) => (
          <button
            key={law.id}
            onClick={() => setOpenId(law.id)}
            className="command-card"
            style={{
              textAlign: "left",
              padding: "20px 20px",
              cursor: "pointer",
              background: "var(--ce-panel)",
              border: "1px solid var(--ce-border)",
              color: "inherit",
            }}
          >
            <div style={{ fontSize: 38, fontWeight: 700, color: "var(--ce-gold)", letterSpacing: "-0.03em", lineHeight: 1 }}>
              {law.numeral}
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ce-white)", marginTop: 10, lineHeight: 1.3 }}>
              {law.title}
            </div>
            <div style={{ fontSize: 12.5, color: "var(--ce-muted)", marginTop: 8, lineHeight: 1.55 }}>
              {law.statement}
            </div>
            <div style={{ marginTop: 14, fontSize: 10.5, color: "var(--ce-dim)", letterSpacing: "0.05em" }}>
              {law.relatedChapters.length} related chapter{law.relatedChapters.length > 1 ? "s" : ""}
            </div>
          </button>
        ))}
      </div>

      {openLaw && (
        <div
          onClick={() => setOpenId(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.78)",
            backdropFilter: "blur(6px)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="command-card"
            style={{ maxWidth: 620, width: "100%", padding: "32px 28px", maxHeight: "85vh", overflowY: "auto" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ fontSize: 44, fontWeight: 700, color: "var(--ce-gold)" }}>{openLaw.numeral}</div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--ce-gold)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    Immutable Law
                  </div>
                  <div style={{ fontSize: 19, fontWeight: 600, color: "var(--ce-white)" }}>{openLaw.title}</div>
                </div>
              </div>
              <button
                onClick={() => setOpenId(null)}
                style={{ background: "none", border: "none", color: "var(--ce-muted)", fontSize: 22, cursor: "pointer", lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            <div style={{ marginTop: 20, fontSize: 16, color: "var(--ce-white)", lineHeight: 1.5 }}>{openLaw.statement}</div>
            <div style={{ marginTop: 14, fontSize: 14, color: "var(--ce-text)", lineHeight: 1.7 }}>{openLaw.full}</div>

            <div style={{ marginTop: 22, paddingTop: 18, borderTop: "1px solid var(--ce-border)" }}>
              <div style={{ fontSize: 11, color: "var(--ce-dim)", marginBottom: 8, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                Converges With
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {openLaw.related.map((r) => {
                  const rl = getLaw(r);
                  if (!rl) return null;
                  return (
                    <button
                      key={r}
                      onClick={() => setOpenId(r)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: 999,
                        border: "1px solid var(--ce-gold-border)",
                        background: "var(--ce-gold-soft)",
                        color: "var(--ce-gold)",
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      Law {rl.numeral}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
