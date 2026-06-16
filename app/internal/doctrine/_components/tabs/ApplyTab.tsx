"use client";

import { useState } from "react";
import { scenarios } from "../../_data/scenarios";

export function ApplyTab() {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [history, setHistory] = useState<boolean[]>([]);

  const scenario = scenarios[step];

  function choose(index: number) {
    if (selected != null) return;
    setSelected(index);
    setHistory((h) => [...h, scenario.options[index].correct]);
  }

  function next() {
    if (step + 1 < scenarios.length) {
      setStep((s) => s + 1);
      setSelected(null);
    } else {
      setFinished(true);
    }
  }

  function restart() {
    setStep(0);
    setSelected(null);
    setFinished(false);
    setHistory([]);
  }

  if (finished) {
    const correctCount = history.filter(Boolean).length;
    const percent = Math.round((correctCount / scenarios.length) * 100);
    let level = "Execution-Focused";
    if (percent >= 83) level = "Renaissance Operator";
    else if (percent >= 66) level = "Disciplined Operator";
    else if (percent >= 50) level = "Emerging Operator";

    return (
      <div className="command-card" style={{ padding: "44px 32px", textAlign: "center", maxWidth: 560, margin: "0 auto" }}>
        <div style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--ce-dim)" }}>
          Doctrine Alignment Result
        </div>
        <div style={{ fontSize: 56, fontWeight: 700, color: "var(--ce-white)", marginTop: 10 }}>{percent}%</div>
        <div style={{ fontSize: 16, color: "var(--ce-gold)", marginTop: 2 }}>{level}</div>
        <div style={{ marginTop: 18, fontSize: 13.5, color: "var(--ce-muted)", lineHeight: 1.65 }}>
          {correctCount} of {scenarios.length} responses preserved structural doctrine under pressure.
        </div>
        <button
          onClick={restart}
          style={{ marginTop: 24, padding: "10px 22px", borderRadius: 10, border: "1px solid var(--ce-gold-border)", background: "var(--ce-gold-soft)", color: "var(--ce-gold)", fontSize: 13, cursor: "pointer" }}
        >
          Run Scenarios Again
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--ce-gold)" }}>
          Operator Training
        </div>
        <div style={{ fontSize: 20, fontWeight: 600, color: "var(--ce-white)", marginTop: 4 }}>
          Doctrine Application Scenarios
        </div>
        <div style={{ fontSize: 12.5, color: "var(--ce-muted)", marginTop: 4 }}>
          Scenario {step + 1} of {scenarios.length}
        </div>
      </div>

      <div className="command-card" style={{ padding: "28px 26px", maxWidth: 680 }}>
        <div style={{ fontSize: 16, color: "var(--ce-white)", lineHeight: 1.5 }}>{scenario.situation}</div>

        <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 10 }}>
          {scenario.options.map((opt, i) => {
            const isSelected = selected === i;
            const showResult = selected != null;
            return (
              <button
                key={i}
                onClick={() => choose(i)}
                disabled={selected != null}
                style={{
                  textAlign: "left",
                  padding: "14px 16px",
                  borderRadius: 12,
                  border: `1px solid ${isSelected ? (opt.correct ? "var(--ce-gold-border)" : "rgba(226,136,122,0.5)") : "var(--ce-border)"}`,
                  background: isSelected ? (opt.correct ? "var(--ce-gold-soft)" : "rgba(226,136,122,0.08)") : "var(--ce-navy)",
                  color: "var(--ce-text)",
                  fontSize: 13.5,
                  lineHeight: 1.5,
                  cursor: selected == null ? "pointer" : "default",
                  display: "flex",
                  gap: 12,
                }}
              >
                <span style={{ flexShrink: 0, width: 20, height: 20, borderRadius: "50%", border: "1px solid var(--ce-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "var(--ce-dim)" }}>
                  {String.fromCharCode(65 + i)}
                </span>
                <span>{opt.text}</span>
                {showResult && isSelected && (
                  <span style={{ marginLeft: "auto", color: opt.correct ? "var(--ce-gold)" : "#e2887a", fontSize: 11, flexShrink: 0 }}>
                    {opt.correct ? "Aligned" : "Misaligned"}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {selected != null && (
          <div style={{ marginTop: 22, paddingTop: 18, borderTop: "1px solid var(--ce-border)" }}>
            <div style={{ fontSize: 11, color: "var(--ce-gold)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>
              Doctrine Explanation
            </div>
            <div style={{ fontSize: 13.5, color: "var(--ce-text)", lineHeight: 1.65 }}>{scenario.options[selected].explanation}</div>
            <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap", fontSize: 11.5 }}>
              <span style={{ padding: "5px 12px", borderRadius: 999, background: "var(--ce-gold-soft)", color: "var(--ce-gold)" }}>
                Law {scenario.relatedLaw} — {scenario.relatedLawTitle}
              </span>
              <span style={{ padding: "5px 12px", borderRadius: 999, background: "rgba(255,255,255,0.04)", color: "var(--ce-muted)" }}>
                {scenario.relatedChapterLabel}
              </span>
            </div>
            <div style={{ marginTop: 18, display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={next}
                style={{ padding: "10px 22px", borderRadius: 10, border: "1px solid var(--ce-gold-border)", background: "var(--ce-gold)", color: "#1a1306", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
              >
                {step + 1 < scenarios.length ? "Next Scenario" : "View Results"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
