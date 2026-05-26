"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

const S = {
  bg:     "#0b0f1c",
  panel:  "#0f1420",
  border: "#1a2035",
  input:  "#090c17",
  text:   "#f1f5f9",
  muted:  "#94a3b8",
  faint:  "#64748b",
  blue:   "#3b82f6",
} as const;

const REQUIRED_COLS = ["account_name", "opportunity_title", "value", "stage"];
const OPTIONAL_COLS = ["currency", "probability", "expected_close_date", "last_activity_date", "next_action", "next_action_due_date", "contact_name", "contact_email", "notes"];

const TEMPLATE_ROWS = [
  ["Meridian Health Systems", "Q3 EHR Expansion", "280000", "Proposal Sent", "USD", "65", "2025-09-30", "2025-05-10", "Send revised SOW", "2025-05-20", "Jane Doe", "jane@meridian.com", "Budget approved Q2"],
  ["Veritas Capital Partners", "Portfolio Analytics Suite", "195000", "Negotiation", "USD", "80", "2025-08-15", "2025-05-08", "Schedule legal review", "2025-05-15", "Mark Chen", "mchen@veritas.com", ""],
];

function downloadTemplate() {
  const headers = [...REQUIRED_COLS, ...OPTIONAL_COLS];
  const rows = [headers, ...TEMPLATE_ROWS].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
  const blob = new Blob([rows], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "drift-import-template.csv"; a.click();
  URL.revokeObjectURL(url);
}

type Batch = {
  id: string; file_name: string; status: string;
  total_rows: number; successful_rows: number; failed_rows: number;
  created_at: string;
};

type ImportResult = {
  batch_id: string; status: string;
  total_rows: number; successful_rows: number; failed_rows: number;
  errors?: string[];
};

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  completed: { color: "#4ade80", bg: "rgba(34,197,94,0.1)" },
  partial:   { color: "#fbbf24", bg: "rgba(251,191,36,0.1)" },
  failed:    { color: "#f87171", bg: "rgba(239,68,68,0.1)" },
  processing:{ color: "#60a5fa", bg: "rgba(96,165,250,0.1)" },
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function DataSourcesPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(true);

  const loadBatches = useCallback(() => {
    fetch("/api/drift/import")
      .then(r => r.json())
      .then(d => setBatches(d.batches ?? []))
      .catch(() => {})
      .finally(() => setLoadingBatches(false));
  }, []);

  useEffect(() => { loadBatches(); }, [loadBatches]);

  async function handleFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setUploadError("Only .csv files are accepted.");
      return;
    }
    setUploading(true);
    setResult(null);
    setUploadError(null);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/drift/import", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setUploadError(data.error ?? "Import failed"); }
      else { setResult(data); loadBatches(); }
    } catch {
      setUploadError("Network error — could not reach import API");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  const inputStyle: React.CSSProperties = { fontFamily: "system-ui, -apple-system, sans-serif" };

  return (
    <div style={{ minHeight: "100vh", background: S.bg, fontFamily: "system-ui, -apple-system, sans-serif", color: S.text }}>

      {/* Top bar */}
      <div style={{ borderBottom: `1px solid ${S.border}`, background: "#090c17", padding: "14px 40px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(59,130,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="12" height="12" viewBox="0 0 20 20" fill="none"><path d="M4 4 L16 10 L4 16 L7 10 Z" fill="#3b82f6" /></svg>
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.02em" }}>Drift</span>
        </div>
        <span style={{ color: S.border, fontSize: 16 }}>/</span>
        <span style={{ fontSize: 13, color: S.muted }}>Data Sources</span>
        <div style={{ flex: 1 }} />
        <Link href="/admin/drift" style={{ fontSize: 12, color: S.faint, textDecoration: "none" }}>
          ← Revenue Execution
        </Link>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 40px 80px" }}>

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.4em", textTransform: "uppercase", color: S.faint, marginBottom: 6 }}>Pipeline Import</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 8px" }}>Data Sources</h1>
          <p style={{ fontSize: 14, color: S.faint, margin: 0 }}>Import your pipeline snapshot via CSV to populate the Drift scoring engine.</p>
        </div>

        {/* Upload zone */}
        <div style={{ borderRadius: 14, border: `1px solid ${S.border}`, background: S.panel, padding: 28, marginBottom: 24 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: S.text, marginBottom: 16 }}>Upload CSV</p>

          <input ref={inputRef} type="file" accept=".csv" style={{ display: "none" }} onChange={onFileChange} />

          <div
            onClick={() => { if (!uploading) { setResult(null); setUploadError(null); inputRef.current?.click(); } }}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            style={{
              border: `2px dashed ${dragging ? S.blue : "#1e2a45"}`,
              borderRadius: 10,
              padding: "40px 24px",
              textAlign: "center",
              cursor: uploading ? "not-allowed" : "pointer",
              background: dragging ? "rgba(59,130,246,0.05)" : "transparent",
              transition: "all 0.15s",
              marginBottom: 16,
            }}
          >
            {uploading ? (
              <div>
                <div style={{ width: 36, height: 36, borderRadius: "50%", border: "2px solid #1e2a45", borderTop: `2px solid ${S.blue}`, animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
                <p style={{ fontSize: 14, color: S.muted, margin: 0 }}>Importing…</p>
              </div>
            ) : (
              <>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 12 }}>
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <p style={{ fontSize: 14, fontWeight: 500, color: S.muted, margin: "0 0 4px" }}>
                  Drop your CSV here, or <span style={{ color: S.blue }}>click to browse</span>
                </p>
                <p style={{ fontSize: 12, color: S.faint, margin: 0 }}>Accepts .csv only</p>
              </>
            )}
          </div>

          {/* Result */}
          {result && (
            <div style={{ borderRadius: 8, border: result.failed_rows === 0 ? "1px solid rgba(34,197,94,0.25)" : "1px solid rgba(251,191,36,0.25)", background: result.failed_rows === 0 ? "rgba(34,197,94,0.06)" : "rgba(251,191,36,0.06)", padding: "14px 16px", marginBottom: 12 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: result.failed_rows === 0 ? "#4ade80" : "#fbbf24", margin: "0 0 4px" }}>
                {result.failed_rows === 0 ? "Import complete" : "Import partial"}
              </p>
              <p style={{ fontSize: 12, color: S.muted, margin: 0 }}>
                {result.successful_rows} rows imported, {result.failed_rows} failed · Batch {result.batch_id.slice(0, 8)}…
              </p>
              {result.errors && result.errors.length > 0 && (
                <details style={{ marginTop: 10 }}>
                  <summary style={{ fontSize: 11, color: S.faint, cursor: "pointer" }}>{result.errors.length} row error{result.errors.length !== 1 ? "s" : ""}</summary>
                  <ul style={{ marginTop: 8, padding: "8px 12px", borderRadius: 6, background: "#090c17", listStyle: "none", maxHeight: 120, overflowY: "auto" }}>
                    {result.errors.map((e, i) => <li key={i} style={{ fontSize: 11, color: "#f87171", marginBottom: 2 }}>{e}</li>)}
                  </ul>
                </details>
              )}
            </div>
          )}

          {uploadError && (
            <div style={{ borderRadius: 8, border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.06)", padding: "12px 16px", marginBottom: 12 }}>
              <p style={{ fontSize: 13, color: "#f87171", margin: 0 }}>{uploadError}</p>
            </div>
          )}

          {/* Template download */}
          <button
            onClick={downloadTemplate}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 7, border: "1px solid #1e2a45", background: "transparent", color: S.muted, fontSize: 12, fontWeight: 500, cursor: "pointer", ...inputStyle }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download template CSV
          </button>
        </div>

        {/* Column reference */}
        <div style={{ borderRadius: 14, border: `1px solid ${S.border}`, background: S.panel, padding: 28, marginBottom: 24 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: S.text, marginBottom: 16 }}>Expected columns</p>
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: "#f87171", marginBottom: 8 }}>Required</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {REQUIRED_COLS.map(c => (
                <code key={c} style={{ fontSize: 11, padding: "3px 9px", borderRadius: 5, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5", fontFamily: "monospace" }}>{c}</code>
              ))}
            </div>
          </div>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: S.faint, marginBottom: 8 }}>Optional</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {OPTIONAL_COLS.map(c => (
                <code key={c} style={{ fontSize: 11, padding: "3px 9px", borderRadius: 5, background: "rgba(255,255,255,0.04)", border: `1px solid ${S.border}`, color: S.muted, fontFamily: "monospace" }}>{c}</code>
              ))}
            </div>
          </div>
        </div>

        {/* Import history */}
        <div style={{ borderRadius: 14, border: `1px solid ${S.border}`, background: S.panel, padding: 28 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: S.text, marginBottom: 20 }}>Import history</p>

          {loadingBatches ? (
            <p style={{ fontSize: 13, color: S.faint }}>Loading…</p>
          ) : batches.length === 0 ? (
            <p style={{ fontSize: 13, color: S.faint }}>No imports yet. Upload a CSV above to get started.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${S.border}` }}>
                    {["Date", "File", "Total", "Successful", "Failed", "Status"].map(h => (
                      <th key={h} style={{ padding: "0 12px 10px 0", textAlign: "left", fontSize: 9, fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: S.faint }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {batches.map((b, i) => {
                    const st = STATUS_STYLE[b.status] ?? { color: S.muted, bg: "transparent" };
                    return (
                      <tr key={b.id} style={{ borderBottom: i < batches.length - 1 ? `1px solid ${S.border}` : "none" }}>
                        <td style={{ padding: "12px 12px 12px 0", color: S.muted, whiteSpace: "nowrap" }}>{fmt(b.created_at)}</td>
                        <td style={{ padding: "12px 12px 12px 0", color: S.text, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.file_name}</td>
                        <td style={{ padding: "12px 12px 12px 0", color: S.muted }}>{b.total_rows}</td>
                        <td style={{ padding: "12px 12px 12px 0", color: "#4ade80" }}>{b.successful_rows}</td>
                        <td style={{ padding: "12px 12px 12px 0", color: b.failed_rows > 0 ? "#f87171" : S.faint }}>{b.failed_rows}</td>
                        <td style={{ padding: "12px 12px 12px 0" }}>
                          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", padding: "3px 9px", borderRadius: 5, background: st.bg, color: st.color }}>{b.status}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
