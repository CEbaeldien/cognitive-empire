import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata: Metadata = { title: "Privacy Policy" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <h2 style={{ color: "var(--ce-text)", fontSize: "1rem", fontWeight: 600, marginBottom: 12 }}>{title}</h2>
      <div style={{ color: "var(--ce-muted)", fontSize: "0.9rem", lineHeight: 1.75 }}>{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Nav />
      <main style={{ flex: 1, maxWidth: "42rem", margin: "0 auto", width: "100%", padding: "64px 24px 96px" }}>
        <p style={{ color: "var(--ce-gold)", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", marginBottom: 14 }}>
          Privacy Policy
        </p>
        <h1 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "2rem", fontWeight: 700, color: "var(--ce-text)", margin: "0 0 32px" }}>
          Privacy
        </h1>

        <Section title="What We Collect">
          <p>
            When you join a waitlist or make a purchase, we collect your email address so we can
            deliver your digital product and contact you about your order. Payment details are
            collected and processed directly by our merchant of record — we never see or store your
            card details.
          </p>
        </Section>

        <Section title="How We Store It">
          <p>
            Email addresses are stored in Supabase, our database provider, behind access controls
            restricted to Cognitive Empire Systems Ltd.
          </p>
        </Section>

        <Section title="How We Use It">
          <p>
            We use your email to deliver purchased products, notify you when a waitlisted product
            becomes available, and respond to support requests. We do not sell, rent, or share your
            email address with third parties for marketing purposes.
          </p>
        </Section>

        <Section title="Deletion Requests">
          <p>
            You can request deletion of your data at any time by emailing{" "}
            <a href="mailto:founder@cognitiveempire.com" style={{ color: "var(--ce-gold)" }}>founder@cognitiveempire.com</a>.
            We will remove your data within 30 days, except where retention is required by law
            (such as transaction records for tax purposes).
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions about this policy: <a href="mailto:founder@cognitiveempire.com" style={{ color: "var(--ce-gold)" }}>founder@cognitiveempire.com</a>.
          </p>
        </Section>
      </main>
      <Footer />
    </div>
  );
}
