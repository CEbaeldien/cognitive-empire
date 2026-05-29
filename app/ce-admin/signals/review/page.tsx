"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

const C = {
  bg:           "#09091c",
  panel:        "#0e0c1f",
  border:       "#1c1a35",
  accent:       "#00E0FF",
  accentBg:     "rgba(0,224,255,0.08)",
  accentBorder: "rgba(0,224,255,0.25)",
  text:         "#f1f5f9",
  muted:        "#94a3b8",
  faint:        "#64748b",
} as const;

type QueueItem = {
  signal: {
    id: string;
    title: string;
    category: string;
    subcategory: string | null;
    status: string;
    updated_at: string;
  };
  final_score: number | null;
  queue_entry: { submitted_by: string | null; submitted_at: string } | null;
};

function fmtCategory(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function ScorePill({ score }: { score: number | null }) {
  if (score === null) return <span style={{ fontSize: 11, color: C.faint }}>—</span>;
  const color = score >= 70 ? C.accent : score >= 40 ? "#fbbf24" : C.muted;
  return (
    <span style={{ fontSize: 13, fontWeight: 800, color }}>
      {score.toFixed(1)}
      <span style={{ fontSize: 10, fontWeight: 400, color: C.faint, marginLeft: 2 }}>/100</span>
    </span>
  );
}

export default function ReviewQueuePage() {
  const [items,    setItems]    = useState<QueueItem[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [fetchErr, setFetchErr] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setFetchErr(null);
    fetch("/api/signals/review-queue")
      .then((r) => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
      .then((d) => { setItems(d.items ?? []); setLoading(false); })
      .catch((e) => { setFetchErr(String(e)); setLoading(false); });
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{ padding: "28px 32px" }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.45em", textTransform: "uppercase", color: C.faint, marginBottom: 4 }}>CE Signals Admin</p>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: "-0.02em", margin: 0 }}>
          Review Queue
          {!loading && (
            <span style={{ marginLeft: 10, fontSize: 13, fontWeight: 400, color: C.faint }}>
              {items.length} pending
            </span>
          )}
        </h1>
        <p style={{ fontSize: 12, color: C.faint, marginTop: 6 }}>
          Signals awaiting human review before any publish action is available.
        </p>
      </div>

      {loading ? (
        <p style={{ color: C.faint, fontSize: 13, padding: "40px 0", textAlign: "center" }}>Loading review queue…</p>
      ) : fetchErr ? (
        <p style={{ color: "#f87171", fontSize: 13, padding: "40px 0", textAlign: "center" }}>{fetchErr}</p>
      ) : items.length === 0 ? (
        <div style={{ padding: "60px 24px", textAlign: "center", borderRadius: 12, border: `1px solid ${C.border}`, background: C.panel }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C.faint} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 14px", display: "block" }}>
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <p style={{ fontSize: 15, fontWeight: 600, color: C.muted, margin: "0 0 6px" }}>No signals pending review</p>
          <p style={{ fontSize: 12, color: C.faint, margin: 0 }}>Signals submitted for review will appear here.</p>
        </div>
      ) : (
        <div style={{ borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead style={{ background: "#0c0b1e", borderBottom: `1px solid ${C.border}` }}>
              <tr>
                {["Title", "Category", "Score", "Submitted At", "Submitted By", ""].map((h) => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, letterSpacing: "0.35em", textTransform: "uppercase", color: C.faint, whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map(({ signal, final_score, queue_entry }) => (
                <tr key={signal.id} style={{ borderBottom: `1px solid ${C.border}`, background: C.panel }}>
                  <td style={{ padding: "13px 14px", verticalAlign: "middle", maxWidth: 340 }}>
                    <span style={{ fontWeight: 600, color: C.text, fontSize: 13, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {signal.title}
                    </span>
                    {signal.subcategory && (
                      <span style={{ fontSize: 11, color: C.faint }}>{signal.subcategory}</span>
                    )}
                  </td>
                  <td style={{ padding: "13px 14px", verticalAlign: "middle" }}>
                    <span style={{ fontSize: 11, color: C.muted }}>{fmtCategory(signal.category)}</span>
                  </td>
                  <td style={{ padding: "13px 14px", verticalAlign: "middle" }}>
                    <ScorePill score={final_score} />
                  </td>
                  <td style={{ padding: "13px 14px", verticalAlign: "middle", color: C.faint, fontSize: 11, whiteSpace: "nowrap" }}>
                    {fmtDate(queue_entry?.submitted_at)}
                  </td>
                  <td style={{ padding: "13px 14px", verticalAlign: "middle", color: C.faint, fontSize: 11 }}>
                    {queue_entry?.submitted_by ?? "—"}
                  </td>
                  <td style={{ padding: "13px 14px", verticalAlign: "middle" }}>
                    <Link
                      href={`/ce-admin/signals/${signal.id}/review`}
                      style={{ padding: "6px 14px", borderRadius: 6, background: C.accentBg, border: `1px solid ${C.accentBorder}`, color: C.accent, fontSize: 11, fontWeight: 700, cursor: "pointer", textDecoration: "none", display: "inline-block", whiteSpace: "nowrap" }}
                    >
                      Open for Review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
