"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { SignalCategory } from "@/types/signals";

const C = {
  bg:           "#09091c",
  panel:        "#0e0c1f",
  border:       "#1c1a35",
  accent:       "#00E0FF",
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
  { value: "science_frontier",         label: "Science Frontier" },
  { value: "governance_stability",     label: "Governance & Stability" },
  { value: "markets_human_prosperity", label: "Markets & Human Prosperity" },
  { value: "resources_continuity",     label: "Resources & Continuity" },
];

function Label({ text, required }: { text: string; required?: boolean }) {
  return (
    <label style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: C.faint, marginBottom: 7 }}>
      {text}{required && <span style={{ color: "#f87171", marginLeft: 3 }}>*</span>}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 13px", borderRadius: 8, border: `1px solid ${C.border}`,
  background: C.input, color: C.text, fontSize: 13, outline: "none", boxSizing: "border-box",
  fontFamily: "system-ui, -apple-system, sans-serif",
};

export default function NewSignalPage() {
  const router = useRouter();

  const [category,    setCategory]    = useState<SignalCategory | "">("");
  const [title,       setTitle]       = useState("");
  const [summary,     setSummary]     = useState("");
  const [implication, setImplication] = useState("");
  const [rawItemId,   setRawItemId]   = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!category || !title.trim() || !summary.trim() || !implication.trim()) {
      setError("Category, title, summary, and implication are all required.");
      return;
    }
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/signals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category,
        title:       title.trim(),
        summary:     summary.trim(),
        implication: implication.trim(),
        raw_item_id: rawItemId.trim() || null,
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
    <div style={{ padding: "28px 32px", maxWidth: 760 }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <Link href="/ce-admin/signals" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: C.faint, marginBottom: 14 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          All Signals
        </Link>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.45em", textTransform: "uppercase", color: C.faint, marginBottom: 4 }}>CE Signals Admin</p>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: "-0.02em", margin: 0 }}>New Signal</h1>
        <p style={{ fontSize: 13, color: C.faint, marginTop: 6 }}>Creates a draft signal. Scoring and review submission happen on the detail page.</p>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "#f87171", fontSize: 13, marginBottom: 20 }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ borderRadius: 12, border: `1px solid ${C.border}`, background: C.panel, padding: "24px 26px", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Category */}
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

          {/* Title */}
          <div>
            <Label text="Title" required />
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Signal title — specific, factual, no interpretation"
              style={inputStyle}
              required
            />
          </div>

          {/* Summary */}
          <div>
            <Label text="Summary" required />
            <p style={{ fontSize: 11, color: C.faint, marginBottom: 8 }}>2–3 sentences in CE voice. State what happened, not what it means.</p>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="What happened or is happening. CE voice, factual, present tense."
              rows={4}
              style={{ ...inputStyle, resize: "vertical" }}
              required
            />
          </div>

          {/* Implication */}
          <div>
            <Label text="Implication" required />
            <p style={{ fontSize: 11, color: C.faint, marginBottom: 8 }}>The so-what for the CE reader. One or two sentences. Doctrine-grounded but not yet scored.</p>
            <textarea
              value={implication}
              onChange={(e) => setImplication(e.target.value)}
              placeholder="Why this matters to the CE reader. What it signals about the structural shift."
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
              required
            />
          </div>

          {/* Raw Item ID (optional) */}
          <div>
            <Label text="Raw Item ID (optional)" />
            <p style={{ fontSize: 11, color: C.faint, marginBottom: 8 }}>Paste a UUID from <code style={{ fontSize: 10, background: "rgba(255,255,255,0.06)", padding: "1px 5px", borderRadius: 4 }}>raw_items</code> if this signal originates from a Mesodma ingestion.</p>
            <input
              type="text"
              value={rawItemId}
              onChange={(e) => setRawItemId(e.target.value)}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              style={{ ...inputStyle, fontFamily: "monospace", fontSize: 12 }}
            />
          </div>

        </div>

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 20 }}>
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
          <span style={{ fontSize: 11, color: C.faint, marginLeft: 4 }}>
            Signal will be created as <strong style={{ color: C.muted }}>draft</strong>
          </span>
        </div>
      </form>
    </div>
  );
}
