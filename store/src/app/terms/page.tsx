import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata: Metadata = { title: "Terms of Sale" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <h2 style={{ color: "var(--ce-text)", fontSize: "1rem", fontWeight: 600, marginBottom: 12 }}>{title}</h2>
      <div style={{ color: "var(--ce-muted)", fontSize: "0.9rem", lineHeight: 1.75 }}>{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Nav />
      <main style={{ flex: 1, maxWidth: "42rem", margin: "0 auto", width: "100%", padding: "64px 24px 96px" }}>
        <p style={{ color: "var(--ce-gold)", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", marginBottom: 14 }}>
          Terms of Sale
        </p>
        <h1 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "2rem", fontWeight: 700, color: "var(--ce-text)", margin: "0 0 32px" }}>
          Terms
        </h1>

        <Section title="1. What You're Buying">
          <p>
            This site sells digital products only — PDF editions and generated reports. There is no
            physical shipment and no ongoing service. Each purchase is a one-time transaction for a
            single digital item.
          </p>
        </Section>

        <Section title="2. Delivery">
          <p>
            Digital products are delivered instantly via download link upon completed payment.
            Delivery is automated; no manual fulfillment step is involved.
          </p>
        </Section>

        <Section title="3. License">
          <p>
            Purchasing a digital product grants you a personal, non-transferable license to read
            and use the content for your own purposes. You may not redistribute, resell, republish,
            or share the file outside your organization. Where a product is explicitly marked with a
            Creative Commons license (such as CC BY-ND), that license governs instead.
          </p>
        </Section>

        <Section title="4. Acceptable Use">
          <p>
            You agree not to copy, mirror, or redistribute purchased digital products for commercial
            or public distribution, and not to misrepresent authorship of the material.
          </p>
        </Section>

        <Section title="5. Pricing & Currency">
          <p>Prices are listed in USD and may be updated at any time without notice to future purchasers. Your price is fixed at the time of purchase.</p>
        </Section>

        <Section title="6. Refunds">
          <p>
            See our <a href="/refunds" style={{ color: "var(--ce-gold)" }}>Refund Policy</a> for the
            14-day refund window and how to request one.
          </p>
        </Section>

        <Section title="7. Governing Law">
          <p>These terms are governed by the laws of England and Wales.</p>
        </Section>
      </main>
      <Footer />
    </div>
  );
}
