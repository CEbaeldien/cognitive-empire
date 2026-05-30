"use client";

import { useState, useEffect } from "react";
import type {
  RuntimeSystemRow, RuntimeConflictRow, RuntimeApprovalRow,
  SystemType, SystemStatus, HealthStatus, SyncStatus,
  DataSensitivity, CostType,
  MemoryType, MemoryConfidence, MemoryLifecycleStatus, MemorySourceType,
} from "@/types/runtime";

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
  input:        "#0a0919",
  green:        "#4ade80",
  red:          "#f87171",
  amber:        "#fbbf24",
} as const;

const IMPACT_COLOR: Record<string, string> = {
  low: C.green, medium: C.amber, high: "#fb923c", critical: C.red,
};

const HEALTH_COLOR: Record<string, string> = {
  healthy: C.green, warning: C.amber, broken: C.red,
  stale: C.muted, unknown: C.faint, needs_review: "#fb923c",
};

// ── option arrays ────────────────────────────────────────────────────────────

const MEMORY_TYPES:     MemoryType[]           = ["fact","decision","assumption","opinion","task","system_state","risk","dependency","doctrine_reference"];
const MEMORY_CONFS:     MemoryConfidence[]      = ["confirmed","inferred","uncertain","stale","conflicted"];
const MEMORY_LIFECYCLE: MemoryLifecycleStatus[] = ["draft","active","locked","stale","superseded","archived","conflicted"];
const MEMORY_SOURCES:   MemorySourceType[]      = ["founder_input","codebase","database","n8n","admin_ui","deployment","document","chat_summary","ai_analysis"];
const SYS_TYPES:        SystemType[]            = ["public_page","admin_page","api_route","database_table","workflow","ai_module","product_system","internal_system","doctrine_release","service_offer","external_dependency"];
const SYS_STATUSES:     SystemStatus[]          = ["planned","active","paused","deprecated","broken","archived"];
const HEALTH_STATUSES:  HealthStatus[]          = ["healthy","warning","broken","stale","unknown","needs_review"];
const SYNC_STATUSES:    SyncStatus[]            = ["in_sync","stale","drift_detected","conflicted","unknown","manual_review_required"];
const DATA_SENS:        DataSensitivity[]       = ["public","internal","restricted","confidential"];
const RISK_LEVELS                               = ["critical","high","medium","low"];
const COST_TYPES:       CostType[]              = ["free","fixed_subscription","usage_based","hybrid","manual","unknown"];

// ── helpers ──────────────────────────────────────────────────────────────────

const fmt = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "—";
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 2)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── shared styles ─────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 13px", borderRadius: 8,
  border: `1px solid ${C.border}`, background: C.input,
  color: C.text, fontSize: 13, outline: "none", boxSizing: "border-box",
  fontFamily: "system-ui, -apple-system, sans-serif",
};

const taStyle: React.CSSProperties = { ...inputStyle, resize: "vertical" };

// ── shared components ─────────────────────────────────────────────────────────

function Label({ text, required }: { text: string; required?: boolean }) {
  return (
    <label style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: C.faint, marginBottom: 7 }}>
      {text}{required && <span style={{ color: C.red, marginLeft: 3 }}>*</span>}
    </label>
  );
}

