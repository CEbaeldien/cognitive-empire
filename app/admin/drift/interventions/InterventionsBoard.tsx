"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import EvidenceModal from "../EvidenceModal";
import type { DriftOverview, InterventionRow } from "@/lib/drift/data";

// ── Style constants ────────────────────────────────────────────────────────────
const S = {
  bg:     "#0b0f1c",
  panel2: "#0d1220",
  border: "#1a2035",
  text:   "#f1f5f9",
  muted:  "#94a3b8",
  faint:  "#64748b",
  blue:   "#3b82f6",
} as const;

// ── Helpers ────────────────────────────────────────────────────────────────────
function usd(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD", maximumFractionDigits: 0,
  }).format(n);
}

function daysAgo(iso: string): string {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (d === 0) return "Today";
  if (d === 1) return "1d ago";
  return `${d}d ago`;
}

function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

function firstBullets(notes: string | null | undefined, max = 3): string[] {
  if (!notes) return [];
  return notes
    .split(/\.\s+/)
    .map(s => s.replace(/\.$/, "").trim())
    .filter(Boolean)
    .slice(0, max);
}

const PRIORITY_TO_LEVEL: Record<string, string> = {
  high: "critical", medium: "decaying", low: "watch",
};
const LATE_STAGES = new Set([
  "Negotiation", "Proposal Sent", "Contract Sent", "Closing", "Final Review",
]);
const LEVEL_ORDER: Record<string, number> = {
  healthy: 0, watch: 1, decaying: 2, critical: 3,
};
const ACTIVITY_LABELS: Record<string, string> = {
  call_completed:            "Call",
  email_sent:                "Email",
  meeting_scheduled:         "Meeting",
  proposal_sent:             "Proposal",
  proposal_resent:           "Resent Proposal",
  decision_maker_contacted:  "DM Contact",
  next_action_updated:       "Next Action",
  internal_review_completed: "Internal Review",
  note_added:                "Note",
  other:                     "Other",
};

type ScoreLike = {
  drift_level: "healthy" | "watch" | "decaying" | "critical";
  revenue_at_risk: number;
  scoring_notes: string | null;
};

function deriveLevel(iv: InterventionRow, scoreMap: Map<string, ScoreLike>): string {
  return scoreMap.get(iv.opportunity_id)?.drift_level
    ?? PRIORITY_TO_LEVEL[iv.priority]
    ?? "watch";
}

function deriveRisk(iv: InterventionRow, scoreMap: Map<string, ScoreLike>): number {
  return Number(
    scoreMap.get(iv.opportunity_id)?.revenue_at_risk
    ?? iv.opportunities?.value
    ?? 0
  );
}

// ── Color maps ─────────────────────────────────────────────────────────────────
const LEVEL_LEFT: Record<string, string>  = { critical: "#ef4444", decaying: "#f97316", watch: "#eab308" };
const LEVEL_AMT: Record<string, string>   = { critical: "#f87171", decaying: "#fb923c", watch: "#fbbf24" };
const LEVEL_TAG: Record<string, { color: string; label: string }> = {
  critical: { color: "#f87171", label: "High-Risk" },
  decaying: { color: "#fb923c", label: "At Risk"   },
  watch:    { color: "#fbbf24", label: "Watch"     },
};
const LEVEL_BADGE: Record<string, { border: string; color: string; label: string }> = {
  critical: { border: "#ef4444", color: "#f87171", label: "CRITICAL" },
  decaying: { border: "#f97316", color: "#fb923c", label: "DECAYING" },
  watch:    { border: "#eab308", color: "#fbbf24", label: "WATCH"    },
};
const STRENGTH_STYLE: Record<string, { bg: string; border: string; color: string }> = {
  strong:   { bg: "rgba(34,197,94,0.08)",   border: "rgba(34,197,94,0.3)",   color: "#4ade80" },
  moderate: { bg: "rgba(234,179,8,0.08)",   border: "rgba(234,179,8,0.3)",   color: "#fbbf24" },
  weak:     { bg: "rgba(100,116,139,0.08)", border: "rgba(100,116,139,0.3)", color: "#64748b" },
};

