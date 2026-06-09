"use client";

import React, { useState, useEffect, useCallback } from "react";

// ── Palette ───────────────────────────────────────────────────────────────────

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
  input:        "#0a0919",
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

type V1Stats = {
  raw_items_pending:        number;
  candidate_evidence_count: number;
  first_pass_signals_ready: number;
  rejected_noise_count:     number;
  mesodma_runs_count:       number;
};

type RawItem = {
  id: string;
  title: string;
  body: string | null;
  url: string | null;
  published_at: string | null;
  signal_processing_status: string | null;
  status: string;
  extracted_fields: Record<string, unknown>;
  sources: { name: string; category: string } | null;
};

type CandidateEvidence = {
  id: string;
  raw_item_id: string;
  domain: string;
  subcategory: string | null;
  clean_summary: string | null;
  source_provenance: string | null;
  evidence_type: string | null;
  visibility_stage: string | null;
  noise_level: string | null;
  confidence: number | null;
  created_at: string;
};

type FirstPassSignal = {
  id: string;
  domain: string;
  signal_potential: string;
  first_pass_signal: string | null;
  possible_constraint_shift: string | null;
  confidence: number | null;
  status: string;
  created_at: string;
};

type MesodmaRun = {
  id: string;
  raw_item_id: string;
  module_name: string;
  model_used: string | null;
  route: string | null;
  confidence: number | null;
  error_flag: boolean;
  input_snapshot: Record<string, unknown>;
  output_json: Record<string, unknown>;
  created_at: string;
};

type TrainingExample = {
  id: string;
  title: string;
  input_text: string | null;
  expected_route: string | null;
  example_category: string | null;
  lesson: string | null;
  created_at: string;
};

type ProcessResult = {
  route_taken: string;
  signal_potential?: string;
  confidence?: number;
  first_pass_signal?: string;
  rejection_reason?: string;
  error?: string;
};

type ExampleForm = {
  title: string;
  input_text: string;
  expected_route: string;
  example_category: string;
  lesson: string;
};

const BLANK_EXAMPLE: ExampleForm = {
  title: "", input_text: "", expected_route: "", example_category: "", lesson: "",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "—";
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 2)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function pct(n: number | null | undefined): string {
  if (n == null) return "—";
  return `${Math.round(n * 100)}%`;
}

// ── Small components ──────────────────────────────────────────────────────────

function StatTile({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{ flex: 1, minWidth: 130, padding: "16px 20px", borderRadius: 10, background: C.panel, border: `1px solid ${C.border}` }}>
      <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.4em", textTransform: "uppercase", color: C.faint, margin: "0 0 8px" }}>{label}</p>
      <p style={{ fontSize: 26, fontWeight: 800, color: color ?? C.text, margin: 0, letterSpacing: "-0.03em", lineHeight: 1 }}>{value}</p>
    </div>
  );
}

