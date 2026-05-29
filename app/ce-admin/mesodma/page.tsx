"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { SourceRow, RawItemRow, SignalCategory, SourceType } from "@/types/signals";
import type { IngestReport } from "@/lib/mesodma/types";

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

type SystemStats = {
  sources:            { total: number; active: number; paused: number; blocked: number };
  raw_items_today:    number;
  pending_enrichment: number;
  errors_24h:         number;
  last_ingest_at:     string | null;
};

type RawItemWithSource = RawItemRow & {
  sources: { name: string; category: string } | null;
};

type SourceFormData = {
  name: string; category: string; subcategory: string; source_type: string;
  endpoint_url: string; trust_tier: string; ingestion_mode: string;
  use_case: string; priority: string; notes: string;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES: SignalCategory[] = [
  "intelligence", "physical_systems", "infrastructure", "energy",
  "science_frontier", "governance_stability", "markets_human_prosperity", "resources_continuity",
];

const SOURCE_TYPES: SourceType[] = ["rss", "api", "scrape", "manual"];
const TRUST_TIERS = [1, 2, 3];
const INGESTION_STATUSES = ["active", "paused", "blocked"];

const BLANK_FORM: SourceFormData = {
  name: "", category: "", subcategory: "", source_type: "rss",
  endpoint_url: "", trust_tier: "2", ingestion_mode: "automatic",
  use_case: "", priority: "5", notes: "",
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

function fmtTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

// ── Small Components ──────────────────────────────────────────────────────────

function StatTile({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{ flex: 1, minWidth: 120, padding: "16px 20px", borderRadius: 10, background: C.panel, border: `1px solid ${C.border}` }}>
      <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.4em", textTransform: "uppercase", color: C.faint, margin: "0 0 8px" }}>{label}</p>
      <p style={{ fontSize: 26, fontWeight: 800, color: color ?? C.text, margin: 0, letterSpacing: "-0.03em", lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: 10, color: C.faint, margin: "6px 0 0" }}>{sub}</p>}
    </div>
  );
}

