"use client";

import { useState, useEffect, useCallback } from "react";

const C = {
  bg:           "#09091c",
  panel:        "#0e0c1f",
  panelDark:    "#0c0b1e",
  border:       "#1c1a35",
  accent:       "#00E0FF",
  accentBg:     "rgba(0,224,255,0.08)",
  accentBorder: "rgba(0,224,255,0.25)",
  text:         "#f1f5f9",
  muted:        "#94a3b8",
  faint:        "#64748b",
  red:          "#f87171",
  redBg:        "rgba(248,113,113,0.10)",
  yellow:       "#fbbf24",
  yellowBg:     "rgba(251,191,36,0.10)",
  green:        "#4ade80",
  greenBg:      "rgba(74,222,128,0.10)",
} as const;

type NoiseItem = {
  id: string;
  title: string;
  url: string | null;
  created_at: string;
  signal_processing_status: string | null;
  sources: { name: string } | null;
};

function countdown(createdAt: string): string {
  const expiresAt = new Date(new Date(createdAt).getTime() + 48 * 60 * 60 * 1000);
  const msLeft    = expiresAt.getTime() - Date.now();
  if (msLeft <= 0) return "Queued for deletion";
  const h = Math.floor(msLeft / 3_600_000);
  const m = Math.floor((msLeft % 3_600_000) / 60_000);
  return `${h}h ${m}m remaining`;
}

function countdownColor(createdAt: string): string {
  const hoursOld = (Date.now() - new Date(createdAt).getTime()) / 3_600_000;
  if (hoursOld >= 48) return C.red;
  if (hoursOld >= 36) return C.yellow;
  return C.faint;
}

const TD: React.CSSProperties = { padding: "11px 14px", verticalAlign: "middle", borderBottom: `1px solid ${C.border}` };
const btnBase: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 14px", borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "none" };

export default function NoiseCornerPage() {
  const [items,   setItems]   = useState<NoiseItem[]>([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);
  const [cleanResult, setCleanResult] = useState<{ deleted_raw_items: number; deleted_candidates: number } | null>(null);
  const [cleanError, setCleanError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/mesodma/raw-items?signal_processing_status=rejected_noise&limit=200")
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { setItems(d.items ?? []); setTotal(d.total ?? 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // Refresh countdown every minute
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const t = setInterval(() => forceUpdate(n => n + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  async function runCleanup() {
    setCleaning(true);
    setCleanResult(null);
    setCleanError(null);
    try {
      const res = await fetch("/api/mesodma/cleanup", {
        method:  "POST",
        headers: { "Authorization": "Bearer ce-mesodma-2026" },
      });
      const d = await res.json() as { deleted_raw_items?: number; deleted_candidates?: number; error?: string };
      if (!res.ok) throw new Error(d.error ?? `HTTP ${res.status}`);
      setCleanResult({ deleted_raw_items: d.deleted_raw_items ?? 0, deleted_candidates: d.deleted_candidates ?? 0 });
      load();
    } catch (e) {
      setCleanError(e instanceof Error ? e.message : String(e));
    } finally {
      setCleaning(false);
    }
  }

  const pastExpiry = items.filter(i => Date.now() - new Date(i.created_at).getTime() >= 48 * 60 * 60 * 1000);

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1200 }}>
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.5em", textTransform: "uppercase", color: C.faint, marginBottom: 4 }}>CE Admin · Mesodma</p>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: "-0.025em", margin: "0 0 4px" }}>
          Noise Corner {total > 0 && <span style={{ fontSize: 14, color: C.red, fontWeight: 700 }}>{total}</span>}
        </h1>
        <p style={{ fontSize: 12, color: C.faint, margin: 0 }}>
          Items rejected by Mesodma. Auto-deleted 48h after rejection by the daily cleanup job.
        </p>
      </div>

      {/* Cleanup panel */}
      <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, padding: "18px 22px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: C.text, margin: "0 0 3px" }}>Run Cleanup Now</p>
          <p style={{ fontSize: 11, color: C.faint, margin: 0 }}>
            Deletes noise older than 48h.
            {pastExpiry.length > 0 && (
              <span style={{ color: C.red, marginLeft: 8 }}>{pastExpiry.length} item{pastExpiry.length > 1 ? "s" : ""} past expiry.</span>
            )}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {cleanResult && (
            <span style={{ fontSize: 11, color: C.green }}>
              Deleted: {cleanResult.deleted_raw_items} raw, {cleanResult.deleted_candidates} candidates
            </span>
          )}
          {cleanError && (
            <span style={{ fontSize: 11, color: C.red }}>{cleanError}</span>
          )}
          <button
            onClick={runCleanup}
            disabled={cleaning}
            style={{ ...btnBase, background: C.redBg, color: C.red, border: `1px solid rgba(248,113,113,0.25)`, opacity: cleaning ? 0.6 : 1 }}
          >
            {cleaning ? "Cleaning…" : "Run Cleanup"}
          </button>
        </div>
      </div>

      {loading ? (
        <p style={{ color: C.faint, fontSize: 13, padding: "24px 0" }}>Loading…</p>
      ) : (
        <div style={{ borderRadius: 10, border: `1px solid ${C.border}`, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead style={{ background: C.panelDark, borderBottom: `1px solid ${C.border}` }}>
              <tr>
                {["Title", "Source", "Rejected", "Expires In"].map(h => (
                  <th key={h} style={{ padding: "9px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, letterSpacing: "0.35em", textTransform: "uppercase", color: C.faint, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: "40px 20px", textAlign: "center", color: C.faint, fontSize: 13 }}>
                    No noise items. The queue is clean.
                  </td>
                </tr>
              ) : items.map(item => (
                <tr key={item.id} style={{ background: C.panel }}>
                  <td style={{ ...TD, maxWidth: 400 }}>
                    {item.url ? (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: C.text, fontSize: 12, fontWeight: 500, textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                        {item.title}
                      </a>
                    ) : (
                      <p style={{ margin: 0, fontSize: 12, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</p>
                    )}
                  </td>
                  <td style={TD}><span style={{ fontSize: 11, color: C.muted }}>{item.sources?.name ?? "—"}</span></td>
                  <td style={TD}>
                    <span style={{ fontSize: 11, color: C.faint }}>
                      {Math.floor((Date.now() - new Date(item.created_at).getTime()) / 3_600_000)}h ago
                    </span>
                  </td>
                  <td style={TD}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: countdownColor(item.created_at) }}>
                      {countdown(item.created_at)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!loading && total > 200 && (
        <p style={{ marginTop: 10, fontSize: 11, color: C.faint }}>Showing 200 of {total} records.</p>
      )}
    </div>
  );
}
