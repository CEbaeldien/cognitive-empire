import { createClient } from "@supabase/supabase-js";
import type { DreProject } from "@/types/dr-e";

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

const PRIORITY_COLOR: Record<string, string> = {
  critical: "#f87171",
  high:     "#fb923c",
  medium:   "#fbbf24",
  low:      "#4ade80",
};

const STATUS_COLOR: Record<string, string> = {
  active:   "#4ade80",
  paused:   "#fbbf24",
  planned:  "#00E0FF",
  complete: "#94a3b8",
  decaying: "#f87171",
};

const DECAY_COLOR: Record<string, string> = {
  high:   "#f87171",
  medium: "#fbbf24",
  low:    "#4ade80",
  none:   "#475569",
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

const PRIORITY_ORDER = ["critical", "high", "medium", "low"];

export default async function ProjectsPage() {
  const { data, error } = await sb()
    .from("dre_projects")
    .select("*")
    .order("created_at", { ascending: true });

  const projects = ((data ?? []) as DreProject[]).sort(
    (a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority)
  );

  const TH: React.CSSProperties = {
    padding: "10px 14px", textAlign: "left", fontSize: 10, fontWeight: 700,
    letterSpacing: "0.35em", textTransform: "uppercase", color: C.faint, whiteSpace: "nowrap",
  };

  const TD: React.CSSProperties = {
    padding: "11px 14px", verticalAlign: "middle", fontSize: 12,
  };

  return (
    <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.45em", textTransform: "uppercase", color: C.faint, marginBottom: 4 }}>Dr. E · Projects</p>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: "-0.02em", margin: 0 }}>Projects</h1>
        <p style={{ fontSize: 12, color: C.faint, marginTop: 4 }}>{projects.length} projects · sorted by priority</p>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", borderRadius: 8, border: "1px solid rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.06)" }}>
          <p style={{ fontSize: 12, color: "#f87171", margin: 0 }}>Database error: {error.message}</p>
        </div>
      )}

      <div style={{ borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: C.panelDeep, borderBottom: `1px solid ${C.border}` }}>
            <tr>
              {["Project", "Status", "Priority", "Phase", "Next Action", "Decay Risk"].map((h) => (
                <th key={h} style={TH}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {projects.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ ...TD, textAlign: "center", color: C.faint, padding: "32px 20px" }}>
                  No projects found.
                </td>
              </tr>
            ) : projects.map((p, i) => (
              <tr key={p.id} style={{ borderBottom: i < projects.length - 1 ? `1px solid ${C.border}` : undefined, background: C.panel }}>
                <td style={{ ...TD, maxWidth: 220 }}>
                  <p style={{ margin: 0, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.project_name}</p>
                  {p.blocker && (
                    <p style={{ margin: "2px 0 0", fontSize: 10, color: "#f87171" }}>Blocker: {p.blocker}</p>
                  )}
                </td>
                <td style={TD}><Badge value={p.status}    colorMap={STATUS_COLOR}   /></td>
                <td style={TD}><Badge value={p.priority}  colorMap={PRIORITY_COLOR} /></td>
                <td style={{ ...TD, maxWidth: 200, color: C.muted }}>
                  <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.current_phase ?? "—"}
                  </span>
                </td>
                <td style={{ ...TD, maxWidth: 220, color: C.muted }}>
                  <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.next_action ?? "—"}
                  </span>
                </td>
                <td style={TD}>
                  <span style={{
                    padding: "2px 8px", borderRadius: 4,
                    background: `${DECAY_COLOR[p.decay_risk] ?? C.faint}14`,
                    color: DECAY_COLOR[p.decay_risk] ?? C.faint,
                    fontSize: 9, fontWeight: 800, textTransform: "uppercase",
                  }}>
                    {p.decay_risk}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
