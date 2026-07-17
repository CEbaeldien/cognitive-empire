import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata: Metadata = { title: "Legal Information" };

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 16 }}>
      <span style={{ color: "var(--ce-faint)", fontSize: "0.72rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</span>
      <span style={{ color: "var(--ce-text)", fontSize: "0.92rem" }}>{value}</span>
    </div>
  );
}

export default function LegalPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Nav />
      <main style={{ flex: 1, maxWidth: "42rem", margin: "0 auto", width: "100%", padding: "64px 24px 96px" }}>
        <p style={{ color: "var(--ce-gold)", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", marginBottom: 14 }}>
          Legal Information
        </p>
        <h1 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "2rem", fontWeight: 700, color: "var(--ce-text)", margin: "0 0 32px" }}>
          Company Identity
        </h1>

        <div style={{ background: "var(--ce-card)", border: "1px solid var(--ce-border)", borderRadius: 8, padding: "28px 26px", marginBottom: 40 }}>
          <Row label="Legal name" value="Cognitive Empire Systems Ltd" />
          <Row label="Company type" value="Private company limited by shares" />
          <Row label="Jurisdiction" value="Registered in England and Wales" />
          <Row label="Company number" value="17272459" />
          <Row label="Registered office" value="71–75 Shelton Street, Covent Garden, London, WC2H 9JQ, United Kingdom" />
          <Row label="Director" value="Ebaeldien Kamal Hussain Maghazi" />
          <Row
            label="Contact"
            value={
              <a href="mailto:founder@cognitiveempire.com" style={{ color: "var(--ce-gold)", textDecoration: "none" }}>
                founder@cognitiveempire.com
              </a>
            }
          />
        </div>

        <p style={{ color: "var(--ce-muted)", fontSize: "0.88rem", lineHeight: 1.75, marginBottom: 28 }}>
          This site sells instantly delivered digital products only. No human fulfillment or
          professional services are provided through this site.
        </p>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <a href="/refunds" style={{ color: "var(--ce-gold)", fontSize: "0.85rem" }}>Refund Policy</a>
          <a href="/terms" style={{ color: "var(--ce-gold)", fontSize: "0.85rem" }}>Terms of Sale</a>
          <a href="/privacy" style={{ color: "var(--ce-gold)", fontSize: "0.85rem" }}>Privacy Policy</a>
        </div>
      </main>
      <Footer />
    </div>
  );
}
