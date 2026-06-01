import { createClient } from "@supabase/supabase-js";
import type { DreResearchThread } from "@/types/dr-e";

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

const THREAD_COLOR: Record<string, string> = {
  doctrine:      "#00E0FF",
  market:        "#a78bfa",
  pricing:       "#fbbf24",
  signals:       "#4ade80",
  foundry:       "#fb923c",
  investigation: "#94a3b8",
  hypothesis:    "#f472b6",
};

const DECAY_COLOR: Record<string, string> = {
  fresh:   "#4ade80",
  aging:   "#fbbf24",
  stale:   "#fb923c",
  decayed: "#f87171",
};

const STATUS_COLOR: Record<string, string> = {
  active:   "#4ade80",
  paused:   "#fbbf24",
  complete: "#94a3b8",
  decayed:  "#f87171",
};

function Badge({ value, colorMap }: { value: string; colorMap: Record<string, string> }) {
  const color = colorMap[value] ?? C.faint;
  return (
    <span style={{ padding: "3px 9px", borderRadius: 5, background: `${color}18`, color, fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
      {value}
    </span>
  );
}

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export default async function ResearchPage() {
  const { data, error } = await sb()
    .from("dre_research")
    .select("*")
    .order("created_at", { ascending: false });

  const threads = (data ?? []) as DreResearchThread[];
  const active  = threads.filter((t) => t.status === "active").length;

  return (
    <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.45em", textTransform: "uppercase", color: C.faint, marginBottom: 4 }}>Dr. E · Research</p>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: "-0.02em", margin: 0 }}>Research Threads</h1>
        <p style={{ fontSize: 12, color: C.faint, marginTop: 4 }}>{threads.length} threads · {active} active</p>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", borderRadius: 8, border: "1px solid rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.06)" }}>
          <p style={{ fontSize: 12, color: "#f87171", margin: 0 }}>Database error: {error.message}</p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {threads.length === 0 ? (
          <div style={{ padding: "40px 24px", borderRadius: 12, border: `1px solid ${C.border}`, background: C.panel, textAlign: "center" }}>
            <p style={{ fontSize: 13, color: C.faint, margin: 0 }}>No research threads.</p>
          </div>
        ) : threads.map((t) => (
          <div key={t.id} style={{ padding: "18px 22px", borderRadius: 12, border: `1px solid ${C.border}`, background: C.panel }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 10 }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: "0 0 4px" }}>{t.title}</p>
                {t.summary && (
                  <p style={{ fontSize: 12, color: C.muted, margin: 0, lineHeight: 1.6 }}>{t.summary}</p>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end", flexShrink: 0 }}>
                <Badge value={t.thread_type}  colorMap={THREAD_COLOR} />
                <Badge value={t.status}       colorMap={STATUS_COLOR} />
                <Badge value={t.decay_status} colorMap={DECAY_COLOR}  />
              </div>
            </div>
            {t.next_action && (
              <p style={{ fontSize: 11, color: C.faint, margin: 0 }}>
                Next: <span style={{ color: C.accent }}>{t.next_action}</span>
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
