import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata: Metadata = { title: "Refund Policy" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <h2 style={{ color: "var(--ce-text)", fontSize: "1rem", fontWeight: 600, marginBottom: 12 }}>{title}</h2>
      <div style={{ color: "var(--ce-muted)", fontSize: "0.9rem", lineHeight: 1.75 }}>{children}</div>
    </section>
  );
}

export default function RefundsPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Nav />
      <main style={{ flex: 1, maxWidth: "42rem", margin: "0 auto", width: "100%", padding: "64px 24px 96px" }}>
        <p style={{ color: "var(--ce-gold)", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", marginBottom: 14 }}>
          Refund Policy
        </p>
        <h1 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "2rem", fontWeight: 700, color: "var(--ce-text)", margin: "0 0 32px" }}>
          Refunds
        </h1>

        <Section title="14-Day Refund Window">
          <p>
            All digital products sold on this site carry a 14-day, no-questions refund window from
            the date of purchase. If a product doesn&rsquo;t work for you, you can request a full
            refund within 14 days — no explanation required.
          </p>
        </Section>

        <Section title="How to Request">
          <p>
            Email <a href="mailto:founder@cognitiveempire.com" style={{ color: "var(--ce-gold)" }}>founder@cognitiveempire.com</a>{" "}
            with your order reference. Refunds are typically processed within five business days.
          </p>
        </Section>

        <Section title="Payment Processing">
          <p>
            Payments are processed by our merchant of record. Refunds are issued through the same
            payment provider used at checkout and will appear back on the original payment method.
          </p>
        </Section>

        <Section title="Statutory Rights">
          <p>
            Nothing in this policy limits your statutory consumer rights under applicable law,
            including the UK Consumer Rights Act 2015 or equivalent legislation in your jurisdiction.
          </p>
        </Section>
      </main>
      <Footer />
    </div>
  );
}
