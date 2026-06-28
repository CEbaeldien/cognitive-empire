"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

// ── Design tokens ──────────────────────────────────────────────────────────────
const C = {
  bg:        "#03050A",
  panel:     "#111111",
  border:    "#1A1A1A",
  borderMid: "#2A2A2A",
  text:      "#EEF3FA",
  muted:     "#7A8DA6",
  dim:       "#4A5A70",
  gold:      "#C9A961",
  goldBg:    "rgba(201,169,97,0.08)",
  goldBdr:   "rgba(201,169,97,0.30)",
  green:     "#4CAF82",
  greenBg:   "rgba(76,175,130,0.08)",
  amber:     "#E09A40",
  amberBg:   "rgba(224,154,64,0.08)",
  red:       "#E05A5A",
  redBg:     "rgba(224,90,90,0.08)",
  blue:      "#00CFFF",
  blueBg:    "rgba(0,207,255,0.08)",
} as const;

const inp: React.CSSProperties = {
  background: "#0A0A0A", border: `1px solid ${C.borderMid}`,
  borderRadius: 3, color: C.text, padding: "8px 12px",
  fontSize: 13, width: "100%", boxSizing: "border-box",
  outline: "none", fontFamily: "system-ui,-apple-system,sans-serif",
};

// ── Types ─────────────────────────────────────────────────────────────────────
type SignalState = "act_now" | "directional" | "growing" | "watch" | "contradicted" | "raw" | "potential" | "retire";

type BaseSignal = {
  id: string;
  title: string;
  signal_state: SignalState | null;
  directional_thesis: string | null;
  dominant_path: string | null;
  operator_move: string | null;
  directional_weight: number | null;
  signal_scores: { final_score: number } | null;
};

type Decision = {
  id: string;
  title: string;
  stage: number;
  authority: "self" | "review" | "canon";
  readiness_pct: number;
  stage_log: unknown[];
  constraints_identified: string | null;
  risks_surfaced: string | null;
  contradictions: string | null;
  operator_move: string | null;
  outcome: string | null;
  canonized_at: string | null;
  created_at: string;
};

type GravityRecord = {
  id: string;
  week_of: string;
  score: number;
  ownerless: number;
  open_loops: number;
  unreviewed_automations: number;
  critical_dependencies: number;
  verdict: string | null;
};

type SessionUpgrade = { id: string; title: string; from: string; to: string };

// ── State color helpers ───────────────────────────────────────────────────────
const STATE_BORDER: Record<string, string> = {
  act_now:     C.gold,
  directional: C.blue,
  growing:     C.green,
  watch:       C.amber,
  contradicted: C.red,
  raw:         C.dim,
  potential:   C.dim,
  retire:      C.dim,
};

const STATE_LABEL: Record<string, string> = {
  act_now: "ACT NOW", directional: "DIRECTIONAL", growing: "GROWING",
  watch: "WATCH", contradicted: "CONTRADICTED", raw: "RAW",
  potential: "POTENTIAL", retire: "RETIRE",
};

const STATE_PROGRESSION: SignalState[] = ["raw", "potential", "watch", "directional", "growing", "act_now"];
const DECISION_STAGES = ["INTAKE", "DIAGNOSIS", "SYNTHESIS", "APPROVAL", "ACTION", "MEMORY"];

function currentMonday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

// ── Shared components ─────────────────────────────────────────────────────────
function Btn({ onClick, children, gold, dim, disabled }: {
  onClick: () => void; children: React.ReactNode;
  gold?: boolean; dim?: boolean; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        border: `1px solid ${disabled ? C.borderMid : gold ? C.gold : C.borderMid}`,
        color: disabled ? C.dim : gold ? C.gold : dim ? C.dim : C.muted,
        background: "transparent", padding: "7px 16px", fontSize: 12,
        fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
        letterSpacing: "0.04em", transition: "border-color 150ms, color 150ms",
        borderRadius: 3,
      }}
      onMouseEnter={(e) => { if (!disabled && gold) { e.currentTarget.style.background = C.gold; e.currentTarget.style.color = "#000"; } }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = disabled ? C.dim : gold ? C.gold : dim ? C.dim : C.muted; }}
    >
      {children}
    </button>
  );
}

