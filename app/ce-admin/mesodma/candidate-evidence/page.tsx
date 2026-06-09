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
  green:        "#4ade80",
  greenBg:      "rgba(74,222,128,0.10)",
  yellow:       "#fbbf24",
  yellowBg:     "rgba(251,191,36,0.10)",
  red:          "#f87171",
  redBg:        "rgba(248,113,113,0.10)",
} as const;

type Candidate = {
  id: string;
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

function fmt(s: string) { return s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()); }
function pct(n: number | null | undefined) { return n == null ? "—" : `${Math.round(n * 100)}%`; }
function timeAgo(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 2) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function Badge({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <span style={{ padding: "3px 9px", borderRadius: 5, background: bg, color, fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

const TD: React.CSSProperties = { padding: "11px 14px", verticalAlign: "middle", borderBottom: `1px solid ${C.border}` };

export default function CandidateEvidencePage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [total,      setTotal]      = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [filterDomain, setFilterDomain] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "100" });
    if (filterDomain) params.set("domain", filterDomain);
    fetch(`/api/mesodma/candidates?${params}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { setCandidates(d.candidates ?? []); setTotal(d.total ?? 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filterDomain]);

  useEffect(() => { load(); }, [load]);

  const selStyle: React.CSSProperties = { padding: "6px 10px", borderRadius: 7, border: `1px solid ${C.border}`, background: "#0a0919", color: C.text, fontSize: 12, outline: "none", cursor: "pointer" };
  const btnBase: React.CSSProperties  = { display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 14px", borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "none" };

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1400 }}>
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.5em", textTransform: "uppercase", color: C.faint, marginBottom: 4 }}>CE Admin · Mesodma</p>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: "-0.025em", margin: "0 0 4px" }}>
          Candidate Evidence {total > 0 && <span style={{ fontSize: 14, color: C.accent, fontWeight: 700 }}>{total}</span>}
        </h1>
        <p style={{ fontSize: 12, color: C.faint, margin: 0 }}>
          Structured evidence that passed noise filtering. Read-only — items accumulate until convergence or expiry.
        </p>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        <select style={selStyle} value={filterDomain} onChange={e => setFilterDomain(e.target.value)}>
          <option value="">All domains</option>
          <option value="intelligence">Intelligence</option>
          <option value="infrastructure">Infrastructure</option>
          <option value="governance_stability">Governance &amp; Stability</option>
        </select>
        <button onClick={load} style={{ ...btnBase, background: C.accentBg, color: C.accent, border: `1px solid ${C.accentBorder}` }}>
          Refresh
        </button>
      </div>

      {loading ? (
        <p style={{ color: C.faint, fontSize: 13, padding: "24px 0" }}>Loading…</p>
      ) : (
        <div style={{ borderRadius: 10, border: `1px solid ${C.border}`, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead style={{ background: C.panelDark, borderBottom: `1px solid ${C.border}` }}>
              <tr>
                {["Summary", "Domain", "Evidence Type", "Visibility", "Noise", "Confidence", "Age"].map(h => (
                  <th key={h} style={{ padding: "9px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, letterSpacing: "0.35em", textTransform: "uppercase", color: C.faint, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {candidates.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "40px 20px", textAlign: "center", color: C.faint, fontSize: 13 }}>
                    No candidate evidence yet.
                  </td>
                </tr>
              ) : candidates.map(c => (
                <tr key={c.id} style={{ background: C.panel }}>
                  <td style={{ ...TD, maxWidth: 320 }}>
                    <p style={{ margin: 0, fontSize: 12, color: C.text, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                      {c.clean_summary ?? <em style={{ color: C.faint }}>—</em>}
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
            </tbody>
          </table>
        </div>
      )}
      {!loading && total > 100 && (
        <p style={{ marginTop: 10, fontSize: 11, color: C.faint }}>Showing 100 of {total} records.</p>
      )}
    </div>
  );
}
