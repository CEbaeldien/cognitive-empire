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
  border:     "rgba(255,255,255,0.07)",
  text:       "#EEF3FA",
  muted:      "#7A8DA6",
  dim:        "#4A5A70",
  gold:       "#C9A961",
  goldBorder: "rgba(201,169,97,0.30)",
} as const;

// ── Flow tiles (5, excluding MG + Kernel which live in the two-card section)
const FLOW_TILES = [
  { n: "n:01", title: "Signals",       desc: "Structural intelligence feed.",     href: "/signals",      status: "LIVE" },
  { n: "n:02", title: "Drift",         desc: "Revenue decay detection.",          href: "/drift",        status: "LIVE" },
  { n: "n:03", title: "Orchestrator",  desc: "Multi-model MMCP.",                href: "/orchestrator", status: "BETA" },
  { n: "n:04", title: "CE Research",   desc: "Doctrine and field research.",      href: "/ce-research",  status: "LIVE" },
  { n: "n:05", title: "Connect",       desc: "Route a direct inquiry.",           href: "/connect",      status: "OPEN" },
] as const;

const FLOW_OFFSETS = [0, 36, 0, 36, 0] as const;
const FLOW_DOT_POSITIONS = ["10%", "30%", "50%", "70%", "90%"] as const;

export default function HomePage() {
  return (
    <>
      <style>{`
        @keyframes ceReveal {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ce-hero { opacity: 0; animation: ceReveal 280ms cubic-bezier(0.25,0.1,0.25,1.0) 0ms forwards; }
        .hp-r1   { opacity: 0; animation: ceReveal 260ms cubic-bezier(0.25,0.1,0.25,1.0) 60ms forwards; }
        .hp-r2   { opacity: 0; animation: ceReveal 260ms cubic-bezier(0.25,0.1,0.25,1.0) 120ms forwards; }

        /* ── Two-card layout ── */
        .hp-dual {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          align-items: stretch;
        }
        .hp-left-col {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .hp-card {
          text-decoration: none;
          display: flex;
          flex-direction: column;
          transition: transform 220ms cubic-bezier(0.25,0.1,0.25,1.0),
                      border-color 220ms ease,
                      border-left-color 220ms ease;
        }
        .hp-card:hover { transform: translateY(-3px); }
        .hp-card--mg:hover    { border-color: rgba(201,169,97,0.55) !important; }
        .hp-card--paper:hover { border-color: rgba(255,255,255,0.28) !important; border-left-color: rgba(150,175,210,0.70) !important; }
        .hp-card--kernel:hover { border-color: rgba(201,169,97,0.55) !important; }
        .hp-card--kernel {
          height: 100%;
          justify-content: center;
        }
        .hp-cta {
          display: inline-flex; align-items: center;
          padding: 7px 14px;
          font-size: 0.68rem; font-weight: 700; letter-spacing: 0.14em;
          text-transform: uppercase; color: #EEF3FA;
          border: 1px solid rgba(201,169,97,0.40);
          background: rgba(201,169,97,0.08);
          align-self: flex-start;
          transition: background 150ms ease, border-color 150ms ease;
          border-radius: 2px;
        }
        .hp-card:hover .hp-cta {
          background: rgba(201,169,97,0.18);
          border-color: rgba(201,169,97,0.70);
        }

        /* ── Five-tile flow ── */
        .hp-flow-rail {
          position: relative;
          display: flex;
          gap: 12px;
        }
        .hp-flow-rail::before {
          content: '';
          position: absolute;
          top: 50%; left: 0; right: 0;
          height: 1px;
          background: #C9A961;
          opacity: 0.28;
          pointer-events: none;
          z-index: 0;
        }
        .hp-flow-dot {
          position: absolute;
          top: calc(50% - 2px);
          width: 4px; height: 4px;
          border-radius: 50%;
          background: #C9A961;
          z-index: 2;
          pointer-events: none;
          transition: opacity 220ms ease;
        }
        .hp-flow-tile {
          flex: 1; min-width: 0;
          text-decoration: none;
          display: flex; flex-direction: column;
          background: #111111;
          border: 1px solid #1A1A1A;
          border-radius: 4px;
          padding: 20px;
          position: relative; z-index: 1;
          transition: transform 220ms cubic-bezier(0.25,0.1,0.25,1.0), border-color 220ms ease;
        }
        .hp-flow-tile:hover {
          transform: translateY(-3px);
          border-color: rgba(201,169,97,0.35) !important;
        }
        .hp-status {
          display: inline-block;
          font-size: 0.50rem; font-weight: 700; letter-spacing: 0.20em;
          text-transform: uppercase; font-family: monospace;
          color: #4A5A70;
          border: 1px solid rgba(255,255,255,0.07);
          padding: 2px 6px; margin-top: 10px; align-self: flex-start;
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .hp-dual      { grid-template-columns: 1fr !important; }
          .hp-card--kernel { height: auto !important; justify-content: flex-start !important; }
          .hp-flow-rail { flex-direction: column !important; }
          .hp-flow-rail::before { display: none !important; }
          .hp-flow-dot  { display: none !important; }
          .hp-flow-tile { margin-top: 0 !important; }
          .ce-hero-wrap { padding: 48px 20px 40px !important; }
          .hp-sec-wrap  { padding: 32px 20px 48px !important; }
        }

        /* ── Hero image + glow ── */
        @keyframes starGlow {
          0%,100% { opacity: 0.3; transform: scale(0.85); }
          50%      { opacity: 1;   transform: scale(1.15); }
        }
        .hero-glow-dot {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          animation: starGlow var(--dur,6s) ease-in-out var(--delay,0s) infinite;
        }
        .hero-glow-dot--gold {
          width: 10px; height: 10px;
          background: #C9A961;
          box-shadow: 0 0 8px 3px rgba(201,169,97,0.7), 0 0 18px 7px rgba(201,169,97,0.28);
          margin-left: -5px; margin-top: -5px;
        }
        .hero-glow-dot--white {
          width: 5px; height: 5px;
          background: rgba(255,255,255,0.85);
          box-shadow: 0 0 5px 2px rgba(255,255,255,0.45);
          margin-left: -2.5px; margin-top: -2.5px;
        }
        @media (max-width: 768px) {
          .ce-hero-img, .ce-hero-glow { display: none !important; }
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation: none !important; transition: none !important; }
          .ce-hero, .hp-r1, .hp-r2 { opacity: 1; transform: none; }
          .hero-glow-dot { animation: none !important; opacity: 0.6; }
        }
      `}</style>

      <div style={{ background: P.bg, color: P.text, fontFamily: "system-ui, -apple-system, sans-serif", minHeight: "100vh" }}>
        <SiteHoldBanner />
        <CENav />

        {/* ══════ HERO ══════ */}
        <section style={{ borderBottom: `1px solid ${P.border}`, background: "linear-gradient(180deg, #020713 0%, #03050A 100%)", position: "relative", overflow: "hidden" }}>
          {/* Architecture image — right side, full section height */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="ce-hero-img"
            src="/images/hero-architecture.webp"
            alt=""
            aria-hidden="true"
            style={{
              position: "absolute", right: 0, top: 0, bottom: 0,
              height: "100%", width: "auto",
              opacity: 0.85, zIndex: 0, pointerEvents: "none",
            }}
          />
          {/* Glow overlay — dots sit on top of the image nodes */}
          <div className="ce-hero-glow" aria-hidden="true" style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none" }}>
            <span className="hero-glow-dot hero-glow-dot--gold" style={{ left: "68%", top: "12%", "--dur": "7s",   "--delay": "0s"   } as React.CSSProperties} />
            <span className="hero-glow-dot hero-glow-dot--gold" style={{ left: "68%", top: "50%", "--dur": "5.5s", "--delay": "1.8s" } as React.CSSProperties} />
            <span className="hero-glow-dot hero-glow-dot--gold" style={{ left: "88%", top: "68%", "--dur": "6.5s", "--delay": "3.4s" } as React.CSSProperties} />
            <span className="hero-glow-dot hero-glow-dot--white" style={{ left: "57%", top: "30%", "--dur": "5s",   "--delay": "2.2s" } as React.CSSProperties} />
            <span className="hero-glow-dot hero-glow-dot--white" style={{ left: "74%", top: "32%", "--dur": "6s",   "--delay": "0.9s" } as React.CSSProperties} />
            <span className="hero-glow-dot hero-glow-dot--white" style={{ left: "79%", top: "56%", "--dur": "7s",   "--delay": "4.1s" } as React.CSSProperties} />
            <span className="hero-glow-dot hero-glow-dot--white" style={{ left: "63%", top: "63%", "--dur": "5.5s", "--delay": "3.0s" } as React.CSSProperties} />
            <span className="hero-glow-dot hero-glow-dot--white" style={{ left: "83%", top: "43%", "--dur": "6.5s", "--delay": "4.9s" } as React.CSSProperties} />
          </div>
          <div className="ce-hero-wrap ce-hero" style={{ maxWidth: 1280, margin: "0 auto", padding: "72px 48px 60px", position: "relative", zIndex: 2 }}>
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
              maxWidth: 540, margin: "0 0 28px",
            }}>
              Cognitive Empire prevents intelligent systems from collapsing under their own complexity.
            </p>
            <div style={{ width: 32, height: 1, background: P.goldBorder }} />
          </div>
        </section>

        {/* ══════ TWO-CARD SECTION ══════ */}
        <section style={{ borderBottom: `1px solid ${P.border}` }}>
          <div className="hp-sec-wrap hp-r1" style={{ maxWidth: 1280, margin: "0 auto", padding: "48px 48px 52px" }}>
            <div className="hp-dual">

              {/* LEFT: MG large + paper small */}
              <div className="hp-left-col">

                {/* Card 1: MG Score (large) */}
                <Link href="/maintenance-gravity" className="hp-card hp-card--mg" style={{
                  background: "#111111",
                  border: "1px solid #1A1A1A",
                  borderLeft: "3px solid #C9A961",
                  borderRadius: 4,
                  padding: "32px",
                }}>
                  <span style={{
                    fontSize: "0.54rem", fontWeight: 700, letterSpacing: "0.32em",
                    textTransform: "uppercase", color: P.gold,
                    fontFamily: "monospace", display: "block", marginBottom: 14,
                  }}>
                    Maintenance Gravity
                  </span>
                  <h2 style={{
                    fontSize: "1.5rem", fontWeight: 700, color: P.text,
                    margin: "0 0 10px", letterSpacing: "-0.025em", lineHeight: 1.15,
                  }}>
                    How heavy is your operation?
                  </h2>
                  <p style={{
                    fontSize: "0.875rem", color: P.muted, lineHeight: 1.65,
                    margin: "0 0 24px", flex: 1,
                  }}>
                    Free score in 60 seconds. Your own AI does the work.
                  </p>
                  <span className="hp-cta">Get Your Score →</span>
                </Link>

                {/* Card 2: Research paper (compact) */}
                <Link href="/research/maintenance-gravity" className="hp-card hp-card--paper" style={{
                  background: "#0D0D0D",
                  border: "1px solid #1A1A1A",
                  borderLeft: "1px solid #7A8DA6",
                  borderRadius: 4,
                  padding: "16px 20px",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}>
                  <span style={{ fontSize: "0.875rem", color: P.text, lineHeight: 1.4 }}>
                    Read the research paper
                  </span>
                  <span style={{ fontSize: "0.875rem", color: P.muted, flexShrink: 0, marginLeft: 12 }}>→</span>
                </Link>
              </div>

              {/* RIGHT: Kernel (full height) */}
              <Link href="/operator-kernel" className="hp-card hp-card--kernel" style={{
                background: "#111111",
                border: "1px solid #1A1A1A",
                borderLeft: "3px solid #C9A961",
                borderRadius: 4,
                padding: "32px",
              }}>
                <span style={{
                  fontSize: "0.54rem", fontWeight: 700, letterSpacing: "0.32em",
                  textTransform: "uppercase", color: P.gold,
                  fontFamily: "monospace", display: "block", marginBottom: 14,
                }}>
                  The Operator Kernel
                </span>
                <h2 style={{
                  fontSize: "1.5rem", fontWeight: 700, color: P.text,
                  margin: "0 0 10px", letterSpacing: "-0.025em", lineHeight: 1.15,
                }}>
                  Intelligence Is Abundant.<br />Judgment Is Power.
                </h2>
                <p style={{
                  fontSize: "0.875rem", color: P.muted, lineHeight: 1.65,
                  margin: "0 0 24px", flex: 1,
                }}>
                  The structural operating system for the intelligence transition. Eight Immutable Laws. Twenty-one sections.
                </p>
                <span className="hp-cta">Enter the Kernel →</span>
              </Link>

            </div>
          </div>
        </section>

        {/* ══════ FIVE-TILE FLOW ══════ */}
        <section>
          <div className="hp-sec-wrap hp-r2" style={{ maxWidth: 1280, margin: "0 auto", padding: "48px 48px 72px" }}>

            <div style={{ marginBottom: 32 }}>
              <p style={{
                fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.44em",
                textTransform: "uppercase", color: P.gold, margin: "0 0 6px",
                fontFamily: "monospace",
              }}>
                CE — Public Systems
              </p>
              <p style={{ fontSize: "0.85rem", color: P.dim, margin: 0 }}>
                Five systems. One spine.
              </p>
            </div>

            <div className="hp-flow-rail">
              {/* Spine dots */}
              {FLOW_DOT_POSITIONS.map((left, i) => (
                <span key={i} className="hp-flow-dot" style={{ left, marginLeft: -2 }} />
              ))}

              {/* Tiles */}
              {FLOW_TILES.map((tile, i) => (
                <Link key={tile.n} href={tile.href} className="hp-flow-tile" style={{ marginTop: FLOW_OFFSETS[i] }}>
                  <span style={{
                    fontSize: "0.54rem", fontWeight: 800, letterSpacing: "0.28em",
                    color: P.gold, fontFamily: "monospace",
                    display: "block", marginBottom: 10,
                  }}>
                    {tile.n}
                  </span>
                  <span style={{
                    fontSize: "1rem", fontWeight: 600, color: P.text,
                    display: "block", marginBottom: 6, letterSpacing: "-0.01em",
                  }}>
                    {tile.title}
                  </span>
                  <span style={{
                    fontSize: "0.8125rem", color: P.muted, lineHeight: 1.5,
                    display: "block", flex: 1,
                  }}>
                    {tile.desc}
                  </span>
                  <span className="hp-status">{tile.status}</span>
                  <span style={{
                    fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.18em",
                    textTransform: "uppercase", color: P.gold,
                    display: "block", marginTop: 14,
                  }}>
                    Enter →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Mark strip */}
        <div style={{
          borderTop: `1px solid ${P.border}`,
          background: P.bg,
          padding: "14px 48px",
          display: "flex", alignItems: "center", gap: 12,
          maxWidth: 1280, margin: "0 auto",
        }}>
          <CEMark style={{ width: 16, height: 16, flexShrink: 0, color: "rgba(201,169,97,0.30)" }} />
          <p style={{ fontSize: "0.6rem", color: P.dim, letterSpacing: "0.18em", margin: 0, textTransform: "uppercase" }}>
            Signal. Judgment. Systems.
          </p>
        </div>

        <CEFooter />
      </div>
    </>
  );
}
