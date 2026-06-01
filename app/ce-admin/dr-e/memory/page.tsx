import { createClient } from "@supabase/supabase-js";

const C = {
  bg:        "#09091c",
  panel:     "#0e0c1f",
  panelDeep: "#0b0a1e",
  border:    "#1c1a35",
  accent:    "#00E0FF",
  text:      "#f1f5f9",
  muted:     "#94a3b8",
  faint:     "#64748b",
} as const;

const CONF_COLOR: Record<string, string> = {
  confirmed:  "#4ade80",
  inferred:   "#00E0FF",
  uncertain:  "#fbbf24",
  stale:      "#94a3b8",
  conflicted: "#f87171",
};

function Badge({ value, colorMap }: { value: string; colorMap: Record<string, string> }) {
  const color = colorMap[value] ?? C.faint;
  return (
    <span style={{ padding: "3px 9px", borderRadius: 5, background: `${color}18`, color, fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
      {value}
    </span>
  );
}

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 2)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

type Memory = { id: string; title: string; confidence: string; memory_type: string; lifecycle_status: string; content: string | null; updated_at: string };

export default async function MemoryPage() {
  const { data, error } = await sb()
    .from("runtime_memories")
    .select("id, title, confidence, memory_type, lifecycle_status, content, updated_at")
    .order("updated_at", { ascending: false })
    .limit(100);

  const memories = (data ?? []) as Memory[];

  const typeGroups = [...new Set(memories.map((m) => m.memory_type))].sort();

  return (
    <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.45em", textTransform: "uppercase", color: C.faint, marginBottom: 4 }}>Dr. E · Memory</p>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: "-0.02em", margin: 0 }}>Runtime Memory</h1>
        <p style={{ fontSize: 12, color: C.faint, marginTop: 4 }}>{memories.length} entries from CE Runtime memory bank.</p>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", borderRadius: 8, border: "1px solid rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.06)" }}>
          <p style={{ fontSize: 12, color: "#f87171", margin: 0 }}>Database error: {error.message}</p>
        </div>
      )}

      {memories.length === 0 && !error && (
        <div style={{ padding: "40px 24px", borderRadius: 12, border: `1px solid ${C.border}`, background: C.panel, textAlign: "center" }}>
          <p style={{ fontSize: 13, color: C.faint, margin: 0 }}>No memory entries found.</p>
        </div>
      )}

      {typeGroups.map((type) => {
        const group = memories.filter((m) => m.memory_type === type);
        return (
          <div key={type}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.4em", textTransform: "uppercase", color: C.accent, marginBottom: 10 }}>
              {type.replace(/_/g, " ")} · {group.length}
            </p>
            <div style={{ borderRadius: 10, border: `1px solid ${C.border}`, overflow: "hidden" }}>
              {group.map((m, i) => (
                <div key={m.id} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, padding: "12px 16px", background: C.panel, borderBottom: i < group.length - 1 ? `1px solid ${C.border}` : undefined }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 600, color: C.text }}>{m.title}</p>
                    {m.content && (
                      <p style={{ margin: 0, fontSize: 11, color: C.faint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {m.content}
                      </p>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <Badge value={m.confidence}      colorMap={CONF_COLOR}    />
                    <span style={{ fontSize: 11, color: C.faint }}>{timeAgo(m.updated_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