function Badge({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <span style={{ padding: "3px 9px", borderRadius: 5, background: bg, color, fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase" }}>
      {label}
    </span>
  );
}

function SourceStatusBadge({ status }: { status: string | null }) {
  if (!status || status === "active") return <Badge label="active" bg={C.accentBg} color={C.accent} />;
  if (status === "paused")  return <Badge label="paused"  bg={C.yellowBg}  color={C.yellow} />;
  if (status === "blocked") return <Badge label="blocked" bg={C.redBg}     color={C.red} />;
  return <Badge label={status} bg="rgba(100,116,139,0.1)" color={C.muted} />;
}

function ItemStatusBadge({ status }: { status: string | null }) {
  if (status === "extracted") return <Badge label="extracted" bg={C.accentBg}  color={C.accent} />;
  if (status === "pending")   return <Badge label="pending"   bg={C.yellowBg}  color={C.yellow} />;
  if (status === "error")     return <Badge label="error"     bg={C.redBg}     color={C.red} />;
  if (status === "skipped")   return <Badge label="skipped"   bg="rgba(100,116,139,0.1)" color={C.faint} />;
  return <Badge label={status ?? "—"} bg="rgba(100,116,139,0.1)" color={C.faint} />;
}

function TierBadge({ tier }: { tier: number | null }) {
  if (!tier) return <span style={{ color: C.faint, fontSize: 11 }}>—</span>;
  const colors: Record<number, [string, string]> = {
    1: [C.accentBg, C.accent],
    2: [C.yellowBg, C.yellow],
    3: [C.redBg, C.red],
  };
  const [bg, color] = colors[tier] ?? ["rgba(100,116,139,0.1)", C.muted];
  return <Badge label={`T${tier}`} bg={bg} color={color} />;
}

// ── Form fields (shared between Add + Edit modals) ────────────────────────────

function SourceFormFields({
  data,
  onChange,
}: {
  data: SourceFormData;
  onChange: (field: keyof SourceFormData, value: string) => void;
}) {
  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "8px 12px", borderRadius: 7,
    border: `1px solid ${C.border}`, background: C.input, color: C.text,
    fontSize: 13, outline: "none", boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 10, fontWeight: 700, letterSpacing: "0.3em",
    textTransform: "uppercase", color: C.faint, marginBottom: 5,
  };
  const field = (label: string, key: keyof SourceFormData, node: React.ReactNode) => (
    <div>
      <label style={labelStyle}>{label}</label>
      {node}
    </div>
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 20px" }}>
      {field("Name *", "name",
        <input style={inputStyle} value={data.name} onChange={e => onChange("name", e.target.value)} placeholder="e.g. MIT Technology Review" />
      )}
      {field("Category *", "category",
        <select style={{ ...inputStyle, cursor: "pointer" }} value={data.category} onChange={e => onChange("category", e.target.value)}>
          <option value="">Select category…</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{fmt(c)}</option>)}
        </select>
      )}
      {field("Subcategory", "subcategory",
        <input style={inputStyle} value={data.subcategory} onChange={e => onChange("subcategory", e.target.value)} placeholder="e.g. AI Hardware" />
      )}
      {field("Source Type *", "source_type",
        <select style={{ ...inputStyle, cursor: "pointer" }} value={data.source_type} onChange={e => onChange("source_type", e.target.value)}>
          {SOURCE_TYPES.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
        </select>
      )}
      <div style={{ gridColumn: "1 / -1" }}>
        {field("Feed URL / Endpoint", "endpoint_url",
          <input style={inputStyle} value={data.endpoint_url} onChange={e => onChange("endpoint_url", e.target.value)} placeholder="https://…" />
        )}
      </div>
      {field("Trust Tier (1–3)", "trust_tier",
        <select style={{ ...inputStyle, cursor: "pointer" }} value={data.trust_tier} onChange={e => onChange("trust_tier", e.target.value)}>
          <option value="">None</option>
          {TRUST_TIERS.map(t => <option key={t} value={t}>Tier {t}</option>)}
        </select>
      )}
      {field("Ingestion Mode", "ingestion_mode",
        <input style={inputStyle} value={data.ingestion_mode} onChange={e => onChange("ingestion_mode", e.target.value)} placeholder="automatic / manual / …" />
      )}
      {field("Use Case", "use_case",
        <input style={inputStyle} value={data.use_case} onChange={e => onChange("use_case", e.target.value)} placeholder="Signal sourcing, monitoring…" />
      )}
      {field("Priority (0–10)", "priority",
        <input style={inputStyle} type="number" min={0} max={10} value={data.priority} onChange={e => onChange("priority", e.target.value)} />
      )}
      <div style={{ gridColumn: "1 / -1" }}>
        {field("Notes", "notes",
          <textarea
            style={{ ...inputStyle, resize: "vertical", minHeight: 72 }}
            value={data.notes}
            onChange={e => onChange("notes", e.target.value)}
            placeholder="Optional context…"
          />
        )}
      </div>
    </div>
  );
}

// ── Edit Source Modal ─────────────────────────────────────────────────────────

