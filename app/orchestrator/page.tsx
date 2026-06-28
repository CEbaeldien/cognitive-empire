"use client";

import { useState, useRef, useCallback } from "react";
import CENav from "../components/CENav";
import CEFooter from "../components/CEFooter";

const P = {
  bg:         "#03050A",
  panel:      "#0A1221",
  panelDeep:  "#060C18",
  border:     "rgba(255,255,255,0.07)",
  borderMid:  "rgba(255,255,255,0.10)",
  text:       "#EEF3FA",
  muted:      "#7A8DA6",
  dim:        "#4A5A70",
  gold:       "#C9A961",
  goldSoft:   "rgba(201,169,97,0.09)",
  goldBorder: "rgba(201,169,97,0.30)",
  goldDim:    "rgba(201,169,97,0.18)",
} as const;

const MODELS = [
  { id: "gpt-4o",              label: "GPT-4o",         provider: "openai"    },
  { id: "gpt-4o-mini",         label: "GPT-4o Mini",    provider: "openai"    },
  { id: "claude-sonnet-4-6",   label: "Claude Sonnet",  provider: "anthropic" },
  { id: "claude-haiku-4-5-20251001", label: "Claude Haiku", provider: "anthropic" },
  { id: "gemini-2.0-flash",    label: "Gemini Flash",   provider: "google"    },
] as const;

type ModelId = (typeof MODELS)[number]["id"];
type Provider = (typeof MODELS)[number]["provider"];

type KeyStore = Partial<Record<Provider, string>>;

type Message = { role: "user" | "assistant"; content: string; model?: ModelId };

function generateSessionId() {
  return crypto.randomUUID();
}

async function callModel(
  provider: Provider,
  modelId: ModelId,
  apiKey: string,
  messages: { role: "user" | "assistant"; content: string }[]
): Promise<string> {
  if (provider === "openai") {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: modelId, messages, temperature: 0.7, max_tokens: 1024 }),
    });
    if (!res.ok) throw new Error(`OpenAI error ${res.status}`);
    const j = await res.json();
    return j.choices?.[0]?.message?.content ?? "";
  }

  if (provider === "anthropic") {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: modelId,
        max_tokens: 1024,
        messages,
      }),
    });
    if (!res.ok) throw new Error(`Anthropic error ${res.status}`);
    const j = await res.json();
    return j.content?.[0]?.text ?? "";
  }

  if (provider === "google") {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: messages.map((m) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
          })),
        }),
      }
    );
    if (!res.ok) throw new Error(`Google error ${res.status}`);
    const j = await res.json();
    return j.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  }

  throw new Error(`Unknown provider: ${provider}`);
}

