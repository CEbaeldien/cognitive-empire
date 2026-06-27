"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { SignalRow, SignalStatus, SignalCategory, SignalState } from "@/types/signals";

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
  input:        "#0a0919",
} as const;

const STATUS_TABS: { value: string; label: string }[] = [
  { value: "",          label: "All" },
  { value: "draft",     label: "Draft" },
  { value: "in_review", label: "In Review" },
  { value: "approved",  label: "Approved" },
  { value: "published", label: "Published" },
  { value: "rejected",  label: "Rejected" },
];

const CATEGORIES: { value: SignalCategory; label: string }[] = [
  { value: "intelligence",         label: "Intelligence" },
  { value: "governance_stability", label: "Governance & Stability" },
  { value: "infrastructure",       label: "Infrastructure" },
];

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "—";
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 2) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
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
    <span style={{ padding: "3px 10px", borderRadius: 6, background: bg, color, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
      {status.replace("_", " ")}
    </span>
  );
}

const SIGNAL_STATE_COLORS: Record<SignalState, [string, string]> = {
  act_now:      ["rgba(251,191,36,0.15)",  "#fbbf24"],
  directional:  ["rgba(241,245,249,0.12)", "#f1f5f9"],
  growing:      ["rgba(74,222,128,0.12)",  "#86efac"],
  watch:        ["rgba(96,165,250,0.12)",  "#93c5fd"],
  contradicted: ["rgba(239,68,68,0.12)",   "#f87171"],
  raw:          ["rgba(100,116,139,0.10)", "#64748b"],
  potential:    ["rgba(100,116,139,0.10)", "#64748b"],
  retire:       ["rgba(51,65,85,0.15)",    "#475569"],
};

