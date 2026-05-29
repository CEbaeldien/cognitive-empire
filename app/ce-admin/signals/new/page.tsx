"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { SignalCategory } from "@/types/signals";

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

const CATEGORIES: { value: SignalCategory; label: string }[] = [
  { value: "intelligence",             label: "Intelligence" },
  { value: "physical_systems",         label: "Physical Systems" },
  { value: "infrastructure",           label: "Infrastructure" },
  { value: "energy",                   label: "Energy" },
  { value: "science_frontier",         label: "Science & Frontier" },
  { value: "governance_stability",     label: "Governance & Stability" },
  { value: "markets_human_prosperity", label: "Markets & Human Prosperity" },
  { value: "resources_continuity",     label: "Resources & Continuity" },
];

const IMPACT_LAYER_OPTIONS = [
  "Founder", "Operator", "Creator", "Builder", "Investor",
  "Governance", "Infrastructure", "Market", "Prosperity", "Continuity",
];

type Vector = { id: string; name: string };

function Label({ text, required, hint }: { text: string; required?: boolean; hint?: string }) {
  return (
    <div style={{ marginBottom: 7 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: C.faint }}>
        {text}{required && <span style={{ color: "#f87171", marginLeft: 3 }}>*</span>}
      </label>
      {hint && <p style={{ fontSize: 11, color: C.faint, marginTop: 3 }}>{hint}</p>}
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ borderRadius: 12, border: `1px solid ${C.border}`, background: C.panel, padding: "22px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.35em", textTransform: "uppercase", color: C.faint, margin: 0 }}>{title}</p>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 13px", borderRadius: 8, border: `1px solid ${C.border}`,
  background: C.input, color: C.text, fontSize: 13, outline: "none", boxSizing: "border-box",
  fontFamily: "system-ui, -apple-system, sans-serif",
};

const taStyle: React.CSSProperties = { ...inputStyle, resize: "vertical" };

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

