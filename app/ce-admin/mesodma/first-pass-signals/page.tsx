"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

// ── Palette ───────────────────────────────────────────────────────────────────

const C = {
  bg:           "#09091c",
  panel:        "#0e0c1f",
  panelDark:    "#0c0b1e",
  panelAlt:     "#0b0a1e",
  border:       "#1c1a35",
  accent:       "#00E0FF",
  accentBg:     "rgba(0,224,255,0.08)",
  accentBorder: "rgba(0,224,255,0.25)",
  text:         "#f1f5f9",
  muted:        "#94a3b8",
  faint:        "#64748b",
  green:        "#4ade80",
  greenBg:      "rgba(74,222,128,0.10)",
  yellow:       "#fbbf24",
  yellowBg:     "rgba(251,191,36,0.10)",
  red:          "#f87171",
  redBg:        "rgba(248,113,113,0.10)",
  orange:       "#fb923c",
  orangeBg:     "rgba(251,146,60,0.10)",
} as const;

// ── Types ─────────────────────────────────────────────────────────────────────

type FPS = {
  id: string;
  raw_item_id: string | null;
  candidate_evidence_id: string | null;
  source_id: string | null;
  domain: string;
  subcategory: string | null;
  first_pass_signal: string | null;
  clean_summary: string | null;
  source_provenance: string | null;
  evidence_type: string | null;
  visibility_stage: string | null;
  signal_potential: string;
  possible_constraint_shift: string | null;
  possible_bottleneck_migration: string | null;
  possible_maintenance_gravity: string | null;
  possible_continuity_pressure: string | null;
  candidate_pressure_vectors: string[] | null;
  active_laws_candidate: string[] | null;
  skeptic_note: string | null;
  evidence_limitations: string | null;
  confidence: number | null;
  reason_for_signal_candidate: string | null;
  status: string;
  created_at: string;
  source_url: string | null;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(s: string) { return s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()); }
