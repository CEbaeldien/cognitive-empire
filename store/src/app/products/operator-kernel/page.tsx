import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import WaitlistForm from "@/components/WaitlistForm";

const TITLE = "The Operator Kernel — Full Edition";
const DESC =
  "The complete operating doctrine, typeset as a 67-page digital edition: 19 chapters, 4 appendices, the Eight Immutable Laws, and the full doctrine lexicon. Instant download.";

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
    price: "19.00",
    priceCurrency: "USD",
    availability: "https://schema.org/PreOrder",
  },
};

export default function OperatorKernelPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
      <Nav />

      <main style={{ flex: 1, maxWidth: "42rem", margin: "0 auto", width: "100%", padding: "64px 24px 96px" }}>
        <p style={{ color: "var(--ce-gold)", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", marginBottom: 18 }}>
          Digital Edition · Instant Download
        </p>

        <h1 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(1.8rem, 4vw, 2.5rem)", fontWeight: 700, color: "var(--ce-text)", lineHeight: 1.2, margin: "0 0 20px" }}>
          {TITLE}
        </h1>

        <p style={{ color: "var(--ce-gold)", fontSize: "1.6rem", fontWeight: 700, marginBottom: 28 }}>$19</p>

        <div style={{ color: "var(--ce-muted)", fontSize: "0.95rem", lineHeight: 1.8, marginBottom: 36 }}>
          <p>
            A 67-page typeset PDF — the complete operating doctrine across 19 chapters and 4
            appendices, including the Eight Immutable Laws and the full doctrine lexicon.
          </p>
          <p>Delivered as an instant digital download the moment checkout completes. No calls, no onboarding.</p>
        </div>

        <div style={{ background: "var(--ce-card)", border: "1px solid var(--ce-border)", borderRadius: 8, padding: "22px 24px", marginBottom: 40 }}>
          <p style={{ color: "var(--ce-faint)", fontSize: "0.72rem", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>
            Checkout opening shortly
          </p>
          <p style={{ color: "var(--ce-muted)", fontSize: "0.85rem", marginBottom: 16 }}>
            Join the list and we&rsquo;ll email you the moment the purchase link goes live.
          </p>
          <WaitlistForm product="operator-kernel" />
        </div>

        <ul style={{ color: "var(--ce-dim)", fontSize: "0.85rem", lineHeight: 2, listStyle: "none", padding: 0, margin: 0 }}>
          <li>— 19 chapters, 4 appendices</li>
          <li>— The Eight Immutable Laws</li>
          <li>— Full doctrine lexicon</li>
          <li>— Instant digital delivery, no human fulfillment</li>
        </ul>
      </main>

      <Footer />
    </div>
  );
}