function StateBadge({ state }: { state: string | null }) {
  if (!state) return null;
  const color = STATE_BORDER[state] ?? C.dim;
  return (
    <span style={{
      padding: "2px 7px", fontSize: 9, fontWeight: 700,
      letterSpacing: "0.1em", textTransform: "uppercase" as const,
      border: `1px solid ${color}`, color, borderRadius: 2,
    }}>
      {STATE_LABEL[state] ?? state}
    </span>
  );
}

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div style={{ height: 4, background: C.borderMid, borderRadius: 2, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${Math.min(100, Math.max(0, score))}%`, background: color, borderRadius: 2, transition: "width 300ms ease" }} />
    </div>
  );
}

function ProgressionDots({ state }: { state: SignalState | null }) {
  const idx = state ? STATE_PROGRESSION.indexOf(state) : -1;
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
      {STATE_PROGRESSION.map((s, i) => {
        const filled = i <= idx;
        const color = filled ? (STATE_BORDER[s] ?? C.dim) : C.borderMid;
        return (
          <div key={s} style={{ width: 8, height: 8, borderRadius: "50%", background: filled ? color : "transparent", border: `1px solid ${color}`, transition: "all 180ms ease" }} title={STATE_LABEL[s] ?? s} />
        );
      })}
    </div>
  );
}

// ── SIGNALS TAB ───────────────────────────────────────────────────────────────
function SignalsTab({
  signals, loading, onStateAdvanced,
}: {
  signals: BaseSignal[];
  loading: boolean;
  onStateAdvanced: (id: string, title: string, from: string, to: string) => void;
}) {
  const [expanded,    setExpanded]    = useState<string | null>(null);
  const [modal,       setModal]       = useState<BaseSignal | null>(null);
  const [newState,    setNewState]    = useState<SignalState>("directional");
  const [note,        setNote]        = useState("");
  const [saving,      setSaving]      = useState(false);
  const [saveErr,     setSaveErr]     = useState<string | null>(null);

  const openModal = (s: BaseSignal) => {
    setModal(s);
    const curIdx = s.signal_state ? STATE_PROGRESSION.indexOf(s.signal_state) : -1;
    const next = STATE_PROGRESSION[curIdx + 1] ?? "act_now";
    setNewState(next);
    setNote("");
    setSaveErr(null);
  };

  const applyState = async () => {
    if (!modal || saving) return;
    setSaving(true);
    setSaveErr(null);
    try {
      const res = await fetch(`/api/signals/${modal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signal_state: newState }),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      onStateAdvanced(modal.id, modal.title, modal.signal_state ?? "raw", newState);
      setModal(null);
    } catch (err) {
      setSaveErr(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p style={{ color: C.muted, fontSize: 13, padding: "24px 0" }}>Loading base forces…</p>;
  if (!signals.length) return <p style={{ color: C.dim, fontSize: 13, padding: "24px 0" }}>No published base signals found.</p>;

  return (
    <div>
      <p style={{ fontSize: 11, color: C.dim, letterSpacing: "0.08em", textTransform: "uppercase" as const, margin: "0 0 16px" }}>
        {signals.length} Base Forces · Signal State Management
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {signals.map((s) => {
          const score = s.signal_scores?.final_score ?? (s.directional_weight ?? 0) * 2;
          const borderColor = STATE_BORDER[s.signal_state ?? "raw"] ?? C.dim;
          const isOpen = expanded === s.id;
          return (
            <div key={s.id} style={{
              background: C.panel, borderRadius: 4,
              borderLeft: `3px solid ${borderColor}`,
              border: `1px solid ${C.border}`,
              borderLeftWidth: 3, borderLeftColor: borderColor,
              overflow: "hidden",
              transform: "translateY(0)",
              transition: "transform 200ms cubic-bezier(0.25,0.1,0.25,1.0)",
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
            >
              <div
                onClick={() => setExpanded(isOpen ? null : s.id)}
                style={{ padding: "14px 18px", cursor: "pointer" }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <p style={{ fontSize: 13, color: C.text, fontWeight: 600, margin: 0 }}>{s.title}</p>
                      <StateBadge state={s.signal_state} />
                    </div>
                    <ProgressionDots state={s.signal_state} />
                    {score > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                          <span style={{ fontSize: 10, color: C.dim }}>Evidence strength</span>
                          <span style={{ fontSize: 10, color: C.muted }}>{Math.round(score)}</span>
                        </div>
                        <ScoreBar score={score} color={borderColor} />
                      </div>
                    )}
                  </div>
                  <span style={{ color: C.dim, fontSize: 11, flexShrink: 0, marginTop: 2 }}>{isOpen ? "▲" : "▼"}</span>
                </div>
              </div>

              {isOpen && (
                <div style={{ padding: "0 18px 16px", borderTop: `1px solid ${C.border}` }}>
                  {s.directional_thesis && (
                    <p style={{ fontSize: 12, color: C.muted, margin: "12px 0 6px", lineHeight: 1.65 }}>
                      <span style={{ color: C.dim }}>Thesis: </span>{s.directional_thesis}
                    </p>
                  )}
                  {s.dominant_path && (
                    <p style={{ fontSize: 12, color: C.muted, margin: "0 0 6px" }}>
                      <span style={{ color: C.dim }}>Dominant path: </span>{s.dominant_path}
                    </p>
                  )}
                  {s.operator_move && (
                    <p style={{ fontSize: 12, color: C.muted, margin: "0 0 14px" }}>
                      <span style={{ color: C.dim }}>Operator move: </span>{s.operator_move}
                    </p>
                  )}
                  <Btn gold onClick={() => openModal(s)}>Advance State →</Btn>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Advance state modal */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: C.bg, border: `1px solid ${C.gold}`, borderRadius: 4, padding: "28px 32px", width: "100%", maxWidth: 480, margin: "0 16px" }}>
            <p style={{ fontSize: 12, color: C.gold, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const, margin: "0 0 4px" }}>Advance State</p>
            <p style={{ fontSize: 13, color: C.text, fontWeight: 600, margin: "0 0 16px" }}>{modal.title}</p>

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <StateBadge state={modal.signal_state} />
              <span style={{ color: C.dim, fontSize: 12 }}>→</span>
              <select
                value={newState}
                onChange={(e) => setNewState(e.target.value as SignalState)}
                style={{ ...inp, width: "auto", flex: 1 }}
              >
                {(["raw","potential","watch","directional","growing","act_now","contradicted","retire"] as SignalState[]).map((s) => (
                  <option key={s} value={s}>{STATE_LABEL[s] ?? s}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 11, color: C.dim, marginBottom: 5, letterSpacing: "0.06em", textTransform: "uppercase" as const }}>
                Evidence note (optional)
              </label>
              <textarea
                rows={3} value={note} onChange={(e) => setNote(e.target.value)}
                style={{ ...inp, resize: "none" as const }}
                placeholder="What new evidence supports this state change?"
              />
            </div>

            {saveErr && <p style={{ fontSize: 12, color: C.red, margin: "0 0 12px" }}>{saveErr}</p>}

            <div style={{ display: "flex", gap: 10 }}>
              <Btn gold onClick={applyState} disabled={saving}>{saving ? "Saving…" : "Apply →"}</Btn>
              <Btn dim onClick={() => setModal(null)}>Cancel</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── DECISIONS TAB ─────────────────────────────────────────────────────────────
function DecisionsTab({
  decisions, setDecisions, onCanonized,
}: {
  decisions: Decision[];
  setDecisions: (d: Decision[]) => void;
  onCanonized: (id: string, title: string) => void;
}) {
  const [newTitle,    setNewTitle]    = useState("");
  const [creating,   setCreating]    = useState(false);
  const [expanded,   setExpanded]    = useState<string | null>(null);
  const [approvalId, setApprovalId]  = useState<string | null>(null);
  const [advancing,  setAdvancing]   = useState<string | null>(null);

  const createDecision = async () => {
    if (!newTitle.trim() || creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/mmcp/decisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim() }),
      });
      const d = await res.json();
      setDecisions([d, ...decisions]);
      setNewTitle("");
    } catch { /* silent */ }
    setCreating(false);
  };

  const advanceStage = async (decision: Decision, toStage: number) => {
    if (advancing === decision.id) return;
    setAdvancing(decision.id);
    try {
      const res = await fetch("/api/mmcp/decisions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: decision.id,
          stage: toStage,
          stage_log: [...(decision.stage_log ?? []), { from: decision.stage, to: toStage, at: new Date().toISOString() }],
          ...(toStage === 5 ? { authority: "canon" } : {}),
        }),
      });
      const updated = await res.json();
      setDecisions(decisions.map((d) => d.id === decision.id ? updated : d));
      if (toStage === 5) onCanonized(decision.id, decision.title);
    } catch { /* silent */ }
    setAdvancing(null);
    setApprovalId(null);
  };

  const authorityColor = (a: string) =>
    a === "canon" ? C.gold : a === "review" ? C.blue : C.dim;

  return (
    <div>
      {/* Add decision */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <input
          type="text" placeholder="New decision title…"
          value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") createDecision(); }}
          style={{ ...inp, flex: 1 }}
          onFocus={(e) => { e.currentTarget.style.borderColor = C.gold; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = C.borderMid; }}
        />
        <Btn gold onClick={createDecision} disabled={!newTitle.trim() || creating}>
          {creating ? "Adding…" : "Add Decision →"}
        </Btn>
      </div>

      {!decisions.length && (
        <p style={{ color: C.dim, fontSize: 13 }}>No decisions tracked yet.</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {decisions.map((d) => {
          const isOpen = expanded === d.id;
          const nextStage = d.stage + 1;
          const atApproval = d.stage === 3;
          const isCanon = d.stage === 5;
          return (
            <div key={d.id} style={{
              background: C.panel, border: `1px solid ${isCanon ? C.goldBdr : C.border}`,
              borderRadius: 4, overflow: "hidden",
            }}>
              <div onClick={() => setExpanded(isOpen ? null : d.id)} style={{ padding: "14px 18px", cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" as const }}>
                      <p style={{ fontSize: 13, color: C.text, fontWeight: 600, margin: 0 }}>{d.title}</p>
                      <span style={{ fontSize: 9, color: authorityColor(d.authority), border: `1px solid ${authorityColor(d.authority)}`, padding: "1px 6px", textTransform: "uppercase" as const, letterSpacing: "0.08em", fontWeight: 700 }}>
                        {d.authority}
                      </span>
                    </div>
                    {/* Decision stage rail */}
                    <div style={{ display: "flex", alignItems: "center", gap: 0, flexWrap: "wrap" as const }}>
                      {DECISION_STAGES.map((label, i) => {
                        const isActive = i === d.stage;
                        const isDone   = i < d.stage;
                        const isApprSt = i === 3;
                        return (
                          <div key={label} style={{ display: "flex", alignItems: "center" }}>
                            {i > 0 && <span style={{ color: C.borderMid, fontSize: 9, margin: "0 4px" }}>→</span>}
                            <span style={{
                              fontSize: 9, letterSpacing: "0.07em", textTransform: "uppercase" as const,
                              fontWeight: isActive ? 700 : 400,
                              color: isActive ? (isApprSt ? C.gold : C.text) : isDone ? C.muted : C.dim,
                              borderBottom: isActive ? `1px solid ${isApprSt ? C.gold : C.text}` : "none",
                            }}>
                              {isDone ? "✓ " : ""}{label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <span style={{ color: C.dim, fontSize: 11, flexShrink: 0 }}>{isOpen ? "▲" : "▼"}</span>
                </div>
              </div>

              {isOpen && (
                <div style={{ padding: "0 18px 16px", borderTop: `1px solid ${C.border}` }}>
                  {d.constraints_identified && (
                    <p style={{ fontSize: 12, color: C.muted, margin: "12px 0 4px" }}>
                      <span style={{ color: C.dim }}>Constraints: </span>{d.constraints_identified}
                    </p>
                  )}
                  {d.risks_surfaced && (
                    <p style={{ fontSize: 12, color: C.muted, margin: "0 0 4px" }}>
                      <span style={{ color: C.dim }}>Risks: </span>{d.risks_surfaced}
                    </p>
                  )}
                  {d.contradictions && (
                    <p style={{ fontSize: 12, color: C.muted, margin: "0 0 4px" }}>
                      <span style={{ color: C.dim }}>Contradictions: </span>{d.contradictions}
                    </p>
                  )}
                  {d.operator_move && (
                    <p style={{ fontSize: 12, color: C.muted, margin: "0 0 14px" }}>
                      <span style={{ color: C.dim }}>Operator move: </span>{d.operator_move}
                    </p>
                  )}
                  {d.outcome && (
                    <p style={{ fontSize: 12, color: C.green, margin: "0 0 14px" }}>
                      <span style={{ color: C.dim }}>Outcome: </span>{d.outcome}
                    </p>
                  )}

                  {!isCanon && nextStage <= 5 && (
                    <div style={{ marginTop: 12 }}>
                      {atApproval && approvalId !== d.id ? (
                        <Btn gold onClick={() => setApprovalId(d.id)}>
                          Advance to {DECISION_STAGES[nextStage]} →
                        </Btn>
                      ) : atApproval && approvalId === d.id ? (
                        <div style={{ background: C.goldBg, border: `1px solid ${C.goldBdr}`, borderRadius: 3, padding: "12px 14px" }}>
                          <p style={{ fontSize: 12, color: C.gold, margin: "0 0 10px" }}>
                            Confirm APPROVAL gate clearance. This cannot be undone.
                          </p>
                          <div style={{ display: "flex", gap: 8 }}>
                            <Btn gold onClick={() => advanceStage(d, nextStage)} disabled={advancing === d.id}>
                              {advancing === d.id ? "Advancing…" : "Confirm →"}
                            </Btn>
                            <Btn dim onClick={() => setApprovalId(null)}>Cancel</Btn>
                          </div>
                        </div>
                      ) : (
                        <Btn gold onClick={() => advanceStage(d, nextStage)} disabled={advancing === d.id}>
                          {advancing === d.id ? "Advancing…" : `Advance to ${DECISION_STAGES[nextStage]} →`}
                        </Btn>
                      )}
                    </div>
                  )}

                  {isCanon && (
                    <p style={{ fontSize: 11, color: C.gold, marginTop: 12 }}>
                      ✓ Canonized {d.canonized_at ? new Date(d.canonized_at).toLocaleDateString() : ""}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── GRAVITY TAB ───────────────────────────────────────────────────────────────
function GravityTab({
  history,
  onScoreSaved,
}: {
  history: GravityRecord[];
  onScoreSaved: (score: number) => void;
}) {
  const lastWeek = history[0] ?? null;

  const [ownerless,   setOwnerless]   = useState(lastWeek?.ownerless ?? 0);
  const [openLoops,   setOpenLoops]   = useState(lastWeek?.open_loops ?? 0);
  const [unreviewed,  setUnreviewed]  = useState(lastWeek?.unreviewed_automations ?? 0);
  const [critDeps,    setCritDeps]    = useState(lastWeek?.critical_dependencies ?? 0);
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);

  const score = (ownerless * 3) + (openLoops * 2) + (unreviewed * 1) + (critDeps * 2);
  const scoreColor = score <= 30 ? C.green : score <= 60 ? C.amber : C.red;
  const verdict    = score <= 30 ? "GREEN — Manageable" : score <= 60 ? "AMBER — Needs Attention" : "RED — Critical";

  const saveGravity = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await fetch("/api/mmcp/gravity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          week_of: currentMonday(),
          score, ownerless, open_loops: openLoops,
          unreviewed_automations: unreviewed,
          critical_dependencies: critDeps,
        }),
      });
      onScoreSaved(score);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { /* silent */ }
    setSaving(false);
  };

  const numInp: React.CSSProperties = { ...inp, width: 80, textAlign: "center" as const, fontFamily: "monospace", fontSize: 20, fontWeight: 700 };

  return (
    <div>
      {lastWeek && (
        <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 3, padding: "10px 14px", marginBottom: 24, display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 11, color: C.dim }}>Last recorded: {lastWeek.week_of}</span>
          <span style={{ fontSize: 13, color: lastWeek.score <= 30 ? C.green : lastWeek.score <= 60 ? C.amber : C.red, fontWeight: 700 }}>
            {lastWeek.score}
          </span>
          <span style={{ fontSize: 11, color: C.dim }}>{lastWeek.verdict}</span>
        </div>
      )}

      {/* Live score display */}
      <div style={{ textAlign: "center" as const, marginBottom: 32 }}>
        <p style={{ fontSize: 11, color: C.dim, letterSpacing: "0.1em", textTransform: "uppercase" as const, margin: "0 0 8px" }}>Current Gravity Score</p>
        <div style={{ fontSize: 64, fontWeight: 700, color: scoreColor, lineHeight: 1, marginBottom: 8, fontFamily: "monospace" }}>
          {score}
        </div>
        <p style={{ fontSize: 12, color: scoreColor, margin: 0 }}>{verdict}</p>
      </div>

      {/* Input grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28, maxWidth: 480, margin: "0 auto 28px" }}>
        {[
          { label: "Ownerless Systems", val: ownerless, set: setOwnerless, mult: 3 },
          { label: "Open Loops", val: openLoops, set: setOpenLoops, mult: 2 },
          { label: "Unreviewed Automations", val: unreviewed, set: setUnreviewed, mult: 1 },
          { label: "Critical Dependencies", val: critDeps, set: setCritDeps, mult: 2 },
        ].map(({ label, val, set, mult }) => (
          <div key={label} style={{ textAlign: "center" as const }}>
            <label style={{ display: "block", fontSize: 10, color: C.dim, marginBottom: 6, letterSpacing: "0.08em", textTransform: "uppercase" as const, lineHeight: 1.4 }}>
              {label} <span style={{ color: C.gold }}>×{mult}</span>
            </label>
            <input
              type="number" min={0} value={val}
              onChange={(e) => set(Math.max(0, parseInt(e.target.value) || 0))}
              style={numInp}
              onFocus={(e) => { e.currentTarget.style.borderColor = C.gold; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = C.borderMid; }}
            />
            <p style={{ fontSize: 10, color: C.dim, margin: "4px 0 0" }}>= {val * mult}</p>
          </div>
        ))}
      </div>

      <div style={{ textAlign: "center" as const }}>
        <Btn gold onClick={saveGravity} disabled={saving}>
          {saving ? "Saving…" : saved ? "Saved ✓" : "Save This Week's Gravity →"}
        </Btn>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <p style={{ fontSize: 11, color: C.dim, letterSpacing: "0.08em", textTransform: "uppercase" as const, margin: "0 0 12px" }}>Recent History</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {history.slice(0, 8).map((h) => (
              <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 10px", background: C.panel, borderRadius: 3 }}>
                <span style={{ fontSize: 11, color: C.dim, width: 90, flexShrink: 0 }}>{h.week_of}</span>
                <div style={{ flex: 1 }}>
                  <ScoreBar score={Math.min(100, (h.score / 100) * 100)} color={h.score <= 30 ? C.green : h.score <= 60 ? C.amber : C.red} />
                </div>
                <span style={{ fontSize: 12, color: h.score <= 30 ? C.green : h.score <= 60 ? C.amber : C.red, fontWeight: 700, width: 36, textAlign: "right" as const }}>{h.score}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── WEEKLY REVIEW TAB ─────────────────────────────────────────────────────────
function WeeklyReviewTab({
  sessionUpgrades,
  sessionCanonized,
  gravityStart,
  gravityEnd,
}: {
  sessionUpgrades: SessionUpgrade[];
  sessionCanonized: { id: string; title: string }[];
  gravityStart: number | null;
  gravityEnd: number | null;
}) {
  const [biggestRisk,       setBiggestRisk]       = useState("");
  const [missionMoved,      setMissionMoved]      = useState("");
  const [nextWeekPriority,  setNextWeekPriority]  = useState("");
  const [openLoopsChecked,  setOpenLoopsChecked]  = useState(false);
  const [saved,             setSaved]             = useState(false);
  const [saving,            setSaving]            = useState(false);

  const checks = [
    { label: "Signal evidence added or upgraded this session", checked: sessionUpgrades.length > 0 },
    { label: "Decision canonized (stage 5) this session",      checked: sessionCanonized.length > 0 },
    { label: "Gravity score reduced vs last save",             checked: gravityEnd !== null && gravityStart !== null && gravityEnd < gravityStart },
    { label: "Approval gate cleared (any decision reached stage 3+)", checked: false },
    { label: "Open loops reviewed and actioned",               checked: openLoopsChecked, toggle: true },
  ];

  const missionScore = checks.filter((c) => c.checked).length;

  const saveReview = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await fetch("/api/mmcp/weekly-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          week_of:            currentMonday(),
          mission_score:      missionScore,
          signals_upgraded:   sessionUpgrades,
          decisions_canonized: sessionCanonized,
          gravity_start:      gravityStart,
          gravity_end:        gravityEnd,
          gravity_delta:      gravityEnd !== null && gravityStart !== null ? gravityEnd - gravityStart : null,
          biggest_risk:       biggestRisk || null,
          mission_moved:      missionMoved || null,
          next_week_priority: nextWeekPriority || null,
        }),
      });
      setSaved(true);
    } catch { /* silent */ }
    setSaving(false);
  };

  const downloadReview = () => {
    const lines = [
      `CE MINI MMCP — WEEKLY REVIEW`,
      `Week of: ${currentMonday()}`,
      `Mission Score: ${missionScore}/5`,
      ``,
      `MISSION CHECKLIST:`,
      ...checks.map((c, i) => `  ${i + 1}. [${c.checked ? "X" : " "}] ${c.label}`),
      ``,
      `SIGNALS UPGRADED THIS SESSION (${sessionUpgrades.length}):`,
      ...sessionUpgrades.map((u) => `  - ${u.title}: ${u.from} → ${u.to}`),
      ``,
      `DECISIONS CANONIZED (${sessionCanonized.length}):`,
      ...sessionCanonized.map((d) => `  - ${d.title}`),
      ``,
      `GRAVITY:`,
      `  Start: ${gravityStart ?? "—"}`,
      `  End:   ${gravityEnd ?? "—"}`,
      `  Delta: ${gravityEnd !== null && gravityStart !== null ? gravityEnd - gravityStart : "—"}`,
      ``,
      `BIGGEST RISK / CONTRADICTION:`,
      biggestRisk || "(not entered)",
      ``,
      `ONE THING THAT MOVED THE MISSION:`,
      missionMoved || "(not entered)",
      ``,
      `NEXT WEEK PRIORITY:`,
      nextWeekPriority || "(not entered)",
      ``,
      `FAILURE MODE WATCH:`,
      `  [Output without governance] Trigger: shipping without APPROVAL gate | Circuit breaker: review every deploy`,
      `  [Gravity accumulation]       Trigger: score ≥60 two weeks running | Circuit breaker: gravity audit`,
      `  [Decision paralysis]         Trigger: stuck at SYNTHESIS >2 weeks | Circuit breaker: force to APPROVAL`,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `ce-mmcp-review-${currentMonday()}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  const taStyle: React.CSSProperties = { ...inp, resize: "vertical" as const };

  return (
    <div>
      {/* Mission score */}
      <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 4, padding: "18px 20px", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
          <p style={{ fontSize: 11, color: C.dim, letterSpacing: "0.1em", textTransform: "uppercase" as const, margin: 0 }}>Mission Score</p>
          <div style={{ display: "flex", gap: 4 }}>
            {[1,2,3,4,5].map((n) => (
              <div key={n} style={{ width: 18, height: 18, borderRadius: 2, background: n <= missionScore ? C.gold : C.borderMid, transition: "background 200ms ease" }} />
            ))}
          </div>
          <span style={{ fontSize: 20, fontWeight: 700, color: C.gold, fontFamily: "monospace" }}>{missionScore}/5</span>
        </div>

        {checks.map((c, i) => (
          <div
            key={i}
            onClick={() => c.toggle && setOpenLoopsChecked((v) => !v)}
            style={{
              display: "flex", alignItems: "center", gap: 10, padding: "6px 0",
              cursor: c.toggle ? "pointer" : "default",
              borderBottom: i < checks.length - 1 ? `1px solid ${C.border}` : "none",
            }}
          >
            <div style={{ width: 14, height: 14, borderRadius: 2, background: c.checked ? C.gold : "transparent", border: `1px solid ${c.checked ? C.gold : C.borderMid}`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {c.checked && <span style={{ color: "#000", fontSize: 9, fontWeight: 700 }}>✓</span>}
            </div>
            <span style={{ fontSize: 12, color: c.checked ? C.text : C.muted }}>{c.label}</span>
            {c.toggle && <span style={{ fontSize: 10, color: C.dim, marginLeft: "auto" }}>click to toggle</span>}
          </div>
        ))}
      </div>

      {/* Session data */}
      {(sessionUpgrades.length > 0 || sessionCanonized.length > 0) && (
        <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 4, padding: "14px 18px", marginBottom: 20 }}>
          {sessionUpgrades.length > 0 && (
            <div style={{ marginBottom: sessionCanonized.length > 0 ? 12 : 0 }}>
              <p style={{ fontSize: 11, color: C.dim, margin: "0 0 6px", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>Signal upgrades this session</p>
              {sessionUpgrades.map((u, i) => (
                <p key={i} style={{ fontSize: 12, color: C.muted, margin: "0 0 3px" }}>
                  {u.title}: <span style={{ color: C.dim }}>{u.from}</span> → <span style={{ color: C.gold }}>{u.to}</span>
                </p>
              ))}
            </div>
          )}
          {sessionCanonized.length > 0 && (
            <div>
              <p style={{ fontSize: 11, color: C.dim, margin: "0 0 6px", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>Decisions canonized</p>
              {sessionCanonized.map((d, i) => (
                <p key={i} style={{ fontSize: 12, color: C.gold, margin: "0 0 3px" }}>✓ {d.title}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Manual fields */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Biggest risk / contradiction surfaced", val: biggestRisk, set: setBiggestRisk },
          { label: "One thing that moved the mission",      val: missionMoved, set: setMissionMoved },
          { label: "Next week priority",                    val: nextWeekPriority, set: setNextWeekPriority },
        ].map(({ label, val, set }) => (
          <div key={label}>
            <label style={{ display: "block", fontSize: 11, color: C.dim, marginBottom: 5, letterSpacing: "0.06em", textTransform: "uppercase" as const }}>{label}</label>
            <textarea rows={2} value={val} onChange={(e) => set(e.target.value)} style={taStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = C.gold; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = C.borderMid; }}
            />
          </div>
        ))}
      </div>

      {/* Failure mode watch */}
      <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 4, padding: "14px 18px", marginBottom: 24 }}>
        <p style={{ fontSize: 11, color: C.dim, letterSpacing: "0.08em", textTransform: "uppercase" as const, margin: "0 0 12px" }}>Failure Mode Watch</p>
        {[
          { name: "Output without governance", trigger: "Shipping without clearing APPROVAL gate", circuit: "Review every deploy against MMCP stage" },
          { name: "Gravity accumulation",      trigger: "Score ≥60 for two consecutive weeks",     circuit: "Mandatory gravity audit before new work" },
          { name: "Decision paralysis",        trigger: "Any decision stuck at SYNTHESIS >2 weeks", circuit: "Force to APPROVAL or archive" },
        ].map((f, i) => (
          <div key={i} style={{ marginBottom: i < 2 ? 10 : 0, paddingBottom: i < 2 ? 10 : 0, borderBottom: i < 2 ? `1px solid ${C.border}` : "none" }}>
            <p style={{ fontSize: 12, color: C.text, fontWeight: 600, margin: "0 0 3px" }}>{f.name}</p>
            <p style={{ fontSize: 11, color: C.muted, margin: "0 0 2px" }}><span style={{ color: C.dim }}>Trigger: </span>{f.trigger}</p>
            <p style={{ fontSize: 11, color: C.green, margin: 0 }}><span style={{ color: C.dim }}>Circuit: </span>{f.circuit}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 10 }}>
        <Btn gold onClick={downloadReview}>Download Record →</Btn>
        <Btn gold onClick={saveReview} disabled={saving}>
          {saving ? "Saving…" : saved ? "Saved to Runtime ✓" : "Save to Runtime →"}
        </Btn>
      </div>
      {saved && <p style={{ fontSize: 12, color: C.green, marginTop: 8 }}>Saved.</p>}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
type Tab = "signals" | "decisions" | "gravity" | "review";

export default function MMCPPage() {
  const [tab,              setTab]              = useState<Tab>("signals");
  const [signals,          setSignals]          = useState<BaseSignal[]>([]);
  const [signalsLoading,   setSignalsLoading]   = useState(true);
  const [decisions,        setDecisions]        = useState<Decision[]>([]);
  const [gravityHistory,   setGravityHistory]   = useState<GravityRecord[]>([]);
  const [sessionUpgrades,  setSessionUpgrades]  = useState<SessionUpgrade[]>([]);
  const [sessionCanonized, setSessionCanonized] = useState<{ id: string; title: string }[]>([]);
  const [gravityStart,     setGravityStart]     = useState<number | null>(null);
  const [gravityEnd,       setGravityEnd]       = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/signals/base-forces")
      .then((r) => r.json())
      .then((d) => { setSignals(d); setSignalsLoading(false); })
      .catch(() => setSignalsLoading(false));
    fetch("/api/mmcp/decisions")
      .then((r) => r.json())
      .then(setDecisions)
      .catch(() => {});
    fetch("/api/mmcp/gravity")
      .then((r) => r.json())
      .then((d: GravityRecord[]) => {
        setGravityHistory(d);
        if (d[0]) setGravityStart(d[0].score);
      })
      .catch(() => {});
  }, []);

  // Sync signal state changes back into local array
  const handleStateAdvanced = useCallback((id: string, title: string, from: string, to: string) => {
    setSignals((prev) => prev.map((s) => s.id === id ? { ...s, signal_state: to as SignalState } : s));
    setSessionUpgrades((prev) => [...prev, { id, title, from, to }]);
  }, []);

  const handleCanonized = useCallback((id: string, title: string) => {
    setSessionCanonized((prev) => [...prev, { id, title }]);
  }, []);

  const handleGravitySaved = useCallback((score: number) => {
    setGravityEnd(score);
  }, []);

  const TABS: { key: Tab; label: string }[] = [
    { key: "signals",   label: "SIGNALS" },
    { key: "decisions", label: "DECISIONS" },
    { key: "gravity",   label: "GRAVITY" },
    { key: "review",    label: "WEEKLY REVIEW" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "system-ui,-apple-system,sans-serif" }}>

      {/* Top bar */}
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/ce-admin/signals" style={{ fontSize: 12, color: C.dim, textDecoration: "none", transition: "color 150ms" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = C.muted; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = C.dim; }}
          >
            ← Signals
          </Link>
          <span style={{ color: C.border }}>|</span>
          <span style={{ fontSize: 11, color: C.gold, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const }}>Mini MMCP</span>
          <span style={{ fontSize: 10, color: C.dim, border: `1px solid ${C.borderMid}`, padding: "1px 6px", letterSpacing: "0.08em" }}>v0.1</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {sessionUpgrades.length > 0 && (
            <span style={{ fontSize: 10, color: C.gold, border: `1px solid ${C.goldBdr}`, padding: "2px 8px" }}>
              {sessionUpgrades.length} upgrade{sessionUpgrades.length !== 1 ? "s" : ""}
            </span>
          )}
          {sessionCanonized.length > 0 && (
            <span style={{ fontSize: 10, color: C.green, border: `1px solid rgba(76,175,130,0.3)`, padding: "2px 8px" }}>
              {sessionCanonized.length} canonized
            </span>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: "0 32px", display: "flex", gap: 0 }}>
        {TABS.map(({ key, label }) => {
          const isActive = tab === key;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                padding: "14px 20px", fontSize: 11, fontWeight: isActive ? 700 : 400,
                letterSpacing: "0.1em", textTransform: "uppercase" as const,
                color: isActive ? C.gold : C.dim,
                borderBottom: isActive ? `2px solid ${C.gold}` : "2px solid transparent",
                marginBottom: -1,
                transition: "color 150ms, border-color 150ms",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 32px 80px" }}>
        {tab === "signals" && (
          <SignalsTab
            signals={signals}
            loading={signalsLoading}
            onStateAdvanced={handleStateAdvanced}
          />
        )}
        {tab === "decisions" && (
          <DecisionsTab
            decisions={decisions}
            setDecisions={setDecisions}
            onCanonized={handleCanonized}
          />
        )}
        {tab === "gravity" && (
          <GravityTab
            history={gravityHistory}
            onScoreSaved={handleGravitySaved}
          />
        )}
        {tab === "review" && (
          <WeeklyReviewTab
            sessionUpgrades={sessionUpgrades}
            sessionCanonized={sessionCanonized}
            gravityStart={gravityStart}
            gravityEnd={gravityEnd}
          />
        )}
      </div>
    </div>
  );
}