function pct(n: number | null | undefined) { return n == null ? "—" : `${Math.round(n * 100)}%`; }
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}
function timeAgo(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 2) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function triggerDownload(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ── Download text builders ────────────────────────────────────────────────────

const FOUR_QUESTIONS_BLOCK = `THE FOUR QUESTIONS (Human Review Gate)
=======================================
1. What changed?
2. What structural direction does it support?
3. What pressure is accumulating?
4. What second-order consequence follows?`;

const MMCP_BLOCK = `ADVERSARIAL REVIEW INSTRUCTIONS
================================
Act as an adversarial reviewer of the Cognitive Empire first-pass signals below.
For each signal, apply these four stress-tests in sequence:

1. FOUR-QUESTION INTERROGATION
   Does the signal answer all four gate questions directly?
   Or does it assume structural relevance without demonstrating it?

2. FALSIFICATION TEST
   State the single piece of evidence — discoverable within 12 months — that
   would invalidate this signal's structural claim. If no such evidence is
   conceivable, the signal is unfalsifiable: flag it.

3. DOCTRINE MAPPING CHALLENGE
   For each active law assigned, ask: does this evidence DEMONSTRATE the law,
   or does it merely rhyme with it? Challenge any force-fit doctrine tags.

4. EVENT vs. STRUCTURE TEST
   Is this a genuine structural shift (a change in the underlying rules of the
   system) or an event that will normalize, reverse, or be absorbed without
   lasting structural consequence? Flag event-dependent signals explicitly.

Output for each signal: PROMOTE / NEEDS SOURCES / REJECT
Plus one sentence of reasoning per decision.`;

function signalBody(s: FPS): string {
  const laws = (s.active_laws_candidate    ?? []).map(l => fmt(l)).join("  ·  ") || "—";
  const pvs  = (s.candidate_pressure_vectors ?? []).map(v => fmt(v)).join("  ·  ") || "—";
  return [
    `DOMAIN: ${fmt(s.domain)}${s.subcategory ? `  ·  SUBCATEGORY: ${s.subcategory}` : ""}`,
    `POTENTIAL: ${fmt(s.signal_potential)}  ·  CONFIDENCE: ${pct(s.confidence)}`,
    `STATUS: ${fmt(s.status)}`,
    `CREATED: ${fmtDate(s.created_at)}`,
    "",
    "FIRST-PASS SIGNAL",
    "-".repeat(40),
    s.first_pass_signal ?? "—",
    "",
    "REASON FOR SIGNAL CANDIDATE",
    "-".repeat(40),
    s.reason_for_signal_candidate ?? "—",
    "",
    "SOURCE",
    "-".repeat(40),
    `Summary    : ${s.clean_summary ?? "—"}`,
    `Provenance : ${s.source_provenance ?? "—"}`,
    `Type       : ${s.evidence_type ? fmt(s.evidence_type) : "—"}`,
    `Visibility : ${s.visibility_stage ? fmt(s.visibility_stage) : "—"}`,
    `URL        : ${s.source_url ?? "—"}`,
    "",
    "STRUCTURAL ANALYSIS",
    "-".repeat(40),
    "Constraint Shift:",
    s.possible_constraint_shift ?? "—",
    "",
    "Bottleneck Migration:",
    s.possible_bottleneck_migration ?? "—",
    "",
    "Maintenance Gravity:",
    s.possible_maintenance_gravity ?? "—",
    "",
    "Continuity Pressure:",
    s.possible_continuity_pressure ?? "—",
    "",
    "DOCTRINE",
    "-".repeat(40),
    `Active Laws     : ${laws}`,
    `Pressure Vectors: ${pvs}`,
    "",
    "CRITICAL REVIEW",
    "-".repeat(40),
    "Skeptic Note:",
    s.skeptic_note ?? "—",
    "",
    "Evidence Limitations:",
    s.evidence_limitations ?? "—",
  ].join("\n");
}

function buildSingleTxt(s: FPS): string {
  return [
    "CE SIGNALS — FIRST-PASS REVIEW",
    "================================",
    `${fmtDate(s.created_at)}  ·  Signal ID: ${s.id}`,
    "",
    FOUR_QUESTIONS_BLOCK,
    "",
    "=".repeat(60),
    "",
    signalBody(s),
  ].join("\n");
}

function buildAllTxt(signals: FPS[], date: string): string {
  const header = [
    "CE SIGNALS — FIRST-PASS BATCH REVIEW",
    "======================================",
    `Generated: ${date}  ·  ${signals.length} signal${signals.length !== 1 ? "s" : ""}`,
    "",
    FOUR_QUESTIONS_BLOCK,
    "",
    MMCP_BLOCK,
    "",
    "=".repeat(60),
    "",
  ].join("\n");

  const blocks = signals.map((s, i) =>
    `${"=".repeat(60)}\nSIGNAL ${i + 1} OF ${signals.length}\n${"=".repeat(60)}\n\n${signalBody(s)}`
  ).join("\n\n");

  return header + blocks;
}

// ── Badge components ──────────────────────────────────────────────────────────

function Badge({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <span style={{ padding: "3px 9px", borderRadius: 5, background: bg, color, fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

function PotentialBadge({ v }: { v: string }) {
  if (v === "critical") return <Badge label="critical" bg="rgba(248,113,113,0.15)" color={C.red} />;
  if (v === "high")     return <Badge label="high"     bg={C.orangeBg}             color={C.orange} />;
  if (v === "medium")   return <Badge label="medium"   bg={C.yellowBg}             color={C.yellow} />;
  return <Badge label="low" bg="rgba(100,116,139,0.1)" color={C.faint} />;
}

function StatusBadge({ v }: { v: string }) {
  if (v === "ready_for_signal_intelligence") return <Badge label="ready"         bg={C.accentBg} color={C.accent} />;
  if (v === "needs_more_sources")            return <Badge label="needs sources" bg={C.yellowBg} color={C.yellow} />;
  if (v === "needs_human_check")             return <Badge label="human check"  bg={C.orangeBg} color={C.orange} />;
  if (v === "rejected_by_mesodma")           return <Badge label="rejected"     bg={C.redBg}    color={C.red} />;
  return <Badge label={fmt(v)} bg="rgba(100,116,139,0.1)" color={C.faint} />;
}

// ── Detail modal ──────────────────────────────────────────────────────────────

function renderField(label: string, value: string | null | undefined) {
  if (!value) return null;
  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.faint, marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: 13, color: C.text, lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap" }}>{value}</p>
    </div>
  );
}

function renderChips(label: string, items: string[] | null | undefined) {
  return (
    <div style={{ marginBottom: 16 }}>
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.faint, marginBottom: 8 }}>{label}</p>
      {items?.length ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {items.map(v => (
            <span key={v} style={{ padding: "3px 10px", borderRadius: 5, background: C.accentBg, color: C.accent, fontSize: 11, fontWeight: 600, border: `1px solid ${C.accentBorder}` }}>
              {fmt(v)}
            </span>
          ))}
        </div>
      ) : <span style={{ fontSize: 12, color: C.faint }}>—</span>}
    </div>
  );
}

function SectionHead({ title }: { title: string }) {
  return (
    <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 20, marginTop: 8, marginBottom: 18 }}>
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: C.faint, margin: 0 }}>{title}</p>
    </div>
  );
}