// ── Grid ───────────────────────────────────────────────────────────────────────
const GRID = "2fr 0.7fr 0.7fr 1.5fr 1.8fr 0.65fr 0.6fr auto";
const COL_HEADERS = [
  "OPPORTUNITY", "STAGE", "EXPOSURE", "DECAY REASONS",
  "REQUIRED INTERVENTION", "URGENCY", "STATUS", "ACTION",
];

// ── Icons ──────────────────────────────────────────────────────────────────────
const IcoPerson = () => (
  <svg
    width="10" height="10" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ display: "inline", marginRight: 3, verticalAlign: "middle" }}
  >
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

// ── Props ──────────────────────────────────────────────────────────────────────
type Props = {
  overview: DriftOverview;
  interventions: InterventionRow[];
};

// ── Component ──────────────────────────────────────────────────────────────────
export default function InterventionsBoard({ overview, interventions }: Props) {
  const router = useRouter();

  const scoreMap = useMemo(() => {
    const map = new Map<string, ScoreLike>();
    for (const opp of overview.opportunities) {
      if (opp.score) map.set(opp.id, opp.score);
    }
    return map;
  }, [overview.opportunities]);

  const openCount     = overview.summary.pendingInterventions;
  const resolvedCount = interventions.filter(iv => iv.status === "completed").length;

  // ── Filter state ─────────────────────────────────────────────────────────────
  const [filterStatus,  setFilterStatus]  = useState<"open" | "resolved" | "all">("open");
  const [filterUrgency, setFilterUrgency] = useState<"all" | "critical" | "decaying" | "watch">("all");
  const [filterAccount, setFilterAccount] = useState<string>("all");

  // ── Derived ───────────────────────────────────────────────────────────────────
  const accounts = useMemo(() =>
    Array.from(
      new Set(interventions.map(iv => iv.opportunities?.accounts?.name).filter((n): n is string => !!n))
    ).sort(),
  [interventions]);

  const portfolioRisk = useMemo(() =>
    interventions.reduce((s, iv) => s + deriveRisk(iv, scoreMap), 0),
  [interventions, scoreMap]);

  const visible = useMemo(() =>
    interventions
      .filter(iv => {
        if (filterStatus  === "open"     && iv.status !== "pending")   return false;
        if (filterStatus  === "resolved" && iv.status !== "completed") return false;
        if (filterAccount !== "all" && iv.opportunities?.accounts?.name !== filterAccount) return false;
        if (filterUrgency !== "all" && deriveLevel(iv, scoreMap) !== filterUrgency) return false;
        return true;
      })
      .sort((a, b) => {
        const la = LEVEL_ORDER[deriveLevel(a, scoreMap)] ?? 0;
        const lb = LEVEL_ORDER[deriveLevel(b, scoreMap)] ?? 0;
        if (lb !== la) return lb - la;
        return deriveRisk(b, scoreMap) - deriveRisk(a, scoreMap);
      }),
  [interventions, filterStatus, filterUrgency, filterAccount, scoreMap]);

  // ── Row render ────────────────────────────────────────────────────────────────
  function renderRow(iv: InterventionRow, idx: number) {
    const level      = deriveLevel(iv, scoreMap);
    const risk       = deriveRisk(iv, scoreMap);
    const riskPct    = portfolioRisk > 0 ? (risk / portfolioRisk) * 100 : 0;
    const score      = scoreMap.get(iv.opportunity_id);
    const bullets    = firstBullets(score?.scoring_notes ?? iv.reason);
    const stage      = iv.opportunities?.stage ?? null;
    const owner      = iv.opportunities?.accounts?.contact_name ?? null;
    const acctName   = iv.opportunities?.accounts?.name ?? "Unknown";
    const dealTitle  = iv.opportunities?.title ?? "—";
    const due        = daysUntil(iv.opportunities?.next_action_due_date);
    const isLate     = stage ? LATE_STAGES.has(stage) : false;
    const isResolved = iv.status === "completed";

    const leftBorder = LEVEL_LEFT[level]  ?? "#334155";
    const amtCol     = LEVEL_AMT[level]   ?? "#94a3b8";
    const tag        = LEVEL_TAG[level]   ?? { color: "#4ade80", label: "Low Risk" };
    const badge      = LEVEL_BADGE[level] ?? { border: "#475569", color: "#64748b", label: level.toUpperCase() };

    const dueColor = due === null ? "#64748b"
      : due  < 0 ? "#f87171"
      : due <= 2 ? "#f87171"
      : due <= 5 ? "#fb923c"
      : "#94a3b8";
    const dueLabel = due === null ? null
      : due  < 0 ? `Overdue ${Math.abs(due)}d`
      : due === 0 ? "Due today"
      : due === 1 ? "Due tomorrow"
      : `Due in ${due}d`;

    return (
      <div
        key={iv.id}
        style={{
          display: "grid",
          gridTemplateColumns: GRID,
          alignItems: "start",
          background: idx % 2 === 0 ? "#090e1b" : "#0a0f1d",
          borderTop: idx > 0 ? `1px solid ${S.border}` : "none",
          borderLeft: `2.5px solid ${leftBorder}`,
          opacity: isResolved ? 0.72 : 1,
        }}
      >
        {/* Opportunity */}
        <div style={{ padding: "13px 12px 13px 18px" }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: S.text }}>{acctName}</p>
          <p style={{ margin: "2px 0 0", fontSize: 11, color: S.faint }}>{dealTitle}</p>
          <div style={{ marginTop: 5, display: "flex", flexWrap: "wrap", gap: "2px 10px" }}>
            {owner && (
              <span style={{ fontSize: 10, color: "#4a5568" }}>
                <IcoPerson />{owner}
              </span>
            )}
            <span style={{ fontSize: 10, color: "#334155" }}>{daysAgo(iv.created_at)}</span>
          </div>
        </div>

        {/* Stage */}
        <div style={{ padding: "13px 8px" }}>
          <p style={{ margin: 0, fontSize: 12, color: S.muted }}>{stage ?? "—"}</p>
          <p style={{ margin: "3px 0 0", fontSize: 11, fontWeight: 500, color: tag.color }}>{tag.label}</p>
          {isLate && <p style={{ margin: "2px 0 0", fontSize: 10, color: "#fb923c" }}>Late Stage</p>}
        </div>

        {/* Exposure */}
        <div style={{ padding: "13px 8px" }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: amtCol }}>{usd(risk)}</p>
          <p style={{ margin: "2px 0 0", fontSize: 11, color: "#334155" }}>{riskPct.toFixed(1)}%</p>
        </div>

        {/* Decay Reasons */}
        <div style={{ padding: "13px 8px" }}>
          {bullets.length > 0 ? (
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {bullets.map((b, i) => (
                <li
                  key={i}
                  style={{ display: "flex", alignItems: "flex-start", gap: 5, marginBottom: 4, fontSize: 11, color: S.muted }}
                >
                  <span style={{ marginTop: 5, width: 3, height: 3, borderRadius: "50%", background: "#334155", flexShrink: 0 }} />
                  {b}
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ margin: 0, fontSize: 11, color: "#334155" }}>No scoring data</p>
          )}
        </div>

        {/* Required Intervention */}
        <div style={{ padding: "13px 8px" }}>
          <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: "#cbd5e1" }}>
            {iv.recommended_action}
          </p>
          {dueLabel && (
            <p style={{ margin: "5px 0 0", fontSize: 11, fontWeight: 500, color: dueColor }}>
              {dueLabel}
            </p>
          )}
        </div>

        {/* Urgency */}
        <div style={{ padding: "13px 8px", display: "flex", alignItems: "flex-start" }}>
          <span style={{
            display: "inline-block",
            padding: "4px 7px",
            border: `1px solid ${badge.border}`,
            color: badge.color,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.05em",
            borderRadius: 3,
          }}>
            {badge.label}
          </span>
        </div>

        {/* Status */}
        <div style={{ padding: "13px 8px", display: "flex", alignItems: "flex-start" }}>
          <span style={{
            display: "inline-block",
            padding: "4px 7px",
            borderRadius: 4,
            background: isResolved ? "rgba(100,116,139,0.1)" : "rgba(239,68,68,0.09)",
            color: isResolved ? "#475569" : "#f87171",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.04em",
          }}>
            {isResolved ? "RESOLVED" : "OPEN"}
          </span>
        </div>

        {/* Action */}
        <div style={{ padding: "13px 10px", display: "flex", alignItems: "flex-start" }}>
          {isResolved ? (
            iv.activity ? (() => {
              const ss = STRENGTH_STYLE[iv.activity.evidence_strength] ?? STRENGTH_STYLE.weak;
              return (
                <div>
                  <span style={{
                    display: "inline-block",
                    padding: "3px 8px",
                    borderRadius: 3,
                    border: `1px solid ${ss.border}`,
                    background: ss.bg,
                    color: ss.color,
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase" as const,
                  }}>
                    {iv.activity.evidence_strength}
                  </span>
                  <p style={{ margin: "4px 0 0", fontSize: 10, color: S.faint }}>
                    {ACTIVITY_LABELS[iv.activity.activity_type] ?? iv.activity.activity_type}
                  </p>
                  {iv.completed_at && (
                    <p style={{ margin: "2px 0 0", fontSize: 10, color: "#334155" }}>
                      {daysAgo(iv.completed_at)}
                    </p>
                  )}
                </div>
              );
            })() : (
              <span style={{ fontSize: 11, color: "#334155" }}>—</span>
            )
          ) : (
            <EvidenceModal
              interventionId={iv.id}
              recommendedAction={iv.recommended_action}
              workspaceId={iv.workspace_id}
              opportunityId={iv.opportunity_id}
              accountId={iv.opportunities?.accounts?.id ?? ""}
            />
          )}
        </div>
      </div>
    );
  }

  // ── Empty state messages ──────────────────────────────────────────────────────
  const emptyMsg = {
    open:     { h: "No open interventions.",     sub: "Run the scoring engine to generate intervention actions." },
    resolved: {
      h:   "No resolved interventions.",
      sub: filterUrgency !== "all" || filterAccount !== "all"
        ? "No resolved interventions match the active filters."
        : "Resolved interventions appear here after evidence is submitted.",
    },
    all: { h: "No interventions.", sub: "No interventions match the active filters." },
  } as const;

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: S.bg, fontFamily: "system-ui, -apple-system, sans-serif", color: S.text }}>

      {/* Top bar */}
      <div style={{ borderBottom: `1px solid ${S.border}`, background: "#090c17", padding: "14px 40px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(59,130,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
              <path d="M4 4 L16 10 L4 16 L7 10 Z" fill={S.blue} />
            </svg>
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.02em" }}>Drift</span>
        </div>
        <span style={{ color: S.border, fontSize: 16 }}>/</span>
        <span style={{ fontSize: 13, color: S.muted }}>Interventions</span>
        <div style={{ flex: 1 }} />
        <Link href="/admin/drift" style={{ fontSize: 12, color: S.faint, textDecoration: "none" }}>
          ← Revenue Execution
        </Link>
      </div>

      <div style={{ maxWidth: 1440, margin: "0 auto", padding: "36px 40px 80px" }}>

        {/* Page header */}
        <div style={{ marginBottom: 28, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 600, letterSpacing: "0.4em", textTransform: "uppercase", color: S.faint }}>
              Execution
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em" }}>Interventions</h1>
              {openCount > 0 && (
                <span style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  minWidth: 24, height: 24, padding: "0 6px", borderRadius: 12,
                  background: "#ef4444", color: "#fff", fontSize: 11, fontWeight: 700,
                }}>
                  {openCount > 99 ? "99+" : openCount}
                </span>
              )}
            </div>
            <p style={{ margin: "6px 0 0", fontSize: 13, color: S.faint }}>
              Full intervention queue and execution evidence for this workspace.
            </p>
          </div>
          <button
            onClick={() => router.refresh()}
            style={{
              padding: "8px 16px",
              border: `1px solid ${S.border}`,
              background: "transparent",
              color: S.faint,
              fontSize: 12,
              borderRadius: 7,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Refresh
          </button>
        </div>

        {/* Filter bar */}
        <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>

          {/* Status tabs */}
          <div style={{ display: "flex", border: `1px solid ${S.border}`, borderRadius: 7, overflow: "hidden" }}>
            {(["open", "resolved", "all"] as const).map((s, i) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                style={{
                  padding: "7px 16px",
                  border: "none",
                  borderRight: i < 2 ? `1px solid ${S.border}` : "none",
                  background: filterStatus === s ? "rgba(59,130,246,0.14)" : "transparent",
                  color: filterStatus === s ? "#93c5fd" : S.faint,
                  fontSize: 12,
                  fontWeight: filterStatus === s ? 600 : 400,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {s === "open"
                  ? `Open${openCount > 0 ? ` (${openCount})` : ""}`
                  : s === "resolved"
                  ? `Resolved${resolvedCount > 0 ? ` (${resolvedCount})` : ""}`
                  : "All"}
              </button>
            ))}
          </div>

          {/* Urgency */}
          <select
            value={filterUrgency}
            onChange={e => setFilterUrgency(e.target.value as typeof filterUrgency)}
            style={{
              padding: "7px 12px", borderRadius: 7,
              border: `1px solid ${S.border}`,
              background: "#090c17", color: S.faint,
              fontSize: 12, cursor: "pointer", outline: "none", fontFamily: "inherit",
            }}
          >
            <option value="all">All urgency</option>
            <option value="critical">Critical</option>
            <option value="decaying">Decaying</option>
            <option value="watch">Watch</option>
          </select>

          {/* Account */}
          {accounts.length > 0 && (
            <select
              value={filterAccount}
              onChange={e => setFilterAccount(e.target.value)}
              style={{
                padding: "7px 12px", borderRadius: 7,
                border: `1px solid ${S.border}`,
                background: "#090c17", color: S.faint,
                fontSize: 12, cursor: "pointer", outline: "none", fontFamily: "inherit",
              }}
            >
              <option value="all">All accounts</option>
              {accounts.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          )}

          <span style={{ marginLeft: "auto", fontSize: 12, color: "#334155" }}>
            {visible.length} intervention{visible.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Table */}
        <div style={{ borderRadius: 12, border: `1px solid ${S.border}`, overflow: "hidden" }}>

          {/* Column headers */}
          <div style={{ display: "grid", gridTemplateColumns: GRID, background: S.panel2, borderBottom: `1px solid ${S.border}` }}>
            {COL_HEADERS.map((h, i) => (
              <div
                key={h}
                style={{
                  padding: i === 0 ? "10px 10px 10px 20px" : "10px 8px",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.35em",
                  color: S.faint,
                  textTransform: "uppercase" as const,
                }}
              >
                {h}
              </div>
            ))}
          </div>

          {/* Rows / empty */}
          {visible.length === 0 ? (
            <div style={{ padding: "52px 24px", textAlign: "center", borderBottom: `1px solid ${S.border}` }}>
              <p style={{ margin: "0 0 5px", fontSize: 14, color: S.faint }}>
                {emptyMsg[filterStatus].h}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: "#334155" }}>
                {emptyMsg[filterStatus].sub}
              </p>
            </div>
          ) : (
            visible.map((iv, idx) => renderRow(iv, idx))
          )}

          {/* Footer */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            borderTop: `1px solid ${S.border}`,
            background: S.panel2,
            padding: "10px 20px",
          }}>
            <span style={{ fontSize: 11, color: "#334155" }}>
              {visible.length} of {interventions.length} intervention{interventions.length !== 1 ? "s" : ""}
            </span>
            <span style={{ fontSize: 11, color: "#334155" }}>
              {openCount} open · {resolvedCount} resolved
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
