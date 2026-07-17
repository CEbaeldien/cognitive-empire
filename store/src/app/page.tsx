import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "CE Digital Editions",
  description:
    "Doctrine and diagnostic reports from Cognitive Empire, delivered instantly as digital downloads.",
};

const PRODUCTS = [
  {
    slug: "operator-kernel",
    name: "The Operator Kernel — Full Edition",
    desc: "The complete operating doctrine: 19 chapters, 4 appendices, the Eight Immutable Laws, and the full doctrine lexicon.",
    price: "$19",
  },
  {
    slug: "gravity-report",
    name: "The Full Gravity Report",
    desc: "The paid deep-dive on your free Gravity Score — force-by-force breakdown, benchmark placement, and a counterweight starter plan.",
    price: "$29",
  },
];

export default function StorefrontPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Nav />

      <main style={{ flex: 1, maxWidth: "64rem", margin: "0 auto", width: "100%", padding: "72px 24px 96px" }}>
        <p
          style={{
            color: "var(--ce-gold)",
            fontSize: "0.7rem",
            fontWeight: 700,
            letterSpacing: "0.30em",
            textTransform: "uppercase",
            marginBottom: 18,
          }}
        >
          Instant Digital Delivery
        </p>
        <h1
          style={{
            fontFamily: "var(--font-playfair), serif",
            fontSize: "clamp(2rem, 5vw, 3rem)",
            fontWeight: 700,
            color: "var(--ce-text)",
            lineHeight: 1.15,
            margin: "0 0 18px",
            maxWidth: "38rem",
          }}
        >
          CE Digital Editions
        </h1>
        <p style={{ color: "var(--ce-muted)", fontSize: "1rem", lineHeight: 1.7, maxWidth: "34rem", marginBottom: 56 }}>
          Doctrine and diagnostic reports, delivered instantly as digital downloads. No calls,
          no onboarding — download and read.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          {PRODUCTS.map((p) => (
            <Link
              key={p.slug}
              href={`/products/${p.slug}`}
              style={{
                display: "block",
                background: "var(--ce-card)",
                border: "1px solid var(--ce-border)",
                borderRadius: 8,
                padding: "28px 26px",
                textDecoration: "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
                <span style={{ color: "var(--ce-gold)", fontSize: "1.4rem", fontWeight: 700 }}>{p.price}</span>
                <span style={{ color: "var(--ce-faint)", fontSize: "0.72rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Digital download
                </span>
              </div>
              <h2 style={{ color: "var(--ce-text)", fontSize: "1.15rem", fontWeight: 600, margin: "0 0 10px", lineHeight: 1.35 }}>
                {p.name}
              </h2>
              <p style={{ color: "var(--ce-muted)", fontSize: "0.88rem", lineHeight: 1.65, margin: 0 }}>{p.desc}</p>
              <span style={{ display: "inline-block", marginTop: 18, color: "var(--ce-gold)", fontSize: "0.8rem", fontWeight: 600 }}>
                View product →
              </span>
            </Link>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
