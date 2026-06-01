import Link from "next/link";

const C = {
  bg:           "#09091c",
  panel:        "#0e0c1f",
  border:       "#1c1a35",
  accent:       "#00E0FF",
  accentBg:     "rgba(0,224,255,0.08)",
  accentBorder: "rgba(0,224,255,0.25)",
  text:         "#f1f5f9",
  muted:        "#94a3b8",
  faint:        "#64748b",
} as const;

const LINKS = [
  { href: "/ce-admin/signals",        label: "All Signals",    desc: "Full signal list — filter by status and category." },
  { href: "/ce-admin/signals/review", label: "Review Queue",   desc: "Signals pending founder review before publish." },
  { href: "/ce-admin/signals/new",    label: "New Signal",     desc: "Draft a new doctrine-evaluated intelligence signal." },
  { href: "/signals",                 label: "Public Feed",    desc: "The live public-facing CE Signals intelligence feed.", external: true },
];

export default function DrESignalsPage() {
  return (
    <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.45em", textTransform: "uppercase", color: C.faint, marginBottom: 4 }}>Dr. E · Intelligence</p>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: "-0.02em", margin: 0 }}>Signals</h1>
        <p style={{ fontSize: 12, color: C.faint, marginTop: 4 }}>Access to the CE Signals intelligence pipeline.</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {LINKS.map(({ href, label, desc, external }) => (
          <Link key={href} href={href} style={{ textDecoration: "none" }} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}>
            <div style={{
              padding: "18px 22px", borderRadius: 12,
              border: `1px solid ${C.accentBorder}`,
              background: C.accentBg,
              transition: "all 0.12s",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: C.accent, margin: 0 }}>{label}</p>
                {external && (
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.faint, padding: "2px 6px", borderRadius: 4, border: `1px solid ${C.border}` }}>
                    external
                  </span>
                )}
              </div>
              <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>{desc}</p>
              <p style={{ fontSize: 11, color: C.faint, margin: "6px 0 0", fontFamily: "monospace" }}>{href}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
