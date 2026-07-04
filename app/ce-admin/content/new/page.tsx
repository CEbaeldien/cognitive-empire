"use client";

import { useState } from "react";

const C = {
  bg:           "#020509",
  panel:        "rgba(3,7,16,0.90)",
  border:       "rgba(14,26,46,0.90)",
  borderHover:  "rgba(197,164,110,0.30)",
  gold:         "#C5A46E",
  goldDim:      "rgba(197,164,110,0.20)",
  cyan:         "#00E5FF",
  text:         "#EEF3FA",
  muted:        "#7A8DA6",
  dim:          "#46566A",
  input:        "rgba(2,5,12,0.80)",
  danger:       "#ef4444",
} as const;

type Format = "short" | "longform" | "thumbnail_brief" | "linkedin";

const FORMAT_OPTIONS: { value: Format; label: string; sub: string }[] = [
  { value: "short",           label: "Short (60-90s)",          sub: "YouTube Short script" },
  { value: "longform",        label: "Long-form outline (8-15min)", sub: "YouTube video outline" },
  { value: "linkedin",        label: "LinkedIn post",            sub: "Operator-to-operator" },
  { value: "thumbnail_brief", label: "Thumbnail brief",          sub: "Visual design spec" },
];

type Brief = { id: string; topic: string; format: string; title: string | null; status: string; created_at: string };
type FormatResult = { fmt: Format; brief?: Brief; error?: string };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", color: C.dim }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function inputStyle(multi?: boolean): React.CSSProperties {
  return {
    background: C.input, border: `1px solid ${C.border}`, borderRadius: 4,
    color: C.text, fontSize: 13, padding: multi ? "10px 12px" : "9px 12px",
    outline: "none", width: "100%", resize: multi ? "vertical" : undefined,
    minHeight: multi ? 72 : undefined, boxSizing: "border-box",
    fontFamily: "inherit",
  };
}

export default function ContentNewPage() {
  const [topic,    setTopic]    = useState("");
  const [notes,    setNotes]    = useState("");
  const [formats,  setFormats]  = useState<Set<Format>>(new Set(["short"]));
  const [loading,  setLoading]  = useState(false);
  const [results,  setResults]  = useState<FormatResult[]>([]);
  const [err,      setErr]      = useState<string | null>(null);

  function toggleFormat(f: Format) {
    setFormats(prev => {
      const next = new Set(prev);
      next.has(f) ? next.delete(f) : next.add(f);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim()) { setErr("Topic is required."); return; }
    if (formats.size === 0) { setErr("Select at least one format."); return; }
    setErr(null);
    setLoading(true);
    setResults([]);
    try {
      // One request per format in parallel — each server call has one OpenAI call (fits Vercel 10s wall).
      const settled = await Promise.all(
        [...formats].map(async (fmt) => {
          try {
            const r = await fetch("/api/content/generate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ topic: topic.trim(), notes: notes.trim() || undefined, format: fmt }),
            });
            const d = await r.json();
            return d.brief ? { fmt, brief: d.brief as Brief } : { fmt, error: d.error ?? `HTTP ${r.status}` };
          } catch {
            return { fmt, error: "network error" };
          }
        })
      );
      setResults(settled);
      const allFailed = settled.every(r => r.error);
      if (allFailed) setErr(settled[0].error ?? "All formats failed.");
    } catch {
      setErr("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, padding: "40px 32px" }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.32em", textTransform: "uppercase", color: C.dim, margin: "0 0 8px" }}>
            Content Engine
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0, color: C.text }}>
            Generate Content Brief
          </h1>
          <p style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>
            Select formats, enter the topic, and generate drafts for the queue.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          <Field label="Topic *">
            <input
              style={inputStyle()}
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g. Maintenance Gravity in AI deployment pipelines"
              required
            />
          </Field>

          <Field label="Additional context (optional)">
            <textarea
              style={inputStyle(true)}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Recent CE data, session outputs, convergence results, angle focus..."
              rows={3}
            />
          </Field>

          <Field label="Formats">
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 2 }}>
              {FORMAT_OPTIONS.map(opt => {
                const checked = formats.has(opt.value);
                return (
                  <label
                    key={opt.value}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "11px 14px", borderRadius: 4, cursor: "pointer",
                      background: checked ? "rgba(197,164,110,0.06)" : C.panel,
                      border: `1px solid ${checked ? C.gold : C.border}`,
                      transition: "border-color 160ms, background 160ms",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleFormat(opt.value)}
                      style={{ accentColor: C.gold, width: 14, height: 14, flexShrink: 0 }}
                    />
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 500, color: checked ? C.text : C.muted }}>
                        {opt.label}
                      </span>
                      <span style={{ fontSize: 11, color: C.dim, marginLeft: 8 }}>{opt.sub}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </Field>

          {err && (
            <p style={{ fontSize: 12, color: C.danger, margin: 0 }}>{err}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "11px 24px", borderRadius: 4,
              background: loading ? "rgba(197,164,110,0.25)" : C.goldDim,
              border: `1px solid ${loading ? "rgba(197,164,110,0.15)" : C.gold}`,
              color: loading ? C.dim : C.gold,
              fontSize: 11, fontWeight: 700, letterSpacing: "0.20em",
              textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer",
              alignSelf: "flex-start", transition: "background 160ms",
            }}
          >
            {loading ? "Generating…" : `Generate ${formats.size > 0 ? formats.size : ""} Brief${formats.size !== 1 ? "s" : ""}`}
          </button>
        </form>

        {/* Results */}
        {results.length > 0 && (
          <div style={{ marginTop: 40 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", color: C.dim, margin: 0 }}>
                Queue — {results.filter(r => r.brief).length}/{results.length} saved
              </p>
              <div style={{ flex: 1, height: 1, background: C.border }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {results.map(r => (
                <div
                  key={r.fmt}
                  style={{
                    padding: "14px 16px", borderRadius: 4,
                    background: C.panel,
                    border: `1px solid ${r.error ? "rgba(239,68,68,0.30)" : C.border}`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: r.brief?.title ? 6 : 0 }}>
                    <span style={{
                      fontSize: 9, fontWeight: 700, letterSpacing: "0.20em",
                      background: "rgba(197,164,110,0.10)", border: `1px solid rgba(197,164,110,0.25)`,
                      color: C.gold, padding: "2px 8px", borderRadius: 3,
                    }}>
                      {r.fmt.replace(/_/g, " ").toUpperCase()}
                    </span>
                    {r.brief && (
                      <span style={{
                        fontSize: 9, fontWeight: 700, letterSpacing: "0.14em",
                        background: "rgba(0,229,255,0.07)", border: `1px solid rgba(0,229,255,0.18)`,
                        color: "#00E5FF", padding: "2px 8px", borderRadius: 3,
                      }}>DRAFT</span>
                    )}
                    {r.error && (
                      <span style={{
                        fontSize: 9, fontWeight: 700, letterSpacing: "0.14em",
                        background: "rgba(239,68,68,0.10)", border: `1px solid rgba(239,68,68,0.28)`,
                        color: C.danger, padding: "2px 8px", borderRadius: 3,
                      }}>FAILED</span>
                    )}
                    {r.brief && (
                      <span style={{ fontSize: 10, color: C.dim, marginLeft: "auto" }}>
                        {r.brief.id.slice(0, 8)}
                      </span>
                    )}
                  </div>
                  {r.brief?.title && (
                    <p style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: "6px 0 0" }}>
                      {r.brief.title}
                    </p>
                  )}
                  {r.error && (
                    <p style={{ fontSize: 11, color: C.danger, margin: "6px 0 0" }}>{r.error}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
