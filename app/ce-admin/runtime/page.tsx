import { createClient } from "@supabase/supabase-js";
import type { RuntimeSystemRow, RuntimeApprovalRow, RuntimeConflictRow } from "@/types/runtime";

// ── constants ────────────────────────────────────────────────────────────────

const C = {
  bg:           "#09091c",
  panel:        "#0e0c1f",
  panelDeep:    "#0b0a1e",
  border:       "#1c1a35",
  accent:       "#00E0FF",
  accentBg:     "rgba(0,224,255,0.08)",
  accentBorder: "rgba(0,224,255,0.25)",
  text:         "#f1f5f9",
  muted:        "#94a3b8",
  faint:        "#64748b",
} as const;

const HEALTH_COLOR: Record<string, string> = {
  healthy:      "#4ade80",
  warning:      "#fbbf24",
  broken:       "#f87171",
  stale:        "#94a3b8",
  unknown:      "#64748b",
  needs_review: "#fb923c",
};

const SYNC_COLOR: Record<string, string> = {
  in_sync:                "#4ade80",
  stale:                  "#94a3b8",
  drift_detected:         "#fbbf24",
  conflicted:             "#f87171",
  unknown:                "#64748b",
  manual_review_required: "#fb923c",
};

const RISK_COLOR: Record<string, string> = {
  low:      "#4ade80",
  medium:   "#fbbf24",
  high:     "#fb923c",
  critical: "#f87171",
};

const CONF_COLOR: Record<string, string> = {
  confirmed:  "#4ade80",
  inferred:   "#00E0FF",
  uncertain:  "#fbbf24",
  stale:      "#94a3b8",
  conflicted: "#f87171",
};

const IMPACT_COLOR: Record<string, string> = {
  low:      "#4ade80",
  medium:   "#fbbf24",
  high:     "#fb923c",
  critical: "#f87171",
};

// ── helpers ──────────────────────────────────────────────────────────────────

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

function fmt(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "—";
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 2)   return "just now";
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fmtCost(n: number | null): string {
  if (n == null) return "—";
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// ── sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, color, warn }: { label: string; value: number; color?: string; warn?: boolean }) {
  const accent = color ?? C.accent;
  const bg     = warn && value > 0 ? "rgba(239,68,68,0.06)" : C.panel;
  const border = warn && value > 0 ? "rgba(239,68,68,0.2)"  : C.border;
  return (
    <div style={{ flex: 1, minWidth: 0, padding: "16px 20px", borderRadius: 12, background: bg, border: `1px solid ${border}` }}>
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.35em", textTransform: "uppercase", color: C.faint, margin: "0 0 8px" }}>
        {label}
      </p>
      <p style={{ fontSize: 28, fontWeight: 800, color: accent, margin: 0, letterSpacing: "-0.03em" }}>
        {value}
      </p>
    </div>
  );
}

