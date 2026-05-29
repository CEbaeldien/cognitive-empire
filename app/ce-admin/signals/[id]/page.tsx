"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { SignalRow, SignalScoreRow, SignalStatus, SignalCategory, LawId } from "@/types/signals";

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
  input:        "#0a0919",
} as const;

// ── Eight Laws — static doctrine ──────────────────────────────────────────────

type LawMeta = { id: LawId; name: string; shortDesc: string; temporalClass: string };

const EIGHT_LAWS: LawMeta[] = [
  { id: "intelligence_abundance",   name: "Intelligence Abundance",   shortDesc: "AI capability is now a commodity. The differentiator shifts upstream.",            temporalClass: "fast_moving" },
  { id: "bottleneck_migration",     name: "Bottleneck Migration",     shortDesc: "When one constraint is removed, the next one becomes visible.",                    temporalClass: "fast_moving" },
  { id: "responsibility_migration", name: "Responsibility Migration", shortDesc: "As AI executes more, accountability pressure migrates to decision-makers.",        temporalClass: "slow_burn"   },
  { id: "output_inflation",         name: "Output Inflation",         shortDesc: "Volume of AI-generated output expands faster than human capacity to evaluate it.", temporalClass: "fast_moving" },
  { id: "decision_half_life",       name: "Decision Half-Life",       shortDesc: "The useful lifespan of strategic decisions is compressing.",                       temporalClass: "classifier"  },
  { id: "escalation_preservation",  name: "Escalation Preservation",  shortDesc: "High-stakes, irreversible, and ambiguous decisions must remain human.",            temporalClass: "slow_burn"   },
  { id: "optimization_fragility",   name: "Optimization Fragility",   shortDesc: "Highly optimized systems become brittle at the edges they were not optimized for.", temporalClass: "slow_burn"  },
  { id: "human_differentiation",    name: "Human Differentiation",    shortDesc: "The value of distinctly human attributes increases as AI capability expands.",     temporalClass: "fast_moving" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const CATEGORIES: SignalCategory[] = [
  "intelligence", "physical_systems", "infrastructure", "energy",
  "science_frontier", "governance_stability", "markets_human_prosperity", "resources_continuity",
];

function fmtCategory(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
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

const TEMPORAL_COLORS: Record<string, string> = {
  fast_moving: "#00E0FF",
  slow_burn:   "#f97316",
  classifier:  "#a78bfa",
};

// ── Score state type ───────────────────────────────────────────────────────────

type LawScoreState = {
  cesm_score:      number;
  cesm_rationale:  string;
  cecm_score:      number;
  cecm_rationale:  string;
};

function defaultScoreState(): LawScoreState {
  return { cesm_score: 5, cesm_rationale: "", cecm_score: 5, cecm_rationale: "" };
}

function initScores(_loaded: SignalScoreRow[]): Record<string, LawScoreState> {
  const init: Record<string, LawScoreState> = {};
  for (const law of EIGHT_LAWS) init[law.id] = defaultScoreState();
  return init;
}

function cesic(state: LawScoreState): number {
  return Math.round((state.cesm_score * 0.6 + state.cecm_score * 0.4) * 10) / 10;
}

// ── Shared input styles ───────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "9px 12px", borderRadius: 7, border: `1px solid ${C.border}`,
  background: C.input, color: C.text, fontSize: 13, outline: "none", boxSizing: "border-box",
  fontFamily: "system-ui, -apple-system, sans-serif",
};

function Label({ text }: { text: string }) {
  return (
    <label style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.faint, marginBottom: 6 }}>
      {text}
    </label>
  );
}

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <h2 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: 0 }}>{title}</h2>
      {sub && <p style={{ fontSize: 12, color: C.faint, marginTop: 4 }}>{sub}</p>}
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ msg, type, onDismiss }: { msg: string; type: "ok" | "err"; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);
  const bg    = type === "ok" ? "rgba(34,197,94,0.12)"  : "rgba(239,68,68,0.12)";
  const color = type === "ok" ? "#4ade80"               : "#f87171";
  const bdr   = type === "ok" ? "rgba(34,197,94,0.3)"   : "rgba(239,68,68,0.3)";
  return (
    <div style={{ position: "fixed", bottom: 28, right: 28, padding: "12px 18px", borderRadius: 10, border: `1px solid ${bdr}`, background: bg, color, fontSize: 13, fontWeight: 500, zIndex: 200, boxShadow: "0 4px 20px rgba(0,0,0,0.4)", maxWidth: 360 }}>
      {msg}
    </div>
  );
}

// ── Number score input (1–10) ─────────────────────────────────────────────────

function ScoreInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <input
      type="number"
      min={1}
      max={10}
      value={value}
      onChange={(e) => {
        const n = Math.min(10, Math.max(1, parseInt(e.target.value, 10) || 1));
        onChange(n);
      }}
      style={{ width: 64, padding: "7px 10px", borderRadius: 7, border: `1px solid ${C.border}`, background: C.input, color: C.text, fontSize: 14, fontWeight: 700, outline: "none", textAlign: "center" }}
    />
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SignalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [signal,  setSignal]  = useState<SignalRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageErr, setPageErr] = useState<string | null>(null);

  // Metadata edit state
  const [editTitle,       setEditTitle]       = useState("");
  const [editCategory,    setEditCategory]    = useState<SignalCategory | "">("");
  const [editSummary,     setEditSummary]     = useState("");
  const [editImplication, setEditImplication] = useState("");
  const [savingMeta,      setSavingMeta]      = useState(false);

  // Score state — keyed by LawId
  const [scores,      setScores]      = useState<Record<string, LawScoreState>>(() => initScores([]));
  const [savingScores, setSavingScores] = useState(false);

  // Review submit
  const [submittingReview, setSubmittingReview] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  function showToast(msg: string, type: "ok" | "err") {
    setToast({ msg, type });
  }

  // ── Load signal + scores ──────────────────────────────────────────────────

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/signals/${id}`)
      .then((r) => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
      .then(({ signal: s, scores: sc }: { signal: SignalRow; scores: SignalScoreRow[] }) => {
        setSignal(s);
        setEditTitle(s.title);
        setEditCategory(s.category);
        setEditSummary(s.summary);
        setEditImplication(s.implication);
        setScores(initScores(sc));
        setLoading(false);
      })
      .catch((e) => { setPageErr(String(e)); setLoading(false); });
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // ── Save metadata ─────────────────────────────────────────────────────────

  async function handleSaveMeta() {
    if (!editCategory || !editTitle.trim() || !editSummary.trim() || !editImplication.trim()) {
      showToast("All metadata fields are required.", "err");
      return;
    }
    setSavingMeta(true);
    const res = await fetch(`/api/signals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editTitle.trim(), category: editCategory, summary: editSummary.trim(), implication: editImplication.trim() }),
    });
    setSavingMeta(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      showToast(d.error ?? `HTTP ${res.status}`, "err");
      return;
    }
    const updated = await res.json();
    setSignal(updated);
    showToast("Signal saved.", "ok");
  }

  // ── Save scores ───────────────────────────────────────────────────────────

  async function handleSaveScores() {
    const payload = EIGHT_LAWS.map((law) => ({
      law_id:         law.id,
      cesm_score:     scores[law.id].cesm_score,
      cesm_rationale: scores[law.id].cesm_rationale,
      cecm_score:     scores[law.id].cecm_score,
      cecm_rationale: scores[law.id].cecm_rationale,
    }));

    setSavingScores(true);
    const res = await fetch(`/api/signals/${id}/score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scores: payload }),
    });
    setSavingScores(false);

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      showToast(d.error ?? `HTTP ${res.status}`, "err");
      return;
    }
    showToast("Scores saved.", "ok");
  }

  // ── Submit to review ──────────────────────────────────────────────────────

  async function handleSubmitReview() {
    setSubmittingReview(true);
    const res = await fetch(`/api/signals/${id}/review`, { method: "POST" });
    setSubmittingReview(false);

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      showToast(d.error ?? `HTTP ${res.status}`, "err");
      return;
    }
    showToast("Submitted to review queue.", "ok");
    setSignal((prev) => prev ? { ...prev, status: "in_review" } : prev);
  }

  // ── Archive ───────────────────────────────────────────────────────────────

  async function handleArchive() {
    if (!confirm("Archive this signal? It will be hidden from the list but not deleted.")) return;
    const res = await fetch(`/api/signals/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/ce-admin/signals");
    else showToast("Failed to archive signal.", "err");
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return <div style={{ padding: "60px 32px", color: C.faint, fontSize: 13, textAlign: "center" }}>Loading signal…</div>;
  }

  if (pageErr || !signal) {
    return (
      <div style={{ padding: "60px 32px", textAlign: "center" }}>
        <p style={{ color: "#f87171", fontSize: 14 }}>{pageErr ?? "Signal not found."}</p>
        <Link href="/ce-admin/signals" style={{ color: C.faint, fontSize: 12, textDecoration: "none", marginTop: 12, display: "inline-block" }}>← All Signals</Link>
      </div>
    );
  }

  const canSubmitReview = signal.status !== "in_review" && signal.status !== "published" && signal.status !== "archived";

  return (
    <div style={{ padding: "28px 32px", maxWidth: 900 }}>

      {/* Breadcrumb + status */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <Link href="/ce-admin/signals" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: C.faint }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          All Signals
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <StatusBadge status={signal.status} />
          <button
            onClick={handleArchive}
            style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid rgba(239,68,68,0.25)", background: "transparent", color: "#f87171", fontSize: 11, cursor: "pointer" }}
          >
            Archive
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.45em", textTransform: "uppercase", color: C.faint, marginBottom: 4 }}>CE Signals Admin</p>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: C.text, letterSpacing: "-0.02em", margin: 0, lineHeight: 1.3 }}>{signal.title}</h1>
        <p style={{ fontSize: 11, color: C.faint, marginTop: 6 }}>
          Created {fmtDate(signal.created_at)}
          {signal.updated_at !== signal.created_at && <> · Updated {fmtDate(signal.updated_at)}</>}
        </p>
      </div>

      {/* ── SECTION 1: Metadata ─────────────────────────────────────────────── */}
      <section style={{ borderRadius: 12, border: `1px solid ${C.border}`, background: C.panel, padding: "22px 24px", marginBottom: 20 }}>
        <SectionHeader title="Signal Metadata" sub="Core fields. Edit and save before scoring." />

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Category */}
          <div>
            <Label text="Category" />
            <select
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value as SignalCategory)}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{fmtCategory(c)}</option>)}
            </select>
          </div>

          {/* Title */}
          <div>
            <Label text="Title" />
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Summary */}
          <div>
            <Label text="Summary" />
            <textarea
              value={editSummary}
              onChange={(e) => setEditSummary(e.target.value)}
              rows={4}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          {/* Implication */}
          <div>
            <Label text="Implication" />
            <textarea
              value={editImplication}
              onChange={(e) => setEditImplication(e.target.value)}
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          {/* Raw item link */}
          {signal.raw_item_id && (
            <div style={{ padding: "8px 12px", borderRadius: 7, border: `1px solid ${C.border}`, background: C.panelAlt }}>
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: C.faint, marginBottom: 3 }}>Linked Raw Item</p>
              <code style={{ fontSize: 11, color: C.muted }}>{signal.raw_item_id}</code>
            </div>
          )}

          <div>
            <button
              onClick={handleSaveMeta}
              disabled={savingMeta}
              style={{ padding: "9px 20px", borderRadius: 7, background: C.accent, border: "none", color: "#000", fontSize: 13, fontWeight: 700, cursor: savingMeta ? "not-allowed" : "pointer", opacity: savingMeta ? 0.6 : 1 }}
            >
              {savingMeta ? "Saving…" : "Save Metadata"}
            </button>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: CESIC Scoring ─────────────────────────────────────────── */}
      <section style={{ borderRadius: 12, border: `1px solid ${C.border}`, background: C.panel, padding: "22px 24px", marginBottom: 20 }}>
        <SectionHeader
          title="CESIC Scoring"
          sub="Score this signal against all Eight Laws. CESM (signal magnitude) and CECM (convergence magnitude), 1–10 each. CESIC = (CESM × 0.6) + (CECM × 0.4)."
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {EIGHT_LAWS.map((law, i) => {
            const state  = scores[law.id] ?? defaultScoreState();
            const score  = cesic(state);
            const tColor = TEMPORAL_COLORS[law.temporalClass] ?? C.faint;

            return (
              <div key={law.id} style={{ borderRadius: 10, border: `1px solid ${C.border}`, background: C.panelAlt, overflow: "hidden" }}>

                {/* Law header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: `1px solid ${C.border}`, background: "#0c0b1e" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: C.faint, minWidth: 18 }}>L{i + 1}</span>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: 0 }}>{law.name}</p>
                      <p style={{ fontSize: 11, color: C.faint, margin: "2px 0 0" }}>{law.shortDesc}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0, marginLeft: 16 }}>
                    <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: tColor, padding: "2px 7px", borderRadius: 4, border: `1px solid ${tColor}44`, background: `${tColor}11` }}>
                      {law.temporalClass.replace("_", " ")}
                    </span>
                    {/* Live CESIC */}
                    <div style={{ textAlign: "center", minWidth: 64, padding: "6px 10px", borderRadius: 7, background: score >= 7 ? "rgba(0,224,255,0.12)" : score >= 4 ? "rgba(251,191,36,0.1)" : "rgba(100,116,139,0.1)", border: `1px solid ${score >= 7 ? C.accentBorder : score >= 4 ? "rgba(251,191,36,0.25)" : C.border}` }}>
                      <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: C.faint, margin: "0 0 2px" }}>CESIC</p>
                      <p style={{ fontSize: 17, fontWeight: 800, color: score >= 7 ? C.accent : score >= 4 ? "#fbbf24" : C.muted, margin: 0, lineHeight: 1 }}>{score.toFixed(1)}</p>
                    </div>
                  </div>
                </div>

                {/* Score inputs */}
                <div style={{ padding: "14px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

                  {/* CESM */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <Label text="CESM" />
                      <ScoreInput
                        value={state.cesm_score}
                        onChange={(n) => setScores((prev) => ({ ...prev, [law.id]: { ...prev[law.id], cesm_score: n } }))}
                      />
                      <span style={{ fontSize: 10, color: C.faint }}>/ 10</span>
                    </div>
                    <textarea
                      value={state.cesm_rationale}
                      onChange={(e) => setScores((prev) => ({ ...prev, [law.id]: { ...prev[law.id], cesm_rationale: e.target.value } }))}
                      placeholder="Signal magnitude rationale — why this score?"
                      rows={2}
                      style={{ ...inputStyle, fontSize: 12, resize: "vertical" }}
                    />
                  </div>

                  {/* CECM */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <Label text="CECM" />
                      <ScoreInput
                        value={state.cecm_score}
                        onChange={(n) => setScores((prev) => ({ ...prev, [law.id]: { ...prev[law.id], cecm_score: n } }))}
                      />
                      <span style={{ fontSize: 10, color: C.faint }}>/ 10</span>
                    </div>
                    <textarea
                      value={state.cecm_rationale}
                      onChange={(e) => setScores((prev) => ({ ...prev, [law.id]: { ...prev[law.id], cecm_rationale: e.target.value } }))}
                      placeholder="Convergence magnitude rationale — alignment with other signals?"
                      rows={2}
                      style={{ ...inputStyle, fontSize: 12, resize: "vertical" }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Save scores button */}
        <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={handleSaveScores}
            disabled={savingScores}
            style={{ padding: "9px 20px", borderRadius: 7, background: C.accent, border: "none", color: "#000", fontSize: 13, fontWeight: 700, cursor: savingScores ? "not-allowed" : "pointer", opacity: savingScores ? 0.6 : 1 }}
          >
            {savingScores ? "Saving scores…" : "Save All Scores"}
          </button>
          <span style={{ fontSize: 11, color: C.faint }}>All 8 laws saved together.</span>
        </div>
      </section>

      {/* ── SECTION 3: Review Queue ──────────────────────────────────────────── */}
      <section style={{ borderRadius: 12, border: canSubmitReview ? `1px solid ${C.accentBorder}` : `1px solid ${C.border}`, background: C.panel, padding: "22px 24px", marginBottom: 20 }}>
        <SectionHeader
          title="Submit to Review"
          sub="Signals must pass human review before any publish action is available. Once submitted, the signal is locked in 'in_review' status."
        />

        {signal.status === "in_review" && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 8, border: "1px solid rgba(251,191,36,0.3)", background: "rgba(251,191,36,0.08)" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p style={{ fontSize: 13, color: "#fbbf24", margin: 0 }}>This signal is currently in the review queue. Awaiting reviewer action.</p>
          </div>
        )}

        {signal.status === "published" && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 8, border: "1px solid rgba(34,197,94,0.3)", background: "rgba(34,197,94,0.08)" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <p style={{ fontSize: 13, color: "#4ade80", margin: 0 }}>This signal is published. No further review actions are available here.</p>
          </div>
        )}

        {canSubmitReview && (
          <div>
            {signal.status === "rejected" && (
              <p style={{ fontSize: 12, color: "#f87171", marginBottom: 14 }}>
                This signal was previously rejected. Review revision_notes below and update the signal before resubmitting.
              </p>
            )}
            {signal.revision_notes && (
              <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 7, border: "1px solid rgba(251,191,36,0.2)", background: "rgba(251,191,36,0.06)" }}>
                <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#fbbf24", marginBottom: 4 }}>Revision Notes from Reviewer</p>
                <p style={{ fontSize: 13, color: C.muted }}>{signal.revision_notes}</p>
              </div>
            )}
            <button
              onClick={handleSubmitReview}
              disabled={submittingReview}
              style={{ padding: "10px 24px", borderRadius: 8, background: C.accentBg, border: `1px solid ${C.accentBorder}`, color: C.accent, fontSize: 13, fontWeight: 700, cursor: submittingReview ? "not-allowed" : "pointer", opacity: submittingReview ? 0.6 : 1 }}
            >
              {submittingReview ? "Submitting…" : signal.status === "rejected" ? "Resubmit for Review" : "Submit to Review Queue"}
            </button>
            <p style={{ fontSize: 11, color: C.faint, marginTop: 8 }}>
              This will set status to <strong style={{ color: "#fbbf24" }}>in_review</strong> and create a review_queue entry. No publish path exists in this panel.
            </p>
          </div>
        )}
      </section>

      {toast && (
        <Toast msg={toast.msg} type={toast.type} onDismiss={() => setToast(null)} />
      )}
    </div>
  );
}