function EditSourceModal({
  source,
  onClose,
  onSaved,
}: {
  source: SourceRow;
  onClose: () => void;
  onSaved: (updated: SourceRow) => void;
}) {
  const [form, setForm] = useState<SourceFormData>({
    name:          source.name,
    category:      source.category,
    subcategory:   source.subcategory ?? "",
    source_type:   source.source_type,
    endpoint_url:  source.endpoint_url ?? "",
    trust_tier:    String(source.trust_tier ?? ""),
    ingestion_mode: source.ingestion_mode ?? "",
    use_case:      source.use_case ?? "",
    priority:      String(source.priority ?? 0),
    notes:         source.notes ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  function update(field: keyof SourceFormData, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setSaving(true); setError(null);
    try {
      const res = await fetch(`/api/mesodma/sources/${source.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:           form.name.trim(),
          category:       form.category,
          subcategory:    form.subcategory.trim() || null,
          source_type:    form.source_type,
          endpoint_url:   form.endpoint_url.trim() || null,
          trust_tier:     form.trust_tier ? parseInt(form.trust_tier, 10) : null,
          ingestion_mode: form.ingestion_mode.trim() || null,
          use_case:       form.use_case.trim() || null,
          priority:       parseInt(form.priority, 10) || 0,
          notes:          form.notes.trim() || null,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? `HTTP ${res.status}`); }
      const updated = await res.json();
      onSaved(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.7)", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 680, maxHeight: "90vh", overflow: "auto", background: C.panelDark, borderRadius: 14, border: `1px solid ${C.border}`, boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}>
        <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.4em", textTransform: "uppercase", color: C.faint, margin: "0 0 3px" }}>Edit Source</p>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: C.text, margin: 0 }}>{source.name}</h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.faint, cursor: "pointer", fontSize: 20, lineHeight: 1, padding: 4 }}>×</button>
        </div>
        <div style={{ padding: "20px 24px" }}>
          <SourceFormFields data={form} onChange={update} />
          {error && <p style={{ marginTop: 14, fontSize: 12, color: C.red }}>{error}</p>}
          <div style={{ marginTop: 20, display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={onClose} style={{ padding: "8px 18px", borderRadius: 7, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, fontSize: 13, cursor: "pointer" }}>
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ padding: "8px 20px", borderRadius: 7, border: "none", background: C.accent, color: "#000", fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Section header ────────────────────────────────────────────────────────────

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

// ── Table wrapper ─────────────────────────────────────────────────────────────

function TableWrap({ headers, children, empty }: { headers: string[]; children: React.ReactNode; empty: boolean }) {
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
                No records found.
              </td>
            </tr>
          ) : children}
        </tbody>
      </table>
    </div>
  );
}

const TD: React.CSSProperties = { padding: "11px 14px", verticalAlign: "middle", borderBottom: `1px solid ${C.border}` };

// ── Main page ─────────────────────────────────────────────────────────────────

export default function MesodmaCockpit() {
  const router = useRouter();

  // Stats
  const [stats,       setStats]       = useState<SystemStats | null>(null);
  const [statsErr,    setStatsErr]     = useState<string | null>(null);

  // Sources
  const [sources,     setSources]     = useState<SourceRow[]>([]);
  const [srcLoading,  setSrcLoading]  = useState(true);
  const [srcErr,      setSrcErr]      = useState<string | null>(null);
  const [catFilter,   setCatFilter]   = useState("");
  const [tierFilter,  setTierFilter]  = useState("");
  const [stFilter,    setStFilter]    = useState("");
  const [editSource,  setEditSource]  = useState<SourceRow | null>(null);
  const [toggling,    setToggling]    = useState<string | null>(null);

  // Raw items
  const [items,       setItems]       = useState<RawItemWithSource[]>([]);
  const [itemTotal,   setItemTotal]   = useState(0);
  const [itemsLoading,setItemsLoading]= useState(true);
  const [itemsErr,    setItemsErr]    = useState<string | null>(null);
  const [itemStFilter,setItemStFilter]= useState("");
  const [draftingId,  setDraftingId]  = useState<string | null>(null);
  const [skippingId,  setSkippingId]  = useState<string | null>(null);

  // Ingest
  const [ingestRunning, setIngestRunning] = useState(false);
  const [ingestResult,  setIngestResult]  = useState<IngestReport | null>(null);
  const [ingestErr,     setIngestErr]     = useState<string | null>(null);

  // Add source form
  const [addOpen,   setAddOpen]   = useState(false);
  const [addForm,   setAddForm]   = useState<SourceFormData>(BLANK_FORM);
  const [addSaving, setAddSaving] = useState(false);
  const [addErr,    setAddErr]    = useState<string | null>(null);

  // ── Data loaders ────────────────────────────────────────────────────────────

  const loadStats = useCallback(() => {
    fetch("/api/mesodma/stats")
      .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
      .then(setStats)
      .catch(e => setStatsErr(String(e)));
  }, []);

  const loadSources = useCallback(() => {
    setSrcLoading(true); setSrcErr(null);
    const p = new URLSearchParams();
    if (catFilter)  p.set("category",         catFilter);
    if (tierFilter) p.set("trust_tier",        tierFilter);
    if (stFilter)   p.set("ingestion_status",  stFilter);
    fetch(`/api/mesodma/sources?${p}`)
      .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
      .then(d => { setSources(d.sources ?? []); setSrcLoading(false); })
      .catch(e => { setSrcErr(String(e)); setSrcLoading(false); });
  }, [catFilter, tierFilter, stFilter]);

  const loadItems = useCallback(() => {
    setItemsLoading(true); setItemsErr(null);
    const p = new URLSearchParams({ limit: "50" });
    if (itemStFilter) p.set("status", itemStFilter);
    fetch(`/api/mesodma/raw-items?${p}`)
      .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
      .then(d => { setItems(d.items ?? []); setItemTotal(d.total ?? 0); setItemsLoading(false); })
      .catch(e => { setItemsErr(String(e)); setItemsLoading(false); });
  }, [itemStFilter]);

  useEffect(() => { loadStats(); loadSources(); loadItems(); }, [loadStats, loadSources, loadItems]);

  // ── Source toggle ────────────────────────────────────────────────────────────

  async function toggleSource(src: SourceRow) {
    const isPaused = src.ingestion_status === "paused" || (!src.ingestion_status && !src.is_active);
    const update = isPaused
      ? { ingestion_status: "active",  is_active: true  }
      : { ingestion_status: "paused",  is_active: false };
    setToggling(src.id);
    try {
      const res = await fetch(`/api/mesodma/sources/${src.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = await res.json();
      setSources(prev => prev.map(s => s.id === src.id ? updated : s));
      loadStats();
    } finally {
      setToggling(null);
    }
  }

  // ── Draft signal from raw item ────────────────────────────────────────────────

  async function draftSignal(item: RawItemWithSource) {
    setDraftingId(item.id);
    try {
      const ef = item.extracted_fields as Record<string, unknown>;
      const title     = (ef.clean_title  as string) || item.title;
      const summary   = (ef.clean_summary as string) || (item.body?.slice(0, 400) ?? "Draft — fill in summary.");
      const category  = (item.sources?.category as SignalCategory) || "intelligence";

      const res = await fetch("/api/signals", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, summary, category,
          implication: "Pending analysis.",
          raw_item_id: item.id,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? `HTTP ${res.status}`); }
      const signal = await res.json();

      // Mark item as drafted
      await fetch(`/api/mesodma/raw-items/${item.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signal_processing_status: "drafted" }),
      });

      router.push(`/ce-admin/signals/${signal.id}`);
    } catch (e) {
      alert(`Draft signal failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setDraftingId(null);
    }
  }

  // ── Skip raw item ─────────────────────────────────────────────────────────────

  async function skipItem(item: RawItemWithSource) {
    setSkippingId(item.id);
    try {
      const res = await fetch(`/api/mesodma/raw-items/${item.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "skipped" }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setItems(prev => prev.map(it => it.id === item.id ? { ...it, status: "skipped" } : it));
      loadStats();
    } finally {
      setSkippingId(null);
    }
  }

  // ── Run ingest ────────────────────────────────────────────────────────────────

  async function runIngest() {
    setIngestRunning(true); setIngestResult(null); setIngestErr(null);
    try {
      const res = await fetch("/api/mesodma/trigger", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setIngestResult(data);
      loadStats(); loadItems();
    } catch (e) {
      setIngestErr(e instanceof Error ? e.message : String(e));
    } finally {
      setIngestRunning(false);
    }
  }

  // ── Add source ────────────────────────────────────────────────────────────────

  function updateAddForm(field: keyof SourceFormData, value: string) {
    setAddForm(prev => ({ ...prev, [field]: value }));
  }

  async function submitAddSource() {
    if (!addForm.name.trim() || !addForm.category || !addForm.source_type) {
      setAddErr("Name, Category, and Source Type are required."); return;
    }
    setAddSaving(true); setAddErr(null);
    try {
      const res = await fetch("/api/mesodma/sources", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:           addForm.name.trim(),
          category:       addForm.category,
          subcategory:    addForm.subcategory.trim() || null,
          source_type:    addForm.source_type,
          endpoint_url:   addForm.endpoint_url.trim() || null,
          trust_tier:     addForm.trust_tier ? parseInt(addForm.trust_tier, 10) : null,
          ingestion_mode: addForm.ingestion_mode.trim() || null,
          use_case:       addForm.use_case.trim() || null,
          priority:       parseInt(addForm.priority, 10) || 0,
          notes:          addForm.notes.trim() || null,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? `HTTP ${res.status}`); }
      setAddForm(BLANK_FORM); setAddOpen(false);
      loadSources(); loadStats();
    } catch (e) {
      setAddErr(e instanceof Error ? e.message : String(e));
    } finally {
      setAddSaving(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  const btnBase: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none" };

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1400 }}>

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.5em", textTransform: "uppercase", color: C.faint, marginBottom: 4 }}>CE Admin · Mesodma</p>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: C.text, letterSpacing: "-0.025em", margin: 0 }}>Ingestion Cockpit</h1>
      </div>

      {/* ── 1. SYSTEM STATUS ────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 12, marginBottom: 36, flexWrap: "wrap" }}>
        {stats ? (
          <>
            <StatTile
              label="Sources"
              value={stats.sources.total}
              sub={`${stats.sources.active} active · ${stats.sources.paused} paused · ${stats.sources.blocked} blocked`}
              color={C.accent}
            />
            <StatTile
              label="Items Today"
              value={stats.raw_items_today}
              sub="fetched since midnight"
              color={C.text}
            />
            <StatTile
              label="Pending Enrichment"
              value={stats.pending_enrichment}
              sub="awaiting enrichment pass"
              color={stats.pending_enrichment > 0 ? C.yellow : C.text}
            />
            <StatTile
              label="Errors (24h)"
              value={stats.errors_24h}
              sub="items with extraction errors"
              color={stats.errors_24h > 0 ? C.red : C.text}
            />
            <StatTile
              label="Last Ingest"
              value={timeAgo(stats.last_ingest_at)}
              sub={fmtTime(stats.last_ingest_at)}
              color={C.text}
            />
          </>
        ) : statsErr ? (
          <p style={{ fontSize: 12, color: C.red }}>{statsErr}</p>
        ) : (
          <p style={{ fontSize: 12, color: C.faint }}>Loading stats…</p>
        )}
      </div>

      {/* ── 2. SOURCE REGISTRY ──────────────────────────────────────────────── */}
      <div style={{ marginBottom: 36 }}>
        <SectionHeader
          label="Section 2"
          title="Source Registry"
          right={
            <button
              onClick={() => setAddOpen(v => !v)}
              style={{ ...btnBase, background: addOpen ? C.accentBg : C.accent, color: addOpen ? C.accent : "#000", border: addOpen ? `1px solid ${C.accentBorder}` : "none" }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              {addOpen ? "Close Form" : "Add Source"}
            </button>
          }
        />

        {/* Filters */}
        <div style={{ display: "flex", gap: 9, marginBottom: 14 }}>
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ padding: "7px 11px", borderRadius: 7, border: `1px solid ${C.border}`, background: C.input, color: catFilter ? C.text : C.faint, fontSize: 12, outline: "none", cursor: "pointer" }}>
            <option value="">All categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{fmt(c)}</option>)}
          </select>
          <select value={tierFilter} onChange={e => setTierFilter(e.target.value)} style={{ padding: "7px 11px", borderRadius: 7, border: `1px solid ${C.border}`, background: C.input, color: tierFilter ? C.text : C.faint, fontSize: 12, outline: "none", cursor: "pointer" }}>
            <option value="">All tiers</option>
            {TRUST_TIERS.map(t => <option key={t} value={t}>Tier {t}</option>)}
          </select>
          <select value={stFilter} onChange={e => setStFilter(e.target.value)} style={{ padding: "7px 11px", borderRadius: 7, border: `1px solid ${C.border}`, background: C.input, color: stFilter ? C.text : C.faint, fontSize: 12, outline: "none", cursor: "pointer" }}>
            <option value="">All statuses</option>
            {INGESTION_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {(catFilter || tierFilter || stFilter) && (
            <button onClick={() => { setCatFilter(""); setTierFilter(""); setStFilter(""); }} style={{ padding: "7px 12px", borderRadius: 7, border: `1px solid ${C.border}`, background: "transparent", color: C.faint, fontSize: 12, cursor: "pointer" }}>
              Clear
            </button>
          )}
        </div>

        {srcLoading ? (
          <p style={{ color: C.faint, fontSize: 13, padding: "24px 0" }}>Loading sources…</p>
        ) : srcErr ? (
          <p style={{ color: C.red, fontSize: 13 }}>{srcErr}</p>
        ) : (
          <TableWrap
            headers={["Name", "Category", "Trust Tier", "Mode", "Status", "Priority", "Last Fetched", ""]}
            empty={sources.length === 0}
          >
            {sources.map(src => (
              <tr key={src.id} style={{ background: C.panel }}>
                <td style={TD}>
                  <p style={{ margin: 0, fontWeight: 600, color: C.text, fontSize: 13 }}>{src.name}</p>
                  {src.subcategory && <p style={{ margin: "2px 0 0", fontSize: 10, color: C.faint }}>{src.subcategory}</p>}
                </td>
                <td style={TD}><span style={{ fontSize: 11, color: C.muted }}>{fmt(src.category)}</span></td>
                <td style={TD}><TierBadge tier={src.trust_tier} /></td>
                <td style={TD}><span style={{ fontSize: 11, color: C.muted }}>{src.ingestion_mode ?? "—"}</span></td>
                <td style={TD}><SourceStatusBadge status={src.ingestion_status} /></td>
                <td style={TD}><span style={{ fontSize: 11, color: C.muted }}>{src.priority ?? 0}</span></td>
                <td style={TD}><span style={{ fontSize: 11, color: C.faint }}>{timeAgo(src.last_fetched_at)}</span></td>
                <td style={{ ...TD, whiteSpace: "nowrap" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    {src.ingestion_status !== "blocked" && (
                      <button
                        onClick={() => toggleSource(src)}
                        disabled={toggling === src.id}
                        style={{ ...btnBase, padding: "5px 11px", background: "transparent", border: `1px solid ${C.border}`, color: C.muted, opacity: toggling === src.id ? 0.5 : 1 }}
                      >
                        {toggling === src.id ? "…" : (src.ingestion_status === "paused" || !src.is_active) ? "Activate" : "Pause"}
                      </button>
                    )}
                    <button
                      onClick={() => setEditSource(src)}
                      style={{ ...btnBase, padding: "5px 11px", background: "transparent", border: `1px solid ${C.border}`, color: C.muted }}
                    >
                      Edit
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </TableWrap>
        )}
      </div>

      {/* ── 3. RAW ITEMS QUEUE ──────────────────────────────────────────────── */}
      <div style={{ marginBottom: 36 }}>
        <SectionHeader
          label="Section 3"
          title={`Raw Items Queue${itemTotal > 0 ? ` — ${itemTotal} total` : ""}`}
          right={
            <select value={itemStFilter} onChange={e => setItemStFilter(e.target.value)} style={{ padding: "7px 11px", borderRadius: 7, border: `1px solid ${C.border}`, background: C.input, color: itemStFilter ? C.text : C.faint, fontSize: 12, outline: "none", cursor: "pointer" }}>
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="extracted">Extracted</option>
              <option value="error">Error</option>
              <option value="skipped">Skipped</option>
            </select>
          }
        />

        {itemsLoading ? (
          <p style={{ color: C.faint, fontSize: 13, padding: "24px 0" }}>Loading items…</p>
        ) : itemsErr ? (
          <p style={{ color: C.red, fontSize: 13 }}>{itemsErr}</p>
        ) : (
          <TableWrap
            headers={["Title", "Source", "Ingest", "Enrichment", "Signal", "Fetched", ""]}
            empty={items.length === 0}
          >
            {items.map(item => (
              <tr key={item.id} style={{ background: C.panel }}>
                <td style={{ ...TD, maxWidth: 300 }}>
                  {item.url ? (
                    <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: C.text, fontWeight: 600, fontSize: 12, textDecoration: "none", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.title}
                    </a>
                  ) : (
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 12, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</p>
                  )}
                  {item.author && <p style={{ margin: "2px 0 0", fontSize: 10, color: C.faint }}>{item.author}</p>}
                </td>
                <td style={TD}><span style={{ fontSize: 11, color: C.muted }}>{item.sources?.name ?? "—"}</span></td>
                <td style={TD}><ItemStatusBadge status={item.status} /></td>
                <td style={TD}><ItemStatusBadge status={item.enrichment_status} /></td>
                <td style={TD}>
                  {item.signal_processing_status === "drafted"
                    ? <Badge label="drafted" bg={C.greenBg} color={C.green} />
                    : <span style={{ fontSize: 11, color: C.faint }}>{item.signal_processing_status ?? "—"}</span>
                  }
                </td>
                <td style={TD}><span style={{ fontSize: 11, color: C.faint }}>{timeAgo(item.fetched_at)}</span></td>
                <td style={{ ...TD, whiteSpace: "nowrap" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    {item.signal_processing_status !== "drafted" && item.status !== "skipped" && (
                      <button
                        onClick={() => draftSignal(item)}
                        disabled={draftingId === item.id}
                        style={{ ...btnBase, padding: "5px 11px", background: C.accentBg, border: `1px solid ${C.accentBorder}`, color: C.accent, opacity: draftingId === item.id ? 0.6 : 1 }}
                      >
                        {draftingId === item.id ? "…" : "Draft Signal"}
                      </button>
                    )}
                    {item.status !== "skipped" && (
                      <button
                        onClick={() => skipItem(item)}
                        disabled={skippingId === item.id}
                        style={{ ...btnBase, padding: "5px 11px", background: "transparent", border: `1px solid ${C.border}`, color: C.faint, opacity: skippingId === item.id ? 0.5 : 1 }}
                      >
                        {skippingId === item.id ? "…" : "Skip"}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </TableWrap>
        )}
        {!itemsLoading && itemTotal > 50 && (
          <p style={{ marginTop: 10, fontSize: 11, color: C.faint }}>Showing 50 of {itemTotal}. Use status filter to narrow.</p>
        )}
      </div>

      {/* ── 4. INGEST CONTROL ───────────────────────────────────────────────── */}
      <div style={{ marginBottom: 36 }}>
        <SectionHeader label="Section 4" title="Ingest Control" />
        <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, padding: "20px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: ingestResult || ingestErr ? 20 : 0 }}>
            <button
              onClick={runIngest}
              disabled={ingestRunning}
              style={{ ...btnBase, padding: "10px 24px", background: ingestRunning ? C.accentBg : C.accent, color: ingestRunning ? C.accent : "#000", border: ingestRunning ? `1px solid ${C.accentBorder}` : "none", fontSize: 13, opacity: ingestRunning ? 0.8 : 1 }}
            >
              {ingestRunning ? (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M21 12a9 9 0 11-6.219-8.56" />
                  </svg>
                  Running Ingest…
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  Run Ingest Now
                </>
              )}
            </button>
            {ingestRunning && <p style={{ fontSize: 12, color: C.faint }}>Fetching active RSS sources and running GPT-4o-mini extraction…</p>}
          </div>

          {ingestErr && (
            <div style={{ padding: "12px 16px", borderRadius: 8, background: C.redBg, border: `1px solid ${C.red}44` }}>
              <p style={{ fontSize: 12, color: C.red, margin: 0 }}>Ingest failed: {ingestErr}</p>
            </div>
          )}

          {ingestResult && (
            <div>
              <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                <div style={{ padding: "10px 16px", borderRadius: 8, background: C.accentBg, border: `1px solid ${C.accentBorder}` }}>
                  <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.35em", textTransform: "uppercase", color: C.faint, margin: "0 0 3px" }}>Extracted</p>
                  <p style={{ fontSize: 20, fontWeight: 800, color: C.accent, margin: 0 }}>{ingestResult.total_extracted}</p>
                </div>
                <div style={{ padding: "10px 16px", borderRadius: 8, background: "rgba(100,116,139,0.06)", border: `1px solid ${C.border}` }}>
                  <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.35em", textTransform: "uppercase", color: C.faint, margin: "0 0 3px" }}>Skipped</p>
                  <p style={{ fontSize: 20, fontWeight: 800, color: C.muted, margin: 0 }}>{ingestResult.total_skipped}</p>
                </div>
                {ingestResult.total_errored > 0 && (
                  <div style={{ padding: "10px 16px", borderRadius: 8, background: C.redBg, border: `1px solid ${C.red}44` }}>
                    <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.35em", textTransform: "uppercase", color: C.faint, margin: "0 0 3px" }}>Errors</p>
                    <p style={{ fontSize: 20, fontWeight: 800, color: C.red, margin: 0 }}>{ingestResult.total_errored}</p>
                  </div>
                )}
                <div style={{ padding: "10px 16px", borderRadius: 8, background: "rgba(100,116,139,0.06)", border: `1px solid ${C.border}` }}>
                  <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.35em", textTransform: "uppercase", color: C.faint, margin: "0 0 3px" }}>Sources</p>
                  <p style={{ fontSize: 20, fontWeight: 800, color: C.muted, margin: 0 }}>{ingestResult.sources_processed}</p>
                </div>
              </div>
              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.35em", textTransform: "uppercase", color: C.faint, marginBottom: 8 }}>Per Source</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {ingestResult.sources.map(s => (
                    <div key={s.source_id} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12 }}>
                      <span style={{ color: C.muted, minWidth: 160, fontWeight: 500 }}>{s.slug}</span>
                      <span style={{ color: C.accent }}>{s.items_extracted} extracted</span>
                      <span style={{ color: C.faint }}>{s.items_skipped} skipped</span>
                      {s.items_errored > 0 && <span style={{ color: C.red }}>{s.items_errored} errors</span>}
                      {s.fetch_error && <span style={{ color: C.red }}>fetch error: {s.fetch_error.slice(0, 60)}</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 5. ADD SOURCE FORM ──────────────────────────────────────────────── */}
      {addOpen && (
        <div style={{ marginBottom: 36 }}>
          <SectionHeader label="Section 5" title="Add Source" />
          <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, padding: "20px 24px" }}>
            <SourceFormFields data={addForm} onChange={updateAddForm} />
            {addErr && <p style={{ marginTop: 14, fontSize: 12, color: C.red }}>{addErr}</p>}
            <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
              <button
                onClick={submitAddSource}
                disabled={addSaving}
                style={{ ...btnBase, padding: "9px 22px", background: C.accent, color: "#000", fontSize: 13, opacity: addSaving ? 0.7 : 1 }}
              >
                {addSaving ? "Adding…" : "Add Source"}
              </button>
              <button
                onClick={() => { setAddForm(BLANK_FORM); setAddOpen(false); setAddErr(null); }}
                style={{ ...btnBase, padding: "9px 18px", background: "transparent", border: `1px solid ${C.border}`, color: C.muted }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit source modal ────────────────────────────────────────────────── */}
      {editSource && (
        <EditSourceModal
          source={editSource}
          onClose={() => setEditSource(null)}
          onSaved={updated => {
            setSources(prev => prev.map(s => s.id === updated.id ? updated : s));
            setEditSource(null);
            loadStats();
          }}
        />
      )}

    </div>
  );
}
