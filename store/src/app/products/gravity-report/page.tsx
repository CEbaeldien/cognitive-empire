import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import WaitlistForm from "@/components/WaitlistForm";

const TITLE = "The Full Gravity Report";
const DESC =
  "The paid deep-dive on your free Gravity Score — expanded band interpretation, force-by-force breakdown, benchmark placement, and a counterweight starter plan. Auto-generated from your diagnostic inputs, delivered instantly as a branded PDF.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  openGraph: { title: TITLE, description: DESC },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: TITLE,
  description: DESC,
  offers: {
    "@type": "Offer",
    price: "29.00",
    priceCurrency: "USD",
    availability: "https://schema.org/PreOrder",
  },
};

export default function GravityReportPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
      <Nav />

      <main style={{ flex: 1, maxWidth: "42rem", margin: "0 auto", width: "100%", padding: "64px 24px 96px" }}>
        <p style={{ color: "var(--ce-gold)", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", marginBottom: 18 }}>
          Digital Report · Instant Download
        </p>

        <h1 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(1.8rem, 4vw, 2.5rem)", fontWeight: 700, color: "var(--ce-text)", lineHeight: 1.2, margin: "0 0 20px" }}>
          {TITLE}
        </h1>

        <p style={{ color: "var(--ce-gold)", fontSize: "1.6rem", fontWeight: 700, marginBottom: 28 }}>$29</p>

        <div style={{ color: "var(--ce-muted)", fontSize: "0.95rem", lineHeight: 1.8, marginBottom: 36 }}>
          <p>
            The paid deep-dive on your free Gravity Score: expanded band interpretation,
            a force-by-force breakdown, benchmark placement against tracked forces, and a
            counterweight starter plan.
          </p>
          <p>
            Auto-generated from your diagnostic inputs and delivered instantly as a branded PDF —
            no waiting, no human review step.
          </p>
        </div>

        <div style={{ background: "var(--ce-card)", border: "1px solid var(--ce-border)", borderRadius: 8, padding: "22px 24px", marginBottom: 40 }}>
          <p style={{ color: "var(--ce-faint)", fontSize: "0.72rem", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>
            Checkout opening shortly
          </p>
          <p style={{ color: "var(--ce-muted)", fontSize: "0.85rem", marginBottom: 16 }}>
            Join the list and we&rsquo;ll email you the moment the purchase link goes live.
          </p>
          <WaitlistForm product="gravity-report" />
        </div>

        <ul style={{ color: "var(--ce-dim)", fontSize: "0.85rem", lineHeight: 2, listStyle: "none", padding: 0, margin: 0 }}>
          <li>— Expanded band interpretation</li>
          <li>— Force-by-force breakdown</li>
          <li>— Benchmark placement</li>
          <li>— Counterweight starter plan</li>
          <li>— Instant digital delivery, no human fulfillment</li>
        </ul>
      </main>

      <Footer />
    </div>
  );
}
