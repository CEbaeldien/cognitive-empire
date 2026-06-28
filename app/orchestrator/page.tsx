"use client";

import { useState } from "react";
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

// ── BETABadge ─────────────────────────────────────────────────────────────────
function BetaBadge() {
  return (
    <span style={{
      border: `1px solid ${C.gold}`,
      color: C.gold,
      padding: "2px 8px",
      fontSize: 11,
      letterSpacing: "0.1em",
      fontWeight: 600,
      textTransform: "uppercase" as const,
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
      <div style={{
        display: "flex", alignItems: "center", gap: 0,
        padding: "12px 0", flexWrap: "wrap" as const,
      }}>
        {STAGES.map((label, i) => {
          const isActive    = i === stage;
          const isCompleted = i < stage;
          const isApproval  = i === 3;
          const dotColor    = isApproval && stage >= 3 ? C.gold : C.cyan;
          const labelColor  = isActive
            ? (isApproval ? C.gold : C.text)
            : isCompleted ? C.muted : C.dim;

          return (
            <div key={label} style={{ display: "flex", alignItems: "center" }}>
              {i > 0 && (
                <span style={{ color: "#333333", fontSize: 11, margin: "0 6px" }}>→</span>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                {isActive && (
                  <div style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: dotColor,
                    flexShrink: 0,
                    boxShadow: stage < 3 ? `0 0 6px ${C.cyan}` : "none",
                    animation: stage < 3 ? "cePulse 1.5s ease-in-out infinite" : "none",
                  }} />
                )}
                {isCompleted && (
                  <span style={{ color: C.muted, fontSize: 10, marginRight: 2 }}>✓</span>
                )}
                <span style={{
                  fontSize: 11,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase" as const,
                  fontWeight: isActive ? 600 : 400,
                  color: labelColor,
                }}>
                  {label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      {atApproval && (
        <div style={{ height: 2, background: C.gold, opacity: 0.6, marginBottom: 4 }} />
      )}
    </div>
  );
}

// ── BYOKPanel ─────────────────────────────────────────────────────────────────
type KeyStore = { anthropic: string; openai: string; grok: string; gemini: string };

function BYOKPanel({
  keys, setKeys, open, setOpen,
}: {
  keys: KeyStore;
  setKeys: (k: KeyStore) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
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
    fontFamily: "monospace",
  };

  const PROVIDERS: { key: keyof KeyStore; label: string; placeholder: string }[] = [
    { key: "anthropic", label: "Anthropic",  placeholder: "sk-ant-..." },
    { key: "openai",    label: "OpenAI",     placeholder: "sk-..." },
    { key: "grok",      label: "Grok (xAI)", placeholder: "xai-..." },
    { key: "gemini",    label: "Gemini",     placeholder: "AIza..." },
  ];

  return (
    <div style={{
      borderBottom: `1px solid ${C.border}`,
      marginBottom: 24,
      paddingBottom: open ? 20 : 0,
    }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "12px 0",
      }}>
        <span style={{ fontSize: 12, color: C.muted, fontWeight: 600, letterSpacing: "0.06em" }}>
          API Keys
        </span>
        <button
          onClick={() => setOpen(!open)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 12, color: C.muted, padding: 0,
          }}
        >
          {open ? "Hide" : "Show"}
        </button>
      </div>

      {open && (
        <div>
          <div className="ce-byok-grid" style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
          }}>
            {PROVIDERS.map(({ key, label, placeholder }) => (
              <div key={key}>
                <label style={{
                  display: "block", fontSize: 11, color: C.dim,
                  marginBottom: 5, letterSpacing: "0.08em", textTransform: "uppercase" as const,
                }}>
                  {label}
                </label>
                <input
                  type="password"
                  placeholder={placeholder}
                  value={keys[key]}
                  onChange={(e) => setKeys({ ...keys, [key]: e.target.value })}
                  style={inputStyle}
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
function FeedbackGate({
  mode,
  sessionId,
  onClose,
}: {
  mode: Mode;
  sessionId: string;
  onClose: () => void;
}) {
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
        body: JSON.stringify({
          session_id: sessionId,
          mode,
          task:       task || null,
          best_model: bestModel || null,
          rating,
          notes:      notes || null,
        }),
      });
    } catch {
      // non-fatal — feedback is best-effort
    }
    onClose();
  };

  const inputStyle: React.CSSProperties = {
    background: "#0A0A0A",
    border: `1px solid ${C.borderMid}`,
    borderRadius: 3,
    color: C.text,
    padding: "8px 12px",
    fontSize: 13,
    width: "100%",
    boxSizing: "border-box",
    resize: "none" as const,
    outline: "none",
    fontFamily: "system-ui, -apple-system, sans-serif",
  };

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
      display: "flex", justifyContent: "center",
    }}>
      <div style={{
        width: "100%", maxWidth: 860,
        background: C.panel,
        borderTop: `1px solid ${C.gold}`,
        padding: "24px 32px",
      }}>
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 14, color: C.text, fontWeight: 600, margin: "0 0 4px" }}>
            Session Feedback
          </p>
          <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>
            Required before session closes.
          </p>
        </div>

        <div className="ce-feedback-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, color: C.dim, marginBottom: 5, letterSpacing: "0.06em", textTransform: "uppercase" as const }}>
              What were you trying to accomplish?
            </label>
            <textarea rows={2} value={task} onChange={(e) => setTask(e.target.value)} style={inputStyle} />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11, color: C.dim, marginBottom: 5, letterSpacing: "0.06em", textTransform: "uppercase" as const }}>
              Most useful model response?
            </label>
            <select
              value={bestModel}
              onChange={(e) => setBestModel(e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
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
                <span
                  key={n}
                  onClick={() => setRating(n)}
                  style={{
                    width: 32, height: 32,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    border: `1px solid ${rating === n ? C.gold : C.borderMid}`,
                    color: rating === n ? C.gold : C.dim,
                    fontSize: 14, fontWeight: 600, cursor: "pointer",
                    userSelect: "none" as const,
                    transition: "color 150ms, border-color 150ms",
                  }}
                >
                  {n}
                </span>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11, color: C.dim, marginBottom: 5, letterSpacing: "0.06em", textTransform: "uppercase" as const }}>
              Anything broken or missing? (optional)
            </label>
            <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} style={inputStyle} />
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <button
            onClick={submit}
            disabled={!canSubmit || sending}
            style={{
              border: `1px solid ${C.gold}`,
              color: canSubmit ? C.gold : C.dim,
              background: "transparent",
              padding: "8px 20px",
              fontSize: 13,
              cursor: canSubmit ? "pointer" : "not-allowed",
              transition: "background 180ms ease, color 180ms ease",
              fontWeight: 600,
            }}
            onMouseEnter={(e) => {
              if (canSubmit) {
                e.currentTarget.style.background = C.gold;
                e.currentTarget.style.color = "#000";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = canSubmit ? C.gold : C.dim;
            }}
          >
            {sending ? "Saving…" : "Submit & Close Session →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ModeContent placeholder ───────────────────────────────────────────────────
function ModeContent({ mode }: { mode: Mode }) {
  const labels: Record<Mode, string> = {
    signal:      "Signal Assessment",
    decision:    "Decision Flow",
    maintenance: "Maintenance Audit",
  };
  return (
    <div style={{ color: C.muted, padding: "40px 0", fontSize: 14 }}>
      {labels[mode]} — coming in next session
    </div>
  );
}

// ── Landing ───────────────────────────────────────────────────────────────────
function Landing({ onSelect }: { onSelect: (m: Mode) => void }) {
  const cards: { mode: Mode; num: string; title: string; body: string }[] = [
    {
      mode:  "signal",
      num:   "MODE 01",
      title: "Signal Assessment",
      body:  "Run raw intelligence through the 7 base forces. Get multi-model analysis and a state recommendation.",
    },
    {
      mode:  "decision",
      num:   "MODE 02",
      title: "Decision Flow",
      body:  "Govern any decision through the full MMCP sequence. Constraints, synthesis, approval, execution.",
    },
    {
      mode:  "maintenance",
      num:   "MODE 03",
      title: "Maintenance Audit",
      body:  "Surface your operational debt. Get a Maintenance Gravity Score and a prioritized reduction list.",
    },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: C.bg,
      color: C.text,
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      <CENav />

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "64px 32px 80px" }}>

        {/* Top row: headline + beta */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <h1 style={{ fontSize: "2.5rem", color: C.text, fontWeight: 600, margin: 0, lineHeight: 1.1 }}>
            The Orchestrator
          </h1>
          <BetaBadge />
        </div>

        <p style={{ fontSize: "1rem", color: C.muted, margin: "8px 0 0" }}>
          Multi-model intelligence. Three session modes.<br />
          No data stored. Judgment stays human.
        </p>

        <div style={{ height: 1, background: C.gold, opacity: 0.4, margin: "32px 0" }} />

        {/* Mode cards */}
        <div style={{
          display: "flex", gap: 16,
          flexWrap: "wrap" as const,
        }}>
          {cards.map(({ mode, num, title, body }) => (
            <ModeCard
              key={mode}
              num={num}
              title={title}
              body={body}
              onClick={() => onSelect(mode)}
            />
          ))}
        </div>

        {/* Disclaimer */}
        <p style={{
          textAlign: "center", fontSize: 12, color: C.dim,
          marginTop: 32, lineHeight: 1.7,
        }}>
          API keys are held in session memory only.<br />
          No conversation content is stored.<br />
          Only aggregate feedback is retained after session close.
        </p>

      </div>

      <CEFooter />
    </div>
  );
}

function ModeCard({
  num, title, body, onClick,
}: {
  num: string; title: string; body: string; onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: "1 1 260px",
        background: C.panel,
        border: `1px solid ${hovered ? C.gold : C.border}`,
        borderRadius: 4,
        padding: "28px 24px",
        cursor: "pointer",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        transition: "transform 220ms cubic-bezier(0.25,0.1,0.25,1.0), border-color 220ms ease",
      }}
    >
      <p style={{ fontSize: 11, color: C.muted, letterSpacing: "0.12em", textTransform: "uppercase" as const, margin: "0 0 8px" }}>
        {num}
      </p>
      <p style={{ fontSize: "1.1rem", color: C.text, fontWeight: 600, margin: "0 0 8px" }}>
        {title}
      </p>
      <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6, margin: "0 0 16px" }}>
        {body}
      </p>
      <p style={{ fontSize: 14, color: C.gold, margin: 0 }}>Begin →</p>
    </div>
  );
}

