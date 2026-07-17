import Link from "next/link";

const LEGAL_LINKS = [
  { label: "Refunds", href: "/refunds" },
  { label: "Terms", href: "/terms" },
  { label: "Privacy", href: "/privacy" },
  { label: "Legal", href: "/legal" },
];

export default function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--ce-border)", background: "var(--ce-surface)" }}>
      <div style={{ maxWidth: "64rem", margin: "0 auto", padding: "40px 24px 28px" }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 24,
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <div>
            <p style={{ color: "var(--ce-text)", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", margin: "0 0 6px" }}>
              CE Digital Editions
            </p>
            <p style={{ color: "var(--ce-dim)", fontSize: "0.78rem", margin: 0 }}>
              Cognitive Empire Systems Ltd
            </p>
          </div>

          <nav style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
            {LEGAL_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                style={{ color: "var(--ce-dim)", fontSize: "0.78rem", textDecoration: "none" }}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        <div style={{ borderTop: "1px solid var(--ce-border)", paddingTop: 18, display: "flex", flexDirection: "column", gap: 8 }}>
          <p style={{ color: "var(--ce-faint)", fontSize: "0.7rem", lineHeight: 1.7, maxWidth: "40rem", margin: 0 }}>
            Cognitive Empire Systems Ltd is a private company limited by shares registered in
            England and Wales. Company No. 17272459. Registered office: 71–75 Shelton Street,
            Covent Garden, London, WC2H 9JQ, United Kingdom.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <span style={{ color: "var(--ce-faint)", fontSize: "0.72rem" }}>
              Contact:{" "}
              <a href="mailto:founder@cognitiveempire.com" style={{ color: "var(--ce-gold)", textDecoration: "none" }}>
                founder@cognitiveempire.com
              </a>
            </span>
            <a
              href="https://cognitiveempire.com"
              style={{ color: "var(--ce-faint)", fontSize: "0.72rem", textDecoration: "none" }}
            >
              Cognitive Empire — main site ↗
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