function Badge({ value, colorMap, prefix }: { value: string; colorMap: Record<string, string>; prefix?: string }) {
  const color = colorMap[value] ?? C.faint;
  const bg    = `${color}18`;
  return (
    <span style={{ padding: "3px 9px", borderRadius: 5, background: bg, color, fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
      {prefix}{value.replace(/_/g, " ")}
    </span>
  );
}

function ConfCard({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div style={{ flex: 1, padding: "14px 18px", borderRadius: 10, background: C.panel, border: `1px solid ${C.border}` }}>
      <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.4em", textTransform: "uppercase", color: C.faint, margin: "0 0 6px" }}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 800, color, margin: 0 }}>{count}</p>
    </div>
  );
}

type SlimMemory = { id: string; title: string; confidence: string; lifecycle_status: string; updated_at: string };

// ── page ─────────────────────────────────────────────────────────────────────

export default async function RuntimeDashboardPage() {
  const client = sb();
  const ago24h = new Date(Date.now() - 86_400_000).toISOString();

  const [
    activeRes,
    reviewRes,
    staleMemRes,
    openConflRes,
    pendingAppRes,
    failedRes,
    systemsRes,
    memoriesRes,
    flaggedMemRes,
    lockedMemRes,
    approvalsRes,
    conflictsRes,
    confConfRes,
    infConfRes,
    uncConfRes,
    staleConfRes,
    conflConfRes,
  ] = await Promise.all([
    // Stat card counts
    client.from("runtime_systems").select("*", { count: "exact", head: true }).eq("status", "active"),
    client.from("runtime_systems").select("*", { count: "exact", head: true }).or("health_status.eq.needs_review,health_status.eq.broken"),
    client.from("runtime_memories").select("*", { count: "exact", head: true }).or("confidence.eq.stale,lifecycle_status.eq.stale"),
    client.from("runtime_conflicts").select("*", { count: "exact", head: true }).eq("status", "open"),
    client.from("runtime_approvals").select("*", { count: "exact", head: true }).eq("status", "pending"),
    client.from("runtime_health_checks").select("*", { count: "exact", head: true }).eq("health_status", "broken").gt("checked_at", ago24h),
    // Display data
    client.from("runtime_systems").select("*").order("name"),
    client.from("runtime_memories").select("id, title, confidence, lifecycle_status, updated_at").order("updated_at", { ascending: false }).limit(300),
    client.from("runtime_memories").select("id, title, confidence, lifecycle_status, updated_at").in("confidence", ["conflicted", "stale"]).order("updated_at", { ascending: false }).limit(20),
    client.from("runtime_memories").select("id, title, lifecycle_status, updated_at").eq("lifecycle_status", "locked").order("updated_at", { ascending: false }).limit(10),
    client.from("runtime_approvals").select("*").eq("status", "pending").order("requested_at", { ascending: false }).limit(10),
    client.from("runtime_conflicts").select("*").eq("status", "open").order("detected_at", { ascending: false }).limit(10),
    // Confidence counts
    client.from("runtime_memories").select("*", { count: "exact", head: true }).eq("confidence", "confirmed"),
    client.from("runtime_memories").select("*", { count: "exact", head: true }).eq("confidence", "inferred"),
    client.from("runtime_memories").select("*", { count: "exact", head: true }).eq("confidence", "uncertain"),
    client.from("runtime_memories").select("*", { count: "exact", head: true }).eq("confidence", "stale"),
    client.from("runtime_memories").select("*", { count: "exact", head: true }).eq("confidence", "conflicted"),
  ]);

  const systems     = (systemsRes.data   ?? []) as RuntimeSystemRow[];
  const approvals   = (approvalsRes.data ?? []) as RuntimeApprovalRow[];
  const conflicts   = (conflictsRes.data ?? []) as RuntimeConflictRow[];
  const flaggedMems = (flaggedMemRes.data ?? []) as SlimMemory[];
  const lockedMems  = (lockedMemRes.data  ?? []) as SlimMemory[];

  // Stat values
  const statActive   = activeRes.count    ?? 0;
  const statReview   = reviewRes.count    ?? 0;
  const statStaleMem = staleMemRes.count  ?? 0;
  const statConflict = openConflRes.count ?? 0;
  const statPending  = pendingAppRes.count ?? 0;
  const statFailed   = failedRes.count    ?? 0;

  // Confidence counts
  const confCounts = {
    confirmed: confConfRes.count ?? 0,
    inferred:  infConfRes.count  ?? 0,
    uncertain: uncConfRes.count  ?? 0,
    stale:     staleConfRes.count ?? 0,
    conflicted: conflConfRes.count ?? 0,
  };

  const TH: React.CSSProperties = {
    padding: "10px 14px", textAlign: "left", fontSize: 10, fontWeight: 700,
    letterSpacing: "0.35em", textTransform: "uppercase", color: C.faint, whiteSpace: "nowrap",
  };

  const TD: React.CSSProperties = {
    padding: "11px 14px", verticalAlign: "middle", fontSize: 12,
  };

  return (
    <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 28 }}>

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.45em", textTransform: "uppercase", color: C.faint, marginBottom: 4 }}>CE Admin · Runtime</p>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: "-0.02em", margin: 0 }}>Health Dashboard</h1>
        <p style={{ fontSize: 12, color: C.faint, marginTop: 4 }}>Read-only snapshot of CE operating state.</p>
      </div>

      {/* ── STAT CARDS ─────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 12 }}>
        <StatCard label="Active Systems"     value={statActive}   color={C.accent} />
        <StatCard label="Pending Approvals"  value={statPending}  color="#fbbf24"  warn />
        <StatCard label="Stale Memories"     value={statStaleMem} color="#94a3b8"  warn />
        <StatCard label="Open Conflicts"     value={statConflict} color="#f87171"  warn />
        <StatCard label="Needs Review"       value={statReview}   color="#fb923c"  warn />
        <StatCard label="Failed Checks 24h"  value={statFailed}   color="#f87171"  warn />
      </div>

      {/* ── SYSTEMS TABLE ──────────────────────────────────────────────── */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: 0 }}>
            Systems Registry
            <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 400, color: C.faint }}>{systems.length} total</span>
          </p>
        </div>

        <div style={{ borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead style={{ background: C.panelDeep, borderBottom: `1px solid ${C.border}` }}>
              <tr>
                {["Name", "Type", "Status", "Health", "Sync", "Risk", "Cost / mo", "Last Check", "Next Action"].map((h) => (
                  <th key={h} style={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {systems.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ ...TD, textAlign: "center", color: C.faint, padding: "32px 20px" }}>
                    No systems registered yet.
                  </td>
                </tr>
              ) : systems.map((s, i) => {
                const hColor = HEALTH_COLOR[s.health_status] ?? C.faint;
                const nextAction = s.next_action;
                return (
                  <tr key={s.id} style={{ borderBottom: i < systems.length - 1 ? `1px solid ${C.border}` : undefined, background: C.panel }}>
                    <td style={{ ...TD, maxWidth: 220 }}>
                      <p style={{ margin: 0, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</p>
                      {s.description && (
                        <p style={{ margin: "2px 0 0", fontSize: 11, color: C.faint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.description}</p>
                      )}
                    </td>
                    <td style={TD}><span style={{ color: C.muted, fontSize: 11 }}>{fmt(s.system_type)}</span></td>
                    <td style={TD}><Badge value={s.status} colorMap={{ active: "#4ade80", planned: "#00E0FF", paused: "#fbbf24", deprecated: "#94a3b8", broken: "#f87171", archived: "#475569" }} /></td>
                    <td style={TD}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: hColor, flexShrink: 0, boxShadow: `0 0 5px ${hColor}55` }} />
                        <span style={{ fontSize: 11, color: hColor, fontWeight: 600 }}>{fmt(s.health_status)}</span>
                      </span>
                    </td>
                    <td style={TD}><Badge value={s.sync_status} colorMap={SYNC_COLOR} /></td>
                    <td style={TD}>
                      {s.risk_level
                        ? <span style={{ padding: "2px 8px", borderRadius: 4, background: `${RISK_COLOR[s.risk_level] ?? C.faint}18`, color: RISK_COLOR[s.risk_level] ?? C.faint, fontSize: 10, fontWeight: 800 }}>{s.risk_level}</span>
                        : <span style={{ color: C.faint }}>—</span>}
                    </td>
                    <td style={{ ...TD, color: s.cost_monthly ? C.text : C.faint }}>{fmtCost(s.cost_monthly)}</td>
                    <td style={{ ...TD, color: C.faint, fontSize: 11 }}>{timeAgo(s.last_health_check)}</td>
                    <td style={{ ...TD, color: C.faint, fontSize: 11 }}>
                      {nextAction ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MEMORY INTEGRITY ───────────────────────────────────────────── */}
      <div>
        <p style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 12 }}>Memory Integrity</p>
        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <ConfCard label="Confirmed"  count={confCounts.confirmed}  color={CONF_COLOR.confirmed}  />
          <ConfCard label="Inferred"   count={confCounts.inferred}   color={CONF_COLOR.inferred}   />
          <ConfCard label="Uncertain"  count={confCounts.uncertain}  color={CONF_COLOR.uncertain}  />
          <ConfCard label="Stale"      count={confCounts.stale}      color={CONF_COLOR.stale}      />
          <ConfCard label="Conflicted" count={confCounts.conflicted} color={CONF_COLOR.conflicted} />
        </div>

        {flaggedMems.length > 0 && (
          <div style={{ borderRadius: 10, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            <div style={{ padding: "10px 16px", background: C.panelDeep, borderBottom: `1px solid ${C.border}` }}>
              <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: C.faint }}>Flagged Memories ({flaggedMems.length})</p>
            </div>
            {flaggedMems.map((m, i) => (
              <div key={m.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", background: C.panel, borderBottom: i < flaggedMems.length - 1 ? `1px solid ${C.border}` : undefined }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: CONF_COLOR[m.confidence] ?? C.faint, flexShrink: 0 }} />
                  <p style={{ margin: 0, fontSize: 12, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.title}</p>
                  <Badge value={m.confidence} colorMap={CONF_COLOR} />
                </div>
                <span style={{ fontSize: 11, color: C.faint, flexShrink: 0, marginLeft: 16 }}>{timeAgo(m.updated_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── FOUNDER FOCUS STRIP ────────────────────────────────────────── */}
      <div>
        <p style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 12 }}>Founder Focus</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>

          {/* Pending Approvals */}
          <div style={{ borderRadius: 10, border: `1px solid ${C.border}`, background: C.panel, overflow: "hidden" }}>
            <div style={{ padding: "10px 16px", background: C.panelDeep, borderBottom: `1px solid ${C.border}` }}>
              <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: "#fbbf24" }}>Pending Approvals</p>
            </div>
            {approvals.length === 0 ? (
              <p style={{ padding: "16px", fontSize: 12, color: C.faint, margin: 0 }}>None pending.</p>
            ) : approvals.map((a) => (
              <div key={a.id} style={{ padding: "10px 16px", borderBottom: `1px solid ${C.border}` }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                  <p style={{ margin: 0, fontSize: 12, color: C.text, fontWeight: 500 }}>{a.title}</p>
                  {a.impact_level && (
                    <span style={{ padding: "2px 7px", borderRadius: 4, background: `${IMPACT_COLOR[a.impact_level] ?? C.faint}18`, color: IMPACT_COLOR[a.impact_level] ?? C.faint, fontSize: 9, fontWeight: 800, textTransform: "uppercase", whiteSpace: "nowrap" }}>
                      {a.impact_level}
                    </span>
                  )}
                </div>
                <p style={{ margin: "3px 0 0", fontSize: 10, color: C.faint }}>{fmt(a.reversibility_class)} · {timeAgo(a.requested_at)}</p>
              </div>
            ))}
          </div>

          {/* Open Conflicts */}
          <div style={{ borderRadius: 10, border: `1px solid ${C.border}`, background: C.panel, overflow: "hidden" }}>
            <div style={{ padding: "10px 16px", background: C.panelDeep, borderBottom: `1px solid ${C.border}` }}>
              <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: "#f87171" }}>Open Conflicts</p>
            </div>
            {conflicts.length === 0 ? (
              <p style={{ padding: "16px", fontSize: 12, color: C.faint, margin: 0 }}>No open conflicts.</p>
            ) : conflicts.map((cf) => (
              <div key={cf.id} style={{ padding: "10px 16px", borderBottom: `1px solid ${C.border}` }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                  <p style={{ margin: 0, fontSize: 12, color: C.text, fontWeight: 500 }}>{cf.title}</p>
                  <Badge value={cf.type} colorMap={{ memory: "#f87171", sync: "#fbbf24", schema: "#fb923c", authority: "#a78bfa", state: "#94a3b8", doctrine: "#00E0FF" }} />
                </div>
                <p style={{ margin: "3px 0 0", fontSize: 10, color: C.faint }}>{timeAgo(cf.detected_at)}</p>
              </div>
            ))}
          </div>

          {/* Locked Memories */}
          <div style={{ borderRadius: 10, border: `1px solid ${C.border}`, background: C.panel, overflow: "hidden" }}>
            <div style={{ padding: "10px 16px", background: C.panelDeep, borderBottom: `1px solid ${C.border}` }}>
              <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: C.accent }}>Locked Memories</p>
            </div>
            {lockedMems.length === 0 ? (
              <p style={{ padding: "16px", fontSize: 12, color: C.faint, margin: 0 }}>No locked memories.</p>
            ) : lockedMems.map((m) => (
              <div key={m.id} style={{ padding: "10px 16px", borderBottom: `1px solid ${C.border}` }}>
                <p style={{ margin: 0, fontSize: 12, color: C.text, fontWeight: 500 }}>{m.title}</p>
                <p style={{ margin: "3px 0 0", fontSize: 10, color: C.faint }}>locked · {timeAgo(m.updated_at)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
