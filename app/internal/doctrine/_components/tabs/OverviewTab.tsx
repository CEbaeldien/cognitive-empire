"use client";

import { useState } from "react";
import { laws } from "../../_data/laws";
import type { TabId } from "../DoctrineConsole";

const CHAPTER_LINKS = [
  { id: "ch1", label: "Ch. 1 — The Prime Doctrine" },
  { id: "ch3", label: "Ch. 3 — Bottleneck Migration" },
  { id: "ch7", label: "Ch. 7 — Governance Under Abundance" },
  { id: "ch12", label: "Ch. 12 — The Renaissance Operator" },
  { id: "ch15", label: "Ch. 15 — Survivable Systems" },
  { id: "appendix-c", label: "Appendix C — Doctrine Summary" },
];

export function OverviewTab({ onNavigate }: { onNavigate: (tab: TabId) => void }) {
  const [notes, setNotes] = useState("");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div className="command-card" style={{ padding: "32px 28px" }}>
        <div
          style={{
            fontSize: 11,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "var(--ce-gold)",
            marginBottom: 10,
          }}
        >
          The Prime Doctrine
        </div>
        <div style={{ fontSize: 24, fontWeight: 600, color: "var(--ce-white)", letterSpacing: "-0.02em", lineHeight: 1.3, maxWidth: 720 }}>
          When intelligence becomes abundant, confusion becomes the bottleneck.
        </div>
        <div style={{ marginTop: 14, fontSize: 14.5, color: "var(--ce-muted)", maxWidth: 680, lineHeight: 1.7 }}>
          What changes is not capability. What changes is constraint. Intelligence solved execution. It did not solve
          judgment. This console is the internal operating interface for reading, applying, and governing the
          Operator Kernel.
        </div>
      </div>

      <div>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ce-white)" }}>The Eight Laws — Summary</div>
          <button
            onClick={() => onNavigate("laws")}
            style={{ fontSize: 12, color: "var(--ce-gold)", background: "none", border: "none", cursor: "pointer" }}
          >
            Open Laws →
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
          {laws.map((law) => (
            <div key={law.id} className="command-card" style={{ padding: "16px 16px" }}>
              <div style={{ fontSize: 22, color: "var(--ce-gold)", fontWeight: 700, letterSpacing: "-0.02em" }}>
                {law.numeral}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ce-white)", marginTop: 4 }}>{law.title}</div>
              <div style={{ fontSize: 12, color: "var(--ce-muted)", marginTop: 6, lineHeight: 1.5 }}>{law.statement}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
        <div className="command-card" style={{ padding: "20px 22px" }}>
          <div style={{ fontSize: 12, color: "var(--ce-gold)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>
            Canon Status
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13, color: "var(--ce-muted)" }}>
            <Row label="Immutable laws" value="8" />
            <Row label="Manuscript chapters" value="19 + 4 appendices" />
            <Row label="Lexicon terms" value="27" />
            <Row label="Structural migrations" value="8" />
            <Row label="Application scenarios" value="6" />
          </div>
        </div>

        <div className="command-card" style={{ padding: "20px 22px" }}>
          <div style={{ fontSize: 12, color: "var(--ce-gold)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>
            Quick Links — Manuscript
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {CHAPTER_LINKS.map((c) => (
              <button
                key={c.id}
                onClick={() => onNavigate("manuscript")}
                className="toc-link"
                style={{ textAlign: "left", background: "none", border: "none", cursor: "pointer", padding: "6px 8px" }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="command-card" style={{ padding: "20px 22px" }}>
          <div style={{ fontSize: 12, color: "var(--ce-gold)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>
            Private Operator Notes
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Not yet persisted — local to this session."
            style={{
              width: "100%",
              minHeight: 96,
              background: "var(--ce-navy)",
              border: "1px solid var(--ce-border)",
              borderRadius: 10,
              padding: 10,
              color: "var(--ce-text)",
              fontSize: 13,
              resize: "vertical",
            }}
          />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span>{label}</span>
      <span style={{ color: "var(--ce-text)", fontWeight: 500 }}>{value}</span>
    </div>
  );
}