function Badge({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <span style={{ padding: "3px 9px", borderRadius: 5, background: bg, color, fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

function SignalPotentialBadge({ v }: { v: string }) {
  if (v === "critical") return <Badge label="critical" bg="rgba(248,113,113,0.15)" color={C.red} />;
  if (v === "high")     return <Badge label="high"     bg={C.orangeBg}              color={C.orange} />;
  if (v === "medium")   return <Badge label="medium"   bg={C.yellowBg}              color={C.yellow} />;
  return <Badge label="low" bg="rgba(100,116,139,0.1)" color={C.faint} />;
}

function FPStatusBadge({ v }: { v: string }) {
  if (v === "ready_for_signal_intelligence") return <Badge label="ready" bg={C.accentBg} color={C.accent} />;
  if (v === "needs_more_sources") return <Badge label="needs sources" bg={C.yellowBg} color={C.yellow} />;
  if (v === "needs_human_check")  return <Badge label="human check"  bg={C.orangeBg}  color={C.orange} />;
  if (v === "rejected_by_mesodma") return <Badge label="rejected"   bg={C.redBg}     color={C.red} />;
  return <Badge label={fmt(v)} bg="rgba(100,116,139,0.1)" color={C.faint} />;
}

function SectionHeader({ label, title, right }: { label: string; title: string; right?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 14 }}>
      <div>
        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.45em", textTransform: "uppercase", color: C.faint, margin: "0 0 3px" }}>{label}</p>
        <h2 style={{ fontSize: 17, fontWeight: 800, color: C.text, letterSpacing: "-0.02em", margin: 0 }}>{title}</h2>
      </div>
      {right}
    </div>
  );
}

function TableWrap({ headers, children, empty, emptyMsg }: {
  headers: string[]; children: React.ReactNode; empty: boolean; emptyMsg?: string;
}) {
  return (
    <div style={{ borderRadius: 10, border: `1px solid ${C.border}`, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead style={{ background: C.panelDark, borderBottom: `1px solid ${C.border}` }}>
          <tr>
            {headers.map(h => (
              <th key={h} style={{ padding: "9px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, letterSpacing: "0.35em", textTransform: "uppercase", color: C.faint, whiteSpace: "nowrap" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {empty ? (
            <tr>
              <td colSpan={headers.length} style={{ padding: "40px 20px", textAlign: "center", color: C.faint, fontSize: 13 }}>
                {emptyMsg ?? "No records found."}
              </td>
            </tr>
          ) : children}
        </tbody>
      </table>
    </div>
  );
}

const TD: React.CSSProperties = { padding: "11px 14px", verticalAlign: "middle", borderBottom: `1px solid ${C.border}` };
const inputStyle: React.CSSProperties = { width: "100%", padding: "8px 11px", borderRadius: 7, border: `1px solid ${C.border}`, background: C.input, color: C.text, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "system-ui, -apple-system, sans-serif" };
const labelStyle: React.CSSProperties = { display: "block", fontSize: 10, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: C.faint, marginBottom: 5 };
const btnBase: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none" };

// ── Main page ─────────────────────────────────────────────────────────────────

export default function MesodmaV1() {
  // Stats
  const [stats,        setStats]       = useState<V1Stats | null>(null);
  const [statsErr,     setStatsErr]    = useState<string | null>(null);

  // Raw items queue
  const [rawItems,     setRawItems]    = useState<RawItem[]>([]);
  const [rawTotal,     setRawTotal]    = useState(0);
  const [rawLoading,   setRawLoading]  = useState(true);
  const [processing,   setProcessing]  = useState<Set<string>>(new Set());
  const [procResults,  setProcResults] = useState<Map<string, ProcessResult>>(new Map());

  // Candidate evidence
  const [candidates,   setCandidates]  = useState<CandidateEvidence[]>([]);
  const [candTotal,    setCandTotal]   = useState(0);
  const [candLoading,  setCandLoading] = useState(true);

  // First-pass signals
  const [fps,          setFps]         = useState<FirstPassSignal[]>([]);
  const [fpsTotal,     setFpsTotal]    = useState(0);
  const [fpsLoading,   setFpsLoading]  = useState(true);

  // Training examples
  const [examples,     setExamples]    = useState<TrainingExample[]>([]);
  const [exLoading,    setExLoading]   = useState(true);
  const [addExOpen,    setAddExOpen]   = useState(false);
  const [exForm,       setExForm]      = useState<ExampleForm>(BLANK_EXAMPLE);
  const [exSaving,     setExSaving]    = useState(false);
  const [exErr,        setExErr]       = useState<string | null>(null);

  // Runs log
  const [runs,         setRuns]        = useState<MesodmaRun[]>([]);
  const [runsTotal,    setRunsTotal]   = useState(0);
  const [runsLoading,  setRunsLoading] = useState(true);
  const [expandedRun,  setExpandedRun] = useState<string | null>(null);

  // ── Data loaders ────────────────────────────────────────────────────────────

  const loadStats = useCallback(() => {
    fetch("/api/mesodma/stats")
      .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
      .then((d) => setStats({
        raw_items_pending:        d.raw_items_pending        ?? 0,
        candidate_evidence_count: d.candidate_evidence_count ?? 0,
        first_pass_signals_ready: d.first_pass_signals_ready ?? 0,
        rejected_noise_count:     d.rejected_noise_count     ?? 0,
        mesodma_runs_count:       d.mesodma_runs_count       ?? 0,
      }))
      .catch(e => setStatsErr(String(e)));
  }, []);

  const loadRawItems = useCallback(() => {
    setRawLoading(true);
    fetch("/api/mesodma/raw-items?signal_processing_status_in=pending,needs_enrichment&include_null=true&status=extracted&limit=50")
      .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
      .then(d => { setRawItems(d.items ?? []); setRawTotal(d.total ?? 0); })
      .catch(() => {})
      .finally(() => setRawLoading(false));
  }, []);

  const loadCandidates = useCallback(() => {
    setCandLoading(true);
    fetch("/api/mesodma/candidates?limit=50")
      .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
      .then(d => { setCandidates(d.candidates ?? []); setCandTotal(d.total ?? 0); })
      .catch(() => {})
      .finally(() => setCandLoading(false));
  }, []);

  const loadFps = useCallback(() => {
    setFpsLoading(true);
    fetch("/api/mesodma/first-pass-signals?limit=50")
      .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
      .then(d => { setFps(d.signals ?? []); setFpsTotal(d.total ?? 0); })
      .catch(() => {})
      .finally(() => setFpsLoading(false));
  }, []);

  const loadExamples = useCallback(() => {
    setExLoading(true);
    fetch("/api/mesodma/training-examples")
      .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
      .then(d => setExamples(d.examples ?? []))
      .catch(() => {})
      .finally(() => setExLoading(false));
  }, []);

  const loadRuns = useCallback(() => {
    setRunsLoading(true);
    fetch("/api/mesodma/runs?limit=50")
      .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
      .then(d => { setRuns(d.runs ?? []); setRunsTotal(d.total ?? 0); })
      .catch(() => {})
      .finally(() => setRunsLoading(false));
  }, []);

  useEffect(() => {
    loadStats();
    loadRawItems();
    loadCandidates();
    loadFps();
    loadExamples();
    loadRuns();
  }, [loadStats, loadRawItems, loadCandidates, loadFps, loadExamples, loadRuns]);

  // ── Process raw item ────────────────────────────────────────────────────────

  async function processItem(rawItemId: string) {
    setProcessing(prev => new Set(prev).add(rawItemId));
    try {
      const res = await fetch("/api/mesodma/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw_item_id: rawItemId }),
      });
      const data = await res.json() as ProcessResult;
      setProcResults(prev => new Map(prev).set(rawItemId, data));
      loadStats();
      loadRawItems();
      loadCandidates();
      loadFps();
      loadRuns();
    } catch (e) {
      setProcResults(prev => new Map(prev).set(rawItemId, { route_taken: "error", error: String(e) }));
    } finally {
      setProcessing(prev => { const n = new Set(prev); n.delete(rawItemId); return n; });
    }
  }

  // ── Add training example ────────────────────────────────────────────────────

  async function submitExample() {
    if (!exForm.title.trim()) { setExErr("Title is required."); return; }
    setExSaving(true); setExErr(null);
    try {
      const res = await fetch("/api/mesodma/training-examples", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(exForm),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? `HTTP ${res.status}`); }
      setExForm(BLANK_EXAMPLE); setAddExOpen(false);
      loadExamples();
    } catch (e) {
      setExErr(e instanceof Error ? e.message : String(e));
    } finally {
      setExSaving(false);
    }
  }

  // ── Process result renderer ─────────────────────────────────────────────────

  function ProcessResultBadge({ result }: { result: ProcessResult }) {
    const rt = result.route_taken;
    if (rt === "rejected_noise" || rt === "rejected_at_doctrine_filter") {
      return <Badge label="rejected" bg={C.redBg} color={C.red} />;
    }
    if (rt === "needs_enrichment") {
      return <Badge label="needs enrichment" bg={C.yellowBg} color={C.yellow} />;
    }
    if (rt === "promoted_to_first_pass_signal") {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Badge label={`signal ${result.signal_potential ?? ""}`} bg={C.greenBg} color={C.green} />
          <span style={{ fontSize: 10, color: C.faint }}>{pct(result.confidence)} conf</span>
        </div>
      );
    }
    if (rt === "stored_as_candidate_evidence" || rt === "candidate_evidence_stored") {
      return <Badge label="candidate stored" bg={C.accentBg} color={C.accent} />;
    }
    if (result.error) {
      return <Badge label="error" bg={C.redBg} color={C.red} />;
    }
    return <Badge label={rt} bg="rgba(100,116,139,0.1)" color={C.faint} />;
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1400 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.5em", textTransform: "uppercase", color: C.faint, marginBottom: 4 }}>CE Admin · Mesodma V1</p>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: C.text, letterSpacing: "-0.025em", margin: "0 0 6px" }}>MESODMA — Signal vs. Noise Engine</h1>
        <p style={{ fontSize: 13, color: C.faint, margin: 0, fontStyle: "italic" }}>Visibility is a lagging indicator of structural reality.</p>
      </div>

      {/* ── Stats Bar ──────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 12, marginBottom: 36, flexWrap: "wrap" }}>
        {statsErr ? (
          <p style={{ fontSize: 12, color: C.red }}>{statsErr}</p>
        ) : stats ? (
          <>
            <StatTile label="Raw Items Pending"     value={stats.raw_items_pending}        color={stats.raw_items_pending > 0 ? C.yellow : C.text} />
            <StatTile label="Candidate Evidence"    value={stats.candidate_evidence_count} color={C.accent} />
            <StatTile label="First-Pass Signals"    value={stats.first_pass_signals_ready} color={stats.first_pass_signals_ready > 0 ? C.green : C.text} />
            <StatTile label="Rejected Noise"        value={stats.rejected_noise_count}     color={stats.rejected_noise_count > 0 ? C.red : C.text} />
            <StatTile label="Mesodma Runs"          value={stats.mesodma_runs_count}       color={C.muted} />
          </>
        ) : (
          <p style={{ fontSize: 12, color: C.faint }}>Loading stats…</p>
        )}
      </div>

      {/* ── Section 1: Raw Items Queue ─────────────────────────────────────── */}
      <div style={{ marginBottom: 36 }}>
        <SectionHeader
          label="Section 1"
          title={`Raw Items Queue${rawTotal > 0 ? ` — ${rawTotal}` : ""}`}
        />
        {rawLoading ? (
          <p style={{ color: C.faint, fontSize: 13, padding: "24px 0" }}>Loading queue…</p>
        ) : (
          <TableWrap
            headers={["Title", "Source", "Domain", "Published", "Status", "Action"]}
            empty={rawItems.length === 0}
            emptyMsg="No items pending or needing enrichment."
          >
            {rawItems.map(item => {
              const ef = item.extracted_fields ?? {};
              const isProcessing = processing.has(item.id);
              const result = procResults.get(item.id);
              const wasDone = !!result;
              return (
                <tr key={item.id} style={{ background: C.panel }}>
                  <td style={{ ...TD, maxWidth: 320 }}>
                    {item.url ? (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: C.text, fontWeight: 600, fontSize: 12, textDecoration: "none", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.title}
                      </a>
                    ) : (
                      <p style={{ margin: 0, fontWeight: 600, fontSize: 12, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</p>
                    )}
                    {(ef.clean_summary as string | undefined) && (
                      <p style={{ margin: "4px 0 0", fontSize: 11, color: C.faint, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                        {ef.clean_summary as string}
                      </p>
                    )}
                  </td>
                  <td style={TD}><span style={{ fontSize: 11, color: C.muted }}>{item.sources?.name ?? "—"}</span></td>
                  <td style={TD}><span style={{ fontSize: 11, color: C.muted }}>{item.sources?.category ? fmt(item.sources.category) : "—"}</span></td>
                  <td style={TD}><span style={{ fontSize: 11, color: C.faint }}>{timeAgo(item.published_at)}</span></td>
                  <td style={TD}>
                    {item.signal_processing_status ? (
                      <Badge
                        label={item.signal_processing_status}
                        bg={item.signal_processing_status === "needs_enrichment" ? C.yellowBg : "rgba(100,116,139,0.1)"}
                        color={item.signal_processing_status === "needs_enrichment" ? C.yellow : C.faint}
                      />
                    ) : (
                      <span style={{ fontSize: 11, color: C.faint }}>—</span>
                    )}
                  </td>
                  <td style={{ ...TD, whiteSpace: "nowrap" }}>
                    {wasDone ? (
                      <ProcessResultBadge result={result!} />
                    ) : (
                      <button
                        onClick={() => processItem(item.id)}
                        disabled={isProcessing}
                        style={{ ...btnBase, padding: "5px 14px", background: isProcessing ? C.accentBg : C.accent, color: isProcessing ? C.accent : "#000", border: isProcessing ? `1px solid ${C.accentBorder}` : "none", opacity: isProcessing ? 0.8 : 1 }}
                      >
                        {isProcessing ? (
                          <>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "spin 1s linear infinite" }}>
                              <path d="M21 12a9 9 0 11-6.219-8.56" />
                            </svg>
                            Processing…
                          </>
                        ) : "Process"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </TableWrap>
        )}
        {!rawLoading && rawTotal > 50 && (
          <p style={{ marginTop: 10, fontSize: 11, color: C.faint }}>Showing 50 of {rawTotal}. Process items to clear the queue.</p>
        )}
      </div>

      {/* ── Section 2: Candidate Evidence ─────────────────────────────────── */}
      <div style={{ marginBottom: 36 }}>
        <SectionHeader label="Section 2" title={`Candidate Evidence${candTotal > 0 ? ` — ${candTotal}` : ""}`} />
        {candLoading ? (
          <p style={{ color: C.faint, fontSize: 13, padding: "24px 0" }}>Loading candidates…</p>
        ) : (
          <TableWrap
            headers={["Summary", "Domain", "Evidence Type", "Visibility Stage", "Noise Level", "Confidence", "Created"]}
            empty={candidates.length === 0}
            emptyMsg="No candidate evidence yet. Process raw items to generate candidates."
          >
            {candidates.map(c => (
              <tr key={c.id} style={{ background: C.panel }}>
                <td style={{ ...TD, maxWidth: 300 }}>
                  <p style={{ margin: 0, fontSize: 12, color: C.text, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                    {c.clean_summary ?? <em style={{ color: C.faint }}>no summary</em>}
                  </p>
                  {c.subcategory && <p style={{ margin: "3px 0 0", fontSize: 10, color: C.faint }}>{c.subcategory}</p>}
                </td>
                <td style={TD}><span style={{ fontSize: 11, color: C.muted }}>{c.domain ? fmt(c.domain) : "—"}</span></td>
                <td style={TD}><span style={{ fontSize: 11, color: C.muted }}>{c.evidence_type ? fmt(c.evidence_type) : "—"}</span></td>
                <td style={TD}>
                  <Badge
                    label={c.visibility_stage ?? "unknown"}
                    bg={c.visibility_stage === "upstream" || c.visibility_stage === "early_distribution" ? C.accentBg : "rgba(100,116,139,0.1)"}
                    color={c.visibility_stage === "upstream" || c.visibility_stage === "early_distribution" ? C.accent : C.faint}
                  />
                </td>
                <td style={TD}>
                  <Badge
                    label={c.noise_level ?? "—"}
                    bg={c.noise_level === "low" ? C.greenBg : c.noise_level === "high" ? C.redBg : C.yellowBg}
                    color={c.noise_level === "low" ? C.green : c.noise_level === "high" ? C.red : C.yellow}
                  />
                </td>
                <td style={TD}><span style={{ fontSize: 12, color: C.muted }}>{pct(c.confidence)}</span></td>
                <td style={TD}><span style={{ fontSize: 11, color: C.faint }}>{timeAgo(c.created_at)}</span></td>
              </tr>
            ))}
          </TableWrap>
        )}
        {!candLoading && candTotal > 50 && (
          <p style={{ marginTop: 10, fontSize: 11, color: C.faint }}>Showing 50 of {candTotal}.</p>
        )}
      </div>

      {/* ── Section 3: First-Pass Signals ─────────────────────────────────── */}
      <div style={{ marginBottom: 36 }}>
        <SectionHeader label="Section 3" title={`First-Pass Signals${fpsTotal > 0 ? ` — ${fpsTotal}` : ""}`} />
        {fpsLoading ? (
          <p style={{ color: C.faint, fontSize: 13, padding: "24px 0" }}>Loading signals…</p>
        ) : (
          <TableWrap
            headers={["Domain", "Signal Potential", "First-Pass Signal", "Constraint Shift", "Confidence", "Status", "Created"]}
            empty={fps.length === 0}
            emptyMsg="No first-pass signals yet. Process high-quality items to generate signals."
          >
            {fps.map(s => (
              <tr key={s.id} style={{ background: C.panel }}>
                <td style={TD}><span style={{ fontSize: 11, color: C.muted }}>{s.domain ? fmt(s.domain) : "—"}</span></td>
                <td style={TD}><SignalPotentialBadge v={s.signal_potential} /></td>
                <td style={{ ...TD, maxWidth: 340 }}>
                  <p style={{ margin: 0, fontSize: 12, color: C.text, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>
                    {s.first_pass_signal ?? <em style={{ color: C.faint }}>no signal statement</em>}
                  </p>
                </td>
                <td style={{ ...TD, maxWidth: 200 }}>
                  <p style={{ margin: 0, fontSize: 11, color: C.faint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.possible_constraint_shift ?? "—"}
                  </p>
                </td>
                <td style={TD}><span style={{ fontSize: 12, color: C.muted }}>{pct(s.confidence)}</span></td>
                <td style={TD}><FPStatusBadge v={s.status} /></td>
                <td style={TD}><span style={{ fontSize: 11, color: C.faint }}>{timeAgo(s.created_at)}</span></td>
              </tr>
            ))}
          </TableWrap>
        )}
        {!fpsLoading && fpsTotal > 50 && (
          <p style={{ marginTop: 10, fontSize: 11, color: C.faint }}>Showing 50 of {fpsTotal}.</p>
        )}
      </div>

      {/* ── Section 4: Training Examples ──────────────────────────────────── */}
      <div style={{ marginBottom: 36 }}>
        <SectionHeader
          label="Section 4"
          title="Training Examples"
          right={
            <button
              onClick={() => setAddExOpen(v => !v)}
              style={{ ...btnBase, padding: "7px 16px", background: addExOpen ? C.accentBg : C.accent, color: addExOpen ? C.accent : "#000", border: addExOpen ? `1px solid ${C.accentBorder}` : "none" }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              {addExOpen ? "Close" : "Add Example"}
            </button>
          }
        />

        {addExOpen && (
          <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, padding: "20px 24px", marginBottom: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 20px" }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Title *</label>
                <input style={inputStyle} value={exForm.title} onChange={e => setExForm(p => ({ ...p, title: e.target.value }))} placeholder="Short descriptor of this example" />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Input Text</label>
                <textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} value={exForm.input_text} onChange={e => setExForm(p => ({ ...p, input_text: e.target.value }))} placeholder="The raw item text this example is based on" />
              </div>
              <div>
                <label style={labelStyle}>Expected Route</label>
                <select style={{ ...inputStyle, cursor: "pointer" }} value={exForm.expected_route} onChange={e => setExForm(p => ({ ...p, expected_route: e.target.value }))}>
                  <option value="">Select…</option>
                  <option value="reject_noise">reject_noise</option>
                  <option value="candidate_evidence">candidate_evidence</option>
                  <option value="promote_first_pass_signal">promote_first_pass_signal</option>
                  <option value="needs_more_sources">needs_more_sources</option>
                  <option value="needs_human_check">needs_human_check</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Example Category</label>
                <select style={{ ...inputStyle, cursor: "pointer" }} value={exForm.example_category} onChange={e => setExForm(p => ({ ...p, example_category: e.target.value }))}>
                  <option value="">Select…</option>
                  <option value="obvious_noise">obvious_noise</option>
                  <option value="candidate_evidence">candidate_evidence</option>
                  <option value="strong_signal">strong_signal</option>
                  <option value="false_signal_trap">false_signal_trap</option>
                  <option value="edge_case">edge_case</option>
                </select>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Lesson</label>
                <textarea style={{ ...inputStyle, minHeight: 64, resize: "vertical" }} value={exForm.lesson} onChange={e => setExForm(p => ({ ...p, lesson: e.target.value }))} placeholder="What should the pipeline learn from this example?" />
              </div>
            </div>
            {exErr && <p style={{ marginTop: 12, fontSize: 12, color: C.red }}>{exErr}</p>}
            <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
              <button onClick={submitExample} disabled={exSaving} style={{ ...btnBase, padding: "8px 20px", background: C.accent, color: "#000", opacity: exSaving ? 0.7 : 1 }}>
                {exSaving ? "Saving…" : "Save Example"}
              </button>
              <button onClick={() => { setExForm(BLANK_EXAMPLE); setAddExOpen(false); setExErr(null); }} style={{ ...btnBase, padding: "8px 16px", background: "transparent", border: `1px solid ${C.border}`, color: C.muted }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {exLoading ? (
          <p style={{ color: C.faint, fontSize: 13, padding: "24px 0" }}>Loading examples…</p>
        ) : (
          <TableWrap
            headers={["Title", "Expected Route", "Category", "Lesson", "Created"]}
            empty={examples.length === 0}
            emptyMsg="No training examples yet. Add examples to calibrate module behavior."
          >
            {examples.map(ex => (
              <tr key={ex.id} style={{ background: C.panel }}>
                <td style={{ ...TD, maxWidth: 260 }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 12, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ex.title}</p>
                </td>
                <td style={TD}><span style={{ fontSize: 11, color: C.muted }}>{ex.expected_route ?? "—"}</span></td>
                <td style={TD}><span style={{ fontSize: 11, color: C.muted }}>{ex.example_category ? fmt(ex.example_category) : "—"}</span></td>
                <td style={{ ...TD, maxWidth: 280 }}>
                  <p style={{ margin: 0, fontSize: 11, color: C.faint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ex.lesson ?? "—"}</p>
                </td>
                <td style={TD}><span style={{ fontSize: 11, color: C.faint }}>{timeAgo(ex.created_at)}</span></td>
              </tr>
            ))}
          </TableWrap>
        )}
      </div>

      {/* ── Section 5: Runs Log ────────────────────────────────────────────── */}
      <div style={{ marginBottom: 36 }}>
        <SectionHeader label="Section 5" title={`Runs Log${runsTotal > 0 ? ` — ${runsTotal} total` : ""}`} />
        {runsLoading ? (
          <p style={{ color: C.faint, fontSize: 13, padding: "24px 0" }}>Loading runs…</p>
        ) : (
          <div style={{ borderRadius: 10, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead style={{ background: C.panelDark, borderBottom: `1px solid ${C.border}` }}>
                <tr>
                  {["Module", "Model", "Route", "Confidence", "Error", "Created", ""].map(h => (
                    <th key={h} style={{ padding: "9px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, letterSpacing: "0.35em", textTransform: "uppercase", color: C.faint, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {runs.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: "40px 20px", textAlign: "center", color: C.faint, fontSize: 13 }}>No runs logged yet.</td>
                  </tr>
                ) : runs.map(run => {
                  const isExpanded = expandedRun === run.id;
                  return (
                    <React.Fragment key={run.id}>
                      <tr style={{ background: C.panel }}>
                        <td style={TD}>
                          <Badge
                            label={fmt(run.module_name)}
                            bg={run.module_name === "doctrine_filter" || run.module_name === "skeptic_check" ? "rgba(139,92,246,0.12)" : C.accentBg}
                            color={run.module_name === "doctrine_filter" || run.module_name === "skeptic_check" ? "#a78bfa" : C.accent}
                          />
                        </td>
                        <td style={TD}><span style={{ fontSize: 11, color: C.faint }}>{run.model_used ?? "—"}</span></td>
                        <td style={TD}><span style={{ fontSize: 11, color: C.muted }}>{run.route ?? "—"}</span></td>
                        <td style={TD}><span style={{ fontSize: 12, color: C.muted }}>{pct(run.confidence)}</span></td>
                        <td style={TD}>
                          {run.error_flag
                            ? <Badge label="error" bg={C.redBg} color={C.red} />
                            : <Badge label="ok" bg={C.greenBg} color={C.green} />
                          }
                        </td>
                        <td style={TD}><span style={{ fontSize: 11, color: C.faint }}>{timeAgo(run.created_at)}</span></td>
                        <td style={TD}>
                          <button
                            onClick={() => setExpandedRun(isExpanded ? null : run.id)}
                            style={{ ...btnBase, padding: "4px 10px", background: "transparent", border: `1px solid ${C.border}`, color: C.faint, fontSize: 11 }}
                          >
                            {isExpanded ? "Hide" : "Inspect"}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr style={{ background: C.panelDark }}>
                          <td colSpan={7} style={{ padding: "16px 20px" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                              <div>
                                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: C.faint, margin: "0 0 8px" }}>Input Snapshot</p>
                                <pre style={{ margin: 0, fontSize: 11, color: C.muted, background: C.input, border: `1px solid ${C.border}`, borderRadius: 7, padding: "10px 14px", overflow: "auto", maxHeight: 200, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                                  {JSON.stringify(run.input_snapshot, null, 2)}
                                </pre>
                              </div>
                              <div>
                                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: C.faint, margin: "0 0 8px" }}>Output JSON</p>
                                <pre style={{ margin: 0, fontSize: 11, color: C.muted, background: C.input, border: `1px solid ${C.border}`, borderRadius: 7, padding: "10px 14px", overflow: "auto", maxHeight: 200, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                                  {JSON.stringify(run.output_json, null, 2)}
                                </pre>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {!runsLoading && runsTotal > 50 && (
          <p style={{ marginTop: 10, fontSize: 11, color: C.faint }}>Showing 50 of {runsTotal} most recent runs.</p>
        )}
      </div>

    </div>
  );
}
