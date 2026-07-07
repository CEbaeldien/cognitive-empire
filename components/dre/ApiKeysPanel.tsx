"use client";

import { useEffect, useState } from "react";
import { setKey, hasKey, clearKey, clearAllKeys, type DreModel } from "@/lib/dre/keys";

const C = {
  panel:  "#0e0c1f",
  border: "#1c1a35",
  accent: "#00E0FF",
  text:   "#f1f5f9",
  muted:  "#94a3b8",
  faint:  "#64748b",
  input:  "#0a0919",
} as const;

const MODELS: { key: DreModel; label: string; role: string; placeholder: string }[] = [
  { key: "claude",  label: "Claude",  role: "Reasoning / synthesis", placeholder: "sk-ant-…" },
  { key: "chatgpt", label: "ChatGPT", role: "Brainstorming",         placeholder: "sk-…" },
];

export function ApiKeysPanel() {
  const [loaded, setLoaded] = useState<Record<DreModel, boolean>>({ claude: false, chatgpt: false });
  const [inputs, setInputs] = useState<Partial<Record<DreModel, string>>>({});

  function refresh() {
    setLoaded({ claude: hasKey("claude"), chatgpt: hasKey("chatgpt") });
  }

  useEffect(() => { refresh(); }, []);

  function save(model: DreModel) {
    const k = (inputs[model] ?? "").trim();
    if (!k) return;
    setKey(model, k);
    setInputs((p) => ({ ...p, [model]: "" }));
    refresh();
  }

  function revoke(model: DreModel) {
    clearKey(model);
    refresh();
  }

  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.45em", textTransform: "uppercase", color: C.faint, marginBottom: 4 }}>Dr. E · Settings</p>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: "-0.02em", margin: "0 0 4px" }}>API Keys</h1>
        <p style={{ fontSize: 12, color: C.faint, margin: 0 }}>
          Stored in this browser&apos;s localStorage only — never sent to or stored in the database.
          Powers every chat call on the Command page.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 8 }}>
        {MODELS.map(({ key, label, role, placeholder }) => (
          <div key={key} style={{ border: `1px solid ${loaded[key] ? "rgba(0,224,255,0.25)" : C.border}`, borderRadius: 10, background: C.panel, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderBottom: `1px solid ${C.border}` }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: C.text, margin: 0 }}>{label}</p>
                <p style={{ fontSize: 11, color: C.faint, margin: "2px 0 0" }}>{role}</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  fontSize: 11, padding: "3px 9px", borderRadius: 20,
                  color: loaded[key] ? C.accent : C.faint,
                  background: loaded[key] ? "rgba(0,224,255,0.08)" : "rgba(255,255,255,0.03)",
                }}>
                  {loaded[key] ? "Stored locally" : "Missing"}
                </span>
                {loaded[key] && (
                  <button onClick={() => revoke(key)} style={{ fontSize: 11, color: C.faint, background: "none", border: "none", cursor: "pointer", padding: "2px 4px" }}>
                    Revoke
                  </button>
                )}
              </div>
            </div>
            <div style={{ padding: "10px 14px", display: "flex", gap: 8 }}>
              <input
                type="password"
                value={inputs[key] ?? ""}
                onChange={(e) => setInputs((p) => ({ ...p, [key]: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && save(key)}
                placeholder={loaded[key] ? `Replace ${label} key…` : placeholder}
                style={{ flex: 1, background: C.input, border: `1px solid ${C.border}`, borderRadius: 6, padding: "8px 12px", fontSize: 12, color: C.text, outline: "none", fontFamily: "monospace" }}
              />
              <button
                onClick={() => save(key)}
                disabled={!inputs[key]?.trim()}
                style={{
                  padding: "0 16px", borderRadius: 6, border: "1px solid rgba(0,224,255,0.25)",
                  background: "rgba(0,224,255,0.08)", color: C.accent, fontSize: 12,
                  cursor: inputs[key]?.trim() ? "pointer" : "not-allowed",
                  opacity: inputs[key]?.trim() ? 1 : 0.4,
                }}
              >
                {loaded[key] ? "Replace" : "Save"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {(loaded.claude || loaded.chatgpt) && (
        <button
          onClick={() => { clearAllKeys(); refresh(); }}
          style={{ fontSize: 12, color: C.faint, background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          Clear all keys
        </button>
      )}
    </div>
  );
}
