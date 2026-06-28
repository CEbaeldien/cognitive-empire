import type { Metadata } from "next";
import Link from "next/link";
import CENav from "./components/CENav";
import CEFooter from "./components/CEFooter";
import { CEMark } from "./components/CEMark";
import SiteHoldBanner from "./components/SiteHoldBanner";

export const metadata: Metadata = {
  title: "Cognitive Empire — Signal. Judgment. Systems.",
  description:
    "CE builds doctrine-governed intelligence systems for operators, teams, and institutions working under intelligence abundance.",
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
  goldDim:    "rgba(201,169,97,0.15)",
} as const;

function SystemCard({
  n, title, body, href, animClass,
}: {
  n: string; title: string; body: string; href: string; animClass: string;
}) {
  return (
    <Link href={href} className={`home-card ${animClass}`} style={{
      display: "flex", flexDirection: "column",
      background: P.panel,
      border:     `1px solid ${P.borderMid}`,
      borderTop:  `2px solid ${P.goldDim}`,
      padding:    "24px 22px 20px",
      textDecoration: "none",
    }}>
      <span style={{
        fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.28em",
        fontFamily: "monospace", color: P.gold,
        display: "block", marginBottom: 14,
      }}>
        {n}
      </span>
      <h3 style={{
        fontSize: "1.05rem", fontWeight: 700, color: P.text,
        margin: "0 0 10px", letterSpacing: "-0.015em", lineHeight: 1.2,
      }}>
        {title}
      </h3>
      <p style={{ fontSize: "0.85rem", color: P.muted, lineHeight: 1.7, margin: "0 0 16px", flex: 1 }}>
        {body}
      </p>
      <span className="home-card-arrow" style={{
        fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.16em",
        textTransform: "uppercase", color: P.gold,
        display: "inline-flex", alignItems: "center", gap: 4,
      }}>
        Enter →
      </span>
    </Link>
  );
}

const SYSTEMS = [
  {
    n: "n:01", title: "Drift Intelligence",
    body: "Revenue decay detection. Upload CSV free.",
    href: "/drift",
  },
  {
    n: "n:02", title: "CE Signals",
    body: "Structural intelligence. 2026–2031.",
    href: "/signals",
  },
  {
    n: "n:03", title: "The Orchestrator",
    body: "Multi-model MMCP. Beta access.",
    href: "/orchestrator",
  },
  {
    n: "n:04", title: "Maintenance Gravity",
    body: "Research. The doctrine of operational debt.",
    href: "/maintenance-gravity",
  },
  {
    n: "n:05", title: "Work",
    body: "Request a Maintenance Gravity Audit.",
    href: "/work",
  },
  {
    n: "n:06", title: "Connect",
    body: "Dr. E. Founder.",
    href: "/connect",
  },
];

