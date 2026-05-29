"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { SignalRow, SignalScoreRow, SignalStatus } from "@/types/signals";

// ── Palette ───────────────────────────────────────────────────────────────────

const C = {
  bg:           "#09091c",
  panel:        "#0e0c1f",
  panelAlt:     "#0b0a1e",
  border:       "#1c1a35",
  accent:       "#00E0FF",
  accentBg:     "rgba(0,224,255,0.08)",
  accentBorder: "rgba(0,224,255,0.25)",
  text:         "#f1f5f9",
  muted:        "#94a3b8",
  faint:        "#64748b",
} as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function computeFinalScore(s: SignalScoreRow): number {
  const w =
    s.strength              * 1.5 +
    s.weight                * 1.2 +
    s.longevity             * 1.0 +
    s.convergence_potential * 1.3 +
    s.governance_impact     * 1.0 +
    s.continuity_pressure   * 1.1 +
    s.prosperity_relevance  * 1.0 +
    s.structural_relevance  * 1.4;
  return Math.round((w / 9.5) * s.confidence * 10 * 10) / 10;
}

const STATUS_COLORS: Record<SignalStatus, [string, string]> = {
  draft:     ["rgba(100,116,139,0.12)", "#94a3b8"],
  in_review: ["rgba(251,191,36,0.12)",  "#fbbf24"],
  watching:  ["rgba(139,92,246,0.12)",  "#a78bfa"],
  decaying:  ["rgba(249,115,22,0.12)",  "#fb923c"],
  approved:  ["rgba(0,224,255,0.12)",   "#00E0FF"],
  published: ["rgba(34,197,94,0.12)",   "#4ade80"],
  rejected:  ["rgba(239,68,68,0.12)",   "#f87171"],
  archived:  ["rgba(51,65,85,0.2)",     "#475569"],
};

function StatusBadge({ status }: { status: SignalStatus }) {
  const [bg, color] = STATUS_COLORS[status] ?? ["rgba(100,116,139,0.12)", "#94a3b8"];
  return (
    <span style={{ padding: "4px 12px", borderRadius: 7, background: bg, color, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
      {status.replace("_", " ")}
    </span>
  );
}

function Toast({ msg, type, onDismiss }: { msg: string; type: "ok" | "err"; onDismiss: () => void }) {
  useEffect(() => { const t = setTimeout(onDismiss, 4000); return () => clearTimeout(t); }, [onDismiss]);
  const bg    = type === "ok" ? "rgba(34,197,94,0.12)"  : "rgba(239,68,68,0.12)";
  const color = type === "ok" ? "#4ade80"               : "#f87171";
  const bdr   = type === "ok" ? "rgba(34,197,94,0.3)"   : "rgba(239,68,68,0.3)";
  return (
    <div style={{ position: "fixed", bottom: 28, right: 28, padding: "12px 18px", borderRadius: 10, border: `1px solid ${bdr}`, background: bg, color, fontSize: 13, fontWeight: 500, zIndex: 200, boxShadow: "0 4px 20px rgba(0,0,0,0.4)", maxWidth: 360 }}>
      {msg}
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.faint, margin: "0 0 6px" }}>{label}</p>
      <div style={{ fontSize: 13, color: value ? C.text : C.faint, lineHeight: 1.6 }}>
        {value || "—"}
      </div>
    </div>
  );
}

function TagList({ tags }: { tags: string[] }) {
  if (!tags.length) return <span style={{ fontSize: 12, color: C.faint }}>None</span>;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {tags.map((t) => (
        <span key={t} style={{ padding: "4px 11px", borderRadius: 6, background: C.accentBg, border: `1px solid ${C.accentBorder}`, color: C.accent, fontSize: 11, fontWeight: 600 }}>
          {t}
        </span>
      ))}
    </div>
  );
}

// ── Score dimension definitions ───────────────────────────────────────────────

const SCORE_FIELDS: { key: keyof SignalScoreRow; label: string }[] = [
  { key: "strength",              label: "Strength" },
  { key: "weight",                label: "Weight" },
  { key: "longevity",             label: "Longevity" },
  { key: "convergence_potential", label: "Convergence Potential" },
  { key: "governance_impact",     label: "Governance Impact" },
  { key: "continuity_pressure",   label: "Continuity Pressure" },
  { key: "prosperity_relevance",  label: "Prosperity Relevance" },
  { key: "structural_relevance",  label: "Structural Relevance" },
  { key: "decay_factor",          label: "Decay Factor" },
];

// ── Main ──────────────────────────────────────────────────────────────────────

type Vector = { id: string; name: string };