// ── SessionView ───────────────────────────────────────────────────────────────
function SessionView({
  mode,
  stage,
  keys,
  setKeys,
  keysOpen,
  setKeysOpen,
  sessionId,
  feedbackOpen,
  setFeedbackOpen,
  onBack,
  onSessionClose,
}: {
  mode: Mode;
  stage: number;
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
    signal:      "Signal Assessment",
    decision:    "Decision Flow",
    maintenance: "Maintenance Audit",
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: C.bg,
      color: C.text,
      fontFamily: "system-ui, -apple-system, sans-serif",
      paddingBottom: feedbackOpen ? 260 : 0,
    }}>
      <CENav />

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "24px 32px 80px" }}>

        {/* Top bar */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: 20,
        }}>
          <button
            onClick={onBack}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 13, color: C.muted, padding: 0,
              transition: "color 150ms ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = C.text; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = C.muted; }}
          >
            ← {modeLabels[mode]}
          </button>
          <BetaBadge />
        </div>

        {/* Progression rail */}
        <ProgressionRail stage={stage} />

        {/* Divider */}
        <div style={{ height: 1, background: C.border, margin: "16px 0 20px" }} />

        {/* BYOK panel */}
        <BYOKPanel keys={keys} setKeys={setKeys} open={keysOpen} setOpen={setKeysOpen} />

        {/* Mode content */}
        <ModeContent mode={mode} />

      </div>

      {/* Feedback gate — fixed bottom, only when open */}
      {feedbackOpen && (
        <FeedbackGate
          mode={mode}
          sessionId={sessionId}
          onClose={onSessionClose}
        />
      )}

      <CEFooter />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function OrchestratorPage() {
  const [mode,        setMode]        = useState<Mode | null>(null);
  const [stage,       setStage]       = useState<number>(0);
  const [keys,        setKeys]        = useState<KeyStore>({ anthropic: "", openai: "", grok: "", gemini: "" });
  const [keysOpen,    setKeysOpen]    = useState(true);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [sessionId]                   = useState(() => crypto.randomUUID());

  const handleSelectMode = (m: Mode) => {
    setMode(m);
    setStage(0);
    setKeysOpen(true);
    setFeedbackOpen(false);
  };

  const handleBack = () => {
    setMode(null);
    setStage(0);
    setFeedbackOpen(false);
  };

  const handleSessionClose = () => {
    setMode(null);
    setStage(0);
    setFeedbackOpen(false);
  };

  if (mode === null) {
    return (
      <>
        <style>{`
          @keyframes cePulse {
            0%, 100% { opacity: 1; }
            50%       { opacity: 0.3; }
          }
          @media (max-width: 640px) {
            .ce-byok-grid { grid-template-columns: 1fr !important; }
            .ce-feedback-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
        <Landing onSelect={handleSelectMode} />
      </>
    );
  }

  return (
    <>
      <style>{`
        @keyframes cePulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
        @media (max-width: 640px) {
          .ce-byok-grid { grid-template-columns: 1fr !important; }
          .ce-feedback-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <SessionView
        mode={mode}
        stage={stage}
        keys={keys}
        setKeys={setKeys}
        keysOpen={keysOpen}
        setKeysOpen={setKeysOpen}
        sessionId={sessionId}
        feedbackOpen={feedbackOpen}
        setFeedbackOpen={setFeedbackOpen}
        onBack={handleBack}
        onSessionClose={handleSessionClose}
      />
    </>
  );
}