function SectionCard({ num, title, subtitle, children }: { num: number; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{ borderRadius: 12, border: `1px solid ${C.border}`, background: C.panel, padding: "22px 24px" }}>
      <div style={{ marginBottom: 18 }}>
        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.45em", textTransform: "uppercase", color: C.accent, margin: "0 0 4px" }}>Action {num}</p>
        <p style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: "0 0 4px" }}>{title}</p>
        {subtitle && <p style={{ fontSize: 12, color: C.faint, margin: 0 }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function FeedbackMsg({ msg }: { msg: { ok: boolean; text: string } | null }) {
  if (!msg) return null;
  const ok = msg.ok;
  return (
    <div style={{ padding: "10px 14px", borderRadius: 8, marginTop: 12, fontSize: 12, border: `1px solid ${ok ? "rgba(74,222,128,0.28)" : "rgba(239,68,68,0.28)"}`, background: ok ? "rgba(74,222,128,0.07)" : "rgba(239,68,68,0.07)", color: ok ? C.green : C.red }}>
      {msg.text}
    </div>
  );
}

function SubmitBtn({ label, loading, disabled }: { label: string; loading: boolean; disabled?: boolean }) {
  const busy = loading || !!disabled;
  return (
    <button type="submit" disabled={busy} style={{ padding: "9px 22px", borderRadius: 8, background: C.accent, border: "none", color: "#000", fontSize: 13, fontWeight: 700, cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.6 : 1 }}>
      {loading ? "Working…" : label}
    </button>
  );
}

function SelectField({ label, value, onChange, options, required, placeholder }: {
  label: string; value: string; onChange: (v: string) => void;
  options: string[]; required?: boolean; placeholder?: string;
}) {
  return (
    <div>
      <Label text={label} required={required} />
      <select value={value} onChange={e => onChange(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }} required={required}>
        <option value="">{placeholder ?? "Select…"}</option>
        {options.map(o => <option key={o} value={o}>{fmt(o)}</option>)}
      </select>
    </div>
  );
}

// ── state result type ─────────────────────────────────────────────────────────

type StateResult = {
  systems_count:        number;
  active_systems:       number;
  broken_systems:       number;
  pending_approvals:    number;
  open_conflicts:       number;
  stale_memories:       number;
  recent_health_checks: Array<{ id: string; system_id: string; status: string; check_type: string | null; checked_at: string; notes: string | null }>;
};

// ── page ─────────────────────────────────────────────────────────────────────

export default function RuntimeControlPage() {

  // ── initial data ────────────────────────────────────────────────────────────
  const [systems,     setSystems]     = useState<RuntimeSystemRow[]>([]);
  const [conflicts,   setConflicts]   = useState<RuntimeConflictRow[]>([]);
  const [approvals,   setApprovals]   = useState<RuntimeApprovalRow[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/runtime/systems").then(r => r.ok ? r.json() : { systems: [] }),
      fetch("/api/runtime/conflicts?status=open&limit=50").then(r => r.ok ? r.json() : { conflicts: [] }),
      fetch("/api/runtime/approvals?status=pending&limit=50").then(r => r.ok ? r.json() : { approvals: [] }),
    ]).then(([s, c, a]) => {
      setSystems(s.systems ?? []);
      setConflicts(c.conflicts ?? []);
      setApprovals(a.approvals ?? []);
      setDataLoading(false);
    });
  }, []);

  // ── 1: health check ──────────────────────────────────────────────────────────
  const [hcSystem, setHcSystem] = useState("");
  const [hcHealth, setHcHealth] = useState<HealthStatus | "">("");
  const [hcSync,   setHcSync]   = useState<SyncStatus | "">("");
  const [hcNotes,  setHcNotes]  = useState("");
  const [hcBusy,   setHcBusy]   = useState(false);
  const [hcMsg,    setHcMsg]    = useState<{ ok: boolean; text: string } | null>(null);

  async function runHealthCheck(e: React.FormEvent) {
    e.preventDefault();
    if (!hcSystem || !hcHealth) return;
    setHcBusy(true); setHcMsg(null);
    const res = await fetch("/api/runtime/health-check", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ system_id: hcSystem, health_status: hcHealth, sync_status: hcSync || undefined, notes: hcNotes || null }),
    });
    const d = await res.json().catch(() => ({}));
    setHcMsg({ ok: res.ok, text: res.ok ? "Health check recorded." : (d.error ?? `HTTP ${res.status}`) });
    if (res.ok) { setHcSystem(""); setHcHealth(""); setHcSync(""); setHcNotes(""); }
    setHcBusy(false);
  }

  // ── 2: create memory ─────────────────────────────────────────────────────────
  const [memType,  setMemType]  = useState<MemoryType | "">("");
  const [memTitle, setMemTitle] = useState("");
  const [memBody,  setMemBody]  = useState("");
  const [memConf,  setMemConf]  = useState<MemoryConfidence | "">("");
  const [memLife,  setMemLife]  = useState<MemoryLifecycleStatus | "">("");
  const [memSrc,   setMemSrc]   = useState<MemorySourceType | "">("");
  const [memRef,   setMemRef]   = useState("");
  const [memTags,  setMemTags]  = useState("");
  const [memNotes, setMemNotes] = useState("");
  const [memBusy,  setMemBusy]  = useState(false);
  const [memMsg,   setMemMsg]   = useState<{ ok: boolean; text: string } | null>(null);

  async function createMemory(e: React.FormEvent) {
    e.preventDefault();
    if (!memType || !memTitle || !memBody || !memConf || !memLife || !memSrc) return;
    setMemBusy(true); setMemMsg(null);
    const tags = memTags.split(",").map(t => t.trim()).filter(Boolean);
    const res = await fetch("/api/runtime/memories", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: memType, title: memTitle, content: memBody,
        confidence: memConf, lifecycle_status: memLife, source_type: memSrc,
        source_ref: memRef || null,
        tags: tags.length > 0 ? tags : null,
        metadata: memNotes ? { notes: memNotes } : {},
      }),
    });
    const d = await res.json().catch(() => ({}));
    const short = typeof d.id === "string" ? d.id.slice(0, 8) : "?";
    setMemMsg({ ok: res.ok, text: res.ok ? `Memory created (${short}…).` : (d.error ?? `HTTP ${res.status}`) });
    if (res.ok) { setMemType(""); setMemTitle(""); setMemBody(""); setMemConf(""); setMemLife(""); setMemSrc(""); setMemRef(""); setMemTags(""); setMemNotes(""); }
    setMemBusy(false);
  }

  // ── 3: resolve conflict ───────────────────────────────────────────────────────
  const [resolveId,     setResolveId]     = useState("");
  const [resolveStatus, setResolveStatus] = useState<"resolved" | "dismissed">("resolved");
  const [resolution,    setResolution]    = useState("");
  const [resolveBusy,   setResolveBusy]   = useState(false);
  const [resolveMsg,    setResolveMsg]    = useState<{ ok: boolean; text: string } | null>(null);

  async function resolveConflict(e: React.FormEvent) {
    e.preventDefault();
    if (!resolveId) return;
    setResolveBusy(true); setResolveMsg(null);
    const res = await fetch(`/api/runtime/conflicts/${resolveId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: resolveStatus, resolution: resolution || null }),
    });
    const d = await res.json().catch(() => ({}));
    setResolveMsg({ ok: res.ok, text: res.ok ? "Conflict resolved." : (d.error ?? `HTTP ${res.status}`) });
    if (res.ok) { setConflicts(prev => prev.filter(c => c.id !== resolveId)); setResolveId(""); setResolution(""); }
    setResolveBusy(false);
  }

  // ── 4: review approvals ───────────────────────────────────────────────────────
  const [actioning,   setActioning]   = useState<Record<string, boolean>>({});
  const [actionedIds, setActionedIds] = useState<Set<string>>(new Set());
  const [actionMsgs,  setActionMsgs]  = useState<Record<string, { ok: boolean; text: string }>>({});

  async function handleApproval(id: string, action: "approve" | "reject") {
    setActioning(prev => ({ ...prev, [id]: true }));
    const res = await fetch(`/api/runtime/approvals/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const d = await res.json().catch(() => ({}));
    setActionMsgs(prev => ({ ...prev, [id]: { ok: res.ok, text: res.ok ? `${action}d` : (d.error ?? `HTTP ${res.status}`) } }));
    if (res.ok) setActionedIds(prev => new Set([...prev, id]));
    setActioning(prev => ({ ...prev, [id]: false }));
  }

  const pendingApprovals = approvals.filter(a => !actionedIds.has(a.id));

  // ── 5: register system ────────────────────────────────────────────────────────
  const [sysName,     setSysName]     = useState("");
  const [sysType,     setSysType]     = useState<SystemType | "">("");
  const [sysStatus,   setSysStatus]   = useState<SystemStatus | "">("");
  const [sysDesc,     setSysDesc]     = useState("");
  const [sysUrl,      setSysUrl]      = useState("");
  const [sysAdminUrl, setSysAdminUrl] = useState("");
  const [sysRisk,     setSysRisk]     = useState("");
  const [sysSens,     setSysSens]     = useState<DataSensitivity | "">("");
  const [sysCost,     setSysCost]     = useState("");
  const [sysCostType, setSysCostType] = useState<CostType | "">("");
  const [sysNotes,    setSysNotes]    = useState("");
  const [sysBusy,     setSysBusy]     = useState(false);
  const [sysMsg,      setSysMsg]      = useState<{ ok: boolean; text: string } | null>(null);

  async function registerSystem(e: React.FormEvent) {
    e.preventDefault();
    if (!sysName || !sysType || !sysStatus) return;
    setSysBusy(true); setSysMsg(null);
    const system_slug = sysName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const res = await fetch("/api/runtime/systems", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name:             sysName,
        system_slug,
        system_type:      sysType      || null,
        status:           sysStatus    || null,
        description:      sysDesc      || null,
        public_url:       sysUrl       || null,
        admin_url:        sysAdminUrl  || null,
        risk_level:       sysRisk      || null,
        data_sensitivity: sysSens      || "internal",
        cost_monthly:     sysCost ? parseFloat(sysCost) : null,
        cost_type:        sysCostType  || "unknown",
        notes:            sysNotes     || null,
      }),
    });
    const d = await res.json().catch(() => ({}));
    setSysMsg({ ok: res.ok, text: res.ok ? `"${sysName}" registered.` : (d.error ?? `HTTP ${res.status}`) });
    if (res.ok) {
      setSystems(prev => [...prev, d as RuntimeSystemRow]);
      setSysName(""); setSysType(""); setSysStatus(""); setSysDesc(""); setSysUrl("");
      setSysAdminUrl(""); setSysRisk(""); setSysSens(""); setSysCost(""); setSysCostType(""); setSysNotes("");
    }
    setSysBusy(false);
  }

  // ── 6: generate state ────────────────────────────────────────────────────────
  const [stateResult, setStateResult] = useState<StateResult | null>(null);
  const [stateBusy,   setStateBusy]   = useState(false);
  const [stateErr,    setStateErr]    = useState<string | null>(null);

  async function generateState() {
    setStateBusy(true); setStateErr(null);
    const res = await fetch("/api/runtime/state");
    if (res.ok) {
      setStateResult(await res.json() as StateResult);
    } else {
      setStateErr(`HTTP ${res.status}`);
    }
    setStateBusy(false);
  }

  // ── render ────────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.45em", textTransform: "uppercase", color: C.faint, marginBottom: 4 }}>CE Admin · Runtime</p>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: "-0.02em", margin: 0 }}>Control Panel</h1>
        <p style={{ fontSize: 12, color: C.faint, marginTop: 4 }}>6 privileged write actions. All changes go directly to the runtime registry.</p>
      </div>

      {/* ── 1: Run Health Check ─────────────────────────────────────────── */}
      <SectionCard num={1} title="Run Health Check" subtitle="Record a manual health check for a registered system.">
        <form onSubmit={runHealthCheck} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <Label text="System" required />
            <select value={hcSystem} onChange={e => setHcSystem(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }} required>
              <option value="">Select system…</option>
              {dataLoading
                ? <option disabled>Loading…</option>
                : systems.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
              }
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <SelectField label="Health Status" value={hcHealth} onChange={v => setHcHealth(v as HealthStatus)} options={HEALTH_STATUSES} required />
            <SelectField label="Sync Status" value={hcSync} onChange={v => setHcSync(v as SyncStatus)} options={SYNC_STATUSES} />
          </div>
          <div>
            <Label text="Notes" />
            <textarea value={hcNotes} onChange={e => setHcNotes(e.target.value)} rows={2} style={taStyle} placeholder="Issues observed, context…" />
          </div>
          <div><SubmitBtn label="Record Health Check" loading={hcBusy} /></div>
          <FeedbackMsg msg={hcMsg} />
        </form>
      </SectionCard>

      {/* ── 2: Create Memory Record ─────────────────────────────────────── */}
      <SectionCard num={2} title="Create Memory Record" subtitle="Add a new entry to the runtime memory register.">
        <form onSubmit={createMemory} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            <SelectField label="Memory Type" value={memType} onChange={v => setMemType(v as MemoryType)} options={MEMORY_TYPES} required />
            <SelectField label="Confidence" value={memConf} onChange={v => setMemConf(v as MemoryConfidence)} options={MEMORY_CONFS} required />
            <SelectField label="Lifecycle Status" value={memLife} onChange={v => setMemLife(v as MemoryLifecycleStatus)} options={MEMORY_LIFECYCLE} required />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
            <div>
              <Label text="Title" required />
              <input value={memTitle} onChange={e => setMemTitle(e.target.value)} style={inputStyle} placeholder="Short, searchable title" required />
            </div>
            <SelectField label="Source Type" value={memSrc} onChange={v => setMemSrc(v as MemorySourceType)} options={MEMORY_SOURCES} required />
          </div>
          <div>
            <Label text="Content" required />
            <textarea value={memBody} onChange={e => setMemBody(e.target.value)} rows={4} style={taStyle} placeholder="Full memory content…" required />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <Label text="Source Ref" />
              <input value={memRef} onChange={e => setMemRef(e.target.value)} style={inputStyle} placeholder="URL, commit, filename…" />
            </div>
            <div>
              <Label text="Tags" />
              <input value={memTags} onChange={e => setMemTags(e.target.value)} style={inputStyle} placeholder="tag1, tag2, tag3" />
            </div>
          </div>
          <div>
            <Label text="Notes" />
            <textarea value={memNotes} onChange={e => setMemNotes(e.target.value)} rows={2} style={taStyle} placeholder="Internal notes stored in metadata…" />
          </div>
          <div><SubmitBtn label="Create Memory" loading={memBusy} /></div>
          <FeedbackMsg msg={memMsg} />
        </form>
      </SectionCard>

      {/* ── 3: Resolve Conflict ─────────────────────────────────────────── */}
      <SectionCard num={3} title="Resolve Conflict" subtitle="Mark an open conflict as resolved or dismissed.">
        {dataLoading ? (
          <p style={{ fontSize: 13, color: C.faint }}>Loading conflicts…</p>
        ) : conflicts.length === 0 && !resolveMsg ? (
          <p style={{ fontSize: 13, color: C.faint }}>No open conflicts.</p>
        ) : (
          <form onSubmit={resolveConflict} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {conflicts.length > 0 && (
              <div>
                <Label text="Select Conflict" required />
                <div style={{ borderRadius: 8, border: `1px solid ${C.border}`, overflow: "hidden" }}>
                  {conflicts.map((cf, i) => (
                    <label key={cf.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", cursor: "pointer", background: resolveId === cf.id ? C.accentBg : "transparent", borderBottom: i < conflicts.length - 1 ? `1px solid ${C.border}` : undefined }}>
                      <input
                        type="radio"
                        name="conflictId"
                        value={cf.id}
                        checked={resolveId === cf.id}
                        onChange={() => setResolveId(cf.id)}
                        style={{ accentColor: C.accent, flexShrink: 0 }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: C.text }}>{cf.title}</p>
                        <p style={{ margin: "2px 0 0", fontSize: 10, color: C.faint }}>{fmt(cf.conflict_type)} · {timeAgo(cf.detected_at)}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <Label text="Action" />
                <select value={resolveStatus} onChange={e => setResolveStatus(e.target.value as "resolved" | "dismissed")} style={{ ...inputStyle, cursor: "pointer" }}>
                  <option value="resolved">Mark resolved</option>
                  <option value="dismissed">Dismiss</option>
                </select>
              </div>
            </div>
            <div>
              <Label text="Resolution Notes" />
              <textarea value={resolution} onChange={e => setResolution(e.target.value)} rows={3} style={taStyle} placeholder="How was this conflict resolved?" />
            </div>
            <div><SubmitBtn label="Resolve Conflict" loading={resolveBusy} disabled={!resolveId} /></div>
            <FeedbackMsg msg={resolveMsg} />
          </form>
        )}
      </SectionCard>

      {/* ── 4: Review Approval Queue ────────────────────────────────────── */}
      <SectionCard num={4} title="Review Approval Queue" subtitle="Approve or reject pending approval requests.">
        {dataLoading ? (
          <p style={{ fontSize: 13, color: C.faint }}>Loading approvals…</p>
        ) : pendingApprovals.length === 0 ? (
          <p style={{ fontSize: 13, color: C.faint }}>No pending approvals.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {pendingApprovals.map(a => {
              const inFlight = !!actioning[a.id];
              const msg = actionMsgs[a.id];
              return (
                <div key={a.id} style={{ padding: "14px 16px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.panelDeep }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.text }}>{a.title}</p>
                      {a.description && <p style={{ margin: "3px 0 0", fontSize: 11, color: C.faint }}>{a.description}</p>}
                      <p style={{ margin: "4px 0 0", fontSize: 10, color: C.faint }}>{fmt(a.entity_type)} · {a.reversibility_class ? fmt(a.reversibility_class) : "—"} · {timeAgo(a.requested_at)}</p>
                    </div>
                    {a.reversibility_class && (
                      <span style={{ padding: "3px 9px", borderRadius: 5, background: "rgba(148,163,184,0.12)", color: C.faint, fontSize: 10, fontWeight: 800, textTransform: "uppercase", whiteSpace: "nowrap" }}>
                        {a.reversibility_class}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {msg ? (
                      <span style={{ fontSize: 12, color: msg.ok ? C.green : C.red, fontWeight: 600 }}>{msg.text}</span>
                    ) : (
                      <>
                        <button type="button" disabled={inFlight} onClick={() => handleApproval(a.id, "approve")} style={{ padding: "6px 16px", borderRadius: 7, border: "none", background: "rgba(74,222,128,0.15)", color: C.green, fontSize: 12, fontWeight: 700, cursor: inFlight ? "not-allowed" : "pointer", opacity: inFlight ? 0.5 : 1 }}>
                          Approve
                        </button>
                        <button type="button" disabled={inFlight} onClick={() => handleApproval(a.id, "reject")} style={{ padding: "6px 16px", borderRadius: 7, border: "none", background: "rgba(239,68,68,0.12)", color: C.red, fontSize: 12, fontWeight: 700, cursor: inFlight ? "not-allowed" : "pointer", opacity: inFlight ? 0.5 : 1 }}>
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* ── 5: Register System ──────────────────────────────────────────── */}
      <SectionCard num={5} title="Register System" subtitle="Add a new system to the runtime registry.">
        <form onSubmit={registerSystem} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 14 }}>
            <div>
              <Label text="System Name" required />
              <input value={sysName} onChange={e => setSysName(e.target.value)} style={inputStyle} placeholder="e.g. CE Signals API" required />
            </div>
            <SelectField label="Type" value={sysType} onChange={v => setSysType(v as SystemType)} options={SYS_TYPES} required />
            <SelectField label="Status" value={sysStatus} onChange={v => setSysStatus(v as SystemStatus)} options={SYS_STATUSES} required />
          </div>
          {sysName && (
            <p style={{ fontSize: 11, color: C.faint, marginTop: -8 }}>
              Slug: <code style={{ color: C.muted }}>{sysName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}</code>
            </p>
          )}
          <div>
            <Label text="Description" />
            <input value={sysDesc} onChange={e => setSysDesc(e.target.value)} style={inputStyle} placeholder="What this system does" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <Label text="Public URL" />
              <input value={sysUrl} onChange={e => setSysUrl(e.target.value)} style={inputStyle} placeholder="https://…" />
            </div>
            <div>
              <Label text="Admin URL" />
              <input value={sysAdminUrl} onChange={e => setSysAdminUrl(e.target.value)} style={inputStyle} placeholder="https://…" />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14 }}>
            <SelectField label="Risk Class" value={sysRisk} onChange={v => setSysRisk(v)} options={RISK_LEVELS} placeholder="None" />
            <SelectField label="Data Sensitivity" value={sysSens} onChange={v => setSysSens(v as DataSensitivity)} options={DATA_SENS} />
            <div>
              <Label text="Cost / mo (USD)" />
              <input type="number" min="0" step="0.01" value={sysCost} onChange={e => setSysCost(e.target.value)} style={inputStyle} placeholder="0" />
            </div>
            <SelectField label="Cost Type" value={sysCostType} onChange={v => setSysCostType(v as CostType)} options={COST_TYPES} />
          </div>
          <div>
            <Label text="Notes" />
            <textarea value={sysNotes} onChange={e => setSysNotes(e.target.value)} rows={2} style={taStyle} placeholder="Internal notes…" />
          </div>
          <div><SubmitBtn label="Register System" loading={sysBusy} /></div>
          <FeedbackMsg msg={sysMsg} />
        </form>
      </SectionCard>

      {/* ── 6: Generate Operating State ─────────────────────────────────── */}
      <SectionCard num={6} title="Generate Operating State" subtitle="Pull a live snapshot of CE's current operational state.">
        <button
          type="button"
          onClick={generateState}
          disabled={stateBusy}
          style={{ padding: "9px 22px", borderRadius: 8, background: C.accentBg, border: `1px solid ${C.accentBorder}`, color: C.accent, fontSize: 13, fontWeight: 700, cursor: stateBusy ? "not-allowed" : "pointer", opacity: stateBusy ? 0.6 : 1 }}
        >
          {stateBusy ? "Fetching…" : "Generate State"}
        </button>

        {stateErr && <p style={{ fontSize: 12, color: C.red, marginTop: 12 }}>{stateErr}</p>}

        {stateResult && (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
              {([
                ["Systems Total",     stateResult.systems_count,     C.accent],
                ["Active",            stateResult.active_systems,    C.green],
                ["Broken",            stateResult.broken_systems,    C.red],
                ["Pending Approvals", stateResult.pending_approvals, C.amber],
                ["Open Conflicts",    stateResult.open_conflicts,    C.red],
                ["Stale Memories",    stateResult.stale_memories,    C.muted],
              ] as [string, number, string][]).map(([label, value, color]) => (
                <div key={label} style={{ padding: "12px 14px", borderRadius: 8, background: C.panelDeep, border: `1px solid ${C.border}` }}>
                  <p style={{ margin: "0 0 5px", fontSize: 9, fontWeight: 700, letterSpacing: "0.35em", textTransform: "uppercase", color: C.faint }}>{label}</p>
                  <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color }}>{value ?? "—"}</p>
                </div>
              ))}
            </div>

            {stateResult.recent_health_checks.length > 0 && (
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: C.faint, marginBottom: 8 }}>Recent Health Checks</p>
                <div style={{ borderRadius: 8, border: `1px solid ${C.border}`, overflow: "hidden" }}>
                  {stateResult.recent_health_checks.map((hc, i) => (
                    <div key={hc.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 14px", background: C.panelDeep, borderBottom: i < stateResult.recent_health_checks.length - 1 ? `1px solid ${C.border}` : undefined }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: HEALTH_COLOR[hc.status] ?? C.faint, flexShrink: 0 }} />
                        <span style={{ fontSize: 11, color: C.muted, fontFamily: "monospace" }}>{hc.system_id.slice(0, 8)}…</span>
                        <span style={{ fontSize: 11, color: HEALTH_COLOR[hc.status] ?? C.faint, fontWeight: 600 }}>{fmt(hc.status)}</span>
                        {hc.notes && <span style={{ fontSize: 10, color: C.faint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>{hc.notes}</span>}
                      </div>
                      <span style={{ fontSize: 10, color: C.faint, flexShrink: 0 }}>{timeAgo(hc.checked_at)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </SectionCard>

    </div>
  );
}