type ModalProps = {
  signal: FPS;
  busy: boolean;
  err: string | undefined;
  onClose: () => void;
  onUpdate: (id: string, status: string) => void;
};

function DetailModal({ signal: s, busy, err, onClose, onUpdate }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const dateSlug = new Date().toISOString().slice(0, 10);

  return (
    <>
      {/* backdrop */}
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", zIndex: 100 }} />

      {/* panel */}
      <div style={{
        position: "fixed", top: "4vh", left: "50%", transform: "translateX(-50%)",
        width: "min(860px, 94vw)", maxHeight: "92vh",
        background: C.panel, borderRadius: 14, border: `1px solid ${C.border}`,
        boxShadow: "0 28px 90px rgba(0,0,0,0.75)", zIndex: 101,
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>

        {/* sticky header bar */}
        <div style={{ padding: "16px 22px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", flexShrink: 0, background: C.panelDark }}>
          <PotentialBadge v={s.signal_potential} />
          <StatusBadge v={s.status} />
          <span style={{ fontSize: 12, color: C.muted }}>{fmt(s.domain)}{s.subcategory ? ` · ${s.subcategory}` : ""}</span>
          <span style={{ fontSize: 13, color: C.accent, fontWeight: 700 }}>{pct(s.confidence)}</span>
          <span style={{ fontSize: 11, color: C.faint }}>{fmtDate(s.created_at)}</span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={() => triggerDownload(`ce-fps-${s.id.slice(0, 8)}-${dateSlug}.txt`, buildSingleTxt(s))}
              style={{ padding: "6px 13px", borderRadius: 7, background: C.accentBg, border: `1px solid ${C.accentBorder}`, color: C.accent, fontSize: 11, fontWeight: 600, cursor: "pointer" }}
            >
              ↓ Download
            </button>
            <button
              onClick={onClose}
              style={{ padding: "5px 11px", borderRadius: 7, background: "transparent", border: `1px solid ${C.border}`, color: C.faint, fontSize: 14, lineHeight: 1, cursor: "pointer" }}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* scrollable body */}
        <div style={{ overflowY: "auto", padding: "24px 26px", flex: 1 }}>

          {renderField("First-Pass Signal", s.first_pass_signal)}
          {renderField("Reason for Signal Candidate", s.reason_for_signal_candidate)}

          <SectionHead title="Source" />
          {renderField("Summary", s.clean_summary)}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.faint, marginBottom: 6 }}>Provenance</p>
              <p style={{ fontSize: 13, color: C.text, margin: 0 }}>{s.source_provenance ?? "—"}</p>
            </div>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.faint, marginBottom: 6 }}>Evidence Type</p>
              <p style={{ fontSize: 13, color: C.text, margin: 0 }}>{s.evidence_type ? fmt(s.evidence_type) : "—"}</p>
            </div>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.faint, marginBottom: 6 }}>Visibility</p>
              <p style={{ fontSize: 13, color: C.text, margin: 0 }}>{s.visibility_stage ? fmt(s.visibility_stage) : "—"}</p>
            </div>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.faint, marginBottom: 6 }}>Source URL</p>
              {s.source_url
                ? <a href={s.source_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: C.accent, wordBreak: "break-all", textDecoration: "none" }}>{s.source_url} ↗</a>
                : <p style={{ fontSize: 13, color: C.faint, margin: 0 }}>—</p>
              }
            </div>
          </div>

          <SectionHead title="Structural Analysis" />
          {renderField("Constraint Shift", s.possible_constraint_shift)}
          {renderField("Bottleneck Migration", s.possible_bottleneck_migration)}
          {renderField("Maintenance Gravity", s.possible_maintenance_gravity)}
          {renderField("Continuity Pressure", s.possible_continuity_pressure)}

          <SectionHead title="Doctrine" />
          {renderChips("Active Laws", s.active_laws_candidate)}
          {renderChips("Pressure Vectors", s.candidate_pressure_vectors)}

          <SectionHead title="Critical Review" />
          {renderField("Skeptic Note", s.skeptic_note)}
          {renderField("Evidence Limitations", s.evidence_limitations)}

          {/* actions */}
          <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 24, paddingTop: 20 }}>
            {err && <p style={{ fontSize: 11, color: C.red, marginBottom: 10 }}>{err}</p>}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link
                href="/ce-admin/signals/new"
                style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5, padding: "8px 18px", borderRadius: 7, fontSize: 12, fontWeight: 700, background: C.greenBg, color: C.green, border: `1px solid rgba(74,222,128,0.2)` }}
              >
                Promote →
              </Link>
              {s.status !== "needs_more_sources" && (
                <button onClick={() => onUpdate(s.id, "needs_more_sources")} disabled={busy}
                  style={{ padding: "8px 18px", borderRadius: 7, background: C.yellowBg, color: C.yellow, border: `1px solid rgba(251,191,36,0.2)`, fontSize: 12, fontWeight: 700, cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.6 : 1 }}>
                  Needs Sources
                </button>
              )}
              {s.status !== "rejected_by_mesodma" && (
                <button onClick={() => onUpdate(s.id, "rejected_by_mesodma")} disabled={busy}
                  style={{ padding: "8px 18px", borderRadius: 7, background: C.redBg, color: C.red, border: `1px solid rgba(248,113,113,0.2)`, fontSize: 12, fontWeight: 700, cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.6 : 1 }}>
                  Reject
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const TD: React.CSSProperties = { padding: "11px 14px", verticalAlign: "middle", borderBottom: `1px solid ${C.border}` };
const btnBase: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "none" };

export default function FirstPassSignalsPage() {
  const [signals,    setSignals]    = useState<FPS[]>([]);
  const [total,      setTotal]      = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [updating,   setUpdating]   = useState<Set<string>>(new Set());
  const [errors,     setErrors]     = useState<Map<string, string>>(new Map());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [filterStatus,    setFilterStatus]    = useState("");
  const [filterPotential, setFilterPotential] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "100" });
    if (filterStatus)    params.set("status",           filterStatus);
    if (filterPotential) params.set("signal_potential", filterPotential);
    fetch(`/api/mesodma/first-pass-signals?${params}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { setSignals(d.signals ?? []); setTotal(d.total ?? 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filterStatus, filterPotential]);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(id: string, status: string) {
    setUpdating(prev => new Set(prev).add(id));
    setErrors(prev => { const m = new Map(prev); m.delete(id); return m; });
    try {
      const res = await fetch("/api/mesodma/first-pass-signals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(d.error ?? `HTTP ${res.status}`);
      }
      setSignals(prev => prev.map(s => s.id === id ? { ...s, status } : s));
    } catch (e) {
      setErrors(prev => new Map(prev).set(id, e instanceof Error ? e.message : String(e)));
    } finally {
      setUpdating(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
  }

  const selectedSignal = selectedId ? (signals.find(s => s.id === selectedId) ?? null) : null;
  const dateSlug = new Date().toISOString().slice(0, 10);

  const selStyle: React.CSSProperties = {
    padding: "6px 10px", borderRadius: 7, border: `1px solid ${C.border}`,
    background: "#0a0919", color: C.text, fontSize: 12, outline: "none", cursor: "pointer",
  };

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1400 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, gap: 16 }}>
        <div>
          <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.5em", textTransform: "uppercase", color: C.faint, marginBottom: 4 }}>CE Admin · Mesodma</p>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: "-0.025em", margin: "0 0 4px" }}>
            First-Pass Signals{total > 0 && <span style={{ fontSize: 14, color: C.accent, fontWeight: 700, marginLeft: 10 }}>{total}</span>}
          </h1>
          <p style={{ fontSize: 12, color: C.faint, margin: 0 }}>Click a row for full detail. Promote promising signals, flag for sources, or reject.</p>
        </div>
        {signals.length > 0 && (
          <button
            onClick={() => {
              const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
              triggerDownload(`ce-first-pass-signals-${dateSlug}.txt`, buildAllTxt(signals, date));
            }}
            style={{ ...btnBase, padding: "9px 18px", background: C.accentBg, color: C.accent, border: `1px solid ${C.accentBorder}`, fontSize: 12, flexShrink: 0 }}
          >
            ↓ Download All ({signals.length})
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        <select style={selStyle} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="ready_for_signal_intelligence">Ready</option>
          <option value="needs_more_sources">Needs Sources</option>
          <option value="needs_human_check">Human Check</option>
          <option value="rejected_by_mesodma">Rejected</option>
        </select>
        <select style={selStyle} value={filterPotential} onChange={e => setFilterPotential(e.target.value)}>
          <option value="">All potentials</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <button onClick={load} style={{ ...btnBase, padding: "6px 14px", background: C.accentBg, color: C.accent, border: `1px solid ${C.accentBorder}` }}>
          Refresh
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <p style={{ color: C.faint, fontSize: 13, padding: "24px 0" }}>Loading…</p>
      ) : (
        <div style={{ borderRadius: 10, border: `1px solid ${C.border}`, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead style={{ background: C.panelDark, borderBottom: `1px solid ${C.border}` }}>
              <tr>
                {["Domain", "Potential", "First-Pass Signal", "Constraint Shift", "Confidence", "Status", "Age", "Actions"].map(h => (
                  <th key={h} style={{ padding: "9px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, letterSpacing: "0.35em", textTransform: "uppercase", color: C.faint, whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {signals.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: "40px 20px", textAlign: "center", color: C.faint, fontSize: 13 }}>
                    No first-pass signals found.
                  </td>
                </tr>
              ) : signals.map(s => {
                const busy     = updating.has(s.id);
                const err      = errors.get(s.id);
                const isActive = s.id === selectedId;
                return (
                  <tr
                    key={s.id}
                    onClick={() => setSelectedId(s.id)}
                    style={{ background: isActive ? "rgba(0,224,255,0.04)" : C.panel, cursor: "pointer", transition: "background 0.1s" }}
                  >
                    <td style={TD}><span style={{ fontSize: 11, color: C.muted }}>{s.domain ? fmt(s.domain) : "—"}</span></td>
                    <td style={TD}><PotentialBadge v={s.signal_potential} /></td>
                    <td style={{ ...TD, maxWidth: 320 }}>
                      <p style={{ margin: 0, fontSize: 12, color: C.text, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>
                        {s.first_pass_signal ?? <em style={{ color: C.faint }}>—</em>}
                      </p>
                    </td>
                    <td style={{ ...TD, maxWidth: 200 }}>
                      <p style={{ margin: 0, fontSize: 11, color: C.faint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {s.possible_constraint_shift ?? "—"}
                      </p>
                    </td>
                    <td style={TD}><span style={{ fontSize: 12, color: C.muted }}>{pct(s.confidence)}</span></td>
                    <td style={TD}><StatusBadge v={s.status} /></td>
                    <td style={TD}><span style={{ fontSize: 11, color: C.faint }}>{timeAgo(s.created_at)}</span></td>
                    <td style={{ ...TD, whiteSpace: "nowrap" }} onClick={e => e.stopPropagation()}>
                      {err && <p style={{ margin: "0 0 4px", fontSize: 10, color: C.red }}>{err}</p>}
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                        <button
                          title="Download as .txt"
                          onClick={e => { e.stopPropagation(); triggerDownload(`ce-fps-${s.id.slice(0, 8)}-${dateSlug}.txt`, buildSingleTxt(s)); }}
                          style={{ ...btnBase, background: C.accentBg, color: C.accent, border: `1px solid ${C.accentBorder}` }}
                        >
                          ↓
                        </button>
                        <Link
                          href="/ce-admin/signals/new"
                          onClick={e => e.stopPropagation()}
                          style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: C.greenBg, color: C.green, border: `1px solid rgba(74,222,128,0.2)` }}
                        >
                          Promote →
                        </Link>
                        {s.status !== "needs_more_sources" && (
                          <button onClick={e => { e.stopPropagation(); updateStatus(s.id, "needs_more_sources"); }} disabled={busy}
                            style={{ ...btnBase, background: C.yellowBg, color: C.yellow, border: `1px solid rgba(251,191,36,0.2)`, opacity: busy ? 0.6 : 1, cursor: busy ? "not-allowed" : "pointer" }}>
                            Needs Sources
                          </button>
                        )}
                        {s.status !== "rejected_by_mesodma" && (
                          <button onClick={e => { e.stopPropagation(); updateStatus(s.id, "rejected_by_mesodma"); }} disabled={busy}
                            style={{ ...btnBase, background: C.redBg, color: C.red, border: `1px solid rgba(248,113,113,0.2)`, opacity: busy ? 0.6 : 1, cursor: busy ? "not-allowed" : "pointer" }}>
                            Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail modal */}
      {selectedSignal && (
        <DetailModal
          signal={selectedSignal}
          busy={updating.has(selectedSignal.id)}
          err={errors.get(selectedSignal.id)}
          onClose={() => setSelectedId(null)}
          onUpdate={updateStatus}
        />
      )}
    </div>
  );
}
