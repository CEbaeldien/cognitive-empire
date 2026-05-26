"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// ── Palette (deep purple accent — distinguishes from operator blue) ────────────
const C = {
  bg:          "#09091c",
  sidebar:     "#07071a",
  panel:       "#0e0c1f",
  border:      "#1c1a35",
  accent:      "#7c3aed",
  accentBg:    "rgba(124,58,237,0.12)",
  accentBorder:"rgba(124,58,237,0.3)",
  text:        "#f1f5f9",
  muted:       "#94a3b8",
  faint:       "#64748b",
  input:       "#0a0919",
} as const;

// ── Types ─────────────────────────────────────────────────────────────────────

type Workspace = {
  id: string; name: string; status: string; created_at: string;
  owner_email: string | null; opportunities_count: number;
  critical_count: number; revenue: number; last_scored: string | null;
  health_status: "HEALTHY" | "AT RISK" | "CRITICAL";
};

type UserRow = {
  id: string; email: string; created_at: string; last_sign_in_at: string | null;
  workspace_name: string | null; role: string | null; status: string;
};

type ActivityItem = { timestamp: string; workspace_name: string; event: string; type: string };

type ScoringRun = {
  workspace_name: string; scored_at: string; opportunities_scored: number;
  critical_found: number; avg_score: number;
};

type ImportLog = {
  id: string; workspace_name: string; created_at: string; file: string;
  total: number; successful: number; failed: number; status: string;
};

type CEData = {
  kpis: { total_workspaces: number; total_operators: number; total_opportunities: number; critical_decay: number; total_revenue: number };
  workspaces: Workspace[];
  users: UserRow[];
  system: { db: Record<string, number>; last_scored_at: string | null; supabase_connected: boolean };
  scoring_runs: ScoringRun[];
  import_logs: ImportLog[];
  activity_feed: ActivityItem[];
};

type View = "overview" | "workspaces" | "users" | "health" | "scoring" | "imports" | "settings";

// ── Helpers ───────────────────────────────────────────────────────────────────

function usd(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 2) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ── Sort helper ───────────────────────────────────────────────────────────────

function sorted<T>(arr: T[], col: string, asc: boolean): T[] {
  if (!col) return arr;
  return [...arr].sort((a: any, b: any) => {
    const va = a[col], vb = b[col];
    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;
    return (va < vb ? -1 : va > vb ? 1 : 0) * (asc ? 1 : -1);
  });
}

// ── Column header component ───────────────────────────────────────────────────

