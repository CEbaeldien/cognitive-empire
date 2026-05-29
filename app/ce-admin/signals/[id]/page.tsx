"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { SignalRow, SignalScoreRow, SignalStatus, SignalCategory } from "@/types/signals";

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

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES: SignalCategory[] = [
  "intelligence", "physical_systems", "infrastructure", "energy",
  "science_frontier", "governance_stability", "markets_human_prosperity", "resources_continuity",
];

const IMPACT_LAYER_OPTIONS = [
  "Founder", "Operator", "Creator", "Builder", "Investor",
  "Governance", "Infrastructure", "Market", "Prosperity", "Continuity",
];

// ── Score types ───────────────────────────────────────────────────────────────

type ScoreState = {
  strength:              number;
  weight:                number;
  longevity:             number;
  convergence_potential: number;
  decay_factor:          number;
  governance_impact:     number;
  continuity_pressure:   number;
  prosperity_relevance:  number;
  structural_relevance:  number;
  confidence:            number;
  scoring_notes:         string;
};

const DEFAULT_SCORE: ScoreState = {
  strength: 5, weight: 5, longevity: 5,
  convergence_potential: 5, decay_factor: 5,
  governance_impact: 5, continuity_pressure: 5,
  prosperity_relevance: 5, structural_relevance: 5,
  confidence: 0.7, scoring_notes: "",
};

type ScoreFieldDef = {
  key: Exclude<keyof ScoreState, "confidence" | "scoring_notes">;
  label: string;
};

