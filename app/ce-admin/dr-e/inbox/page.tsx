import { createClient } from "@supabase/supabase-js";
import type { DreInboxItem } from "@/types/dr-e";

const C = {
  bg:        "#09091c",
  panel:     "#0e0c1f",
  panelDeep: "#0b0a1e",
  border:    "#1c1a35",
  accent:    "#00E0FF",
  accentBg:  "rgba(0,224,255,0.08)",
  text:      "#f1f5f9",
  muted:     "#94a3b8",
  faint:     "#64748b",
} as const;

const URGENCY_COLOR: Record<string, string> = {
  high:   "#f87171",
  medium: "#fbbf24",
  low:    "#4ade80",
};

const STATE_COLOR: Record<string, string> = {
  needs_review:             "#fbbf24",
  draft_prepared:           "#00E0FF",
  routed_internally:        "#4ade80",
  founder_approval_required:"#fb923c",
  archived:                 "#475569",
};

const CATEGORY_COLOR: Record<string, string> = {
  drift:       "#00E0FF",
  work:        "#a78bfa",
  signals:     "#4ade80",
  research:    "#fbbf24",
  partnership: "#fb923c",
  general:     "#94a3b8",
  noise:       "#475569",
};

function Badge({ value, colorMap }: { value: string; colorMap: Record<string, string> }) {
  const color = colorMap[value] ?? C.faint;
  return (
    <span style={{ padding: "3px 9px", borderRadius: 5, background: `${color}18`, color, fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
      {value.replace(/_/g, " ")}
    </span>
  );
}

function fmt(d: string): string {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export default async function InboxPage() {
  const { data, error } = await sb()
    .from("dre_inbox")
    .select("*")
    .order("created_at", { ascending: false });

  const items = (data ?? []) as DreInboxItem[];

  return (
    <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.45em", textTransform: "uppercase", color: C.faint, marginBottom: 4 }}>Dr. E · Inbox</p>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: "-0.02em", margin: 0 }}>Inbox</h1>
        <p style={{ fontSize: 12, color: C.faint, marginTop: 4 }}>{items.length} item{items.length !== 1 ? "s" : ""} · sorted by arrival</p>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", borderRadius: 8, border: "1px solid rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.06)" }}>
          <p style={{ fontSize: 12, color: "#f87171", margin: 0 }}>Database error: {error.message}</p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {items.length === 0 ? (
          <div style={{ padding: "40px 24px", borderRadius: 12, border: `1px solid ${C.border}`, background: C.panel, textAlign: "center" }}>
            <p style={{ fontSize: 13, color: C.faint, margin: 0 }}>Inbox is empty.</p>
          </div>
        ) : items.map((item) => (
          <div key={item.id} style={{ padding: "18px 22px", borderRadius: 12, border: `1px solid ${C.border}`, background: C.panel }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 10 }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: "0 0 3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item.subject ?? "No subject"}
                </p>
                <p style={{ fontSize: 11, color: C.faint, margin: 0 }}>
                  {item.source_alias ?? item.sender ?? "Unknown"} · {fmt(item.created_at)}
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                {item.category && <Badge value={item.category} colorMap={CATEGORY_COLOR} />}
                <Badge value={item.urgency} colorMap={URGENCY_COLOR} />
                <Badge value={item.approval_state} colorMap={STATE_COLOR} />
              </div>
            </div>
            {item.body && (
              <p style={{ fontSize: 12, color: C.muted, margin: "0 0 10px", lineHeight: 1.6 }}>{item.body}</p>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              {item.suggested_route && (
                <span style={{ fontSize: 11, color: C.faint }}>Route: <span style={{ color: C.accent }}>{item.suggested_route}</span></span>
              )}
              {item.fit_score != null && (
                <span style={{ fontSize: 11, color: C.faint }}>Fit: <span style={{ color: item.fit_score >= 75 ? "#4ade80" : item.fit_score >= 50 ? "#fbbf24" : C.faint, fontWeight: 700 }}>{item.fit_score}</span></span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
