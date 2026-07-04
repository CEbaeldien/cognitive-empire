"use client";

import { useState, useEffect, useRef } from "react";

const C = {
  bg:      "#020509",
  panel:   "rgba(3,7,16,0.90)",
  border:  "rgba(14,26,46,0.90)",
  gold:    "#C5A46E",
  goldDim: "rgba(197,164,110,0.20)",
  text:    "#EEF3FA",
  muted:   "#7A8DA6",
  dim:     "#46566A",
  input:   "rgba(2,5,12,0.80)",
  danger:  "#ef4444",
  cyan:    "#00E5FF",
} as const;

type Format = "short" | "longform" | "thumbnail_brief" | "linkedin";

const FORMAT_OPTIONS: { value: Format; label: string; sub: string }[] = [
  { value: "short",           label: "Short (60-90s)",              sub: "YouTube Short script" },
  { value: "longform",        label: "Long-form outline (8-14min)", sub: "YouTube video outline" },
  { value: "linkedin",        label: "LinkedIn post",               sub: "Operator-to-operator" },
  { value: "thumbnail_brief", label: "Thumbnail brief",             sub: "Visual design spec" },
];

type Row = {
  id:     string;
  format: Format;
  title:  string | null;
  output: string | null;
  status: string;
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{
        fontSize: 9, fontWeight: 700, letterSpacing: "0.28em",
        textTransform: "uppercase", color: C.dim,
      }}>
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
    minHeight: multi ? 72 : undefined, boxSizing: "border-box", fontFamily: "inherit",
  };
}

function StatusChip({ status }: { status: string }) {
  type ChipStyle = { bg: string; border: string; color: string; label: string };
  const styles: Record<string, ChipStyle> = {
    generating: { bg: "rgba(197,164,110,0.07)", border: "rgba(197,164,110,0.25)", color: C.gold,    label: "GENERATING…" },
    draft:      { bg: "rgba(0,229,255,0.07)",   border: "rgba(0,229,255,0.18)",   color: C.cyan,    label: "DRAFT"       },
    error:      { bg: "rgba(239,68,68,0.10)",   border: "rgba(239,68,68,0.28)",   color: C.danger,  label: "ERROR"       },
  };
  const s = styles[status] ?? styles.draft;
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, letterSpacing: "0.14em",
      background: s.bg, border: `1px solid ${s.border}`,
      color: s.color, padding: "2px 8px", borderRadius: 3,
    }}>
      {s.label}
    </span>
  );
}

function ExpandedOutput({ row }: { row: Row }) {
  const [open, setOpen] = useState(false);
  if (!row.output) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          background: "none", border: "none", cursor: "pointer",
          fontSize: 11, color: C.muted, padding: 0, letterSpacing: "0.05em",
        }}
      >
        {open ? "▲ Hide output" : "▼ Show output"}
      </button>
      {open && (
        <pre style={{
          marginTop: 8, fontSize: 12, color: C.text, lineHeight: 1.65,
          whiteSpace: "pre-wrap", wordBreak: "break-word",
          background: "rgba(0,0,0,0.30)", border: `1px solid ${C.border}`,
          borderRadius: 4, padding: "12px 14px", maxHeight: 480, overflowY: "auto",
        }}>
          {row.output}
        </pre>
      )}
    </div>
  );
}

