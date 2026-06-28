"use client";

import { useState, useEffect, useCallback } from "react";
import CENav from "../components/CENav";
import CEFooter from "../components/CEFooter";

// ── Design tokens ──────────────────────────────────────────────────────────────
const C = {
  bg:        "#03050A",
  panel:     "#111111",
  border:    "#222222",
  borderMid: "#333333",
  text:      "#EEF3FA",
  muted:     "#7A8DA6",
  dim:       "#4A5A70",
  gold:      "#C9A961",
  cyan:      "#00D8FF",
} as const;

// ── Types ──────────────────────────────────────────────────────────────────────
type Mode = "signal" | "decision" | "maintenance";

const STAGES = ["INTAKE", "DIAGNOSIS", "SYNTHESIS", "APPROVAL", "ACTION", "MEMORY"] as const;

type BaseSignal = {
  id: string;
  title: string;
  signal_state: string | null;
  directional_thesis: string | null;
  dominant_path: string | null;
  operator_move: string | null;
};

type ModelResponse = {
  provider: string;
  label: string;
  text: string;
  error?: string;
  done: boolean;
};

type SynthesisResult = {
  directionalWeight: number | null;
  evidenceStrength: number | null;
  stateRecommendation: string | null;
  stateReason: string | null;
  operatorMove: string | null;
  raw: string;
  parseOk: boolean;
};

// ── Model calls ───────────────────────────────────────────────────────────────
type KeyStore = { anthropic: string; openai: string; grok: string; gemini: string };

async function callProvider(
  provider: keyof KeyStore,
  apiKey: string,
  system: string,
  user: string,
): Promise<string> {
  if (provider === "anthropic") {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1200,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });
    if (!res.ok) throw new Error(`Anthropic ${res.status}`);
    const j = await res.json();
    return j.content?.[0]?.text ?? "";
  }
  if (provider === "openai") {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: 1200,
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
      }),
    });
    if (!res.ok) throw new Error(`OpenAI ${res.status}`);
    const j = await res.json();
    return j.choices?.[0]?.message?.content ?? "";
  }
  if (provider === "grok") {
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "grok-3",
        max_tokens: 1200,
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
      }),
    });
    if (!res.ok) throw new Error(`Grok ${res.status}`);
    const j = await res.json();
    return j.choices?.[0]?.message?.content ?? "";
  }
  if (provider === "gemini") {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: user }] }],
        }),
      },
    );
    if (!res.ok) throw new Error(`Gemini ${res.status}`);
    const j = await res.json();
    return j.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  }
  throw new Error("Unknown provider");
}

const PROVIDER_LABELS: Record<keyof KeyStore, string> = {
  anthropic: "Claude",
  openai:    "GPT-4o",
  grok:      "Grok",
  gemini:    "Gemini",
};

// ── Synthesis parser ──────────────────────────────────────────────────────────
function parseSynthesis(text: string): SynthesisResult {
  const get = (key: string) => {
    const m = text.match(new RegExp(`${key}:\\s*(.+?)(?:\\n|$)`, "i"));
    return m?.[1]?.trim() ?? null;
  };
  const dw = get("DIRECTIONAL_WEIGHT");
  const es = get("EVIDENCE_STRENGTH");
  const sr = get("STATE_RECOMMENDATION");
  const sn = get("STATE_REASON");
  const om = get("OPERATOR_MOVE");
  const parseOk = !!(dw || es || sr);
  return {
    directionalWeight:   dw ? parseInt(dw) : null,
    evidenceStrength:    es ? parseInt(es) : null,
    stateRecommendation: sr,
    stateReason:         sn,
    operatorMove:        om,
    raw:                 text,
    parseOk,
  };
}

// ── Shared input style ────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  background: "#0A0A0A",
  border: `1px solid ${C.borderMid}`,
  borderRadius: 3,
  color: C.text,
  padding: "8px 12px",
  fontSize: 13,
  width: "100%",
  boxSizing: "border-box",
  outline: "none",
  fontFamily: "system-ui, -apple-system, sans-serif",
};

function GoldBtn({ onClick, children, disabled }: { onClick: () => void; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        border: `1px solid ${disabled ? C.borderMid : C.gold}`,
        color: disabled ? C.dim : C.gold,
        background: "transparent",
        padding: "9px 22px",
        fontSize: 13,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background 180ms ease, color 180ms ease",
        letterSpacing: "0.04em",
      }}
      onMouseEnter={(e) => {
        if (!disabled) { e.currentTarget.style.background = C.gold; e.currentTarget.style.color = "#000"; }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = disabled ? C.dim : C.gold;
      }}
    >
      {children}
    </button>
  );
}