export default function OrchestratorPage() {
  const sessionId = useRef(generateSessionId());

  const [keys,       setKeys]       = useState<KeyStore>({});
  const [showKeys,   setShowKeys]   = useState(false);
  const [activeModel, setActiveModel] = useState<ModelId>("claude-sonnet-4-6");
  const [messages,   setMessages]   = useState<Message[]>([]);
  const [input,      setInput]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  // Feedback
  const [feedbackDone,  setFeedbackDone]  = useState(false);
  const [bestModel,     setBestModel]     = useState<ModelId | "">("");
  const [rating,        setRating]        = useState<number>(0);
  const [feedbackNotes, setFeedbackNotes] = useState("");
  const [feedbackSent,  setFeedbackSent]  = useState(false);

  const model = MODELS.find((m) => m.id === activeModel)!;

  const setKey = (provider: Provider, val: string) =>
    setKeys((k) => ({ ...k, [provider]: val }));

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const apiKey = keys[model.provider];
    if (!apiKey) {
      setError(`No API key for ${model.provider}. Add it above.`);
      return;
    }

    const userMsg: Message = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const reply = await callModel(
        model.provider,
        model.id,
        apiKey,
        next.map(({ role, content }) => ({ role, content }))
      );
      setMessages((prev) => [...prev, { role: "assistant", content: reply, model: model.id }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, model, keys]);

  const submitFeedback = async () => {
    if (!rating) return;
    await fetch("/api/orchestrator/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId.current,
        task:       messages[0]?.content ?? null,
        best_model: bestModel || null,
        rating,
        notes:      feedbackNotes || null,
      }),
    }).catch(() => null);
    setFeedbackSent(true);
  };

  const hasConversation = messages.length > 0;

  return (
    <>
      <style>{`
        @keyframes ceReveal {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ce-o1 { opacity: 0; animation: ceReveal 280ms cubic-bezier(0.25,0.1,0.25,1.0)  60ms forwards; }
        .ce-o2 { opacity: 0; animation: ceReveal 280ms cubic-bezier(0.25,0.1,0.25,1.0) 120ms forwards; }
        .ce-o3 { opacity: 0; animation: ceReveal 280ms cubic-bezier(0.25,0.1,0.25,1.0) 180ms forwards; }

        .ce-model-btn {
          font-size: 0.68rem; font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase; padding: 7px 14px;
          border: 1px solid rgba(255,255,255,0.10);
          background: transparent;
          color: rgba(122,141,166,1);
          cursor: pointer;
          transition: border-color 150ms ease, color 150ms ease, background 150ms ease;
        }
        .ce-model-btn:hover { border-color: rgba(201,169,97,0.30); color: #EEF3FA; }
        .ce-model-btn.active {
          border-color: rgba(201,169,97,0.55);
          background: rgba(201,169,97,0.09);
          color: #C9A961;
        }

        .ce-key-input {
          background: rgba(6,12,24,0.8);
          border: 1px solid rgba(255,255,255,0.10);
          color: #EEF3FA;
          font-size: 0.82rem;
          padding: 8px 12px;
          width: 100%;
          font-family: monospace;
          outline: none;
          transition: border-color 150ms ease;
        }
        .ce-key-input:focus { border-color: rgba(201,169,97,0.40); }

        .ce-send-btn {
          font-size: 0.72rem; font-weight: 700; letter-spacing: 0.14em;
          text-transform: uppercase; color: #EEF3FA;
          border: 1px solid rgba(201,169,97,0.48);
          background: rgba(201,169,97,0.10);
          padding: 10px 20px;
          cursor: pointer;
          transition: background 150ms ease, border-color 150ms ease;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .ce-send-btn:hover:not(:disabled) {
          background: rgba(201,169,97,0.20);
          border-color: rgba(201,169,97,0.70);
        }
        .ce-send-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .ce-msg-input {
          background: rgba(6,12,24,0.8);
          border: 1px solid rgba(255,255,255,0.10);
          color: #EEF3FA;
          font-size: 0.88rem;
          padding: 10px 14px;
          width: 100%;
          outline: none;
          resize: none;
          font-family: system-ui, -apple-system, sans-serif;
          line-height: 1.5;
          transition: border-color 150ms ease;
        }
        .ce-msg-input:focus { border-color: rgba(201,169,97,0.40); }

        .ce-rating-btn {
          width: 36px; height: 36px;
          border: 1px solid rgba(255,255,255,0.10);
          background: transparent;
          color: rgba(122,141,166,1);
          font-size: 0.85rem; font-weight: 700;
          cursor: pointer;
          transition: border-color 150ms ease, color 150ms ease, background 150ms ease;
        }
        .ce-rating-btn.active {
          border-color: rgba(201,169,97,0.55);
          background: rgba(201,169,97,0.09);
          color: #C9A961;
        }
        .ce-rating-btn:hover { border-color: rgba(201,169,97,0.30); color: #EEF3FA; }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation: none !important; transition: none !important; }
          .ce-o1,.ce-o2,.ce-o3 { opacity: 1; transform: none; }
        }

        @media (max-width: 768px) {
          .ce-orch-wrap { padding: 36px 16px 60px !important; }
          .ce-key-grid  { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={{ background: P.bg, color: P.text, fontFamily: "system-ui, -apple-system, sans-serif", minHeight: "100vh" }}>
        <CENav />

        <div className="ce-orch-wrap" style={{ maxWidth: 860, margin: "0 auto", padding: "56px 48px 80px" }}>

          {/* Header */}
          <div className="ce-o1" style={{ marginBottom: 32 }}>
            <p style={{
              fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.44em",
              textTransform: "uppercase", color: P.gold, margin: "0 0 10px", fontFamily: "monospace",
            }}>
              Cognitive Empire — The Orchestrator
            </p>
            <h1 style={{
              fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)", fontWeight: 300,
              color: P.text, margin: "0 0 14px", letterSpacing: "-0.04em", lineHeight: 1.1,
            }}>
              Multi-Model. Your Keys.
            </h1>
            <p style={{ fontSize: "0.92rem", color: P.muted, lineHeight: 1.7, maxWidth: 500, margin: 0 }}>
              BYOK multi-model session. Keys are session-only — never stored, never sent to CE servers.
            </p>
          </div>

          {/* Divider */}
          <div className="ce-o1" style={{ height: 1, background: P.border, marginBottom: 28 }} />

          {/* Key configuration */}
          <div className="ce-o2" style={{ marginBottom: 28 }}>
            <button
              onClick={() => setShowKeys((v) => !v)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.16em",
                textTransform: "uppercase", color: P.muted,
                background: "none", border: "none", cursor: "pointer", padding: 0,
              }}
            >
              <span style={{ color: P.gold }}>{showKeys ? "▾" : "▸"}</span>
              API Keys (session-only, not stored)
            </button>

            {showKeys && (
              <div className="ce-key-grid" style={{
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
                gap: 10, marginTop: 14,
              }}>
                {(["openai", "anthropic", "google"] as Provider[]).map((prov) => (
                  <div key={prov}>
                    <label style={{
                      fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.22em",
                      textTransform: "uppercase", color: P.dim, display: "block", marginBottom: 5,
                    }}>
                      {prov}
                    </label>
                    <input
                      type="password"
                      placeholder="sk-…"
                      value={keys[prov] ?? ""}
                      onChange={(e) => setKey(prov, e.target.value)}
                      className="ce-key-input"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Model selector */}
          <div className="ce-o2" style={{ marginBottom: 24 }}>
            <p style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: P.dim, margin: "0 0 8px" }}>
              Active model
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {MODELS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setActiveModel(m.id)}
                  className={`ce-model-btn${activeModel === m.id ? " active" : ""}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Conversation */}
          {hasConversation && (
            <div style={{
              background: P.panel, border: `1px solid ${P.borderMid}`,
              marginBottom: 12, maxHeight: 480, overflowY: "auto",
            }}>
              {messages.map((msg, i) => (
                <div key={i} style={{
                  padding: "14px 18px",
                  borderBottom: i < messages.length - 1 ? `1px solid ${P.border}` : "none",
                  background: msg.role === "assistant" ? "rgba(10,18,33,0.6)" : "transparent",
                }}>
                  <p style={{
                    fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.22em",
                    textTransform: "uppercase", color: msg.role === "assistant" ? P.gold : P.muted,
                    margin: "0 0 6px",
                  }}>
                    {msg.role === "assistant"
                      ? (MODELS.find((m) => m.id === msg.model)?.label ?? "Assistant")
                      : "You"}
                  </p>
                  <p style={{ fontSize: "0.88rem", color: P.text, lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap" }}>
                    {msg.content}
                  </p>
                </div>
              ))}
              {loading && (
                <div style={{ padding: "14px 18px" }}>
                  <p style={{ fontSize: "0.85rem", color: P.dim, margin: 0 }}>
                    {MODELS.find((m) => m.id === activeModel)?.label} is thinking…
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Input */}
          <div className="ce-o2" style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 8 }}>
            <textarea
              rows={3}
              placeholder="Enter your prompt…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              className="ce-msg-input"
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              className="ce-send-btn"
            >
              Send →
            </button>
          </div>

          {error && (
            <p style={{ fontSize: "0.82rem", color: "#E07070", margin: "0 0 16px" }}>{error}</p>
          )}

          {/* Mandatory feedback strip — shown after any assistant response */}
          {hasConversation && messages.some((m) => m.role === "assistant") && !feedbackSent && (
            <div className="ce-o3" style={{
              marginTop: 28,
              padding: "18px 20px",
              background: P.panelDeep,
              border: `1px solid ${P.border}`,
              borderTop: `1px solid rgba(201,169,97,0.20)`,
            }}>
              {feedbackDone ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <p style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: P.gold, margin: 0 }}>
                    Session Feedback
                  </p>

                  <div>
                    <p style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: P.dim, margin: "0 0 6px" }}>
                      Which model performed best?
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {MODELS.map((m) => (
                        <button key={m.id} onClick={() => setBestModel(m.id)}
                          className={`ce-model-btn${bestModel === m.id ? " active" : ""}`}
                          style={{ fontSize: "0.62rem" }}>
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: P.dim, margin: "0 0 6px" }}>
                      Session quality (1–5)
                    </p>
                    <div style={{ display: "flex", gap: 6 }}>
                      {[1,2,3,4,5].map((n) => (
                        <button key={n} onClick={() => setRating(n)}
                          className={`ce-rating-btn${rating === n ? " active" : ""}`}>
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <textarea
                      rows={2}
                      placeholder="Notes (optional)"
                      value={feedbackNotes}
                      onChange={(e) => setFeedbackNotes(e.target.value)}
                      className="ce-msg-input"
                      style={{ fontSize: "0.82rem" }}
                    />
                  </div>

                  <button
                    onClick={submitFeedback}
                    disabled={!rating}
                    className="ce-send-btn"
                    style={{ alignSelf: "flex-start" }}
                  >
                    Submit Feedback →
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <p style={{ fontSize: "0.78rem", color: P.muted, margin: 0 }}>
                    Session complete? Rate this session to close.
                  </p>
                  <button
                    onClick={() => setFeedbackDone(true)}
                    className="ce-send-btn"
                    style={{ fontSize: "0.65rem", padding: "8px 16px" }}
                  >
                    Leave Feedback →
                  </button>
                </div>
              )}
            </div>
          )}

          {feedbackSent && (
            <div style={{ marginTop: 20, padding: "14px 18px", background: P.panel, border: `1px solid ${P.goldDim}` }}>
              <p style={{ fontSize: "0.85rem", color: P.gold, margin: 0 }}>Feedback received. Thank you.</p>
            </div>
          )}

          {/* Footer note */}
          <div className="ce-o3" style={{
            marginTop: 36, paddingTop: 18,
            borderTop: `1px solid ${P.border}`,
          }}>
            <p style={{ fontSize: "0.72rem", color: P.dim, lineHeight: 1.7, margin: 0 }}>
              Keys are held in component state for this tab session only. They are sent directly to the provider API from your browser — not through CE servers. Clearing the page clears the keys.
            </p>
          </div>

        </div>

        <CEFooter />
      </div>
    </>
  );
}