export default function ContentNewPage() {
  const [topic,   setTopic]   = useState("");
  const [notes,   setNotes]   = useState("");
  const [formats, setFormats] = useState<Set<Format>>(new Set(["short"]));
  const [loading, setLoading] = useState(false);
  const [rows,    setRows]    = useState<Row[]>([]);
  const [err,     setErr]     = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  function toggleFormat(f: Format) {
    setFormats(prev => {
      const next = new Set(prev);
      next.has(f) ? next.delete(f) : next.add(f);
      return next;
    });
  }

  function startPolling(ids: string[]) {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/content/status?ids=${ids.join(",")}`);
        const json = await res.json() as { rows: Row[] };
        setRows(json.rows);
        const allDone = json.rows.every(r => r.status === "draft" || r.status === "error");
        if (allDone) {
          clearInterval(pollRef.current!);
          pollRef.current = null;
        }
      } catch {
        // transient error — keep polling
      }
    }, 3000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim()) { setErr("Topic is required."); return; }
    if (formats.size === 0) { setErr("Select at least one format."); return; }
    setErr(null);
    setLoading(true);
    setRows([]);
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }

    try {
      const res = await fetch("/api/content/generate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ topic: topic.trim(), notes: notes.trim() || undefined, formats: [...formats] }),
      });
      const json = await res.json();
      if (!res.ok) { setErr(json.error ?? "Enqueue failed."); return; }

      const initialRows: Row[] = (json.rows as { id: string; format: Format; status: string }[]).map(r => ({
        id: r.id, format: r.format, status: r.status, title: null, output: null,
      }));
      setRows(initialRows);
      startPolling(initialRows.map(r => r.id));
    } catch {
      setErr("Network error.");
    } finally {
      setLoading(false);
    }
  }

  const doneCount      = rows.filter(r => r.status === "draft").length;
  const generatingCount = rows.filter(r => r.status === "generating").length;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, padding: "40px 32px" }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>

        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.32em", textTransform: "uppercase", color: C.dim, margin: "0 0 8px" }}>
            Content Engine
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0, color: C.text }}>Generate Content Brief</h1>
          <p style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>
            Briefs generate async — submit and watch them land one by one.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          <Field label="Topic *">
            <input
              style={inputStyle()} value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g. Maintenance Gravity in AI deployment pipelines"
              required
            />
          </Field>

          <Field label="Additional context (optional)">
            <textarea
              style={inputStyle(true)} value={notes}
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
                  <label key={opt.value} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "11px 14px", borderRadius: 4, cursor: "pointer",
                    background: checked ? "rgba(197,164,110,0.06)" : C.panel,
                    border: `1px solid ${checked ? C.gold : C.border}`,
                    transition: "border-color 160ms, background 160ms",
                  }}>
                    <input
                      type="checkbox" checked={checked}
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

          {err && <p style={{ fontSize: 12, color: C.danger, margin: 0 }}>{err}</p>}

          <button
            type="submit" disabled={loading}
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
            {loading
              ? "Queuing…"
              : `Generate ${formats.size > 0 ? formats.size : ""} Brief${formats.size !== 1 ? "s" : ""}`}
          </button>
        </form>

        {rows.length > 0 && (
          <div style={{ marginTop: 40 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <p style={{
                fontSize: 9, fontWeight: 700, letterSpacing: "0.28em",
                textTransform: "uppercase", color: C.dim, margin: 0,
              }}>
                Queue — {doneCount}/{rows.length} ready
                {generatingCount > 0 && ` · ${generatingCount} generating`}
              </p>
              <div style={{ flex: 1, height: 1, background: C.border }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {rows.map(r => (
                <div key={r.id} style={{
                  padding: "14px 16px", borderRadius: 4,
                  background: C.panel,
                  border: `1px solid ${r.status === "error" ? "rgba(239,68,68,0.30)" : C.border}`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{
                      fontSize: 9, fontWeight: 700, letterSpacing: "0.20em",
                      background: "rgba(197,164,110,0.10)", border: `1px solid rgba(197,164,110,0.25)`,
                      color: C.gold, padding: "2px 8px", borderRadius: 3, flexShrink: 0,
                    }}>
                      {r.format.replace(/_/g, " ").toUpperCase()}
                    </span>
                    <StatusChip status={r.status} />
                    <span style={{ fontSize: 10, color: C.dim, marginLeft: "auto" }}>
                      {r.id.slice(0, 8)}
                    </span>
                  </div>
                  {r.title && (
                    <p style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: "8px 0 0" }}>
                      {r.title}
                    </p>
                  )}
                  {r.status === "generating" && !r.title && (
                    <p style={{ fontSize: 11, color: C.muted, margin: "6px 0 0" }}>
                      Generating content…
                    </p>
                  )}
                  <ExpandedOutput row={r} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