export default function SignalReviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [signal,   setSignal]   = useState<SignalRow | null>(null);
  const [score,    setScore]    = useState<SignalScoreRow | null>(null);
  const [pvMap,    setPvMap]    = useState<Map<string, string>>(new Map());
  const [dvMap,    setDvMap]    = useState<Map<string, string>>(new Map());
  const [pvIds,    setPvIds]    = useState<string[]>([]);
  const [dvIds,    setDvIds]    = useState<string[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [pageErr,  setPageErr]  = useState<string | null>(null);

  // Action state
  const [acting,           setActing]           = useState(false);
  const [showRevisionBox,  setShowRevisionBox]  = useState(false);
  const [revisionNotes,    setRevisionNotes]    = useState("");
  const [showRejectPrompt, setShowRejectPrompt] = useState(false);
  const [toast,            setToast]            = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  function showToast(msg: string, type: "ok" | "err") { setToast({ msg, type }); }

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/signals/${id}`).then((r) => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`)),
      fetch("/api/signals/pressure-vectors").then((r) => r.ok ? r.json() : { vectors: [] }),
      fetch("/api/signals/doctrine-vectors").then((r) => r.ok ? r.json() : { vectors: [] }),
    ])
      .then(([detail, pvData, dvData]) => {
        setSignal(detail.signal);
        setScore(detail.score ?? null);
        setPvIds(detail.pressure_vector_ids ?? []);
        setDvIds(detail.doctrine_vector_ids ?? []);
        setPvMap(new Map((pvData.vectors as Vector[]).map((v) => [v.id, v.name])));
        setDvMap(new Map((dvData.vectors as Vector[]).map((v) => [v.id, v.name])));
        setLoading(false);
      })
      .catch((e) => { setPageErr(String(e)); setLoading(false); });
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function doAction(action: string, notes?: string) {
    setActing(true);
    const res = await fetch(`/api/signals/${id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, notes }),
    });
    setActing(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      showToast(d.error ?? `HTTP ${res.status}`, "err");
      return;
    }
    const data = await res.json();
    const newStatus = data.status as SignalStatus;
    setSignal((prev) => prev ? { ...prev, status: newStatus } : prev);
    setShowRevisionBox(false);
    setShowRejectPrompt(false);
    if (action === "approve")           showToast("Signal approved.", "ok");
    if (action === "reject")            showToast("Signal rejected.", "ok");
    if (action === "request_revision")  showToast("Revision requested. Signal returned to draft.", "ok");
    if (action === "publish")           showToast("Signal published.", "ok");
  }

  // ── Guards ────────────────────────────────────────────────────────────────

  if (loading) {
    return <div style={{ padding: "60px 32px", color: C.faint, fontSize: 13, textAlign: "center" }}>Loading signal…</div>;
  }
  if (pageErr || !signal) {
    return (
      <div style={{ padding: "60px 32px", textAlign: "center" }}>
        <p style={{ color: "#f87171", fontSize: 14 }}>{pageErr ?? "Signal not found."}</p>
        <Link href="/ce-admin/signals/review" style={{ color: C.faint, fontSize: 12, textDecoration: "none", marginTop: 12, display: "inline-block" }}>← Review Queue</Link>
      </div>
    );
  }

  const impactTags = typeof signal.impact_layer === "string" && signal.impact_layer
    ? signal.impact_layer.split(", ").filter(Boolean)
    : [];
  const pvNames = pvIds.map((vid) => pvMap.get(vid) ?? vid);
  const dvNames = dvIds.map((did) => dvMap.get(did) ?? did);

  const finalScore = score ? computeFinalScore(score) : null;
  const scoreColor = finalScore == null ? C.faint : finalScore >= 70 ? C.accent : finalScore >= 40 ? "#fbbf24" : C.muted;

  const isInReview = signal.status === "in_review";
  const isApproved = signal.status === "approved";

  const sectionStyle: React.CSSProperties = {
    borderRadius: 12, border: `1px solid ${C.border}`, background: C.panel,
    padding: "22px 24px", marginBottom: 16,
  };

  return (
    <div style={{ padding: "28px 32px", maxWidth: 900 }}>

      {/* Breadcrumb + status */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <Link href="/ce-admin/signals/review" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: C.faint }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          Review Queue
        </Link>
        <StatusBadge status={signal.status} />
      </div>

      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.45em", textTransform: "uppercase", color: C.faint, marginBottom: 4 }}>Signal Review</p>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: C.text, letterSpacing: "-0.02em", margin: 0, lineHeight: 1.3 }}>{signal.title}</h1>
        <p style={{ fontSize: 11, color: C.faint, marginTop: 6 }}>
          {fmtCategory(signal.category)}{signal.subcategory ? ` · ${signal.subcategory}` : ""}
          {" · "}Updated {fmtDate(signal.updated_at)}
        </p>
      </div>

      {/* ── Core Content ──────────────────────────────────────────────────── */}
      <section style={sectionStyle}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.faint, margin: "0 0 18px" }}>Core Content</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Field label="Summary" value={signal.summary} />
          <Field label="Implication" value={signal.implication} />
        </div>
      </section>

      {/* ── Structural Analysis ───────────────────────────────────────────── */}
      <section style={sectionStyle}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.faint, margin: "0 0 18px" }}>Structural Analysis</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="What Changed"         value={signal.what_changed} />
          <Field label="Why It Matters"       value={signal.why_it_matters} />
          <Field label="Structural Relevance" value={signal.structural_relevance} />
          <Field label="Second Order Effect"  value={signal.second_order_effect} />
        </div>
      </section>

      {/* ── Tags ──────────────────────────────────────────────────────────── */}
      <section style={sectionStyle}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.faint, margin: "0 0 18px" }}>Tags & Vectors</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.faint, margin: "0 0 8px" }}>Impact Layer</p>
            <TagList tags={impactTags} />
          </div>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.faint, margin: "0 0 8px" }}>Pressure Vectors</p>
            <TagList tags={pvNames} />
          </div>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.faint, margin: "0 0 8px" }}>Doctrine Vectors</p>
            <TagList tags={dvNames} />
          </div>
        </div>
      </section>

      {/* ── Signal Score ──────────────────────────────────────────────────── */}
      <section style={sectionStyle}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.faint, margin: 0 }}>Signal Score</p>
          {finalScore != null && (
            <div style={{ textAlign: "right", padding: "8px 16px", borderRadius: 9, border: `1px solid ${scoreColor}44`, background: `${scoreColor}11` }}>
              <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.faint, margin: "0 0 1px" }}>Final Score</p>
              <p style={{ fontSize: 26, fontWeight: 800, color: scoreColor, margin: 0, lineHeight: 1 }}>{finalScore.toFixed(1)}</p>
              <p style={{ fontSize: 9, color: C.faint, margin: "1px 0 0" }}>/ 100</p>
            </div>
          )}
          {finalScore == null && <span style={{ fontSize: 12, color: C.faint }}>No score recorded</span>}
        </div>

        {score && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 14 }}>
              {SCORE_FIELDS.map(({ key, label }) => (
                <div key={key} style={{ padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.panelAlt }}>
                  <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.faint, margin: "0 0 6px" }}>{label}</p>
                  <p style={{ fontSize: 18, fontWeight: 800, color: C.text, margin: 0 }}>{String(score[key])}</p>
                  <p style={{ fontSize: 9, color: C.faint, margin: 0 }}>/ 10</p>
                </div>
              ))}
              <div style={{ padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.panelAlt }}>
                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.faint, margin: "0 0 6px" }}>Confidence</p>
                <p style={{ fontSize: 18, fontWeight: 800, color: C.text, margin: 0 }}>{Math.round(score.confidence * 100)}%</p>
              </div>
            </div>
            {score.scoring_notes && (
              <div style={{ padding: "10px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.panelAlt }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.faint, margin: "0 0 4px" }}>Scoring Notes</p>
                <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>{score.scoring_notes}</p>
              </div>
            )}
          </>
        )}
      </section>

      {/* ── Source ────────────────────────────────────────────────────────── */}
      {signal.raw_item_id && (
        <section style={sectionStyle}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.faint, margin: "0 0 8px" }}>Source</p>
          <code style={{ fontSize: 11, color: C.muted }}>raw_item: {signal.raw_item_id}</code>
        </section>
      )}

      {/* ── Review Actions ────────────────────────────────────────────────── */}
      <section style={{ borderRadius: 12, border: `1px solid ${isInReview ? C.accentBorder : isApproved ? "rgba(34,197,94,0.3)" : C.border}`, background: C.panel, padding: "22px 24px", marginBottom: 20 }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.faint, margin: "0 0 18px" }}>Review Actions</p>

        {/* Publish (approved only) */}
        {isApproved && (
          <div style={{ marginBottom: 20, padding: "16px 18px", borderRadius: 9, border: "1px solid rgba(34,197,94,0.3)", background: "rgba(34,197,94,0.06)" }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#4ade80", margin: "0 0 4px" }}>Ready to publish</p>
            <p style={{ fontSize: 12, color: C.faint, margin: "0 0 14px" }}>This signal has been approved. Publish makes it live on the public signals feed.</p>
            <button
              onClick={() => doAction("publish")}
              disabled={acting}
              style={{ padding: "10px 24px", borderRadius: 8, background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.4)", color: "#4ade80", fontSize: 13, fontWeight: 700, cursor: acting ? "not-allowed" : "pointer", opacity: acting ? 0.6 : 1 }}
            >
              {acting ? "Publishing…" : "Publish Signal"}
            </button>
          </div>
        )}

        {/* Approve / Request Revision / Reject (in_review only) */}
        {isInReview && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                onClick={() => doAction("approve")}
                disabled={acting}
                style={{ padding: "10px 22px", borderRadius: 8, background: C.accentBg, border: `1px solid ${C.accentBorder}`, color: C.accent, fontSize: 13, fontWeight: 700, cursor: acting ? "not-allowed" : "pointer", opacity: acting ? 0.6 : 1 }}
              >
                {acting ? "…" : "Approve"}
              </button>

              <button
                onClick={() => { setShowRevisionBox((v) => !v); setShowRejectPrompt(false); }}
                disabled={acting}
                style={{ padding: "10px 22px", borderRadius: 8, background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.3)", color: "#fbbf24", fontSize: 13, fontWeight: 700, cursor: acting ? "not-allowed" : "pointer", opacity: acting ? 0.6 : 1 }}
              >
                Request Revision
              </button>

              <button
                onClick={() => { setShowRejectPrompt((v) => !v); setShowRevisionBox(false); }}
                disabled={acting}
                style={{ padding: "10px 22px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171", fontSize: 13, fontWeight: 700, cursor: acting ? "not-allowed" : "pointer", opacity: acting ? 0.6 : 1 }}
              >
                Reject
              </button>
            </div>

            {/* Revision notes inline */}
            {showRevisionBox && (
              <div style={{ padding: "14px 16px", borderRadius: 9, border: "1px solid rgba(251,191,36,0.25)", background: "rgba(251,191,36,0.05)" }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: "#fbbf24", margin: "0 0 10px", letterSpacing: "0.04em" }}>Revision notes for the author</p>
                <textarea
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  rows={3}
                  placeholder="Describe what needs to change before this can be approved…"
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 7, border: "1px solid rgba(251,191,36,0.25)", background: "#0a0919", color: C.text, fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "system-ui, -apple-system, sans-serif" }}
                />
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button
                    onClick={() => doAction("request_revision", revisionNotes)}
                    disabled={acting || !revisionNotes.trim()}
                    style={{ padding: "8px 18px", borderRadius: 7, background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.4)", color: "#fbbf24", fontSize: 12, fontWeight: 700, cursor: (acting || !revisionNotes.trim()) ? "not-allowed" : "pointer", opacity: (acting || !revisionNotes.trim()) ? 0.5 : 1 }}
                  >
                    {acting ? "Sending…" : "Send Revision Request"}
                  </button>
                  <button
                    onClick={() => setShowRevisionBox(false)}
                    style={{ padding: "8px 14px", borderRadius: 7, background: "transparent", border: `1px solid ${C.border}`, color: C.faint, fontSize: 12, cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Reject confirmation inline */}
            {showRejectPrompt && (
              <div style={{ padding: "14px 16px", borderRadius: 9, border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.06)" }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#f87171", margin: "0 0 6px" }}>Reject this signal?</p>
                <p style={{ fontSize: 12, color: C.faint, margin: "0 0 12px" }}>Status will be set to <strong style={{ color: "#f87171" }}>rejected</strong>. The signal will not be deleted and can be resubmitted after revision.</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => doAction("reject")}
                    disabled={acting}
                    style={{ padding: "8px 18px", borderRadius: 7, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", color: "#f87171", fontSize: 12, fontWeight: 700, cursor: acting ? "not-allowed" : "pointer", opacity: acting ? 0.6 : 1 }}
                  >
                    {acting ? "Rejecting…" : "Confirm Reject"}
                  </button>
                  <button
                    onClick={() => setShowRejectPrompt(false)}
                    style={{ padding: "8px 14px", borderRadius: 7, background: "transparent", border: `1px solid ${C.border}`, color: C.faint, fontSize: 12, cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Published state */}
        {signal.status === "published" && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 8, border: "1px solid rgba(34,197,94,0.3)", background: "rgba(34,197,94,0.07)" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            <p style={{ fontSize: 13, color: "#4ade80", margin: 0 }}>Published{signal.published_at ? ` on ${fmtDate(signal.published_at)}` : ""}. No further review actions available.</p>
          </div>
        )}

        {/* Rejected / draft with no active action */}
        {(signal.status === "rejected" || signal.status === "draft") && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.panelAlt }}>
            <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>
              This signal is <strong>{signal.status}</strong>. Review actions are only available when status is <strong>in_review</strong>.{" "}
              <Link href={`/ce-admin/signals/${id}`} style={{ color: C.accent, textDecoration: "none" }}>Edit signal →</Link>
            </p>
          </div>
        )}
      </section>

      {toast && <Toast msg={toast.msg} type={toast.type} onDismiss={() => setToast(null)} />}
    </div>
  );
}