export default function HomePage() {
  return (
    <>
      <style>{`
        @keyframes ceReveal {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .ce-s1 { opacity: 0; animation: ceReveal 280ms cubic-bezier(0.25,0.1,0.25,1.0)  80ms forwards; }
        .ce-s2 { opacity: 0; animation: ceReveal 280ms cubic-bezier(0.25,0.1,0.25,1.0) 140ms forwards; }
        .ce-s3 { opacity: 0; animation: ceReveal 280ms cubic-bezier(0.25,0.1,0.25,1.0) 200ms forwards; }
        .ce-s4 { opacity: 0; animation: ceReveal 280ms cubic-bezier(0.25,0.1,0.25,1.0) 260ms forwards; }
        .ce-s5 { opacity: 0; animation: ceReveal 280ms cubic-bezier(0.25,0.1,0.25,1.0) 320ms forwards; }
        .ce-s6 { opacity: 0; animation: ceReveal 280ms cubic-bezier(0.25,0.1,0.25,1.0) 380ms forwards; }
        .ce-hero { opacity: 0; animation: ceReveal 280ms cubic-bezier(0.25,0.1,0.25,1.0) 0ms forwards; }

        .home-card {
          transition: transform 220ms ease-out, border-color 220ms ease, border-top-color 220ms ease;
        }
        .home-card:hover {
          transform: translateY(-3px);
          border-color: rgba(201,169,97,0.22) !important;
          border-top-color: rgba(201,169,97,0.52) !important;
        }

        .ce-cta-primary {
          transition: background 180ms ease, border-color 180ms ease, color 180ms ease;
          cursor: pointer; text-decoration: none;
        }
        .ce-cta-primary:hover {
          background: rgba(201,169,97,0.22) !important;
          border-color: rgba(201,169,97,0.75) !important;
          color: #03050A !important;
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation: none !important; transition: none !important; }
          .ce-s1,.ce-s2,.ce-s3,.ce-s4,.ce-s5,.ce-s6,.ce-hero { opacity: 1; transform: none; }
        }

        @media (max-width: 768px) {
          .ce-systems-grid { grid-template-columns: 1fr !important; }
          .ce-hero-wrap    { padding: 48px 20px 36px !important; }
          .ce-systems-wrap { padding: 32px 20px 64px !important; }
        }
      `}</style>

      <div style={{ background: P.bg, color: P.text, fontFamily: "system-ui, -apple-system, sans-serif", minHeight: "100vh" }}>
        <SiteHoldBanner />
        <CENav />

        {/* ══════════ HERO ══════════ */}
        <section style={{ borderBottom: `1px solid ${P.border}`, background: `linear-gradient(180deg, #020713 0%, #03050A 100%)` }}>
          <div className="ce-hero-wrap ce-hero" style={{ maxWidth: 1280, margin: "0 auto", padding: "72px 48px 60px" }}>
            <p style={{
              fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.44em",
              textTransform: "uppercase", color: P.gold, margin: "0 0 22px",
              fontFamily: "monospace",
            }}>
              Cognitive Empire
            </p>

            <h1 style={{
              fontSize: "clamp(2.2rem, 4vw, 3.8rem)", fontWeight: 300,
              color: P.text, lineHeight: 1.12, margin: "0 0 18px",
              letterSpacing: "-0.04em", maxWidth: 700,
            }}>
              Intelligence Is Abundant.<br />
              <span style={{ color: P.gold }}>Judgment Is Power.</span>
            </h1>

            <p style={{
              fontSize: "1.05rem", color: P.muted, lineHeight: 1.7,
              maxWidth: 480, margin: "0 0 32px",
            }}>
              Structural intelligence for the 2026–2031 transition.
            </p>

            <div style={{ width: 32, height: 1, background: P.goldBorder, marginBottom: 28 }} />

            <Link href="/operator-kernel" className="ce-cta-primary" style={{
              fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.16em",
              textTransform: "uppercase", color: P.text,
              border: `1px solid rgba(201,169,97,0.48)`,
              background: "rgba(201,169,97,0.10)",
              padding: "11px 22px", display: "inline-flex", alignItems: "center",
            }}>
              Access the Sovereign Kernel →
            </Link>
          </div>
        </section>

        {/* ══════════ SYSTEMS ══════════ */}
        <section>
          <div className="ce-systems-wrap" style={{ maxWidth: 1280, margin: "0 auto", padding: "52px 48px 80px" }}>
            <div style={{ marginBottom: 28 }}>
              <p style={{
                fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.44em",
                textTransform: "uppercase", color: P.gold, margin: "0 0 6px",
                fontFamily: "monospace",
              }}>
                CE — Public Systems
              </p>
              <p style={{ fontSize: "0.85rem", color: P.dim, margin: 0 }}>
                Six surfaces. One doctrine.
              </p>
            </div>

            <div className="ce-systems-grid" style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 14,
            }}>
              {SYSTEMS.map((s, i) => (
                <SystemCard key={s.n} {...s} animClass={`ce-s${i + 1}`} />
              ))}
            </div>
          </div>
        </section>

        {/* Mark strip */}
        <div style={{
          borderTop: `1px solid ${P.border}`,
          background: P.bg,
          padding: "16px 48px",
          display: "flex", alignItems: "center", gap: 12,
          maxWidth: 1280, margin: "0 auto",
        }}>
          <CEMark style={{ width: 18, height: 18, flexShrink: 0, color: "rgba(201,169,97,0.35)" }} />
          <p style={{ fontSize: "0.65rem", color: P.dim, letterSpacing: "0.18em", margin: 0, textTransform: "uppercase" }}>
            Signal. Judgment. Systems.
          </p>
        </div>

        <CEFooter />
      </div>
    </>
  );
}