function SignalStateBadge({ state }: { state: SignalState }) {
  const [bg, color] = SIGNAL_STATE_COLORS[state] ?? ["rgba(100,116,139,0.10)", "#64748b"];
  const label = state === "act_now" ? "ACT NOW" : state.replace("_", " ");
  return (
    <span style={{ padding: "2px 8px", borderRadius: 5, background: bg, color, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
      {label}
    </span>
  );
}

export default function SignalsListPage() {
  const [signals,  setSignals]  = useState<SignalRow[]>([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [fetchErr, setFetchErr] = useState<string | null>(null);

  const [statusFilter,    setStatusFilter]    = useState<string>("");
  const [categoryFilter,  setCategoryFilter]  = useState<string>("");
  const [baseOnlyFilter,  setBaseOnlyFilter]  = useState<boolean>(false);

  const load = useCallback(() => {
    setLoading(true);
    setFetchErr(null);
    const p = new URLSearchParams();
    if (statusFilter)   p.set("status",   statusFilter);
    if (categoryFilter) p.set("category", categoryFilter);
    p.set("limit", "100");

    fetch(`/api/signals?${p}`)
      .then((r) => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
      .then((d) => {
        let list: SignalRow[] = d.signals ?? [];
        if (baseOnlyFilter) list = list.filter((s) => s.is_base_signal);
        setSignals(list);
        setTotal(baseOnlyFilter ? list.length : (d.total ?? 0));
        setLoading(false);
      })
      .catch((e) => { setFetchErr(String(e)); setLoading(false); });
  }, [statusFilter, categoryFilter, baseOnlyFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{ padding: "28px 32px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.45em", textTransform: "uppercase", color: C.faint, marginBottom: 4 }}>CE Signals Admin</p>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: "-0.02em", margin: 0 }}>
            All Signals
            {!loading && <span style={{ marginLeft: 10, fontSize: 13, fontWeight: 400, color: C.faint }}>{total} total</span>}
          </h1>
        </div>
        <Link href="/ce-admin/signals/new" style={{ textDecoration: "none" }}>
          <button style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 8, background: C.accent, border: "none", color: "#000", fontSize: 13, fontWeight: 700, cursor: "pointer", letterSpacing: "0.01em" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            New Signal
          </button>
        </Link>
      </div>

      {/* Status Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16, borderBottom: `1px solid ${C.border}`, paddingBottom: 0 }}>
        {STATUS_TABS.map(({ value, label }) => {
          const active = statusFilter === value;
          const isReview = value === "in_review";
          return (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              style={{
                padding: "7px 14px", borderRadius: "7px 7px 0 0", border: "none", cursor: "pointer",
                fontSize: 12, fontWeight: active ? 700 : 400,
                background: active ? C.panel : "transparent",
                color: active ? (isReview ? "#fbbf24" : C.text) : C.faint,
                borderBottom: active ? `2px solid ${isReview ? "#fbbf24" : C.accent}` : "2px solid transparent",
                marginBottom: -1,
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Category + Base filter */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, alignItems: "center" }}>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 7, border: `1px solid ${C.border}`, background: C.input, color: categoryFilter ? C.text : C.faint, fontSize: 12, outline: "none", cursor: "pointer" }}
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>

        {categoryFilter && (
          <button
            onClick={() => setCategoryFilter("")}
            style={{ padding: "8px 12px", borderRadius: 7, border: `1px solid ${C.border}`, background: "transparent", color: C.faint, fontSize: 12, cursor: "pointer" }}
          >
            Clear
          </button>
        )}

        <label style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", marginLeft: 8 }}>
          <input
            type="checkbox"
            checked={baseOnlyFilter}
            onChange={(e) => setBaseOnlyFilter(e.target.checked)}
            style={{ accentColor: C.accent, width: 14, height: 14, cursor: "pointer" }}
          />
          <span style={{ fontSize: 12, color: baseOnlyFilter ? C.accent : C.faint, fontWeight: baseOnlyFilter ? 700 : 400 }}>
            Base signals only
          </span>
        </label>
      </div>

      {/* Table */}
      {loading ? (
        <p style={{ color: C.faint, fontSize: 13, padding: "40px 0", textAlign: "center" }}>Loading signals…</p>
      ) : fetchErr ? (
        <p style={{ color: "#f87171", fontSize: 13, padding: "40px 0", textAlign: "center" }}>{fetchErr}</p>
      ) : (
        <div style={{ borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead style={{ background: "#0c0b1e", borderBottom: `1px solid ${C.border}` }}>
              <tr>
                {["Title", "Category", "Status", "State", "Featured", "Created", "Updated", ""].map((h) => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, letterSpacing: "0.35em", textTransform: "uppercase", color: C.faint, whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {signals.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: "40px 20px", textAlign: "center", color: C.faint, fontSize: 13 }}>
                    No signals found{statusFilter || categoryFilter ? " for the selected filters" : ". Create your first signal."}.
                  </td>
                </tr>
              ) : signals.map((s) => (
                <tr key={s.id} style={{ borderBottom: `1px solid ${C.border}`, background: s.is_base_signal ? "rgba(251,191,36,0.03)" : C.panel }}>
                  <td style={{ padding: "12px 14px", verticalAlign: "middle", maxWidth: 320 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <Link href={`/ce-admin/signals/${s.id}`} style={{ textDecoration: "none", color: C.text, fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {s.title}
                      </Link>
                      {s.is_base_signal && (
                        <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.12em", color: "#fbbf24", background: "rgba(251,191,36,0.12)", padding: "1px 6px", borderRadius: 4, flexShrink: 0 }}>BASE</span>
                      )}
                    </div>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: C.faint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {s.summary.slice(0, 80)}{s.summary.length > 80 ? "…" : ""}
                    </p>
                  </td>
                  <td style={{ padding: "12px 14px", verticalAlign: "middle" }}>
                    <span style={{ fontSize: 11, color: C.muted }}>{CATEGORIES.find(c => c.value === s.category)?.label ?? s.category}</span>
                  </td>
                  <td style={{ padding: "12px 14px", verticalAlign: "middle" }}>
                    <StatusBadge status={s.status} />
                  </td>
                  <td style={{ padding: "12px 14px", verticalAlign: "middle" }}>
                    {s.signal_state
                      ? <SignalStateBadge state={s.signal_state} />
                      : <span style={{ fontSize: 11, color: C.faint }}>—</span>}
                  </td>
                  <td style={{ padding: "12px 14px", verticalAlign: "middle", textAlign: "center" }}>
                    {s.is_featured
                      ? <span style={{ color: C.accent, fontSize: 13 }}>★</span>
                      : <span style={{ color: C.faint, fontSize: 11 }}>—</span>}
                  </td>
                  <td style={{ padding: "12px 14px", verticalAlign: "middle", color: C.faint, fontSize: 11 }}>
                    {timeAgo(s.created_at)}
                  </td>
                  <td style={{ padding: "12px 14px", verticalAlign: "middle", color: C.faint, fontSize: 11 }}>
                    {timeAgo(s.updated_at)}
                  </td>
                  <td style={{ padding: "12px 14px", verticalAlign: "middle" }}>
                    <Link
                      href={`/ce-admin/signals/${s.id}`}
                      style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, fontSize: 11, fontWeight: 600, cursor: "pointer", textDecoration: "none", display: "inline-block" }}
                    >
                      Open
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
