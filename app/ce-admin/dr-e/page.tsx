"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { getKey, setKey, hasKey, type DreModel } from "@/lib/dre/keys";

const C = {
  bg:           "#09091c",
  panel:        "#0e0c1f",
  panelDeep:    "#0b0a1e",
  border:       "#1c1a35",
  accent:       "#00E0FF",
  accentBg:     "rgba(0,224,255,0.08)",
  accentBorder: "rgba(0,224,255,0.25)",
  gold:         "#C5A26F",
  text:         "#f1f5f9",
  muted:        "#94a3b8",
  faint:        "#64748b",
  input:        "#0a0919",
} as const;

const RISK_COLOR: Record<string, string> = {
  safe:      "#4ade80",
  medium:    "#fbbf24",
  high:      "#fb923c",
  forbidden: "#f87171",
};

const MODEL_LABEL: Record<DreModel, string> = { claude: "Claude", chatgpt: "ChatGPT" };
const MODEL_ROLE:  Record<DreModel, string> = { claude: "Reasoning / synthesis", chatgpt: "Brainstorming" };
const MODEL_ROUTE: Record<DreModel, string> = { claude: "/api/ce/dr-e", chatgpt: "/api/ce/dr-e/chatgpt" };

const ORCHESTRATOR_URL = "https://orchestrator.cognitiveempire.com";

