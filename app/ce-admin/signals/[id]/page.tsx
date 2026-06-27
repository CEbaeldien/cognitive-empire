"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { SignalRow, SignalScoreRow, SignalStatus, SignalCategory, SignalState } from "@/types/signals";

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

const CATEGORIES: { value: SignalCategory; label: string }[] = [
  { value: "intelligence",         label: "Intelligence" },
  { value: "governance_stability", label: "Governance & Stability" },
  { value: "infrastructure",       label: "Infrastructure" },
];

const SUBCATEGORIES: Record<SignalCategory, string[]> = {
  intelligence:         ["Science & Frontier"],
  governance_stability: ["Markets & Human Prosperity"],
  infrastructure:       ["Physical Systems", "Energy", "Resources & Continuity"],
};

const SIGNAL_STATES: { value: SignalState; label: string }[] = [
  { value: "raw",          label: "Raw" },
  { value: "potential",    label: "Potential" },
  { value: "growing",      label: "Growing" },
  { value: "directional",  label: "Directional" },
  { value: "act_now",      label: "ACT NOW" },
  { value: "watch",        label: "Watch" },
  { value: "contradicted", label: "Contradicted" },
  { value: "retire",       label: "Retire" },
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
    decay_factor:          row.decay_factor,   // signal_scores stores 1–10
    governance_impact:     row.governance_impact,
    continuity_pressure:   row.continuity_pressure,
    prosperity_relevance:  row.prosperity_relevance,
    structural_relevance:  row.structural_relevance,
    confidence:            row.confidence,
    scoring_notes:         row.scoring_notes ?? "",
  };
}

// Fix 3: derive suggested scores from seeded base signal data
function deriveBaseSignalScores(s: SignalRow): ScoreState {
  const gate = (s.act_now_gate ?? {}) as Record<string, boolean>;
  const conditionsMet = Object.values(gate).filter(Boolean).length;
  const strength = Math.min(conditionsMet * 2, 10);

  const weightMap: Record<string, number> = { act_now: 9, directional: 7, growing: 6, watch: 5 };
  const weight = weightMap[s.signal_state ?? ""] ?? 5;

  const longevity = 9;

  const convergenceConf = (s.convergence_record as Record<string, unknown> | null)?.confidence as string | undefined;
  const convergenceMap: Record<string, number> = { maximum: 10, high: 8, medium: 6 };
  const convergence_potential = convergenceConf ? (convergenceMap[convergenceConf] ?? 6) : 5;

  const govMap: Record<string, number> = { governance_stability: 9, infrastructure: 7, intelligence: 8 };
  const governance_impact = govMap[s.v2_category ?? ""] ?? 7;

  const continuityMap: Record<string, number> = { infrastructure: 8, governance_stability: 8, intelligence: 7 };
  const continuity_pressure = continuityMap[s.v2_category ?? ""] ?? 7;

  const prosperityHigh = ["labor_markets", "access_inequality"];
  const prosperity_relevance = prosperityHigh.includes(s.v2_subcategory ?? "") ? 9 : 7;

  const structural_relevance = 9;

  const confidence = s.confidence ?? 0.7;

  // Fix 2: signals.decay_factor is 0.0–1.0; scoring form uses 1–10 display scale
  const decay_factor = Math.max(1, Math.round((s.decay_factor ?? 0.05) * 10));

  return {
    strength, weight, longevity, convergence_potential,
    governance_impact, continuity_pressure, prosperity_relevance,
    structural_relevance, confidence, decay_factor,
    scoring_notes: "Derived from V2 base signal seeded data.",
  };
}

// Fix 4: derive metadata fields from base signal seeded data
function deriveBaseSignalMeta(s: SignalRow) {
  const implication = s.dominant_path ?? "";

  const thesis = s.directional_thesis ?? "";
  const what_changed = thesis.split(". ")[0] ?? "";

  const conf = (s.convergence_record as Record<string, unknown> | null)?.confidence ?? "high";
  const models = (s.convergence_record as Record<string, unknown> | null)?.models as string[] | undefined;
  const modelCount = models?.length ?? 3;
  const why_it_matters = `${modelCount}-model MMCP convergence confirmed ${conf} confidence. ${s.summary}`;

  const cat = (s.v2_category ?? "").replace(/_/g, " & ");
  const sub = (s.v2_subcategory ?? "").replace(/_/g, " ");
  const structural_relevance = `${cat} force. 2026–2031 structural horizon. ${sub}.`;

  const paths = (s.competing_paths ?? []) as Array<{ path: string; signal_strength: string }>;
  const highProb = paths.find(p => p.signal_strength === "high_probability") ?? paths[paths.length - 1];
  const second = paths[1];
  const second_order_effect = highProb && second
    ? `If ${highProb.path} accelerates: ${second.path} becomes the next binding constraint.`
    : "";

  return { implication, what_changed, why_it_matters, structural_relevance, second_order_effect };
}