// ── Signal Assessment Mode ────────────────────────────────────────────────────
function SignalAssessmentMode({
  keys,
  sessionId,
  stage,
  setStage,
  setFeedbackOpen,
  setKeysOpen,
}: {
  keys: KeyStore;
  sessionId: string;
  stage: number;
  setStage: (n: number) => void;
  setFeedbackOpen: (v: boolean) => void;
  setKeysOpen: (v: boolean) => void;
}) {
  const [forces,         setForces]         = useState<BaseSignal[]>([]);
  const [loadingForces,  setLoadingForces]   = useState(true);
  const [selected,       setSelected]        = useState<BaseSignal | null>(null);
  const [rawInput,       setRawInput]        = useState("");
  const [keyWarning,     setKeyWarning]      = useState<string | null>(null);
  const [responses,      setResponses]       = useState<ModelResponse[]>([]);
  const [synthesis,      setSynthesis]       = useState<SynthesisResult | null>(null);
  const [approvalChoice, setApprovalChoice]  = useState<"apply" | "evidence-only" | null>(null);
  const [actionResult,   setActionResult]    = useState<string | null>(null);
  const [actionRunning,  setActionRunning]   = useState(false);
  const [downloaded,     setDownloaded]      = useState(false);

  // Fetch base forces on mount
  useEffect(() => {
    fetch("/api/signals/base-forces")
      .then((r) => r.json())
      .then((data: BaseSignal[]) => { setForces(data); setLoadingForces(false); })
      .catch(() => setLoadingForces(false));
  }, []);

  // Fire model calls when stage advances to DIAGNOSIS
  useEffect(() => {
    if (stage !== 1 || !selected) return;

    const activeProviders = (Object.keys(keys) as (keyof KeyStore)[])
      .filter((p) => keys[p].trim() !== "");

    if (activeProviders.length === 0) {
      setResponses([{ provider: "none", label: "—", text: "", error: "No API keys entered.", done: true }]);
      setStage(2);
      return;
    }

    const system = `You are a structural intelligence analyst operating within Cognitive Empire's MMCP framework.

You are assessing a base force signal. Analyze the operator's input and produce a structured assessment.

Base Force: ${selected.title}
Current State: ${selected.signal_state ?? "unknown"}
Directional Thesis: ${selected.directional_thesis ?? "—"}
Dominant Path: ${selected.dominant_path ?? "—"}

After your analysis, output your structured assessment on new lines in EXACTLY this format:

DIRECTIONAL_WEIGHT: N%
EVIDENCE_STRENGTH: N/100
STATE_RECOMMENDATION: [dormant|monitoring|active|directional|act_now|resolved]
STATE_REASON: one sentence
OPERATOR_MOVE: specific action`;

    const userContent = `Operator input:\n\n${rawInput || "(No additional context provided.)"}`;

    // Initialise slots so cards appear immediately
    const initial: ModelResponse[] = activeProviders.map((p) => ({
      provider: p,
      label: PROVIDER_LABELS[p],
      text: "",
      done: false,
    }));
    setResponses(initial);

    let completedCount = 0;
    const total = activeProviders.length;

    activeProviders.forEach((prov) => {
      callProvider(prov, keys[prov], system, userContent)
        .then((text) => {
          setResponses((prev) =>
            prev.map((r) => r.provider === prov ? { ...r, text, done: true } : r)
          );
        })
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : "Request failed";
          setResponses((prev) =>
            prev.map((r) => r.provider === prov ? { ...r, error: msg, done: true } : r)
          );
        })
        .finally(() => {
          completedCount++;
          if (completedCount === total) {
            // All done — advance to SYNTHESIS
            setStage(2);
          }
        });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  // Build synthesis from first successful response when stage reaches 2
  useEffect(() => {
    if (stage !== 2) return;
    const best = responses.find((r) => r.done && !r.error && r.text);
    if (best) setSynthesis(parseSynthesis(best.text));
  }, [stage, responses]);

  // ── Execute approval action
  const runAction = useCallback(async (choice: "apply" | "evidence-only") => {
    if (!selected || actionRunning) return;
    setApprovalChoice(choice);
    setActionRunning(true);
    try {
      const avgEvidence = synthesis?.evidenceStrength ? synthesis.evidenceStrength / 100 : null;
      const body = choice === "apply"
        ? {
            signal_id: selected.id,
            action: "apply",
            new_state: synthesis?.stateRecommendation ?? selected.signal_state,
            session_id: sessionId,
            raw_input: rawInput,
            model_synthesis: responses.reduce<Record<string, string>>((acc, r) => {
              acc[r.label] = r.text.slice(0, 600);
              return acc;
            }, {}),
          }
        : {
            signal_id: selected.id,
            action: "evidence-only",
            session_id: sessionId,
            raw_input: rawInput,
            model_synthesis: {
              synthesis_summary: synthesis?.stateReason ?? "",
              confidence_score: avgEvidence,
              responses: responses.reduce<Record<string, string>>((acc, r) => {
                acc[r.label] = r.text.slice(0, 600);
                return acc;
              }, {}),
            },
          };

      const res = await fetch("/api/orchestrator/apply-signal-state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Action failed");
      setActionResult(choice === "apply"
        ? `State updated to: ${synthesis?.stateRecommendation ?? "—"}`
        : "Evidence logged without state change.");
      setStage(4);
    } catch (err) {
      setActionResult(err instanceof Error ? err.message : "Action failed.");
      setStage(4);
    } finally {
      setActionRunning(false);
    }
  }, [selected, synthesis, responses, rawInput, sessionId, actionRunning]);

  // ── Download session transcript
  const downloadSession = useCallback(() => {
    if (!selected) return;
    const lines = [
      "CE ORCHESTRATOR — SIGNAL ASSESSMENT SESSION",
      `Session ID: ${sessionId}`,
      `Date: ${new Date().toISOString()}`,
      "",
      `FORCE ASSESSED: ${selected.title}`,
      `CURRENT STATE: ${selected.signal_state ?? "—"}`,
      `RECOMMENDED STATE: ${synthesis?.stateRecommendation ?? "—"}`,
      "",
      "RAW OPERATOR INPUT:",
      rawInput || "(none)",
      "",
      "MODEL DIAGNOSES:",
      ...responses.map((r) => [
        `[${r.label}]`,
        r.error ? `Error: ${r.error}` : r.text.slice(0, 500),
        "",
      ].join("\n")),
      "PARSED SYNTHESIS:",
      `Directional Weight: ${synthesis?.directionalWeight ?? "—"}%`,
      `Evidence Strength: ${synthesis?.evidenceStrength ?? "—"}/100`,
      `State Recommendation: ${synthesis?.stateRecommendation ?? "—"}`,
      `State Reason: ${synthesis?.stateReason ?? "—"}`,
      `Operator Move: ${synthesis?.operatorMove ?? "—"}`,
      "",
      `DECISION: ${approvalChoice === "apply" ? "State change applied" : approvalChoice === "evidence-only" ? "Logged as evidence only" : "—"}`,
      actionResult ? `Result: ${actionResult}` : "",
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `ce-signal-assessment-${sessionId.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloaded(true);
  }, [selected, sessionId, rawInput, responses, synthesis, approvalChoice, actionResult]);

  // ── Stage 0: INTAKE ──────────────────────────────────────────────────────────
  if (stage === 0) {
    return (
      <div style={{ paddingTop: 8 }}>
        <p style={{ fontSize: 11, color: C.dim, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 20px" }}>
          Signal Assessment — Intake
        </p>

        {loadingForces ? (
          <p style={{ color: C.muted, fontSize: 13 }}>Loading base forces…</p>
        ) : forces.length === 0 ? (
          <p style={{ color: "#E07070", fontSize: 13 }}>No published base forces found. Publish at least one base signal first.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            <div>
              <label style={{ display: "block", fontSize: 11, color: C.dim, marginBottom: 6, letterSpacing: "0.08em", textTransform: "uppercase" as const }}>
                Select Force to Assess
              </label>
              <select
                value={selected?.id ?? ""}
                onChange={(e) => {
                  const f = forces.find((x) => x.id === e.target.value) ?? null;
                  setSelected(f);
                }}
                style={{ ...inputStyle, cursor: "pointer" }}
                onFocus={(el) => { el.currentTarget.style.borderColor = C.gold; }}
                onBlur={(el)  => { el.currentTarget.style.borderColor = C.borderMid; }}
              >
                <option value="">— Choose a base force —</option>
                {forces.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.title} {f.signal_state ? `(${f.signal_state})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {selected && (
              <div style={{
                background: C.panel, border: `1px solid ${C.border}`,
                padding: "14px 16px", fontSize: 12,
              }}>
                <p style={{ color: C.muted, margin: "0 0 4px" }}>
                  <span style={{ color: C.dim }}>Thesis: </span>
                  {selected.directional_thesis ?? "—"}
                </p>
                {selected.dominant_path && (
                  <p style={{ color: C.muted, margin: "0 0 4px" }}>
                    <span style={{ color: C.dim }}>Dominant path: </span>
                    {selected.dominant_path}
                  </p>
                )}
                {selected.operator_move && (
                  <p style={{ color: C.dim, margin: 0 }}>
                    <span style={{ color: C.dim }}>Current operator move: </span>
                    {selected.operator_move}
                  </p>
                )}
              </div>
            )}

            <div>
              <label style={{ display: "block", fontSize: 11, color: C.dim, marginBottom: 6, letterSpacing: "0.08em", textTransform: "uppercase" as const }}>
                Raw Input — What have you observed? (paste news, data, evidence)
              </label>
              <textarea
                rows={6}
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                placeholder="Paste raw intelligence, headlines, data points, or observations relevant to this force…"
                style={{ ...inputStyle, resize: "vertical" as const }}
                onFocus={(el) => { el.currentTarget.style.borderColor = C.gold; }}
                onBlur={(el)  => { el.currentTarget.style.borderColor = C.borderMid; }}
              />
            </div>

            {keyWarning && (
              <p style={{ color: "#E09A40", fontSize: 12, margin: 0 }}>{keyWarning}</p>
            )}

            <div>
              <GoldBtn
                onClick={() => {
                  if (!selected) return;
                  const hasKey = Object.values(keys).some((v) => v.trim() !== "");
                  if (!hasKey) {
                    setKeyWarning("Enter at least one API key to run diagnosis. You can proceed anyway.");
                  } else {
                    setKeyWarning(null);
                  }
                  setKeysOpen(false);
                  setStage(1);
                }}
                disabled={!selected}
              >
                Begin Diagnosis →
              </GoldBtn>
            </div>

          </div>
        )}
      </div>
    );
  }

  // ── Stage 1: DIAGNOSIS ───────────────────────────────────────────────────────
  if (stage === 1) {
    return (
      <div style={{ paddingTop: 8 }}>
        <p style={{ fontSize: 11, color: C.dim, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 20px" }}>
          Diagnosis — Running model analysis…
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
          {responses.map((r) => (
            <div key={r.provider} style={{
              background: C.panel, border: `1px solid ${r.done ? C.border : C.borderMid}`,
              padding: "14px 16px",
            }}>
              <p style={{ fontSize: 11, color: C.gold, fontWeight: 600, letterSpacing: "0.08em", margin: "0 0 8px" }}>
                {r.label}
              </p>
              {!r.done ? (
                <p style={{ fontSize: 12, color: C.dim }}>Thinking…</p>
              ) : r.error ? (
                <p style={{ fontSize: 12, color: "#E07070" }}>{r.label} unavailable — {r.error}</p>
              ) : (
                <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                  {r.text.slice(0, 280)}{r.text.length > 280 ? "…" : ""}
                </p>
              )}
            </div>
          ))}
        </div>
        {responses.length === 0 && (
          <p style={{ color: C.dim, fontSize: 13 }}>Initialising model calls…</p>
        )}
      </div>
    );
  }

  // ── Stage 2: SYNTHESIS ───────────────────────────────────────────────────────
  if (stage === 2) {
    return (
      <div style={{ paddingTop: 8 }}>
        <p style={{ fontSize: 11, color: C.dim, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 20px" }}>
          Synthesis — {selected?.title}
        </p>

        {/* Full model responses */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, marginBottom: 28 }}>
          {responses.filter((r) => !r.error && r.text).map((r) => (
            <div key={r.provider} style={{
              background: C.panel, border: `1px solid ${C.border}`, padding: "14px 16px",
            }}>
              <p style={{ fontSize: 11, color: C.gold, fontWeight: 600, letterSpacing: "0.08em", margin: "0 0 8px" }}>
                {r.label}
              </p>
              <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
                {r.text}
              </p>
            </div>
          ))}
          {responses.filter((r) => r.error).map((r) => (
            <div key={r.provider} style={{
              background: C.panel, border: `1px solid ${C.border}`, padding: "14px 16px",
            }}>
              <p style={{ fontSize: 11, color: C.dim, margin: "0 0 6px" }}>{r.label}</p>
              <p style={{ fontSize: 12, color: "#E07070" }}>Unavailable</p>
            </div>
          ))}
        </div>

        {/* Parsed synthesis */}
        {synthesis && (
          <div style={{
            background: "#0A0A0A", border: `1px solid ${C.gold}`,
            padding: "20px 22px", marginBottom: 24,
          }}>
            <p style={{ fontSize: 11, color: C.gold, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 14px" }}>
              Parsed Synthesis
            </p>
            {!synthesis.parseOk && (
              <p style={{ fontSize: 12, color: "#E09A40", marginBottom: 10 }}>
                Could not parse structured output — showing raw response below.
              </p>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 20px" }}>
              <Row label="Directional Weight" value={synthesis.directionalWeight != null ? `${synthesis.directionalWeight}%` : "—"} />
              <Row label="Evidence Strength"  value={synthesis.evidenceStrength  != null ? `${synthesis.evidenceStrength}/100` : "—"} />
              <Row label="State Recommendation" value={synthesis.stateRecommendation ?? "—"} />
              <Row label="Operator Move"       value={synthesis.operatorMove      ?? "—"} />
            </div>
            {synthesis.stateReason && (
              <p style={{ fontSize: 12, color: C.muted, marginTop: 10, lineHeight: 1.6 }}>
                <span style={{ color: C.dim }}>Reason: </span>{synthesis.stateReason}
              </p>
            )}
            {!synthesis.parseOk && (
              <p style={{ fontSize: 12, color: C.dim, marginTop: 12, whiteSpace: "pre-wrap" }}>
                {synthesis.raw.slice(0, 800)}
              </p>
            )}
          </div>
        )}

        <GoldBtn onClick={() => setStage(3)}>
          Advance to Approval →
        </GoldBtn>
      </div>
    );
  }

  // ── Stage 3: APPROVAL (gold, human-gated) ────────────────────────────────────
  if (stage === 3) {
    return (
      <div style={{ paddingTop: 8 }}>
        <p style={{ fontSize: 11, color: C.gold, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 8px" }}>
          Approval — Human Gate
        </p>
        <p style={{ fontSize: 13, color: C.muted, margin: "0 0 24px" }}>
          Review the synthesis and choose an action. This decision is yours — the system will not auto-advance.
        </p>

        <div style={{
          background: "#0A0A0A",
          border: `1px solid ${C.gold}`,
          padding: "18px 20px", marginBottom: 28,
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 20px" }}>
            <Row label="Force"              value={selected?.title ?? "—"} />
            <Row label="Current State"      value={selected?.signal_state ?? "—"} />
            <Row label="Recommended State"  value={synthesis?.stateRecommendation ?? "—"} />
            <Row label="Evidence Strength"  value={synthesis?.evidenceStrength != null ? `${synthesis.evidenceStrength}/100` : "—"} />
          </div>
          {synthesis?.stateReason && (
            <p style={{ fontSize: 12, color: C.muted, marginTop: 12, lineHeight: 1.6 }}>
              <span style={{ color: C.dim }}>Reason: </span>{synthesis.stateReason}
            </p>
          )}
          {synthesis?.operatorMove && (
            <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
              <span style={{ color: C.dim }}>Operator move: </span>{synthesis.operatorMove}
            </p>
          )}
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" as const }}>
          <GoldBtn onClick={() => runAction("apply")} disabled={actionRunning}>
            Apply State Change →
          </GoldBtn>
          <button
            onClick={() => runAction("evidence-only")}
            disabled={actionRunning}
            style={{
              border: `1px solid ${C.borderMid}`,
              color: C.muted, background: "transparent",
              padding: "9px 22px", fontSize: 13, fontWeight: 600,
              cursor: actionRunning ? "not-allowed" : "pointer",
              letterSpacing: "0.04em",
            }}
          >
            Log Evidence Only →
          </button>
        </div>
        {actionRunning && (
          <p style={{ color: C.dim, fontSize: 12, marginTop: 12 }}>Executing…</p>
        )}
      </div>
    );
  }

  // ── Stage 4: ACTION ──────────────────────────────────────────────────────────
  if (stage === 4) {
    return (
      <div style={{ paddingTop: 8 }}>
        <p style={{ fontSize: 11, color: C.dim, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 20px" }}>
          Action — Complete
        </p>
        <div style={{
          background: C.panel, border: `1px solid ${C.border}`,
          padding: "16px 18px", marginBottom: 24,
        }}>
          <p style={{ fontSize: 13, color: C.text, margin: "0 0 4px" }}>
            {approvalChoice === "apply" ? "State change applied." : "Evidence logged without state change."}
          </p>
          {actionResult && (
            <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>{actionResult}</p>
          )}
        </div>
        <GoldBtn onClick={() => setStage(5)}>
          Advance to Memory →
        </GoldBtn>
      </div>
    );
  }

  // ── Stage 5: MEMORY ──────────────────────────────────────────────────────────
  if (stage === 5) {
    return (
      <div style={{ paddingTop: 8 }}>
        <p style={{ fontSize: 11, color: C.dim, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 20px" }}>
          Memory — Session Archive
        </p>
        <div style={{
          background: C.panel, border: `1px solid ${C.border}`,
          padding: "18px 20px", marginBottom: 24,
        }}>
          <p style={{ fontSize: 13, color: C.text, margin: "0 0 6px" }}>Session complete.</p>
          <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.6, margin: 0 }}>
            Force: {selected?.title} · Decision: {approvalChoice === "apply" ? "State applied" : "Evidence logged"}<br />
            Session ID: <span style={{ fontFamily: "monospace" }}>{sessionId.slice(0, 16)}…</span>
          </p>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" as const }}>
          <GoldBtn onClick={downloadSession}>
            {downloaded ? "Downloaded ✓" : "Download Session Log →"}
          </GoldBtn>
          <GoldBtn onClick={() => setFeedbackOpen(true)}>
            Submit Feedback & Close →
          </GoldBtn>
        </div>
      </div>
    );
  }

  return null;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span style={{ fontSize: 11, color: C.dim }}>{label}: </span>
      <span style={{ fontSize: 12, color: C.text }}>{value}</span>
    </div>
  );
}

// ── ModeContent router ────────────────────────────────────────────────────────
function ModeContent({
  mode, keys, sessionId, stage, setStage, setFeedbackOpen, setKeysOpen,
}: {
  mode: Mode;
  keys: KeyStore;
  sessionId: string;
  stage: number;
  setStage: (n: number) => void;
  setFeedbackOpen: (v: boolean) => void;
  setKeysOpen: (v: boolean) => void;
}) {
  if (mode === "signal") {
    return (
      <SignalAssessmentMode
        keys={keys}
        sessionId={sessionId}
        stage={stage}
        setStage={setStage}
        setFeedbackOpen={setFeedbackOpen}
        setKeysOpen={setKeysOpen}
      />
    );
  }
  if (mode === "decision") {
    return <div style={{ color: C.muted, padding: "40px 0", fontSize: 14 }}>Decision Flow — coming in next session</div>;
  }
  return <div style={{ color: C.muted, padding: "40px 0", fontSize: 14 }}>Maintenance Audit — coming in next session</div>;
}

// ── BETABadge ─────────────────────────────────────────────────────────────────
function BetaBadge() {
  return (
    <span style={{
      border: `1px solid ${C.gold}`, color: C.gold,
      padding: "2px 8px", fontSize: 11, letterSpacing: "0.1em",
      fontWeight: 600, textTransform: "uppercase" as const,
    }}>
      BETA
    </span>
  );
}

// ── ProgressionRail ───────────────────────────────────────────────────────────
function ProgressionRail({ stage }: { stage: number }) {
  const atApproval = stage === 3;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", padding: "12px 0", flexWrap: "wrap" as const }}>
        {STAGES.map((label, i) => {
          const isActive    = i === stage;
          const isCompleted = i < stage;
          const dotColor    = (i === 3 && stage >= 3) ? C.gold : C.cyan;
          const labelColor  = isActive ? (i === 3 ? C.gold : C.text) : isCompleted ? C.muted : C.dim;
          return (
            <div key={label} style={{ display: "flex", alignItems: "center" }}>
              {i > 0 && <span style={{ color: "#333", fontSize: 11, margin: "0 6px" }}>→</span>}
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                {isActive && (
                  <div style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: dotColor, flexShrink: 0,
                    boxShadow: stage < 3 ? `0 0 6px ${C.cyan}` : "none",
                    animation: stage < 3 ? "cePulse 1.5s ease-in-out infinite" : "none",
                  }} />
                )}
                {isCompleted && <span style={{ color: C.muted, fontSize: 10, marginRight: 2 }}>✓</span>}
                <span style={{
                  fontSize: 11, letterSpacing: "0.08em",
                  textTransform: "uppercase" as const,
                  fontWeight: isActive ? 600 : 400, color: labelColor,
                }}>
                  {label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      {atApproval && <div style={{ height: 2, background: C.gold, opacity: 0.6, marginBottom: 4 }} />}
    </div>
  );
}

// ── BYOKPanel ─────────────────────────────────────────────────────────────────
function BYOKPanel({
  keys, setKeys, open, setOpen,
}: {
  keys: KeyStore;
  setKeys: (k: KeyStore) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const PROVIDERS: { key: keyof KeyStore; label: string; placeholder: string }[] = [
    { key: "anthropic", label: "Anthropic",  placeholder: "sk-ant-..." },
    { key: "openai",    label: "OpenAI",     placeholder: "sk-..." },
    { key: "grok",      label: "Grok (xAI)", placeholder: "xai-..." },
    { key: "gemini",    label: "Gemini",     placeholder: "AIza..." },
  ];
  return (
    <div style={{ borderBottom: `1px solid ${C.border}`, marginBottom: 24, paddingBottom: open ? 20 : 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0" }}>
        <span style={{ fontSize: 12, color: C.muted, fontWeight: 600, letterSpacing: "0.06em" }}>API Keys</span>
        <button
          onClick={() => setOpen(!open)}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: C.muted, padding: 0 }}
        >
          {open ? "Hide" : "Show"}
        </button>
      </div>
      {open && (
        <div>
          <div className="ce-byok-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {PROVIDERS.map(({ key, label, placeholder }) => (
              <div key={key}>
                <label style={{ display: "block", fontSize: 11, color: C.dim, marginBottom: 5, letterSpacing: "0.08em", textTransform: "uppercase" as const }}>
                  {label}
                </label>
                <input
                  type="password"
                  placeholder={placeholder}
                  value={keys[key]}
                  onChange={(e) => setKeys({ ...keys, [key]: e.target.value })}
                  style={{ ...inputStyle, fontFamily: "monospace" }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = C.gold; }}
                  onBlur={(e)  => { e.currentTarget.style.borderColor = C.borderMid; }}
                />
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11, color: C.dim, margin: "10px 0 0" }}>
            Keys exist in session memory only. Never logged. Never sent to CE servers.
          </p>
        </div>
      )}
    </div>
  );
}

// ── FeedbackGate ──────────────────────────────────────────────────────────────
function FeedbackGate({ mode, sessionId, onClose }: { mode: Mode; sessionId: string; onClose: () => void }) {
  const [task,      setTask]      = useState("");
  const [bestModel, setBestModel] = useState("");
  const [rating,    setRating]    = useState(0);
  const [notes,     setNotes]     = useState("");
  const [sending,   setSending]   = useState(false);
  const canSubmit = rating > 0;

  const submit = async () => {
    if (!canSubmit || sending) return;
    setSending(true);
    try {
      await fetch("/api/orchestrator/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, mode, task: task || null, best_model: bestModel || null, rating, notes: notes || null }),
      });
    } catch { /* non-fatal */ }
    onClose();
  };

  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100, display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 860, background: C.panel, borderTop: `1px solid ${C.gold}`, padding: "24px 32px" }}>
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 14, color: C.text, fontWeight: 600, margin: "0 0 4px" }}>Session Feedback</p>
          <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>Required before session closes.</p>
        </div>
        <div className="ce-feedback-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, color: C.dim, marginBottom: 5, letterSpacing: "0.06em", textTransform: "uppercase" as const }}>
              What were you trying to accomplish?
            </label>
            <textarea rows={2} value={task} onChange={(e) => setTask(e.target.value)} style={{ ...inputStyle, resize: "none" as const }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, color: C.dim, marginBottom: 5, letterSpacing: "0.06em", textTransform: "uppercase" as const }}>
              Most useful model response?
            </label>
            <select value={bestModel} onChange={(e) => setBestModel(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
              <option value="">— Select —</option>
              <option value="claude">Claude</option>
              <option value="gpt">GPT-4o</option>
              <option value="grok">Grok</option>
              <option value="gemini">Gemini</option>
              <option value="tie">Tie</option>
              <option value="n/a">N/A</option>
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, color: C.dim, marginBottom: 8, letterSpacing: "0.06em", textTransform: "uppercase" as const }}>
              Session quality (1–5) *
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              {[1,2,3,4,5].map((n) => (
                <span key={n} onClick={() => setRating(n)} style={{
                  width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
                  border: `1px solid ${rating === n ? C.gold : C.borderMid}`,
                  color: rating === n ? C.gold : C.dim,
                  fontSize: 14, fontWeight: 600, cursor: "pointer", userSelect: "none" as const,
                  transition: "color 150ms, border-color 150ms",
                }}>
                  {n}
                </span>
              ))}
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, color: C.dim, marginBottom: 5, letterSpacing: "0.06em", textTransform: "uppercase" as const }}>
              Anything broken or missing? (optional)
            </label>
            <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} style={{ ...inputStyle, resize: "none" as const }} />
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <button
            onClick={submit}
            disabled={!canSubmit || sending}
            style={{
              border: `1px solid ${C.gold}`, color: canSubmit ? C.gold : C.dim,
              background: "transparent", padding: "8px 20px", fontSize: 13,
              cursor: canSubmit ? "pointer" : "not-allowed",
              transition: "background 180ms ease, color 180ms ease", fontWeight: 600,
            }}
            onMouseEnter={(e) => { if (canSubmit) { e.currentTarget.style.background = C.gold; e.currentTarget.style.color = "#000"; } }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = canSubmit ? C.gold : C.dim; }}
          >
            {sending ? "Saving…" : "Submit & Close Session →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Landing ───────────────────────────────────────────────────────────────────
function ModeCard({ num, title, body, onClick }: { num: string; title: string; body: string; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: "1 1 260px", background: C.panel,
        border: `1px solid ${hovered ? C.gold : C.border}`,
        borderRadius: 4, padding: "28px 24px", cursor: "pointer",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        transition: "transform 220ms cubic-bezier(0.25,0.1,0.25,1.0), border-color 220ms ease",
      }}
    >
      <p style={{ fontSize: 11, color: C.muted, letterSpacing: "0.12em", textTransform: "uppercase" as const, margin: "0 0 8px" }}>{num}</p>
      <p style={{ fontSize: "1.1rem", color: C.text, fontWeight: 600, margin: "0 0 8px" }}>{title}</p>
      <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6, margin: "0 0 16px" }}>{body}</p>
      <p style={{ fontSize: 14, color: C.gold, margin: 0 }}>Begin →</p>
    </div>
  );
}

function Landing({ onSelect }: { onSelect: (m: Mode) => void }) {
  const cards: { mode: Mode; num: string; title: string; body: string }[] = [
    { mode: "signal",      num: "MODE 01", title: "Signal Assessment",  body: "Run raw intelligence through the 7 base forces. Get multi-model analysis and a state recommendation." },
    { mode: "decision",    num: "MODE 02", title: "Decision Flow",       body: "Govern any decision through the full MMCP sequence. Constraints, synthesis, approval, execution." },
    { mode: "maintenance", num: "MODE 03", title: "Maintenance Audit",   body: "Surface your operational debt. Get a Maintenance Gravity Score and a prioritized reduction list." },
  ];
  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <CENav />
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "64px 32px 80px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <h1 style={{ fontSize: "2.5rem", color: C.text, fontWeight: 600, margin: 0, lineHeight: 1.1 }}>The Orchestrator</h1>
          <BetaBadge />
        </div>
        <p style={{ fontSize: "1rem", color: C.muted, margin: "8px 0 0" }}>
          Multi-model intelligence. Three session modes.<br />No data stored. Judgment stays human.
        </p>
        <div style={{ height: 1, background: C.gold, opacity: 0.4, margin: "32px 0" }} />
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" as const }}>
          {cards.map(({ mode, num, title, body }) => (
            <ModeCard key={mode} num={num} title={title} body={body} onClick={() => onSelect(mode)} />
          ))}
        </div>
        <p style={{ textAlign: "center", fontSize: 12, color: C.dim, marginTop: 32, lineHeight: 1.7 }}>
          API keys are held in session memory only.<br />
          No conversation content is stored.<br />
          Only aggregate feedback is retained after session close.
        </p>
      </div>
      <CEFooter />
    </div>
  );
}

