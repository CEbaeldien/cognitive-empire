import { createClient } from "@supabase/supabase-js";
import type { DreGovernanceRule } from "@/types/dr-e";

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

const RULE_COLOR: Record<string, string> = {
  autonomous:        "#4ade80",
  requires_approval: "#fbbf24",
  forbidden:         "#f87171",
};

const RULE_DESC: Record<string, string> = {
  autonomous:        "Dr. E may execute without founder approval.",
  requires_approval: "Founder approval required before execution.",
  forbidden:         "Dr. E is prohibited from this category of action.",
};

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export default async function SettingsPage() {
  const { data, error } = await sb()
    .from("dre_governance")
    .select("*")
    .eq("active", true)
    .order("rule_type")
    .order("rule_name");

  const rules = (data ?? []) as DreGovernanceRule[];

  const groups = ["autonomous", "requires_approval", "forbidden"] as const;

  return (
    <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 28 }}>
      <div>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.45em", textTransform: "uppercase", color: C.faint, marginBottom: 4 }}>Dr. E · Settings</p>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: "-0.02em", margin: 0 }}>Governance Rules</h1>
        <p style={{ fontSize: 12, color: C.faint, marginTop: 4 }}>Defines the operational boundaries of Dr. E. {rules.length} active rules.</p>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", borderRadius: 8, border: "1px solid rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.06)" }}>
          <p style={{ fontSize: 12, color: "#f87171", margin: 0 }}>Database error: {error.message}</p>
        </div>
      )}

      {groups.map((group) => {
        const groupRules = rules.filter((r) => r.rule_type === group);
        if (groupRules.length === 0) return null;
        const color = RULE_COLOR[group];
        return (
          <div key={group}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.4em", textTransform: "uppercase", color, margin: 0 }}>
                {group.replace(/_/g, " ")}
              </p>
              <p style={{ fontSize: 11, color: C.faint, margin: 0 }}>{RULE_DESC[group]}</p>
            </div>
            <div style={{ borderRadius: 10, border: `1px solid ${C.border}`, overflow: "hidden" }}>
              {groupRules.map((rule, i) => (
                <div key={rule.id} style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: "14px 18px", background: C.panel, borderBottom: i < groupRules.length - 1 ? `1px solid ${C.border}` : undefined }}>
                  <div style={{ paddingTop: 2, flexShrink: 0 }}>
                    <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: `${color}60` }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: "0 0 3px" }}>{rule.rule_name}</p>
                    {rule.description && (
                      <p style={{ fontSize: 12, color: C.muted, margin: "0 0 4px", lineHeight: 1.6 }}>{rule.description}</p>
                    )}
                    {rule.action_category && (
                      <span style={{ fontSize: 10, color: C.faint, textTransform: "uppercase", letterSpacing: "0.05em" }}>{rule.action_category}</span>
                    )}
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
