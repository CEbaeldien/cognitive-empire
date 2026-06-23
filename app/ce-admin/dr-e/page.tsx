"use client";

import { useEffect, useState, useRef } from "react";

const C = {
  bg:           "#09091c",
  panel:        "#0e0c1f",
  panelDeep:    "#0b0a1e",
  border:       "#1c1a35",
  accent:       "#00E0FF",
  accentBg:     "rgba(0,224,255,0.08)",
  accentBorder: "rgba(0,224,255,0.25)",
  text:         "#f1f5f9",
  muted:        "#94a3b8",
  faint:        "#64748b",
  input:        "#0a0919",
} as const;

const PRIORITY_COLOR: Record<string, string> = {
  critical: "#f87171",
  high:     "#fb923c",
  medium:   "#fbbf24",
  low:      "#4ade80",
};

const DECAY_COLOR: Record<string, string> = {
  high:   "#f87171",
  medium: "#fbbf24",
  low:    "#4ade80",
  none:   "#475569",
};

const RISK_COLOR: Record<string, string> = {
  safe:      "#4ade80",
  medium:    "#fbbf24",
  high:      "#fb923c",
  forbidden: "#f87171",
};

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

export default function DrECommandPage() {
  const [time,    setTime]    = useState(new Date());
  const [state,   setState]   = useState<CEState | null>(null);
  const [topAction, setTopAction] = useState<SuggestedAction | null>(null);
  const [command, setCommand] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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

  async function handleCommand(e: React.FormEvent) {
    e.preventDefault();
    if (!command.trim()) return;
    setLoading(true);
    setResponse("");

    try {
      const res = await fetch("/api/ce/dr-e", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command }),
      });

      if (!res.ok || !res.body) {
        try {
          const data = await res.json();
          setResponse(`Error: ${data.error ?? "could not reach Dr. E"}`);
        } catch {
          setResponse(`Error: HTTP ${res.status} — could not reach Dr. E`);
        }
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setResponse((prev) => (prev ?? "") + decoder.decode(value, { stream: true }));
      }

      setCommand("");
    } catch {
      setResponse("Error: request failed.");
    } finally {
      setLoading(false);
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

      {/* ── COMMAND INPUT ──────────────────────────────────────────────── */}
      <div style={{ borderRadius: 12, border: `1px solid ${C.border}`, background: C.panel, overflow: "hidden" }}>
        <div style={{ padding: "12px 20px", background: C.panelDeep, borderBottom: `1px solid ${C.border}` }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.4em", textTransform: "uppercase", color: C.faint, margin: 0 }}>
            Command Dr. E
          </p>
        </div>
        <div style={{ padding: "20px" }}>
          <form onSubmit={handleCommand} style={{ display: "flex", gap: 10 }}>
            <input
              ref={inputRef}
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="Command Dr. E..."
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                background: C.input,
                color: C.text,
                fontSize: 13,
                outline: "none",
                fontFamily: "inherit",
              }}
            />
            <button
              type="submit"
              disabled={loading || !command.trim()}
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                border: `1px solid ${C.accentBorder}`,
                background: loading || !command.trim() ? "transparent" : C.accentBg,
                color: loading || !command.trim() ? C.faint : C.accent,
                fontSize: 12,
                fontWeight: 600,
                cursor: loading || !command.trim() ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                whiteSpace: "nowrap",
                transition: "all 0.12s",
              }}
            >
              {loading ? "Processing…" : "Execute"}
            </button>
          </form>

          {(response !== null && response !== undefined) && (
            <div style={{ marginTop: 16, borderRadius: 8, border: `1px solid ${C.border}`, background: "#030210", overflow: "hidden" }}>
              <div style={{ padding: "6px 14px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.45em", textTransform: "uppercase", color: C.faint }}>Dr. E</span>
                {loading && <span style={{ fontSize: 9, color: "#C5A26F", letterSpacing: "0.1em" }}>▌</span>}
              </div>
              <pre style={{
                margin: 0,
                padding: "14px 16px",
                fontSize: 12,
                color: "#C5A26F",
                fontFamily: "ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, monospace",
                lineHeight: 1.75,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                minHeight: 40,
              }}>
                {response || " "}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* ── QUICK PROJECT STATUS ───────────────────────────────────────── */}
      <div>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.4em", textTransform: "uppercase", color: C.faint, marginBottom: 12 }}>
          Priority Projects
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {[
            { name: "Company Registration", priority: "critical", decay_risk: "high",   phase: "In progress",                  next: "Complete registration documents" },
            { name: "Dr. E Internal",       priority: "critical", decay_risk: "low",    phase: "Blueprint locked — building",   next: "Complete V1 build" },
            { name: "DRIFT",                priority: "critical", decay_risk: "low",    phase: "Phase I live",                  next: "Define Phase II feature scope" },
          ].map((p) => (
            <div key={p.name} style={{ padding: "16px 18px", borderRadius: 10, background: C.panel, border: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: C.text, margin: 0 }}>{p.name}</p>
                <span style={{
                  padding: "2px 8px", borderRadius: 4,
                  background: `${PRIORITY_COLOR[p.priority] ?? C.faint}18`,
                  color: PRIORITY_COLOR[p.priority] ?? C.faint,
                  fontSize: 9, fontWeight: 800, textTransform: "uppercase",
                }}>
                  {p.priority}
                </span>
              </div>
              <p style={{ fontSize: 11, color: C.faint, margin: "0 0 6px" }}>{p.phase}</p>
              <p style={{ fontSize: 11, color: C.muted, margin: "0 0 8px" }}>{p.next}</p>
              <span style={{
                padding: "2px 8px", borderRadius: 4,
                background: `${DECAY_COLOR[p.decay_risk] ?? C.faint}14`,
                color: DECAY_COLOR[p.decay_risk] ?? C.faint,
                fontSize: 9, fontWeight: 700, textTransform: "uppercase",
              }}>
                decay {p.decay_risk}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