function Th({ label, col, sortCol, sortAsc, onSort }: {
  label: string; col: string; sortCol: string; sortAsc: boolean;
  onSort: (c: string) => void;
}) {
  const active = sortCol === col;
  return (
    <th
      onClick={() => onSort(col)}
      style={{ padding: "10px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, letterSpacing: "0.35em", textTransform: "uppercase", color: active ? C.accent : C.faint, cursor: "pointer", whiteSpace: "nowrap", userSelect: "none" }}
    >
      {label}{active ? (sortAsc ? " ↑" : " ↓") : ""}
    </th>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, valueColor }: { label: string; value: string | number; sub?: string; valueColor?: string }) {
  return (
    <div style={{ borderRadius: 12, border: `1px solid ${C.border}`, background: C.panel, padding: "18px 20px" }}>
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.4em", textTransform: "uppercase", color: C.faint, marginBottom: 10 }}>{label}</p>
      <p style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", color: valueColor ?? C.text, lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: C.faint, marginTop: 6 }}>{sub}</p>}
    </div>
  );
}

// ── Health badge ──────────────────────────────────────────────────────────────

function HealthBadge({ status }: { status: string }) {
  const colors: Record<string, [string, string]> = {
    HEALTHY:  ["rgba(34,197,94,0.1)",  "#4ade80"],
    "AT RISK":["rgba(234,179,8,0.1)", "#fbbf24"],
    CRITICAL: ["rgba(239,68,68,0.1)",  "#f87171"],
  };
  const [bg, color] = colors[status] ?? ["rgba(100,116,139,0.1)", C.faint];
  return (
    <span style={{ padding: "3px 10px", borderRadius: 6, background: bg, color, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em" }}>
      {status}
    </span>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function Empty({ msg = "No data available." }: { msg?: string }) {
  return (
    <tr>
      <td colSpan={99} style={{ padding: "40px 20px", textAlign: "center", color: C.faint, fontSize: 13 }}>{msg}</td>
    </tr>
  );
}

// ── Table wrapper ─────────────────────────────────────────────────────────────

function Table({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        {children}
      </table>
    </div>
  );
}

function THead({ children }: { children: React.ReactNode }) {
  return (
    <thead style={{ background: "#0c0b1e", borderBottom: `1px solid ${C.border}` }}>
      <tr>{children}</tr>
    </thead>
  );
}

function TBody({ children }: { children: React.ReactNode }) {
  return <tbody>{children}</tbody>;
}

function TD({ children, style }: { children?: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <td style={{ padding: "12px 14px", color: C.muted, verticalAlign: "middle", borderBottom: `1px solid ${C.border}`, ...style }}>
      {children}
    </td>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

const IcoOverview = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
  </svg>
);

const IcoWorkspaces = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const IcoUsers = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87" />
    <path d="M16 3.13a4 4 0 010 7.75" />
  </svg>
);

const IcoHealth = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const IcoScoring = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);

const IcoImports = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const IcoSettings = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
);

const IcoChevron = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

// ── Main component ────────────────────────────────────────────────────────────

export default function CEAdminDrift() {
  const router = useRouter();

  // ── Auth ──────────────────────────────────────────────────────────────────────
  const [authChecked, setAuthChecked] = useState(false);
  const [userEmail, setUserEmail]     = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const email = session?.user?.email ?? null;
      setUserEmail(email);
      if (email !== "founder@cognitiveempire.com") {
        router.replace("/auth/signin");
        return;
      }
      setAuthChecked(true);
    });
  }, [router]);

  // ── Data ──────────────────────────────────────────────────────────────────────
  const [data,    setData]    = useState<CEData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchErr, setFetchErr] = useState<string | null>(null);

  useEffect(() => {
    if (!authChecked) return;
    fetch("/api/ce-admin/overview")
      .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
      .then(d  => { setData(d); setLoading(false); })
      .catch(e => { setFetchErr(String(e)); setLoading(false); });
  }, [authChecked]);

  // ── UI state ──────────────────────────────────────────────────────────────────
  const [view, setView]             = useState<View>("overview");
  const [sortCol, setSortCol]       = useState("");
  const [sortAsc, setSortAsc]       = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const [confirm, setConfirm]       = useState<{ title: string; msg: string; onOk: () => void } | null>(null);
  const [sysNotes, setSysNotes]     = useState("");

  function toggleSort(col: string) {
    setSortCol(s => {
      if (s === col) { setSortAsc(a => !a); return col; }
      setSortAsc(true);
      return col;
    });
  }

  function switchView(v: View) {
    setView(v);
    setSortCol("");
    setSortAsc(true);
  }

  useEffect(() => {
    if (!showProfile) return;
    function h(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [showProfile]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    document.cookie = "sb-auth=; path=/; max-age=0";
    router.replace("/auth/signin");
  }

  // ── Auth gate ─────────────────────────────────────────────────────────────────
  if (!authChecked) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <p style={{ fontSize: 13, color: C.faint }}>Checking authorization…</p>
      </div>
    );
  }

  // ── Render helpers ────────────────────────────────────────────────────────────

  function renderOverview() {
    if (!data) return null;
    const { kpis, workspaces, activity_feed } = data;
    const wsRows = sorted(workspaces, sortCol, sortAsc);

    return (
      <div style={{ padding: "28px 32px" }}>
        {/* KPI strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 28 }}>
          <KpiCard label="Total Workspaces"   value={kpis.total_workspaces} />
          <KpiCard label="Total Operators"    value={kpis.total_operators} />
          <KpiCard label="Total Opportunities" value={kpis.total_opportunities} />
          <KpiCard label="Critical Decay (Global)" value={kpis.critical_decay}
            valueColor={kpis.critical_decay > 0 ? "#f87171" : C.muted} />
          <KpiCard label="Revenue Exposure"   value={usd(kpis.total_revenue)}
            valueColor="#c4b5fd" />
        </div>

        {/* Two-panel row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16 }}>

          {/* Panel A — Workspace Health */}
          <div style={{ borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            <div style={{ background: "#0c0b1e", borderBottom: `1px solid ${C.border}`, padding: "14px 18px" }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: C.text }}>Workspace Health</p>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <THead>
                <Th label="Workspace"       col="name"               sortCol={sortCol} sortAsc={sortAsc} onSort={toggleSort} />
                <Th label="Operator"        col="owner_email"        sortCol={sortCol} sortAsc={sortAsc} onSort={toggleSort} />
                <Th label="Opps"            col="opportunities_count" sortCol={sortCol} sortAsc={sortAsc} onSort={toggleSort} />
                <Th label="Critical"        col="critical_count"     sortCol={sortCol} sortAsc={sortAsc} onSort={toggleSort} />
                <Th label="Revenue"         col="revenue"            sortCol={sortCol} sortAsc={sortAsc} onSort={toggleSort} />
                <Th label="Last Scored"     col="last_scored"        sortCol={sortCol} sortAsc={sortAsc} onSort={toggleSort} />
                <Th label="Status"          col="health_status"      sortCol={sortCol} sortAsc={sortAsc} onSort={toggleSort} />
              </THead>
              <TBody>
                {wsRows.length === 0 ? <Empty msg="No workspaces." /> : wsRows.map(ws => (
                  <tr key={ws.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <TD style={{ color: C.text, fontWeight: 600 }}>{ws.name}</TD>
                    <TD>{ws.owner_email ?? <span style={{ color: C.faint }}>—</span>}</TD>
                    <TD style={{ color: C.text }}>{ws.opportunities_count}</TD>
                    <TD style={{ color: ws.critical_count > 0 ? "#f87171" : C.muted }}>{ws.critical_count}</TD>
                    <TD style={{ color: "#c4b5fd" }}>{usd(ws.revenue)}</TD>
                    <TD style={{ fontSize: 11 }}>{timeAgo(ws.last_scored)}</TD>
                    <TD><HealthBadge status={ws.health_status} /></TD>
                  </tr>
                ))}
              </TBody>
            </table>
          </div>

          {/* Panel B — Activity Feed */}
          <div style={{ borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            <div style={{ background: "#0c0b1e", borderBottom: `1px solid ${C.border}`, padding: "14px 18px" }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: C.text }}>Recent Activity</p>
            </div>
            <div style={{ padding: "10px 0" }}>
              {activity_feed.length === 0 ? (
                <p style={{ padding: "24px 18px", fontSize: 12, color: C.faint, textAlign: "center" }}>No recent activity.</p>
              ) : activity_feed.map((item, i) => {
                const dotColor = item.type === "intervention" ? "#f97316" : item.type === "score" ? C.accent : "#22c55e";
                return (
                  <div key={i} style={{ display: "flex", gap: 12, padding: "10px 18px", borderBottom: i < activity_feed.length - 1 ? `1px solid ${C.border}` : "none" }}>
                    <div style={{ paddingTop: 5 }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: dotColor }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 11, color: C.text, lineHeight: 1.5, marginBottom: 2 }}>{item.event}</p>
                      <p style={{ fontSize: 10, color: C.faint }}>{item.workspace_name} · {timeAgo(item.timestamp)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderWorkspaces() {
    if (!data) return null;
    const rows = sorted(data.workspaces, sortCol, sortAsc);
    return (
      <div style={{ padding: "28px 32px" }}>
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.45em", textTransform: "uppercase", color: C.faint, marginBottom: 4 }}>CE Super Admin</p>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: "-0.02em", margin: 0 }}>All Workspaces</h1>
        </div>
        <Table>
          <THead>
            <Th label="Workspace Name" col="name"                sortCol={sortCol} sortAsc={sortAsc} onSort={toggleSort} />
            <Th label="Owner Email"    col="owner_email"         sortCol={sortCol} sortAsc={sortAsc} onSort={toggleSort} />
            <Th label="Created"        col="created_at"          sortCol={sortCol} sortAsc={sortAsc} onSort={toggleSort} />
            <Th label="Opportunities"  col="opportunities_count" sortCol={sortCol} sortAsc={sortAsc} onSort={toggleSort} />
            <Th label="Critical"       col="critical_count"      sortCol={sortCol} sortAsc={sortAsc} onSort={toggleSort} />
            <Th label="Revenue"        col="revenue"             sortCol={sortCol} sortAsc={sortAsc} onSort={toggleSort} />
            <Th label="Last Active"    col="last_scored"         sortCol={sortCol} sortAsc={sortAsc} onSort={toggleSort} />
            <th style={{ padding: "10px 14px", fontSize: 10, fontWeight: 700, letterSpacing: "0.35em", textTransform: "uppercase", color: C.faint }}>Actions</th>
          </THead>
          <TBody>
            {rows.length === 0 ? <Empty msg="No workspaces found." /> : rows.map(ws => (
              <tr key={ws.id} style={{ background: C.panel, borderBottom: `1px solid ${C.border}` }}>
                <TD style={{ color: C.text, fontWeight: 600 }}>{ws.name}</TD>
                <TD>{ws.owner_email ?? <span style={{ color: C.faint }}>—</span>}</TD>
                <TD style={{ fontSize: 12 }}>{fmtDate(ws.created_at)}</TD>
                <TD style={{ color: C.text }}>{ws.opportunities_count}</TD>
                <TD style={{ color: ws.critical_count > 0 ? "#f87171" : C.muted }}>{ws.critical_count}</TD>
                <TD style={{ color: "#c4b5fd" }}>{usd(ws.revenue)}</TD>
                <TD style={{ fontSize: 11 }}>{timeAgo(ws.last_scored)}</TD>
                <TD>
                  <div style={{ display: "flex", gap: 8 }}>
                    <a
                      href="/admin/drift"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, fontSize: 11, fontWeight: 600, cursor: "pointer", textDecoration: "none" }}
                    >
                      View
                    </a>
                    <button
                      onClick={() => setConfirm({
                        title: `Suspend "${ws.name}"?`,
                        msg: "This will mark the workspace as suspended. Operators will lose access.",
                        onOk: () => setConfirm(null),
                      })}
                      style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid rgba(239,68,68,0.35)", background: "transparent", color: "#f87171", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                    >
                      Suspend
                    </button>
                  </div>
                </TD>
              </tr>
            ))}
          </TBody>
        </Table>
      </div>
    );
  }

  function renderUsers() {
    if (!data) return null;
    const rows = sorted(data.users, sortCol, sortAsc);
    return (
      <div style={{ padding: "28px 32px" }}>
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.45em", textTransform: "uppercase", color: C.faint, marginBottom: 4 }}>CE Super Admin</p>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: "-0.02em", margin: 0 }}>Users</h1>
        </div>
        <Table>
          <THead>
            <Th label="Email"         col="email"            sortCol={sortCol} sortAsc={sortAsc} onSort={toggleSort} />
            <Th label="Workspace"     col="workspace_name"   sortCol={sortCol} sortAsc={sortAsc} onSort={toggleSort} />
            <Th label="Role"          col="role"             sortCol={sortCol} sortAsc={sortAsc} onSort={toggleSort} />
            <Th label="Created"       col="created_at"       sortCol={sortCol} sortAsc={sortAsc} onSort={toggleSort} />
            <Th label="Last Sign In"  col="last_sign_in_at"  sortCol={sortCol} sortAsc={sortAsc} onSort={toggleSort} />
            <Th label="Status"        col="status"           sortCol={sortCol} sortAsc={sortAsc} onSort={toggleSort} />
            <th style={{ padding: "10px 14px", fontSize: 10, fontWeight: 700, letterSpacing: "0.35em", textTransform: "uppercase", color: C.faint }}>Action</th>
          </THead>
          <TBody>
            {rows.length === 0 ? <Empty msg="No users found." /> : rows.map(u => (
              <tr key={u.id} style={{ background: C.panel, borderBottom: `1px solid ${C.border}` }}>
                <TD style={{ color: C.text, fontWeight: 500 }}>{u.email}</TD>
                <TD>{u.workspace_name ?? <span style={{ color: C.faint }}>—</span>}</TD>
                <TD>
                  {u.role ? (
                    <span style={{ padding: "2px 8px", borderRadius: 5, background: C.accentBg, color: "#c4b5fd", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {u.role}
                    </span>
                  ) : <span style={{ color: C.faint }}>—</span>}
                </TD>
                <TD style={{ fontSize: 12 }}>{fmtDate(u.created_at)}</TD>
                <TD style={{ fontSize: 12 }}>{u.last_sign_in_at ? timeAgo(u.last_sign_in_at) : "—"}</TD>
                <TD>
                  <span style={{
                    padding: "2px 8px", borderRadius: 5, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
                    background: u.status === "active" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                    color:      u.status === "active" ? "#4ade80"              : "#f87171",
                  }}>
                    {u.status}
                  </span>
                </TD>
                <TD>
                  {u.email !== "founder@cognitiveempire.com" && (
                    <button
                      onClick={() => setConfirm({
                        title: "Revoke Access?",
                        msg: `Remove ${u.email} from their workspace. They will not be able to sign in.`,
                        onOk: () => setConfirm(null),
                      })}
                      style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid rgba(239,68,68,0.35)", background: "transparent", color: "#f87171", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                    >
                      Revoke
                    </button>
                  )}
                </TD>
              </tr>
            ))}
          </TBody>
        </Table>
      </div>
    );
  }

  function renderHealth() {
    if (!data) return null;
    const { system } = data;
    const dbEntries = Object.entries(system.db);

    return (
      <div style={{ padding: "28px 32px" }}>
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.45em", textTransform: "uppercase", color: C.faint, marginBottom: 4 }}>CE Super Admin</p>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: "-0.02em", margin: 0 }}>System Health</h1>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

          {/* Supabase connection */}
          <div style={{ borderRadius: 12, border: `1px solid ${C.border}`, background: C.panel, padding: "22px 24px" }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 16 }}>Connection Status</p>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 9, height: 9, borderRadius: "50%", background: system.supabase_connected ? "#22c55e" : "#ef4444", flexShrink: 0 }} />
              <p style={{ fontSize: 13, color: C.muted }}>Supabase — {system.supabase_connected ? "Connected" : "Disconnected"}</p>
            </div>
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12, marginTop: 4 }}>
              <p style={{ fontSize: 11, color: C.faint }}>
                Last scoring run: <span style={{ color: system.last_scored_at ? C.muted : C.faint }}>{system.last_scored_at ? fmtDateTime(system.last_scored_at) : "Never"}</span>
              </p>
              <p style={{ fontSize: 11, color: C.faint, marginTop: 4 }}>Next scheduled: <span style={{ color: C.muted }}>Daily at midnight UTC</span></p>
            </div>
          </div>

          {/* Database row counts */}
          <div style={{ borderRadius: 12, border: `1px solid ${C.border}`, background: C.panel, padding: "22px 24px" }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 16 }}>Database Row Counts</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {dbEntries.map(([table, count]) => (
                <div key={table} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <p style={{ fontSize: 12, color: C.muted, fontFamily: "monospace" }}>drift.{table}</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{count.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Scoring engine */}
          <div style={{ borderRadius: 12, border: `1px solid ${C.border}`, background: C.panel, padding: "22px 24px" }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 16 }}>Scoring Engine</p>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <span style={{ padding: "4px 10px", borderRadius: 6, background: C.accentBg, border: `1px solid ${C.accentBorder}`, color: "#c4b5fd", fontSize: 11, fontWeight: 600 }}>ACTIVE</span>
            </div>
            <p style={{ fontSize: 12, color: C.faint }}>Cadence: Daily at midnight UTC</p>
            <p style={{ fontSize: 12, color: C.faint, marginTop: 4 }}>
              Last run: {system.last_scored_at ? timeAgo(system.last_scored_at) : "—"}
            </p>
          </div>

          {/* n8n workflows */}
          <div style={{ borderRadius: 12, border: `1px solid ${C.border}`, background: C.panel, padding: "22px 24px" }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 16 }}>n8n Workflows</p>
            {[
              "drift-daily-scorer",
              "drift-intervention-generator",
              "drift-opportunity-importer",
              "drift-followup-reminder",
              "drift-weekly-report",
            ].map((name, i) => (
              <div key={name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: i < 4 ? `1px solid ${C.border}` : "none" }}>
                <p style={{ fontSize: 12, color: C.muted, fontFamily: "monospace" }}>{name}</p>
                <span style={{ padding: "2px 8px", borderRadius: 5, background: "rgba(34,197,94,0.1)", color: "#4ade80", fontSize: 10, fontWeight: 700 }}>ACTIVE</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function renderScoring() {
    if (!data) return null;
    const rows = sorted(data.scoring_runs, sortCol, sortAsc);
    return (
      <div style={{ padding: "28px 32px" }}>
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.45em", textTransform: "uppercase", color: C.faint, marginBottom: 4 }}>CE Super Admin</p>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: "-0.02em", margin: 0 }}>Scoring Runs</h1>
        </div>
        <Table>
          <THead>
            <Th label="Run Date"              col="scored_at"            sortCol={sortCol} sortAsc={sortAsc} onSort={toggleSort} />
            <Th label="Workspace"             col="workspace_name"       sortCol={sortCol} sortAsc={sortAsc} onSort={toggleSort} />
            <Th label="Opportunities Scored"  col="opportunities_scored" sortCol={sortCol} sortAsc={sortAsc} onSort={toggleSort} />
            <Th label="Critical Found"        col="critical_found"       sortCol={sortCol} sortAsc={sortAsc} onSort={toggleSort} />
            <Th label="Avg Score"             col="avg_score"            sortCol={sortCol} sortAsc={sortAsc} onSort={toggleSort} />
          </THead>
          <TBody>
            {rows.length === 0
              ? <Empty msg="No scoring runs recorded yet." />
              : rows.map((r, i) => (
              <tr key={i} style={{ background: C.panel, borderBottom: `1px solid ${C.border}` }}>
                <TD style={{ fontSize: 12 }}>{fmtDateTime(r.scored_at)}</TD>
                <TD style={{ color: C.text }}>{r.workspace_name}</TD>
                <TD style={{ color: C.text }}>{r.opportunities_scored}</TD>
                <TD style={{ color: r.critical_found > 0 ? "#f87171" : C.muted }}>{r.critical_found}</TD>
                <TD>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1, height: 4, borderRadius: 2, background: C.border, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.min(100, r.avg_score)}%`, background: r.avg_score >= 80 ? "#ef4444" : r.avg_score >= 60 ? "#f97316" : r.avg_score >= 35 ? "#eab308" : "#22c55e", borderRadius: 2 }} />
                    </div>
                    <span style={{ fontSize: 12, color: C.muted, minWidth: 28 }}>{r.avg_score}</span>
                  </div>
                </TD>
              </tr>
            ))}
          </TBody>
        </Table>
      </div>
    );
  }

  function renderImports() {
    if (!data) return null;
    const rows = sorted(data.import_logs, sortCol, sortAsc);
    return (
      <div style={{ padding: "28px 32px" }}>
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.45em", textTransform: "uppercase", color: C.faint, marginBottom: 4 }}>CE Super Admin</p>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: "-0.02em", margin: 0 }}>Import Logs</h1>
        </div>
        <Table>
          <THead>
            <Th label="Date"        col="created_at"     sortCol={sortCol} sortAsc={sortAsc} onSort={toggleSort} />
            <Th label="Workspace"   col="workspace_name" sortCol={sortCol} sortAsc={sortAsc} onSort={toggleSort} />
            <Th label="File"        col="file"           sortCol={sortCol} sortAsc={sortAsc} onSort={toggleSort} />
            <Th label="Total"       col="total"          sortCol={sortCol} sortAsc={sortAsc} onSort={toggleSort} />
            <Th label="Successful"  col="successful"     sortCol={sortCol} sortAsc={sortAsc} onSort={toggleSort} />
            <Th label="Failed"      col="failed"         sortCol={sortCol} sortAsc={sortAsc} onSort={toggleSort} />
            <Th label="Status"      col="status"         sortCol={sortCol} sortAsc={sortAsc} onSort={toggleSort} />
          </THead>
          <TBody>
            {rows.length === 0
              ? <Empty msg="No import batches found. Import logs will appear here when data is ingested." />
              : rows.map(il => (
              <tr key={il.id} style={{ background: C.panel, borderBottom: `1px solid ${C.border}` }}>
                <TD style={{ fontSize: 12 }}>{fmtDateTime(il.created_at)}</TD>
                <TD style={{ color: C.text }}>{il.workspace_name}</TD>
                <TD style={{ fontFamily: "monospace", fontSize: 11 }}>{il.file}</TD>
                <TD style={{ color: C.text }}>{il.total}</TD>
                <TD style={{ color: "#4ade80" }}>{il.successful}</TD>
                <TD style={{ color: il.failed > 0 ? "#f87171" : C.muted }}>{il.failed}</TD>
                <TD>
                  <span style={{
                    padding: "2px 8px", borderRadius: 5, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
                    background: il.status === "completed" ? "rgba(34,197,94,0.1)" : il.status === "failed" ? "rgba(239,68,68,0.1)" : "rgba(234,179,8,0.1)",
                    color:      il.status === "completed" ? "#4ade80"              : il.status === "failed" ? "#f87171"              : "#fbbf24",
                  }}>
                    {il.status}
                  </span>
                </TD>
              </tr>
            ))}
          </TBody>
        </Table>
      </div>
    );
  }

  const THRESHOLDS = [
    { label: "HEALTHY",  range: "0 – 34",   color: "#22c55e", bg: "rgba(34,197,94,0.08)"  },
    { label: "WATCH",    range: "35 – 59",  color: "#eab308", bg: "rgba(234,179,8,0.08)"  },
    { label: "DECAYING", range: "60 – 79",  color: "#f97316", bg: "rgba(249,115,22,0.08)" },
    { label: "CRITICAL", range: "80 – 100", color: "#ef4444", bg: "rgba(239,68,68,0.08)"  },
  ];

  function renderSettings() {
    return (
      <div style={{ padding: "28px 32px" }}>
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.45em", textTransform: "uppercase", color: C.faint, marginBottom: 4 }}>CE Super Admin</p>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: "-0.02em", margin: 0 }}>Settings</h1>
        </div>
        <div style={{ maxWidth: 680, display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Global scoring thresholds */}
          <div style={{ borderRadius: 12, border: `1px solid ${C.border}`, background: C.panel, padding: "22px 26px" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 4 }}>Global Scoring Thresholds</p>
            <p style={{ fontSize: 12, color: C.faint, marginBottom: 18 }}>Read-only in Phase I. Customization available in Phase II.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
              {THRESHOLDS.map(t => (
                <div key={t.label} style={{ borderRadius: 8, border: `1px solid ${t.color}22`, background: t.bg, padding: "12px 14px" }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: t.color, margin: "0 0 4px" }}>{t.label}</p>
                  <p style={{ fontSize: 17, fontWeight: 700, color: t.color, margin: 0 }}>{t.range}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Admin email */}
          <div style={{ borderRadius: 12, border: `1px solid ${C.border}`, background: C.panel, padding: "22px 26px" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 14 }}>Admin Email</p>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input
                readOnly
                value="founder@cognitiveempire.com"
                style={{ padding: "9px 13px", borderRadius: 7, border: `1px solid ${C.border}`, background: C.input, color: C.muted, fontSize: 13, outline: "none", width: 300 }}
              />
              <span style={{ fontSize: 11, color: C.faint }}>Super admin — locked</span>
            </div>
          </div>

          {/* System notes */}
          <div style={{ borderRadius: 12, border: `1px solid ${C.border}`, background: C.panel, padding: "22px 26px" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 14 }}>System Notes</p>
            <textarea
              value={sysNotes}
              onChange={e => setSysNotes(e.target.value)}
              placeholder="Internal notes about system state, known issues, upcoming changes…"
              rows={5}
              style={{ width: "100%", padding: "10px 13px", borderRadius: 7, border: `1px solid ${C.border}`, background: C.input, color: C.text, fontSize: 13, outline: "none", resize: "vertical", fontFamily: "system-ui, -apple-system, sans-serif", boxSizing: "border-box" }}
            />
            <button
              onClick={() => {}}
              style={{ marginTop: 12, padding: "8px 18px", borderRadius: 7, background: C.accent, border: "none", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              Save Notes
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Active view dispatcher ────────────────────────────────────────────────────

  const navItems: { view: View; label: string; icon: React.ReactNode }[] = [
    { view: "overview",   label: "Overview",       icon: <IcoOverview /> },
    { view: "workspaces", label: "All Workspaces",  icon: <IcoWorkspaces /> },
    { view: "users",      label: "Users",           icon: <IcoUsers /> },
    { view: "health",     label: "System Health",   icon: <IcoHealth /> },
    { view: "scoring",    label: "Scoring Runs",    icon: <IcoScoring /> },
    { view: "imports",    label: "Import Logs",     icon: <IcoImports /> },
    { view: "settings",   label: "Settings",        icon: <IcoSettings /> },
  ];

  // ── Layout ────────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: C.bg, color: C.text, fontFamily: "system-ui, -apple-system, sans-serif", WebkitFontSmoothing: "antialiased" }}>

      {/* ══ SIDEBAR ══════════════════════════════════════════════════════════════ */}
      <aside style={{ width: 224, flexShrink: 0, display: "flex", flexDirection: "column", height: "100%", background: C.sidebar, borderRight: `1px solid ${C.border}` }}>

        {/* Logo + CE label */}
        <div style={{ padding: "18px 20px 14px" }}>
          <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.5em", textTransform: "uppercase", color: C.accent, margin: "0 0 6px" }}>CE Super Admin</p>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: C.accentBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `1px solid ${C.accentBorder}` }}>
              <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
                <path d="M4 4 L16 10 L4 16 L7 10 Z" fill={C.accent} />
              </svg>
            </div>
            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.025em", color: C.text }}>Drift</span>
          </div>
        </div>

        <div style={{ margin: "0 16px", borderTop: `1px solid ${C.border}` }} />

        {/* Nav */}
        <nav style={{ padding: "12px 10px", flex: 1, overflow: "auto" }}>
          <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.45em", textTransform: "uppercase", color: C.faint, padding: "0 10px", marginBottom: 6 }}>Navigation</p>
          {navItems.map(({ view: v, label, icon }) => {
            const active = view === v;
            return (
              <button
                key={v}
                onClick={() => switchView(v)}
                style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 12px",
                  borderRadius: 8, marginBottom: 2, cursor: "pointer", textAlign: "left",
                  background: active ? C.accentBg : "transparent",
                  border: active ? `1px solid ${C.accentBorder}` : "1px solid transparent",
                  color: active ? "#c4b5fd" : C.faint,
                  fontSize: 13, fontWeight: active ? 600 : 400,
                  transition: "all 0.15s",
                }}
              >
                <span style={{ opacity: active ? 1 : 0.6 }}>{icon}</span>
                {label}
              </button>
            );
          })}
        </nav>

        <div style={{ margin: "0 16px", borderTop: `1px solid ${C.border}` }} />

        {/* Profile */}
        <div style={{ position: "relative", padding: "12px 14px" }} ref={profileRef}>
          <button
            onClick={() => setShowProfile(v => !v)}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "7px 8px", borderRadius: 8, cursor: "pointer", background: "transparent", border: "none", color: C.text }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: `linear-gradient(135deg, ${C.accent}, #4c1d95)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                E
              </div>
              <div style={{ textAlign: "left" }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: C.text, margin: 0 }}>Dr. E</p>
                <p style={{ fontSize: 10, color: C.accent, margin: 0 }}>Super Admin</p>
              </div>
            </div>
            <span style={{ color: C.faint }}><IcoChevron /></span>
          </button>

          {showProfile && (
            <div style={{ position: "absolute", bottom: "100%", left: 8, right: 8, marginBottom: 8, borderRadius: 12, border: `1px solid ${C.border}`, background: "#0c0b1e", overflow: "hidden", boxShadow: "0 -8px 32px rgba(0,0,0,0.5)" }}>
              {userEmail && (
                <div style={{ borderBottom: `1px solid ${C.border}`, padding: "10px 16px" }}>
                  <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.35em", textTransform: "uppercase", color: C.faint, marginBottom: 3 }}>Signed in as</p>
                  <p style={{ fontSize: 11, color: C.muted }}>{userEmail}</p>
                </div>
              )}
              <button
                onClick={handleSignOut}
                style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "10px 16px", background: "transparent", border: "none", color: C.muted, fontSize: 12, cursor: "pointer", textAlign: "left" }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Sign out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ══ MAIN ═════════════════════════════════════════════════════════════════ */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Header */}
        <header style={{ flexShrink: 0, borderBottom: `1px solid ${C.border}`, background: C.bg, padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.45em", textTransform: "uppercase", color: C.accent, margin: "0 0 2px" }}>CE Super Admin</p>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: C.text, letterSpacing: "-0.02em", margin: 0 }}>
              {navItems.find(n => n.view === view)?.label ?? "Overview"}
            </h1>
          </div>
          {data && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e" }} />
              <span style={{ fontSize: 11, color: C.faint }}>Live — {data.kpis.total_workspaces} workspace{data.kpis.total_workspaces !== 1 ? "s" : ""}</span>
            </div>
          )}
        </header>

        {/* Body */}
        <main style={{ flex: 1, overflowY: "auto", background: C.bg }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: C.faint, fontSize: 13 }}>
              Loading super admin data…
            </div>
          ) : fetchErr ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", gap: 8 }}>
              <p style={{ color: "#f87171", fontSize: 14, fontWeight: 600 }}>Failed to load data</p>
              <p style={{ color: C.faint, fontSize: 12 }}>{fetchErr}</p>
            </div>
          ) : (
            <>
              {view === "overview"   && renderOverview()}
              {view === "workspaces" && renderWorkspaces()}
              {view === "users"      && renderUsers()}
              {view === "health"     && renderHealth()}
              {view === "scoring"    && renderScoring()}
              {view === "imports"    && renderImports()}
              {view === "settings"   && renderSettings()}
            </>
          )}
        </main>

        {/* Footer */}
        <footer style={{ flexShrink: 0, borderTop: `1px solid ${C.border}`, background: C.bg, padding: "8px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, color: C.faint }}>Cognitive Empire · Super Admin Panel</span>
          <span style={{ fontSize: 11, color: C.faint }}>Service role access · All workspaces visible</span>
        </footer>
      </div>

      {/* ── Confirmation modal ────────────────────────────────────────────────── */}
      {confirm && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}
          onClick={() => setConfirm(null)}
        >
          <div
            style={{ background: "#0f0e22", border: `1px solid rgba(239,68,68,0.3)`, borderRadius: 14, padding: 32, maxWidth: 420, width: "90%", textAlign: "center" }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ width: 46, height: 46, borderRadius: 12, background: "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text, margin: "0 0 10px" }}>{confirm.title}</h3>
            <p style={{ fontSize: 13, color: C.faint, lineHeight: 1.6, margin: "0 0 26px" }}>{confirm.msg}</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={() => setConfirm(null)}
                style={{ padding: "9px 22px", borderRadius: 7, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, fontSize: 13, fontWeight: 500, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={confirm.onOk}
                style={{ padding: "9px 22px", borderRadius: 7, border: "none", background: "#ef4444", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