export default function NewSignalPage() {
  const router = useRouter();

  const [category,            setCategory]            = useState<SignalCategory | "">("");
  const [subcategory,         setSubcategory]         = useState("");
  const [title,               setTitle]               = useState("");
  const [summary,             setSummary]             = useState("");
  const [implication,         setImplication]         = useState("");
  const [whatChanged,         setWhatChanged]         = useState("");
  const [whyItMatters,        setWhyItMatters]        = useState("");
  const [structuralRelevance, setStructuralRelevance] = useState("");
  const [secondOrderEffect,   setSecondOrderEffect]   = useState("");
  const [impactLayer,         setImpactLayer]         = useState<Set<string>>(new Set());
  const [rawItemId,           setRawItemId]           = useState("");

  const [pressureVectors,    setPressureVectors]    = useState<Vector[]>([]);
  const [doctrineVectors,    setDoctrineVectors]    = useState<Vector[]>([]);
  const [pressureVectorIds,  setPressureVectorIds]  = useState<Set<string>>(new Set());
  const [doctrineVectorIds,  setDoctrineVectorIds]  = useState<Set<string>>(new Set());

  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/signals/pressure-vectors").then(r => r.ok ? r.json() : { vectors: [] }),
      fetch("/api/signals/doctrine-vectors").then(r => r.ok ? r.json() : { vectors: [] }),
    ]).then(([pv, dv]) => {
      setPressureVectors(pv.vectors ?? []);
      setDoctrineVectors(dv.vectors ?? []);
    });
  }, []);

  function toggleImpact(opt: string) {
    setImpactLayer(prev => {
      const next = new Set(prev);
      next.has(opt) ? next.delete(opt) : next.add(opt);
      return next;
    });
  }

  function togglePv(id: string) {
    setPressureVectorIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function toggleDv(id: string) {
    setDoctrineVectorIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!category || !title.trim() || !summary.trim() || !implication.trim()) {
      setError("Category, title, summary, and implication are required.");
      return;
    }
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/signals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category,
        subcategory:          subcategory.trim() || null,
        title:                title.trim(),
        summary:              summary.trim(),
        implication:          implication.trim(),
        what_changed:         whatChanged.trim() || null,
        why_it_matters:       whyItMatters.trim() || null,
        structural_relevance: structuralRelevance.trim() || null,
        second_order_effect:  secondOrderEffect.trim() || null,
        impact_layer:         impactLayer.size > 0 ? [...impactLayer].join(", ") : null,
        raw_item_id:          rawItemId.trim() || null,
        pressure_vector_ids:  [...pressureVectorIds],
        doctrine_vector_ids:  [...doctrineVectorIds],
      }),
    });

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? `HTTP ${res.status}`);
      setSubmitting(false);
      return;
    }

    const created = await res.json();
    router.push(`/ce-admin/signals/${created.id}`);
  }

  return (
    <div style={{ padding: "28px 32px", maxWidth: 800 }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <Link href="/ce-admin/signals" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: C.faint, marginBottom: 14 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          All Signals
        </Link>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.45em", textTransform: "uppercase", color: C.faint, marginBottom: 4 }}>CE Signals Admin</p>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: "-0.02em", margin: 0 }}>New Signal</h1>
        <p style={{ fontSize: 13, color: C.faint, marginTop: 6 }}>Creates a draft. Scoring and review happen on the detail page.</p>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "#f87171", fontSize: 13, marginBottom: 20 }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* ── Core Fields ─────────────────────────────────────────────────── */}
        <SectionCard title="Core Signal Fields">

          {/* Category + Subcategory */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <Label text="Category" required />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as SignalCategory)}
                style={{ ...inputStyle, cursor: "pointer" }}
                required
              >
                <option value="">Select a category…</option>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <Label text="Subcategory" hint="Optional refinement within the category" />
              <input
                type="text"
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                placeholder="e.g. Autonomous Systems"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <Label text="Title" required hint="Specific and factual. No interpretation." />
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Signal title"
              style={inputStyle}
              required
            />
          </div>

          {/* Summary */}
          <div>
            <Label text="Summary" required hint="2–3 sentences in CE voice. State what happened." />
            <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={4} style={taStyle} required />
          </div>

          {/* Implication */}
          <div>
            <Label text="Implication" required hint="The so-what for the CE reader. One or two sentences." />
            <textarea value={implication} onChange={(e) => setImplication(e.target.value)} rows={3} style={taStyle} required />
          </div>

        </SectionCard>

        {/* ── Structural Analysis ─────────────────────────────────────────── */}
        <SectionCard title="Structural Analysis">

          <div>
            <Label text="What Changed" hint="What specifically changed or was announced?" />
            <textarea value={whatChanged} onChange={(e) => setWhatChanged(e.target.value)} rows={3} style={taStyle} placeholder="Describe the concrete change or event." />
          </div>

          <div>
            <Label text="Why It Matters" hint="Why does this matter structurally?" />
            <textarea value={whyItMatters} onChange={(e) => setWhyItMatters(e.target.value)} rows={3} style={taStyle} placeholder="Structural significance, not just surface relevance." />
          </div>

          <div>
            <Label text="Structural Relevance" hint="What structural consequence does this create?" />
            <textarea value={structuralRelevance} onChange={(e) => setStructuralRelevance(e.target.value)} rows={3} style={taStyle} placeholder="Downstream structural shift or constraint this introduces." />
          </div>

          <div>
            <Label text="Second Order Effect" hint="What happens after the first-order effect lands?" />
            <textarea value={secondOrderEffect} onChange={(e) => setSecondOrderEffect(e.target.value)} rows={3} style={taStyle} placeholder="The cascade. What moves next and why." />
          </div>

        </SectionCard>

        {/* ── Impact Layer ────────────────────────────────────────────────── */}
        <SectionCard title="Impact Layer">
          <p style={{ fontSize: 12, color: C.faint, margin: 0 }}>Who or what does this signal most directly affect?</p>
          <TagGrid
            options={IMPACT_LAYER_OPTIONS.map(o => ({ id: o, name: o }))}
            selected={impactLayer}
            onToggle={toggleImpact}
          />
        </SectionCard>

        {/* ── Pressure Vectors ────────────────────────────────────────────── */}
        <SectionCard title="Pressure Vectors">
          <p style={{ fontSize: 12, color: C.faint, margin: 0 }}>
            Named structural forces this signal activates.{" "}
            {pressureVectors.length === 0 && <span style={{ color: "#f87171" }}>Loading…</span>}
          </p>
          {pressureVectors.length > 0 && (
            <TagGrid options={pressureVectors} selected={pressureVectorIds} onToggle={togglePv} />
          )}
        </SectionCard>

        {/* ── Doctrine Vectors ────────────────────────────────────────────── */}
        <SectionCard title="Doctrine Vectors">
          <p style={{ fontSize: 12, color: C.faint, margin: 0 }}>
            Doctrine vectors this signal expresses.{" "}
            {doctrineVectors.length === 0 && <span style={{ color: "#f87171" }}>Loading…</span>}
          </p>
          {doctrineVectors.length > 0 && (
            <TagGrid options={doctrineVectors} selected={doctrineVectorIds} onToggle={toggleDv} />
          )}
        </SectionCard>

        {/* ── Source ──────────────────────────────────────────────────────── */}
        <SectionCard title="Source">
          <div>
            <Label text="Raw Item ID (optional)" hint="UUID from raw_items if this originates from a Mesodma ingestion." />
            <input
              type="text"
              value={rawItemId}
              onChange={(e) => setRawItemId(e.target.value)}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              style={{ ...inputStyle, fontFamily: "monospace", fontSize: 12 }}
            />
          </div>
        </SectionCard>

        {/* ── Actions ─────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            type="submit"
            disabled={submitting}
            style={{ padding: "10px 24px", borderRadius: 8, background: C.accent, border: "none", color: "#000", fontSize: 13, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.6 : 1 }}
          >
            {submitting ? "Creating…" : "Create Signal"}
          </button>
          <Link href="/ce-admin/signals" style={{ textDecoration: "none" }}>
            <button type="button" style={{ padding: "10px 18px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, fontSize: 13, cursor: "pointer" }}>
              Cancel
            </button>
          </Link>
          <span style={{ fontSize: 11, color: C.faint }}>
            Signal will be created as <strong style={{ color: C.muted }}>draft</strong>
          </span>
        </div>

      </form>
    </div>
  );
}