function fmt(s: string | null | undefined): string {
  if (!s) return "—";
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

type SystemStatus = { label: string; value: string | number; accent?: string };

type SuggestedAction = {
  id: string;
  title: string;
  risk_level: string;
  requires_approval: boolean;
  source_module: string | null;
  notes: string | null;
};

type CEState = {
  runtime:  SystemStatus;
  signals:  SystemStatus;
  drift:    SystemStatus;
  work:     SystemStatus;
  research: SystemStatus;
  actions:  SystemStatus;
};

type ChatMsg = { role: "user" | "assistant"; model: DreModel | null; content: string };

export default function DrECommandPage() {
  const [time,      setTime]      = useState(new Date());
  const [state,     setState]     = useState<CEState | null>(null);
  const [topAction, setTopAction] = useState<SuggestedAction | null>(null);

  const [messages,  setMessages]  = useState<ChatMsg[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [input,     setInput]     = useState("");
  const [model,     setModel]     = useState<DreModel>("claude");
  const [sending,   setSending]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [keyInput,  setKeyInput]  = useState("");
  const [keyLoaded, setKeyLoaded] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const [escalateErr, setEscalateErr] = useState<string | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  // Live clock
  useEffect(() => {
    const tick = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  // Fetch CE state summary from real APIs
  useEffect(() => {
    async function fetchState() {
      const [inboxRes, researchRes, actionsRes] = await Promise.allSettled([
        fetch("/api/dr-e/inbox?approval_state=needs_review&limit=1").then((r) => r.json()),
        fetch("/api/dr-e/research?status=active&limit=1").then((r) => r.json()),
        fetch("/api/dr-e/actions?status=suggested&limit=1").then((r) => r.json()),
      ]);

      const workCount     = inboxRes.status === "fulfilled"     ? (inboxRes.value.total     ?? "—") : "—";
      const researchCount = researchRes.status === "fulfilled"  ? (researchRes.value.total  ?? "—") : "—";
      const actionsCount  = actionsRes.status === "fulfilled"   ? (actionsRes.value.total   ?? "—") : "—";

      if (actionsRes.status === "fulfilled" && actionsRes.value.actions?.length > 0) {
        setTopAction(actionsRes.value.actions[0]);
      }

      setState({
        runtime:  { label: "Runtime",  value: "Stable",     accent: "#4ade80" },
        signals:  { label: "Signals",  value: "Live",       accent: "#4ade80" },
        drift:    { label: "DRIFT",    value: "23 open",    accent: C.accent  },
        work:     { label: "Work",     value: workCount,    accent: C.faint   },
        research: { label: "Research", value: researchCount, accent: C.accent },
        actions:  { label: "Actions",  value: actionsCount, accent: "#fbbf24" },
      });
    }
    fetchState();
  }, []);

  // Load persisted chat thread
  useEffect(() => {
    async function loadThread() {
      try {
        const res = await fetch("/api/dr-e/chat-messages");
        const data = await res.json();
        setMessages((data.messages ?? []).map((m: { role: string; model: string | null; content: string }) => ({
          role: m.role, model: m.model as DreModel | null, content: m.content,
        })));
      } catch { /* start with empty thread */ }
      setLoadingHistory(false);
    }
    loadThread();
  }, []);

  useEffect(() => {
    setKeyLoaded(hasKey(model));
  }, [model]);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  function saveKey() {
    const k = keyInput.trim();
    if (!k) return;
    setKey(model, k);
    setKeyInput("");
    setKeyLoaded(true);
  }

  async function persistMessage(role: "user" | "assistant", content: string, msgModel: DreModel | null) {
    try {
      await fetch("/api/dr-e/chat-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, content, model: msgModel }),
      });
    } catch { /* non-fatal — thread continues in memory even if persistence fails */ }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    const key = getKey(model);
    if (!key) { setError(`${MODEL_LABEL[model]} key required — enter it below.`); return; }

    setError(null);
    const userMsg: ChatMsg = { role: "user", model: null, content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setSending(true);
    void persistMessage("user", text, null);

    setMessages((prev) => [...prev, { role: "assistant", model, content: "" }]);

    try {
      const res = await fetch(MODEL_ROUTE[model], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key,
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        setMessages((prev) => prev.slice(0, -1));
        setError(data.error ?? "Could not reach Dr. E");
        setSending(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", model, content: full };
          return copy;
        });
      }

      void persistMessage("assistant", full, model);
    } catch {
      setMessages((prev) => prev.slice(0, -1));
      setError("Request failed.");
    } finally {
      setSending(false);
    }
  }

  async function runThroughMMCP() {
    if (!messages.length || escalating) return;
    setEscalating(true);
    setEscalateErr(null);
    try {
      const res = await fetch("/api/ce/dr-e/escalate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: messages.map((m) => ({ role: m.role, content: m.content })) }),
      });
      const data = await res.json();
      if (!res.ok) { setEscalateErr(data.error ?? "Escalation failed"); setEscalating(false); return; }
      window.location.href = `${ORCHESTRATOR_URL}/sessions/${data.sessionId}`;
    } catch {
      setEscalateErr("Escalation failed.");
      setEscalating(false);
    }
  }

  const timeStr = time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const dateStr = time.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div style={{ padding: "32px 36px", display: "flex", flexDirection: "column", gap: 32, maxWidth: 960, margin: "0 auto" }}>

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.45em", textTransform: "uppercase", color: C.faint, marginBottom: 6 }}>
            CE Admin · Dr. E Internal
          </p>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text, letterSpacing: "-0.025em", margin: 0 }}>
            {greeting()}, Ebaeldien.
          </h1>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 22, fontWeight: 700, color: C.accent, letterSpacing: "0.05em", margin: 0, fontVariantNumeric: "tabular-nums" }}>{timeStr}</p>
          <p style={{ fontSize: 11, color: C.faint, margin: "2px 0 0" }}>{dateStr}</p>
        </div>
      </div>

      {/* ── CE STATE SUMMARY ───────────────────────────────────────────── */}
      <div>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.4em", textTransform: "uppercase", color: C.faint, marginBottom: 12 }}>CE State</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
          {state
            ? Object.values(state).map((s) => (
              <div key={s.label} style={{ padding: "14px 16px", borderRadius: 10, background: C.panel, border: `1px solid ${C.border}` }}>
                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.4em", textTransform: "uppercase", color: C.faint, margin: "0 0 8px" }}>{s.label}</p>
                <p style={{ fontSize: 18, fontWeight: 800, color: s.accent ?? C.text, margin: 0, letterSpacing: "-0.02em" }}>{s.value}</p>
              </div>
            ))
            : Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ padding: "14px 16px", borderRadius: 10, background: C.panel, border: `1px solid ${C.border}` }}>
                <div style={{ height: 9, borderRadius: 4, background: C.border, marginBottom: 12 }} />
                <div style={{ height: 18, width: "60%", borderRadius: 4, background: C.border }} />
              </div>
            ))
          }
        </div>
      </div>

      {/* ── RECOMMENDED NEXT ACTION ────────────────────────────────────── */}
      {topAction && (
        <div style={{ borderRadius: 12, border: `1px solid ${C.accentBorder}`, background: C.accentBg, padding: "18px 22px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.45em", textTransform: "uppercase", color: C.accent, margin: "0 0 6px" }}>
                Recommended Next Action
              </p>
              <p style={{ fontSize: 15, fontWeight: 600, color: C.text, margin: "0 0 6px" }}>{topAction.title}</p>
              {topAction.notes && (
                <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>{topAction.notes}</p>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end", flexShrink: 0 }}>
              <span style={{
                padding: "3px 9px", borderRadius: 5,
                background: `${RISK_COLOR[topAction.risk_level] ?? C.faint}18`,
                color: RISK_COLOR[topAction.risk_level] ?? C.faint,
                fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
              }}>
                {topAction.risk_level}
              </span>
              {topAction.requires_approval && (
                <span style={{ padding: "3px 9px", borderRadius: 5, background: "rgba(251,191,36,0.12)", color: "#fbbf24", fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  approval required
                </span>
              )}
              {topAction.source_module && (
                <span style={{ fontSize: 10, color: C.faint }}>{fmt(topAction.source_module)}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── CHAT ────────────────────────────────────────────────────────── */}
      <div style={{ borderRadius: 12, border: `1px solid ${C.border}`, background: C.panel, overflow: "hidden" }}>
        <div style={{ padding: "12px 20px", background: C.panelDeep, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.4em", textTransform: "uppercase", color: C.faint, margin: 0 }}>
            Talk to Dr. E
          </p>
          <div style={{ display: "flex", gap: 6 }}>
            {(["claude", "chatgpt"] as DreModel[]).map((m) => (
              <button
                key={m}
                onClick={() => setModel(m)}
                title={MODEL_ROLE[m]}
                style={{
                  padding: "5px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                  border: `1px solid ${model === m ? C.accentBorder : C.border}`,
                  background: model === m ? C.accentBg : "transparent",
                  color: model === m ? C.accent : C.faint,
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                {MODEL_LABEL[m]}
              </button>
            ))}
          </div>
        </div>

        {/* Thread */}
        <div ref={threadRef} style={{ maxHeight: 480, overflowY: "auto", padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
          {loadingHistory && <p style={{ fontSize: 12, color: C.faint }}>Loading conversation…</p>}
          {!loadingHistory && messages.length === 0 && (
            <p style={{ fontSize: 12, color: C.faint }}>No conversation yet. Say something to Dr. E.</p>
          )}
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: C.faint, marginBottom: 4 }}>
                {m.role === "user" ? "Principal" : `Dr. E${m.model ? ` · ${MODEL_LABEL[m.model]}` : ""}`}
              </span>
              <div style={{
                maxWidth: "80%", padding: "10px 14px", borderRadius: 10,
                background: m.role === "user" ? C.accentBg : "#030210",
                border: `1px solid ${m.role === "user" ? C.accentBorder : C.border}`,
                fontSize: 13, lineHeight: 1.65, color: m.role === "user" ? C.text : C.gold,
                whiteSpace: "pre-wrap", wordBreak: "break-word",
              }}>
                {m.content || (sending && i === messages.length - 1 ? "▌" : "")}
              </div>
            </div>
          ))}
        </div>

        {error && <p style={{ fontSize: 12, color: "#f87171", padding: "0 20px" }}>{error}</p>}

        {!keyLoaded && (
          <div style={{ padding: "0 20px 14px", display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveKey()}
              placeholder={`${MODEL_LABEL[model]} API key…`}
              style={{ flex: 1, padding: "8px 12px", borderRadius: 7, border: `1px solid ${C.border}`, background: C.input, color: C.text, fontSize: 12, outline: "none", fontFamily: "inherit" }}
            />
            <button onClick={saveKey} disabled={!keyInput.trim()} style={{ padding: "8px 16px", borderRadius: 7, border: `1px solid ${C.accentBorder}`, background: C.accentBg, color: C.accent, fontSize: 12, fontWeight: 600, cursor: keyInput.trim() ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
              Save
            </button>
            <Link href="/ce-admin/dr-e/settings" style={{ fontSize: 11, color: C.faint, whiteSpace: "nowrap" }}>Manage keys →</Link>
          </div>
        )}

        <div style={{ padding: "0 20px 20px" }}>
          <form onSubmit={sendMessage} style={{ display: "flex", gap: 10 }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Message Dr. E (${MODEL_LABEL[model]})…`}
              style={{ flex: 1, padding: "10px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.input, color: C.text, fontSize: 13, outline: "none", fontFamily: "inherit" }}
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              style={{
                padding: "10px 20px", borderRadius: 8, border: `1px solid ${C.accentBorder}`,
                background: sending || !input.trim() ? "transparent" : C.accentBg,
                color: sending || !input.trim() ? C.faint : C.accent,
                fontSize: 12, fontWeight: 600, cursor: sending || !input.trim() ? "not-allowed" : "pointer",
                fontFamily: "inherit", whiteSpace: "nowrap",
              }}
            >
              {sending ? "Thinking…" : "Send"}
            </button>
          </form>

          {messages.length > 0 && (
            <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
              <button
                onClick={runThroughMMCP}
                disabled={escalating}
                style={{
                  padding: "8px 16px", borderRadius: 7, border: `1px solid rgba(197,162,111,0.3)`,
                  background: "rgba(197,162,111,0.1)", color: C.gold, fontSize: 12, fontWeight: 600,
                  cursor: escalating ? "not-allowed" : "pointer", fontFamily: "inherit",
                }}
              >
                {escalating ? "Creating MMCP session…" : "Run through MMCP →"}
              </button>
              {escalateErr && <span style={{ fontSize: 11, color: "#f87171" }}>{escalateErr}</span>}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