// Fix 5: simple average formula with 1-decimal precision
function computeFinalScore(s: ScoreState): number {
  const dims = [
    s.strength, s.weight, s.longevity, s.convergence_potential,
    s.governance_impact, s.continuity_pressure, s.prosperity_relevance, s.structural_relevance,
  ];
  const avg = dims.reduce((a, b) => a + b, 0) / dims.length;
  return Math.round(avg * s.confidence * 10 * 10) / 10;
}

function scoreBreakdown(s: ScoreState): string {
  const dims = [
    s.strength, s.weight, s.longevity, s.convergence_potential,
    s.governance_impact, s.continuity_pressure, s.prosperity_relevance, s.structural_relevance,
  ];
  const avg = dims.reduce((a, b) => a + b, 0) / dims.length;
  return `Dimension avg: ${avg.toFixed(2)} × Confidence: ${s.confidence.toFixed(2)} × 10 = ${computeFinalScore(s).toFixed(1)}`;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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
  const [editSignalState,         setEditSignalState]         = useState<SignalState | "">("");

  // Tag vectors
  const [pressureVectors,   setPressureVectors]   = useState<Vector[]>([]);
  const [doctrineVectors,   setDoctrineVectors]   = useState<Vector[]>([]);
  const [pvSelected,        setPvSelected]        = useState<Set<string>>(new Set());
  const [dvSelected,        setDvSelected]        = useState<Set<string>>(new Set());

  // Score state
  const [score,       setScore]       = useState<ScoreState>(DEFAULT_SCORE);
  const [savingScore, setSavingScore] = useState(false);

  // Actions
  const [savingMeta,        setSavingMeta]        = useState(false);
  const [submittingReview,  setSubmittingReview]  = useState(false);
  const [reviewActing,      setReviewActing]      = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [toast,             setToast]             = useState<{ msg: string; type: "ok" | "err" } | null>(null);

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
        setEditSignalState(s.signal_state ?? "");

        // Fix 4: auto-fill metadata from seeded base signal data (only when field is empty)
        const meta = s.is_base_signal ? deriveBaseSignalMeta(s) : null;
        setEditImplication(
          s.implication?.trim() ? s.implication :
          meta?.implication ?? ""
        );
        setEditWhatChanged(
          s.what_changed?.trim() ? s.what_changed :
          meta?.what_changed ?? ""
        );
        setEditWhyItMatters(
          s.why_it_matters?.trim() ? s.why_it_matters :
          meta?.why_it_matters ?? ""
        );
        setEditStructuralRelevance(
          s.structural_relevance?.trim() ? s.structural_relevance :
          meta?.structural_relevance ?? ""
        );
        setEditSecondOrderEffect(
          s.second_order_effect?.trim() ? s.second_order_effect :
          meta?.second_order_effect ?? ""
        );

        setEditImpactLayer(new Set(
          typeof s.impact_layer === "string" && s.impact_layer
            ? s.impact_layer.split(", ").filter(Boolean)
            : []
        ));

        // Fix 1 + 3: load score from DB if present; derive from base signal data if not
        if (sc) {
          setScore(scoreFromRow(sc));
        } else if (s.is_base_signal) {
          setScore(deriveBaseSignalScores(s));
        }

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
    if (!editCategory || !editTitle.trim() || !editSummary.trim()) {
      showToast("Category, title, and summary are required.", "err");
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
        implication:          editImplication.trim() || null,
        what_changed:         editWhatChanged.trim() || null,
        why_it_matters:       editWhyItMatters.trim() || null,
        structural_relevance: editStructuralRelevance.trim() || null,
        second_order_effect:  editSecondOrderEffect.trim() || null,
        impact_layer:         editImpactLayer.size > 0 ? [...editImpactLayer].join(", ") : null,
        signal_state:         editSignalState || null,
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

  async function handleReviewAction(action: "approve" | "reject" | "publish") {
    setReviewActing(true);
    const res = await fetch(`/api/signals/${id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setReviewActing(false);
    setShowRejectConfirm(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      showToast(d.error ?? `HTTP ${res.status}`, "err");
      return;
    }
    const nextStatus =
      action === "approve" ? "approved" :
      action === "reject"  ? "rejected" :
      "published";
    setSignal((prev) => prev ? { ...prev, status: nextStatus } : prev);
    showToast(
      action === "approve" ? "Signal approved." :
      action === "reject"  ? "Signal rejected." :
      "Signal published.",
      "ok"
    );
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

  const canSubmitReview = signal.status !== "in_review" && signal.status !== "approved" && signal.status !== "published" && signal.status !== "archived";
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

          {/* Category + Subcategory + Signal State */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            <div>
              <Label text="Category" />
              <select
                value={editCategory}
                onChange={(e) => {
                  setEditCategory(e.target.value as SignalCategory);
                  setEditSubcategory("");
                }}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <Label text="Subcategory" />
              <select
                value={editSubcategory}
                onChange={(e) => setEditSubcategory(e.target.value)}
                style={{ ...inputStyle, cursor: "pointer" }}
                disabled={!editCategory}
              >
                <option value="">— none —</option>
                {editCategory && SUBCATEGORIES[editCategory].map((sub) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
            <div>
              <Label text="Signal State" hint="V2 structural state." />
              <select
                value={editSignalState}
                onChange={(e) => setEditSignalState(e.target.value as SignalState | "")}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                <option value="">— unset —</option>
                {SIGNAL_STATES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
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
            <p style={{ fontSize: 9, color: C.faint, margin: "6px 0 0", fontFamily: "monospace" }}>{scoreBreakdown(score)}</p>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: Review & Publish ───────────────────────────────────── */}
      <section style={{ borderRadius: 12, border: (signal.status === "in_review" || signal.status === "approved") ? `1px solid ${C.accentBorder}` : canSubmitReview ? `1px solid ${C.border}` : `1px solid ${C.border}`, background: C.panel, padding: "22px 24px", marginBottom: 20 }}>
        <SectionHeader
          title="Review & Publish"
          sub="Submit to review queue, then approve and publish. No signal goes live without human review."
        />

        {/* ── in_review: show review actions ── */}
        {signal.status === "in_review" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 8, border: "1px solid rgba(251,191,36,0.3)", background: "rgba(251,191,36,0.08)" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p style={{ fontSize: 13, color: "#fbbf24", margin: 0 }}>This signal is in the review queue.</p>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                onClick={() => handleReviewAction("approve")}
                disabled={reviewActing}
                style={{ padding: "10px 22px", borderRadius: 8, background: C.accentBg, border: `1px solid ${C.accentBorder}`, color: C.accent, fontSize: 13, fontWeight: 700, cursor: reviewActing ? "not-allowed" : "pointer", opacity: reviewActing ? 0.6 : 1 }}
              >
                {reviewActing ? "…" : "Approve"}
              </button>
              <button
                onClick={() => setShowRejectConfirm((v) => !v)}
                disabled={reviewActing}
                style={{ padding: "10px 22px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171", fontSize: 13, fontWeight: 700, cursor: reviewActing ? "not-allowed" : "pointer", opacity: reviewActing ? 0.6 : 1 }}
              >
                Reject
              </button>
            </div>
            {showRejectConfirm && (
              <div style={{ padding: "14px 16px", borderRadius: 9, border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.06)" }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#f87171", margin: "0 0 6px" }}>Reject this signal?</p>
                <p style={{ fontSize: 12, color: C.faint, margin: "0 0 12px" }}>Status will be set to <strong style={{ color: "#f87171" }}>rejected</strong>. The signal can be resubmitted after revision.</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => handleReviewAction("reject")}
                    disabled={reviewActing}
                    style={{ padding: "8px 18px", borderRadius: 7, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", color: "#f87171", fontSize: 12, fontWeight: 700, cursor: reviewActing ? "not-allowed" : "pointer", opacity: reviewActing ? 0.6 : 1 }}
                  >
                    {reviewActing ? "Rejecting…" : "Confirm Reject"}
                  </button>
                  <button
                    onClick={() => setShowRejectConfirm(false)}
                    style={{ padding: "8px 14px", borderRadius: 7, background: "transparent", border: `1px solid ${C.border}`, color: C.faint, fontSize: 12, cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── approved: publish button ── */}
        {signal.status === "approved" && (
          <div style={{ padding: "16px 18px", borderRadius: 9, border: "1px solid rgba(34,197,94,0.3)", background: "rgba(34,197,94,0.06)" }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#4ade80", margin: "0 0 4px" }}>Ready to publish</p>
            <p style={{ fontSize: 12, color: C.faint, margin: "0 0 14px" }}>This signal has been approved. Publish makes it live on the public signals feed.</p>
            <button
              onClick={() => handleReviewAction("publish")}
              disabled={reviewActing}
              style={{ padding: "10px 24px", borderRadius: 8, background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.4)", color: "#4ade80", fontSize: 13, fontWeight: 700, cursor: reviewActing ? "not-allowed" : "pointer", opacity: reviewActing ? 0.6 : 1 }}
            >
              {reviewActing ? "Publishing…" : "Publish Signal"}
            </button>
          </div>
        )}

        {/* ── published ── */}
        {signal.status === "published" && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 8, border: "1px solid rgba(34,197,94,0.3)", background: "rgba(34,197,94,0.08)" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <p style={{ fontSize: 13, color: "#4ade80", margin: 0 }}>This signal is published. No further review actions are available here.</p>
          </div>
        )}

        {/* ── draft / rejected / watching / decaying: submit to review ── */}
        {canSubmitReview && (
          <div>
            {signal.status === "rejected" && (
              <p style={{ fontSize: 12, color: "#f87171", marginBottom: 14 }}>
                This signal was previously rejected. Review revision notes and update before resubmitting.
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
