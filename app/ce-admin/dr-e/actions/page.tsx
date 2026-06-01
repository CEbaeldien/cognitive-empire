import { createClient } from "@supabase/supabase-js";
import type { DreAction } from "@/types/dr-e";

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

const RISK_COLOR: Record<string, string> = {
  safe:      "#4ade80",
  medium:    "#fbbf24",
  high:      "#fb923c",
  forbidden: "#f87171",
};

const STATUS_COLOR: Record<string, string> = {
  suggested:        "#00E0FF",
  drafted:          "#a78bfa",
  pending_approval: "#fbbf24",
  approved:         "#4ade80",
  executed:         "#94a3b8",
  failed:           "#f87171",
  blocked:          "#fb923c",
  archived:         "#475569",
};

function Badge({ value, colorMap }: { value: string; colorMap: Record<string, string> }) {
  const color = colorMap[value] ?? C.faint;
  return (
    <span style={{ padding: "3px 9px", borderRadius: 5, background: `${color}18`, color, fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
      {value.replace(/_/g, " ")}
    </span>
  );
}

function fmt(s: string | null | undefined): string {
  if (!s) return "—";
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export default async function ActionsPage() {
  const { data, error } = await sb()
    .from("dre_actions")
    .select("*")
    .order("created_at", { ascending: false });

  const actions = (data ?? []) as DreAction[];
  const pending = actions.filter((a) => a.status === "suggested" || a.status === "pending_approval").length;

  return (
    <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.45em", textTransform: "uppercase", color: C.faint, marginBottom: 4 }}>Dr. E · Actions</p>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: "-0.02em", margin: 0 }}>Action Queue</h1>
        <p style={{ fontSize: 12, color: C.faint, marginTop: 4 }}>{actions.length} actions · {pending} pending</p>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", borderRadius: 8, border: "1px solid rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.06)" }}>
          <p style={{ fontSize: 12, color: "#f87171", margin: 0 }}>Database error: {error.message}</p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {actions.length === 0 ? (
          <div style={{ padding: "40px 24px", borderRadius: 12, border: `1px solid ${C.border}`, background: C.panel, textAlign: "center" }}>
            <p style={{ fontSize: 13, color: C.faint, margin: 0 }}>No actions in queue.</p>
          </div>
        ) : actions.map((a) => (
          <div key={a.id} style={{ padding: "18px 22px", borderRadius: 12, border: `1px solid ${C.border}`, background: C.panel }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 8 }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: "0 0 3px" }}>{a.title}</p>
                <p style={{ fontSize: 11, color: C.faint, margin: 0 }}>
                  {fmt(a.action_type)} {a.source_module ? `· ${fmt(a.source_module)}` : ""}
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5, alignItems: "flex-end", flexShrink: 0 }}>
                <Badge value={a.status}     colorMap={STATUS_COLOR} />
                <Badge value={a.risk_level} colorMap={RISK_COLOR}   />
                {a.requires_approval && (
                  <span style={{ padding: "3px 9px", borderRadius: 5, background: "rgba(251,191,36,0.12)", color: "#fbbf24", fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    approval req.
                  </span>
                )}
              </div>
            </div>
            {a.notes && (
              <p style={{ fontSize: 12, color: C.muted, margin: 0, lineHeight: 1.6 }}>{a.notes}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