const SCORE_FIELDS: ScoreFieldDef[] = [
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

function scoreFromRow(row: SignalScoreRow): ScoreState {
  return {
    strength:              row.strength,
    weight:                row.weight,
    longevity:             row.longevity,
    convergence_potential: row.convergence_potential,
    decay_factor:          row.decay_factor,
    governance_impact:     row.governance_impact,
    continuity_pressure:   row.continuity_pressure,
    prosperity_relevance:  row.prosperity_relevance,
    structural_relevance:  row.structural_relevance,
    confidence:            row.confidence,
    scoring_notes:         row.scoring_notes ?? "",
  };
}

function computeFinalScore(s: ScoreState): number {
  const weighted =
    s.strength              * 1.5 +
    s.weight                * 1.2 +
    s.longevity             * 1.0 +
    s.convergence_potential * 1.3 +
    s.governance_impact     * 1.0 +
    s.continuity_pressure   * 1.1 +
    s.prosperity_relevance  * 1.0 +
    s.structural_relevance  * 1.4;
  return Math.round((weighted / 9.5) * s.confidence * 10 * 10) / 10;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtCategory(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ── Status colours ────────────────────────────────────────────────────────────

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

// ── UI primitives ─────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "9px 12px", borderRadius: 7, border: `1px solid ${C.border}`,
  background: C.input, color: C.text, fontSize: 13, outline: "none", boxSizing: "border-box",
  fontFamily: "system-ui, -apple-system, sans-serif",
};

function Label({ text, hint }: { text: string; hint?: string }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <label style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.faint }}>
        {text}
      </label>
      {hint && <p style={{ fontSize: 11, color: C.faint, marginTop: 2 }}>{hint}</p>}
    </div>
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

function StatusBadge({ status }: { status: SignalStatus }) {
  const [bg, color] = STATUS_COLORS[status] ?? ["rgba(100,116,139,0.12)", "#94a3b8"];
  return (
    <span style={{ padding: "4px 12px", borderRadius: 7, background: bg, color, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
      {status.replace("_", " ")}
    </span>
  );
}

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

function NumInput({ value, onChange, min = 1, max = 10, step = 1 }: {
  value: number; onChange: (n: number) => void; min?: number; max?: number; step?: number;
}) {
  return (
    <input
      type="number"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => {
        const n = Math.min(max, Math.max(min, parseFloat(e.target.value) || min));
        onChange(n);
      }}
      style={{ width: 72, padding: "7px 10px", borderRadius: 7, border: `1px solid ${C.border}`, background: C.input, color: C.text, fontSize: 14, fontWeight: 700, outline: "none", textAlign: "center" }}
    />
  );
}

function TagGrid({ options, selected, onToggle }: {
  options: { id: string; name: string }[];
  selected: Set<string>;
  onToggle: (id: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
      {options.map((opt) => {
        const on = selected.has(opt.id);
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onToggle(opt.id)}
            style={{
              padding: "5px 13px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 600,
              border: `1px solid ${on ? C.accentBorder : C.border}`,
              background: on ? C.accentBg : "transparent",
              color: on ? C.accent : C.faint,
            }}
          >
            {opt.name}
          </button>
        );
      })}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

type Vector = { id: string; name: string };

export default function SignalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [signal,  setSignal]  = useState<SignalRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageErr, setPageErr] = useState<string | null>(null);

  // Metadata edit state
  const [editTitle,               setEditTitle]               = useState("");
  const [editCategory,            setEditCategory]            = useState<SignalCategory | "">("");
  const [editSubcategory,         setEditSubcategory]         = useState("");
  const [editSummary,             setEditSummary]             = useState("");
  const [editImplication,         setEditImplication]         = useState("");
  const [editWhatChanged,         setEditWhatChanged]         = useState("");
  const [editWhyItMatters,        setEditWhyItMatters]        = useState("");
  const [editStructuralRelevance, setEditStructuralRelevance] = useState("");
  const [editSecondOrderEffect,   setEditSecondOrderEffect]   = useState("");
  const [editImpactLayer,         setEditImpactLayer]         = useState<Set<string>>(new Set());

  // Tag vectors
  const [pressureVectors,   setPressureVectors]   = useState<Vector[]>([]);
  const [doctrineVectors,   setDoctrineVectors]   = useState<Vector[]>([]);
  const [pvSelected,        setPvSelected]        = useState<Set<string>>(new Set());
  const [dvSelected,        setDvSelected]        = useState<Set<string>>(new Set());

  // Score state
  const [score,       setScore]       = useState<ScoreState>(DEFAULT_SCORE);
  const [savingScore, setSavingScore] = useState(false);

  // Actions
  const [savingMeta,       setSavingMeta]       = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [toast,            setToast]            = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  function showToast(msg: string, type: "ok" | "err") { setToast({ msg, type }); }

  // ── Load ──────────────────────────────────────────────────────────────────

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/signals/${id}`).then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`)),
      fetch("/api/signals/pressure-vectors").then(r => r.ok ? r.json() : { vectors: [] }),
      fetch("/api/signals/doctrine-vectors").then(r => r.ok ? r.json() : { vectors: [] }),
    ])
      .then(([detail, pvData, dvData]) => {
        const { signal: s, score: sc, pressure_vector_ids, doctrine_vector_ids } = detail;
        setSignal(s);
        setEditTitle(s.title);
        setEditCategory(s.category);
        setEditSubcategory(s.subcategory ?? "");
        setEditSummary(s.summary);
        setEditImplication(s.implication);
        setEditWhatChanged(s.what_changed ?? "");
        setEditWhyItMatters(s.why_it_matters ?? "");
        setEditStructuralRelevance(s.structural_relevance ?? "");
        setEditSecondOrderEffect(s.second_order_effect ?? "");
        setEditImpactLayer(new Set(
          typeof s.impact_layer === "string" && s.impact_layer
            ? s.impact_layer.split(", ").filter(Boolean)
            : []
        ));
        if (sc) setScore(scoreFromRow(sc));
        setPvSelected(new Set(pressure_vector_ids ?? []));
        setDvSelected(new Set(doctrine_vector_ids ?? []));
        setPressureVectors(pvData.vectors ?? []);
        setDoctrineVectors(dvData.vectors ?? []);
        setLoading(false);
      })
      .catch((e) => { setPageErr(String(e)); setLoading(false); });
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function handleSaveMeta() {
    if (!editCategory || !editTitle.trim() || !editSummary.trim() || !editImplication.trim()) {
      showToast("Category, title, summary, and implication are required.", "err");
      return;
    }
    setSavingMeta(true);
    const res = await fetch(`/api/signals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title:                editTitle.trim(),
        category:             editCategory,
        subcategory:          editSubcategory.trim() || null,
        summary:              editSummary.trim(),
        implication:          editImplication.trim(),
        what_changed:         editWhatChanged.trim() || null,
        why_it_matters:       editWhyItMatters.trim() || null,
        structural_relevance: editStructuralRelevance.trim() || null,
        second_order_effect:  editSecondOrderEffect.trim() || null,
        impact_layer:         editImpactLayer.size > 0 ? [...editImpactLayer].join(", ") : null,
        pressure_vector_ids:  [...pvSelected],
        doctrine_vector_ids:  [...dvSelected],
      }),
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

  async function handleSaveScore() {
    setSavingScore(true);
    const res = await fetch(`/api/signals/${id}/score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score }),
    });
    setSavingScore(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      showToast(d.error ?? `HTTP ${res.status}`, "err");
      return;
    }
    showToast("Score saved.", "ok");
  }

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

  async function handleArchive() {
    if (!confirm("Archive this signal? It will be hidden from the list but not deleted.")) return;
    const res = await fetch(`/api/signals/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/ce-admin/signals");
    else showToast("Failed to archive signal.", "err");
  }

  function toggleImpact(opt: string) {
    setEditImpactLayer(prev => { const n = new Set(prev); n.has(opt) ? n.delete(opt) : n.add(opt); return n; });
  }
  function togglePv(vid: string) {
    setPvSelected(prev => { const n = new Set(prev); n.has(vid) ? n.delete(vid) : n.add(vid); return n; });
  }
  function toggleDv(did: string) {
    setDvSelected(prev => { const n = new Set(prev); n.has(did) ? n.delete(did) : n.add(did); return n; });
  }
  function updateScore<K extends keyof ScoreState>(key: K, val: ScoreState[K]) {
    setScore(prev => ({ ...prev, [key]: val }));
  }

  // ── Render guards ─────────────────────────────────────────────────────────

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
  const finalScore = computeFinalScore(score);
  const scoreColor = finalScore >= 70 ? C.accent : finalScore >= 40 ? "#fbbf24" : C.muted;

  // ── Render ────────────────────────────────────────────────────────────────

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

      {/* ── SECTION 1: Core Metadata ───────────────────────────────────────── */}
      <section style={{ borderRadius: 12, border: `1px solid ${C.border}`, background: C.panel, padding: "22px 24px", marginBottom: 16 }}>
        <SectionHeader title="Signal Metadata" sub="Core fields. Edit and save before scoring." />

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Category + Subcategory */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
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
            <div>
              <Label text="Subcategory" />
              <input
                type="text"
                value={editSubcategory}
                onChange={(e) => setEditSubcategory(e.target.value)}
                placeholder="Optional refinement"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <Label text="Title" />
            <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} style={inputStyle} />
          </div>

          {/* Summary */}
          <div>
            <Label text="Summary" hint="2–3 sentences in CE voice. State what happened." />
            <textarea value={editSummary} onChange={(e) => setEditSummary(e.target.value)} rows={4} style={{ ...inputStyle, resize: "vertical" }} />
          </div>

          {/* Implication */}
          <div>
            <Label text="Implication" hint="The so-what for the CE reader." />
            <textarea value={editImplication} onChange={(e) => setEditImplication(e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
          </div>

          {/* Structural Analysis — 2-col grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <Label text="What Changed" />
              <textarea value={editWhatChanged} onChange={(e) => setEditWhatChanged(e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical" }} placeholder="Concrete change or announcement." />
            </div>
            <div>
              <Label text="Why It Matters" />
              <textarea value={editWhyItMatters} onChange={(e) => setEditWhyItMatters(e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical" }} placeholder="Structural significance." />
            </div>
            <div>
              <Label text="Structural Relevance" />
              <textarea value={editStructuralRelevance} onChange={(e) => setEditStructuralRelevance(e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical" }} placeholder="Downstream structural consequence." />
            </div>
            <div>
              <Label text="Second Order Effect" />
              <textarea value={editSecondOrderEffect} onChange={(e) => setEditSecondOrderEffect(e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical" }} placeholder="What moves after the first-order effect." />
            </div>
          </div>

          {/* Impact Layer */}
          <div>
            <Label text="Impact Layer" hint="Who or what does this signal most directly affect?" />
            <TagGrid
              options={IMPACT_LAYER_OPTIONS.map(o => ({ id: o, name: o }))}
              selected={editImpactLayer}
              onToggle={toggleImpact}
            />
          </div>

          {/* Pressure Vectors */}
          {pressureVectors.length > 0 && (
            <div>
              <Label text="Pressure Vectors" hint="Named structural forces this signal activates." />
              <TagGrid options={pressureVectors} selected={pvSelected} onToggle={togglePv} />
            </div>
          )}

          {/* Doctrine Vectors */}
          {doctrineVectors.length > 0 && (
            <div>
              <Label text="Doctrine Vectors" hint="Doctrine vectors this signal expresses." />
              <TagGrid options={doctrineVectors} selected={dvSelected} onToggle={toggleDv} />
            </div>
          )}

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

      {/* ── SECTION 2: Signal Scoring ──────────────────────────────────────── */}
      <section style={{ borderRadius: 12, border: `1px solid ${C.border}`, background: C.panel, padding: "22px 24px", marginBottom: 16 }}>
        <SectionHeader
          title="Signal Scoring"
          sub="Rate each dimension 1–10. Confidence is 0.0–1.0. Final score = weighted sum × confidence × 10."
        />

        {/* Score grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 16 }}>
          {SCORE_FIELDS.map(({ key, label }) => (
            <div key={key} style={{ padding: "12px 14px", borderRadius: 9, border: `1px solid ${C.border}`, background: C.panelAlt }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.faint, margin: "0 0 10px" }}>{label}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <NumInput
                  value={score[key]}
                  onChange={(n) => updateScore(key, n)}
                />
                <span style={{ fontSize: 11, color: C.faint }}>/ 10</span>
              </div>
            </div>
          ))}

          {/* Confidence */}
          <div style={{ padding: "12px 14px", borderRadius: 9, border: `1px solid ${C.border}`, background: C.panelAlt }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.faint, margin: "0 0 10px" }}>Confidence</p>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <NumInput
                value={score.confidence}
                onChange={(n) => updateScore("confidence", n)}
                min={0}
                max={1}
                step={0.05}
              />
              <span style={{ fontSize: 11, color: C.faint }}>{Math.round(score.confidence * 100)}%</span>
            </div>
          </div>
        </div>

        {/* Scoring notes */}
        <div style={{ marginBottom: 20 }}>
          <Label text="Scoring Notes" />
          <textarea
            value={score.scoring_notes}
            onChange={(e) => updateScore("scoring_notes", e.target.value)}
            rows={3}
            placeholder="Rationale for this score — what drove the values?"
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>

        {/* Final score display */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button
              onClick={handleSaveScore}
              disabled={savingScore}
              style={{ padding: "9px 20px", borderRadius: 7, background: C.accent, border: "none", color: "#000", fontSize: 13, fontWeight: 700, cursor: savingScore ? "not-allowed" : "pointer", opacity: savingScore ? 0.6 : 1 }}
            >
              {savingScore ? "Saving…" : "Save Score"}
            </button>
            <span style={{ fontSize: 11, color: C.faint }}>Upserts one row per signal.</span>
          </div>

          <div style={{ textAlign: "right", padding: "10px 16px", borderRadius: 9, border: `1px solid ${scoreColor}44`, background: `${scoreColor}11` }}>
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.faint, margin: "0 0 2px" }}>Final Score</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: scoreColor, margin: 0, lineHeight: 1 }}>{finalScore.toFixed(1)}</p>
            <p style={{ fontSize: 9, color: C.faint, margin: "2px 0 0" }}>/ 100</p>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: Review Queue ────────────────────────────────────────── */}
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
                This signal was previously rejected. Review revision_notes and update before resubmitting.
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
              Sets status to <strong style={{ color: "#fbbf24" }}>in_review</strong> and creates a review_queue entry.
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
