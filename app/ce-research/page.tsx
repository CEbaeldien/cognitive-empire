import type { Metadata } from "next";
import Link from "next/link";
import CENav from "../components/CENav";
import CEFooter from "../components/CEFooter";

export const metadata: Metadata = {
  title: "CE Research — Canon Library | Cognitive Empire",
  description:
    "Canonical doctrine releases from Cognitive Empire. The Operator Kernel and Maintenance Gravity.",
};

const P = {
  bg:         "#03050A",
  panel:      "#0A1221",
  border:     "rgba(255,255,255,0.07)",
  borderMid:  "rgba(255,255,255,0.10)",
  text:       "#EEF3FA",
  muted:      "#7A8DA6",
  dim:        "#4A5A70",
  gold:       "#C9A961",
  goldSoft:   "rgba(201,169,97,0.09)",
  goldBorder: "rgba(201,169,97,0.30)",
} as const;

interface ResearchCard {
  title:       string;
  subtitle:    string;
  desc:        string;
  cta:         string;
  href:        string;
  leftBorder:  string;
  animClass:   string;
}

const CARDS: ResearchCard[] = [
  {
    title:      "The Operator Kernel",
    subtitle:   "Intelligence Is Abundant. Judgment Is Power.",
    desc:       "The structural operating system for the intelligence transition. 21 sections. Eight Immutable Laws.",
    cta:        "Access the Kernel →",
    href:       "/operator-kernel",
    leftBorder: "#C9A961",
    animClass:  "ce-r2",
  },
  {
    title:      "Maintenance Gravity",
    subtitle:   "Research Paper",
    desc:       "Why systems built faster than they are governed accumulate compounding operational debt.",
    cta:        "Read the Paper →",
    href:       "/research/maintenance-gravity",
    leftBorder: "rgba(255,255,255,0.22)",
    animClass:  "ce-r3",
  },
];

function ResearchCardEl({ card }: { card: ResearchCard }) {
  return (
    <div className={`ce-res-card ${card.animClass}`} style={{
      background:    P.panel,
      border:        `1px solid ${P.borderMid}`,
      borderLeft:    `3px solid ${card.leftBorder}`,
      padding:       "32px 28px 28px",
      display:       "flex",
      flexDirection: "column",
    }}>
      <h2 style={{
        fontSize: "clamp(1.4rem, 2.2vw, 1.8rem)", fontWeight: 700,
        color: P.text, margin: "0 0 8px", letterSpacing: "-0.025em", lineHeight: 1.1,
      }}>
        {card.title}
      </h2>
      <p style={{
        fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.04em",
        color: P.muted, margin: "0 0 18px", lineHeight: 1.4,
        textTransform: "uppercase",
      }}>
        {card.subtitle}
      </p>
      <div style={{ height: 1, background: P.border, marginBottom: 18 }} />
      <p style={{
        fontSize: "0.9rem", color: P.muted, lineHeight: 1.7, margin: "0 0 28px", flex: 1,
      }}>
        {card.desc}
      </p>
      <Link href={card.href} className="ce-res-btn" style={{
        display: "inline-flex", alignItems: "center",
        fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.14em",
        textTransform: "uppercase", textDecoration: "none",
        color: P.text,
        border: `1px solid ${P.goldBorder}`,
        background: P.goldSoft,
        padding: "9px 18px",
        alignSelf: "flex-start",
      }}>
        {card.cta}
      </Link>
    </div>
  );
}

export default function CEResearchPage() {
  return (
    <>
      <style>{`
        @keyframes ceReveal {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ce-r1 { opacity: 0; animation: ceReveal 260ms cubic-bezier(0.25,0.1,0.25,1.0)  50ms forwards; }
        .ce-r2 { opacity: 0; animation: ceReveal 260ms cubic-bezier(0.25,0.1,0.25,1.0) 110ms forwards; }
        .ce-r3 { opacity: 0; animation: ceReveal 260ms cubic-bezier(0.25,0.1,0.25,1.0) 170ms forwards; }

        .ce-res-card {
          transition: transform 200ms ease, border-left-color 200ms ease;
        }
        .ce-res-card:hover { transform: translateY(-2px); }

        .ce-res-btn {
          transition: background 150ms ease, border-color 150ms ease;
        }
        .ce-res-btn:hover {
          background: rgba(201,169,97,0.16) !important;
          border-color: rgba(201,169,97,0.60) !important;
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation: none !important; transition: none !important; }
          .ce-r1,.ce-r2,.ce-r3 { opacity: 1; transform: none; }
        }
        @media (max-width: 800px) {
          .ce-res-grid { grid-template-columns: 1fr !important; }
          .ce-res-wrap { padding: 40px 20px 64px !important; }
        }
      `}</style>

      <div style={{ background: P.bg, color: P.text, fontFamily: "system-ui, -apple-system, sans-serif", minHeight: "100vh" }}>
        <CENav />

        <div className="ce-res-wrap" style={{ maxWidth: 1280, margin: "0 auto", padding: "56px 48px 80px" }}>

          {/* Header */}
          <div className="ce-r1" style={{ marginBottom: 36 }}>
            <p style={{
              fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.44em",
              textTransform: "uppercase", color: P.gold, margin: "0 0 10px",
              fontFamily: "monospace",
            }}>
              CE Research — Canon Library
            </p>
            <h1 style={{
              fontSize: "clamp(1.8rem, 3vw, 2.6rem)", fontWeight: 300,
              color: P.text, margin: "0 0 10px", letterSpacing: "-0.04em", lineHeight: 1.1,
            }}>
              Canonical Doctrine Releases
            </h1>
            <p style={{ fontSize: "0.88rem", color: P.muted, lineHeight: 1.7, maxWidth: 440, margin: 0 }}>
              Two public doctrine artifacts. Human-reviewed. Doctrine-governed.
            </p>
          </div>

          <div style={{ height: 1, background: P.border, marginBottom: 32 }} />

          {/* Cards */}
          <div className="ce-res-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
            {CARDS.map((card) => (
              <ResearchCardEl key={card.title} card={card} />
            ))}
          </div>

          {/* Footer mark */}
          <div style={{
            marginTop: 48, paddingTop: 20,
            borderTop: `1px solid ${P.border}`,
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{
              fontSize: "0.58rem", color: P.dim, letterSpacing: "0.22em",
              textTransform: "uppercase", fontFamily: "monospace",
            }}>
              Signal. Judgment. Systems.
            </span>
          </div>

        </div>

        <CEFooter />
      </div>
    </>
  );
}