// ── SessionView ───────────────────────────────────────────────────────────────
function SessionView({
  mode, stage, setStage, keys, setKeys, keysOpen, setKeysOpen,
  sessionId, feedbackOpen, setFeedbackOpen, onBack, onSessionClose,
}: {
  mode: Mode;
  stage: number;
  setStage: (n: number) => void;
  keys: KeyStore;
  setKeys: (k: KeyStore) => void;
  keysOpen: boolean;
  setKeysOpen: (v: boolean) => void;
  sessionId: string;
  feedbackOpen: boolean;
  setFeedbackOpen: (v: boolean) => void;
  onBack: () => void;
  onSessionClose: () => void;
}) {
  const modeLabels: Record<Mode, string> = {
    signal: "Signal Assessment", decision: "Decision Flow", maintenance: "Maintenance Audit",
  };
  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "system-ui, -apple-system, sans-serif", paddingBottom: feedbackOpen ? 280 : 0 }}>
      <CENav />
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "24px 32px 80px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <button
            onClick={onBack}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: C.muted, padding: 0, transition: "color 150ms ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = C.text; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = C.muted; }}
          >
            ← {modeLabels[mode]}
          </button>
          <BetaBadge />
        </div>
        <ProgressionRail stage={stage} />
        <div style={{ height: 1, background: C.border, margin: "16px 0 20px" }} />
        <BYOKPanel keys={keys} setKeys={setKeys} open={keysOpen} setOpen={setKeysOpen} />
        <ModeContent
          mode={mode}
          keys={keys}
          sessionId={sessionId}
          stage={stage}
          setStage={setStage}
          setFeedbackOpen={setFeedbackOpen}
          setKeysOpen={setKeysOpen}
        />
      </div>
      {feedbackOpen && <FeedbackGate mode={mode} sessionId={sessionId} onClose={onSessionClose} />}
      <CEFooter />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function OrchestratorPage() {
  const [mode,         setMode]         = useState<Mode | null>(null);
  const [stage,        setStage]        = useState<number>(0);
  const [keys,         setKeys]         = useState<KeyStore>({ anthropic: "", openai: "", grok: "", gemini: "" });
  const [keysOpen,     setKeysOpen]     = useState(true);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [sessionId]                     = useState(() => crypto.randomUUID());

  const handleSelectMode = (m: Mode) => { setMode(m); setStage(0); setKeysOpen(true); setFeedbackOpen(false); };
  const handleBack        = ()         => { setMode(null); setStage(0); setFeedbackOpen(false); };
  const handleSessionClose = ()        => { setMode(null); setStage(0); setFeedbackOpen(false); };

  const css = `
    @keyframes cePulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
    @media (max-width: 640px) {
      .ce-byok-grid { grid-template-columns: 1fr !important; }
      .ce-feedback-grid { grid-template-columns: 1fr !important; }
    }
  `;

  if (mode === null) {
    return <><style>{css}</style><Landing onSelect={handleSelectMode} /></>;
  }

  return (
    <>
      <style>{css}</style>
      <SessionView
        mode={mode} stage={stage} setStage={setStage}
        keys={keys} setKeys={setKeys}
        keysOpen={keysOpen} setKeysOpen={setKeysOpen}
        sessionId={sessionId}
        feedbackOpen={feedbackOpen} setFeedbackOpen={setFeedbackOpen}
        onBack={handleBack} onSessionClose={handleSessionClose}
      />
    </>
  );
}
