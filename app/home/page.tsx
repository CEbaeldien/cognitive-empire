import type { Metadata } from "next";
import Link from "next/link";
import CENav from "../components/CENav";
import CEFooter from "../components/CEFooter";

export const metadata: Metadata = {
  title: "Cognitive Empire — Signal. Judgment. Systems.",
  description:
    "CE builds doctrine-governed intelligence systems for operators, teams, and institutions working under intelligence abundance.",
};

// ── Palette ───────────────────────────────────────────────────────────────────
const P = {
  bg:         "#05070B",
  bgDeep:     "#03050A",
  panel:      "#0A1221",
  border:     "rgba(255,255,255,0.07)",
  borderMid:  "rgba(255,255,255,0.10)",
  text:       "#E6EDF7",
  muted:      "#7A8BA6",
  dim:        "#4A5A70",
  gold:       "#C5A26F",
  goldSoft:   "rgba(197,162,111,0.09)",
  goldBorder: "rgba(197,162,111,0.30)",
  goldDim:    "rgba(197,162,111,0.15)",
} as const;

// ── CE mark (locked monogram) ─────────────────────────────────────────────────
function CitadelMark({ w, h, fill }: { w: number; h: number; fill: string }) {
  return (
    <svg width={w} height={h} viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <circle cx="50" cy="50" r="44" stroke={fill} strokeWidth="2" opacity="0.50" />
      <line x1="50" y1="2"  x2="50" y2="9"  stroke={fill} strokeWidth="1.5" opacity="0.30" />
      <line x1="50" y1="91" x2="50" y2="98" stroke={fill} strokeWidth="1.5" opacity="0.30" />
      <line x1="2"  y1="50" x2="9"  y2="50" stroke={fill} strokeWidth="1.5" opacity="0.30" />
      <line x1="91" y1="50" x2="98" y2="50" stroke={fill} strokeWidth="1.5" opacity="0.30" />
      <g fill={fill}>
        <path d="M20,25 L62,25 L57,36 L26,36 L26,64 L57,64 L62,75 L20,75 L14,69 L14,31 Z" />
        <rect x="50" y="38" width="7"  height="24" />
        <rect x="50" y="38" width="22" height="6"  />
        <rect x="50" y="47" width="17" height="6"  />
        <rect x="50" y="56" width="22" height="6"  />
      </g>
    </svg>
  );
}

// ── Authority Core Visual — command surface SVG ───────────────────────────────
function AuthorityCoreVisual() {
  const gold = (o: number) => `rgba(197,162,111,${o})`;
  const white = (o: number) => `rgba(255,255,255,${o})`;

  // Tick marks around the slow-orbit ring (160 radius, 8 positions)
  const orbitTicks = [0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
    const r = (deg * Math.PI) / 180;
    return {
      x1: 220 + 155 * Math.cos(r), y1: 220 + 155 * Math.sin(r),
      x2: 220 + 164 * Math.cos(r), y2: 220 + 164 * Math.sin(r),
    };
  });

  // Spokes at 45° inside static rings
  const spokes = [22.5, 67.5, 112.5, 157.5].map((deg) => {
    const r = (deg * Math.PI) / 180;
    return {
      x1: 220 + 50 * Math.cos(r), y1: 220 + 50 * Math.sin(r),
      x2: 220 + 118 * Math.cos(r), y2: 220 + 118 * Math.sin(r),
    };
  });

  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 440, aspectRatio: "1" }}>
      <svg viewBox="0 0 440 440" fill="none" aria-hidden="true"
        style={{ width: "100%", height: "100%" }}>

        {/* ── Outer command frame ─────────────────────────────────────── */}
        <rect x="18" y="18" width="404" height="404"
          stroke={gold(0.11)} strokeWidth="1" />

        {/* Corner brackets — TL */}
        <path d="M18,46 L18,18 L46,18" stroke={gold(0.50)} strokeWidth="1.5" />
        {/* Corner brackets — TR */}
        <path d="M394,18 L422,18 L422,46" stroke={gold(0.50)} strokeWidth="1.5" />
        {/* Corner brackets — BL */}
        <path d="M18,394 L18,422 L46,422" stroke={gold(0.50)} strokeWidth="1.5" />
        {/* Corner brackets — BR */}
        <path d="M394,422 L422,422 L422,394" stroke={gold(0.50)} strokeWidth="1.5" />

        {/* Mid-edge tick accents */}
        <line x1="220" y1="18" x2="220" y2="26" stroke={gold(0.28)} strokeWidth="1" />
        <line x1="220" y1="414" x2="220" y2="422" stroke={gold(0.20)} strokeWidth="1" />
        <line x1="18" y1="220" x2="26" y2="220" stroke={gold(0.20)} strokeWidth="1" />
        <line x1="414" y1="220" x2="422" y2="220" stroke={gold(0.20)} strokeWidth="1" />

        {/* ── Static orbital rings ─────────────────────────────────────── */}
        <circle cx="220" cy="220" r="166" stroke={white(0.035)} strokeWidth="1" />
        <circle cx="220" cy="220" r="128" stroke={gold(0.07)} strokeWidth="1" />
        <circle cx="220" cy="220" r="88"  stroke={gold(0.08)} strokeWidth="1" strokeDasharray="5 10" />
        <circle cx="220" cy="220" r="50"  stroke={gold(0.11)} strokeWidth="0.75" />

        {/* ── Spoke lines ─────────────────────────────────────────────── */}
        {spokes.map((sp, i) => (
          <line key={i} x1={sp.x1} y1={sp.y1} x2={sp.x2} y2={sp.y2}
            stroke={gold(0.055)} strokeWidth="0.75" />
        ))}

        {/* ── Slow-orbit ring group ────────────────────────────────────── */}
        <g className="ce-orbit-slow" style={{ transformBox: "fill-box", transformOrigin: "center" }}>
          <circle cx="220" cy="220" r="160"
            stroke={gold(0.055)} strokeWidth="0.75" strokeDasharray="3 22" />
          {orbitTicks.map((t, i) => (
            <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
              stroke={gold(0.28)} strokeWidth="1" />
          ))}
        </g>

        {/* ── Counter-orbit dashed ring ────────────────────────────────── */}
        <g className="ce-orbit-counter" style={{ transformBox: "fill-box", transformOrigin: "center" }}>
          <circle cx="220" cy="220" r="108"
            stroke={gold(0.045)} strokeWidth="0.75" strokeDasharray="2 14" />
        </g>

        {/* ── CE mark — centered ────────────────────────────────────── */}
        <g transform="translate(188, 183) scale(0.75)" fill={gold(0.55)}>
          <path d="M20,25 L62,25 L57,36 L26,36 L26,64 L57,64 L62,75 L20,75 L14,69 L14,31 Z" />
          <rect x="50" y="38" width="7"  height="24" />
          <rect x="50" y="38" width="22" height="6"  />
          <rect x="50" y="47" width="17" height="6"  />
          <rect x="50" y="56" width="22" height="6"  />
        </g>

        {/* ── Crosshair at center ──────────────────────────────────────── */}
        <circle cx="220" cy="220" r="4.5" fill="none" stroke={gold(0.24)} strokeWidth="0.75" />
        <line x1="210" y1="220" x2="215" y2="220" stroke={gold(0.20)} strokeWidth="0.75" />
        <line x1="225" y1="220" x2="230" y2="220" stroke={gold(0.20)} strokeWidth="0.75" />
        <line x1="220" y1="210" x2="220" y2="215" stroke={gold(0.20)} strokeWidth="0.75" />
        <line x1="220" y1="225" x2="220" y2="230" stroke={gold(0.20)} strokeWidth="0.75" />

        {/* ── Cardinal status dots ─────────────────────────────────────── */}
        <circle className="ce-status-dot" cx="220" cy="54"  r="2.5" fill={gold(0.38)} />
        <circle                            cx="386" cy="220" r="2"   fill={gold(0.22)} />
        <circle                            cx="220" cy="386" r="2"   fill={gold(0.18)} />
        <circle                            cx="54"  cy="220" r="2"   fill={gold(0.22)} />

        {/* ── Micro readout text ───────────────────────────────────────── */}
        <text x="228" y="57" fill={gold(0.28)} fontSize="7" letterSpacing="2.2"
          fontFamily="ui-monospace,monospace">CE·SYS·01</text>
        <text x="22"  y="34" fill={gold(0.22)} fontSize="6.5" letterSpacing="1.5"
          fontFamily="ui-monospace,monospace">KR</text>
        <text x="394" y="34" fill={gold(0.22)} fontSize="6.5" letterSpacing="1.5"
          fontFamily="ui-monospace,monospace">AR</text>
        <text x="22"  y="412" fill={gold(0.16)} fontSize="6" letterSpacing="1.2"
          fontFamily="ui-monospace,monospace">DOCTRINE</text>

        {/* ── Data point accents ───────────────────────────────────────── */}
        <circle cx="308" cy="138" r="2"   fill={gold(0.22)} />
        <circle cx="142" cy="302" r="1.5" fill={gold(0.16)} />
        <circle cx="318" cy="310" r="1.5" fill={gold(0.12)} />
        <line x1="308" y1="138" x2="324" y2="134" stroke={gold(0.14)} strokeWidth="0.75" />
        <text x="326" y="138" fill={gold(0.22)} fontSize="6" letterSpacing="1"
          fontFamily="ui-monospace,monospace">SIG</text>
      </svg>
    </div>
  );
}

// ── System card ───────────────────────────────────────────────────────────────
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
        transition: "gap 180ms ease",
      }}>
        Enter System →
      </span>
    </Link>
  );
}

// ── System data ───────────────────────────────────────────────────────────────
const SYSTEMS = [
  {
    n: "01", title: "Drift",
    body: "Revenue decay detection for operators who cannot afford hidden execution loss.",
    href: "/drift",
  },
  {
    n: "02", title: "Signals",
    body: "Doctrine-governed structural intelligence. Human-reviewed signal over noise.",
    href: "/signals",
  },
  {
    n: "03", title: "CE Research",
    body: "The canon command center for doctrine, principles, and structural releases.",
    href: "/briefs",
  },
  {
    n: "04", title: "Work",
    body: "Custom operational systems for serious operators and high-trust environments.",
    href: "/work",
  },
  {
    n: "05", title: "Connect",
    body: "Start with the correct path into Cognitive Empire.",
    href: "/connect",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <>
      <style>{`
        /* ── CE Home — motion system ─────────────────────────────────── */

        @keyframes ceReveal {
          from { opacity: 0; transform: translateY(18px); filter: blur(4px); }
          to   { opacity: 1; transform: translateY(0);    filter: blur(0);   }
        }

        @keyframes ceSlowOrbit {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        @keyframes ceCounterOrbit {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }

        @keyframes cePulse {
          0%, 100% { opacity: 0.35; }
          50%       { opacity: 0.75; }
        }

        /* Load stagger */
        .ce-h1  { opacity: 0; animation: ceReveal 900ms cubic-bezier(0.16,1,0.3,1)   0ms forwards; }
        .ce-h2  { opacity: 0; animation: ceReveal 900ms cubic-bezier(0.16,1,0.3,1)  80ms forwards; }
        .ce-h3  { opacity: 0; animation: ceReveal 900ms cubic-bezier(0.16,1,0.3,1) 160ms forwards; }
        .ce-h4  { opacity: 0; animation: ceReveal 900ms cubic-bezier(0.16,1,0.3,1) 240ms forwards; }
        .ce-vis { opacity: 0; animation: ceReveal 1100ms cubic-bezier(0.16,1,0.3,1) 180ms forwards; }

        .ce-s1  { opacity: 0; animation: ceReveal 700ms cubic-bezier(0.16,1,0.3,1) 360ms forwards; }
        .ce-s2  { opacity: 0; animation: ceReveal 700ms cubic-bezier(0.16,1,0.3,1) 420ms forwards; }
        .ce-s3  { opacity: 0; animation: ceReveal 700ms cubic-bezier(0.16,1,0.3,1) 480ms forwards; }
        .ce-s4  { opacity: 0; animation: ceReveal 700ms cubic-bezier(0.16,1,0.3,1) 540ms forwards; }
        .ce-s5  { opacity: 0; animation: ceReveal 700ms cubic-bezier(0.16,1,0.3,1) 600ms forwards; }
        .ce-p1  { opacity: 0; animation: ceReveal 800ms cubic-bezier(0.16,1,0.3,1) 620ms forwards; }
        .ce-c1  { opacity: 0; animation: ceReveal 800ms cubic-bezier(0.16,1,0.3,1) 680ms forwards; }

        /* Authority core visual */
        .ce-orbit-slow {
          transform-box:    fill-box;
          transform-origin: center;
          animation: ceSlowOrbit 120s linear infinite;
        }
        .ce-orbit-counter {
          transform-box:    fill-box;
          transform-origin: center;
          animation: ceCounterOrbit 80s linear infinite;
        }
        .ce-status-dot {
          animation: cePulse 4.5s ease-in-out infinite;
        }

        /* System cards */
        .home-card {
          transition:
            transform     260ms cubic-bezier(0.22,1,0.36,1),
            border-color  260ms ease,
            border-top-color 260ms ease,
            box-shadow    260ms ease,
            background    260ms ease;
        }
        .home-card:hover {
          transform:    translateY(-4px) scale(1.006);
          border-color: rgba(197,162,111,0.22) !important;
          border-top-color: rgba(197,162,111,0.48) !important;
          background:   linear-gradient(180deg, rgba(197,162,111,0.04) 0%, rgba(13,21,36,0.96) 100%) !important;
          box-shadow:
            0 0 0 1px rgba(197,162,111,0.12),
            0 24px 80px rgba(0,0,0,0.38);
        }

        /* Hero CTAs */
        .ce-cta-ghost, .ce-cta-gold, .ce-cta-primary {
          transition: border-color 200ms ease, background 200ms ease, color 200ms ease, transform 180ms ease;
          cursor: pointer;
          text-decoration: none;
        }
        .ce-cta-ghost:hover    { border-color: rgba(255,255,255,0.22) !important; color: #E6EDF7 !important; transform: translateX(2px); }
        .ce-cta-gold:hover     { background: rgba(197,162,111,0.16) !important; border-color: rgba(197,162,111,0.50) !important; transform: translateX(2px); }
        .ce-cta-primary:hover  { background: rgba(197,162,111,0.22) !important; border-color: rgba(197,162,111,0.75) !important; transform: translateX(2px); }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation: none !important; transition: none !important; }
          .ce-h1, .ce-h2, .ce-h3, .ce-h4, .ce-vis,
          .ce-s1, .ce-s2, .ce-s3, .ce-s4, .ce-s5,
          .ce-p1, .ce-c1 { opacity: 1; transform: none; filter: none; }
        }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: `
          radial-gradient(circle at 72% 0%, rgba(197,162,111,0.035), transparent 30%),
          radial-gradient(circle at 18% 18%, rgba(255,255,255,0.018), transparent 32%),
          linear-gradient(180deg, #05070B 0%, #07111F 45%, #05070B 100%)
        `,
        color: P.text,
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}>
        <CENav />

        {/* ══════════ HERO ══════════ */}
        <section style={{ borderBottom: `1px solid ${P.border}` }}>
          <div style={{
            maxWidth: 1280, margin: "0 auto", padding: "68px 48px 64px",
            display: "grid", gridTemplateColumns: "1fr 440px",
            gap: 64, alignItems: "center",
          }}>

            {/* Left — Doctrine positioning */}
            <div>
              <p className="ce-h1" style={{
                fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.40em",
                textTransform: "uppercase", color: P.gold, margin: "0 0 20px",
              }}>
                Cognitive Empire
              </p>

              <h1 className="ce-h2" style={{
                fontSize: "clamp(3.2rem, 5.8vw, 6rem)",
                fontWeight: 200, letterSpacing: "-0.050em",
                color: P.text, lineHeight: 1.04, margin: "0 0 8px",
              }}>
                Intelligence
              </h1>
              <h1 className="ce-h2" style={{
                fontSize: "clamp(3.2rem, 5.8vw, 6rem)",
                fontWeight: 200, letterSpacing: "-0.050em",
                color: P.text, lineHeight: 1.04, margin: "0 0 8px",
              }}>
                is abundant.
              </h1>
              <h1 className="ce-h2" style={{
                fontSize: "clamp(3.2rem, 5.8vw, 6rem)",
                fontWeight: 200, letterSpacing: "-0.050em",
                color: P.gold, lineHeight: 1.04, margin: "0 0 28px",
              }}>
                Judgment is power.
              </h1>

              <div className="ce-h3" style={{ width: 36, height: 1, background: P.goldBorder, marginBottom: 24 }} />

              <p className="ce-h3" style={{
                fontSize: "1.05rem", color: P.muted, lineHeight: 1.8,
                maxWidth: 480, margin: "0 0 36px",
              }}>
                Cognitive Empire builds doctrine-governed intelligence systems for operators, teams, and institutions working under intelligence abundance.
              </p>

              {/* CTAs */}
              <div className="ce-h4" style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                <Link href="/signals" className="ce-cta-ghost" style={{
                  fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.16em",
                  textTransform: "uppercase", color: P.muted,
                  border: `1px solid ${P.border}`, background: "transparent",
                  padding: "9px 18px", display: "inline-flex", alignItems: "center",
                }}>
                  Explore Signals →
                </Link>
                <Link href="/briefs" className="ce-cta-gold" style={{
                  fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.16em",
                  textTransform: "uppercase", color: P.gold,
                  border: `1px solid ${P.goldDim}`, background: P.goldSoft,
                  padding: "9px 18px", display: "inline-flex", alignItems: "center",
                }}>
                  View CE Research →
                </Link>
                <Link href="/connect" className="ce-cta-primary" style={{
                  fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.16em",
                  textTransform: "uppercase", color: P.text,
                  border: `1px solid rgba(197,162,111,0.48)`,
                  background: "rgba(197,162,111,0.12)",
                  padding: "9px 18px", display: "inline-flex", alignItems: "center",
                }}>
                  Connect →
                </Link>
              </div>
            </div>

            {/* Right — Authority Core Visual */}
            <div className="ce-vis" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
              <AuthorityCoreVisual />
            </div>
          </div>
        </section>

        {/* ══════════ PUBLIC SYSTEMS ══════════ */}
        <section style={{ borderBottom: `1px solid ${P.border}` }}>
          <div style={{ maxWidth: 1280, margin: "0 auto", padding: "52px 48px" }}>

            {/* Section header */}
            <div style={{ marginBottom: 32 }}>
              <p style={{
                fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.38em",
                textTransform: "uppercase", color: P.gold, margin: "0 0 8px",
              }}>
                CE — Public Systems
              </p>
              <p style={{ fontSize: "0.88rem", color: P.dim, margin: 0 }}>
                Five publicly accessible surfaces. One operational doctrine.
              </p>
            </div>

            {/* Top row: 3 cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 14 }}>
              {SYSTEMS.slice(0, 3).map((s, i) => (
                <SystemCard key={s.n} {...s} animClass={`ce-s${i + 1}`} />
              ))}
            </div>

            {/* Bottom row: 2 cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
              {SYSTEMS.slice(3).map((s, i) => (
                <SystemCard key={s.n} {...s} animClass={`ce-s${i + 4}`} />
              ))}
            </div>
          </div>
        </section>

        {/* ══════════ OPERATING PRINCIPLE ══════════ */}
        <section className="ce-p1" style={{ borderBottom: `1px solid ${P.border}` }}>
          <div style={{ maxWidth: 1280, margin: "0 auto", padding: "56px 48px" }}>
            <p style={{
              fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.38em",
              textTransform: "uppercase", color: P.gold, margin: "0 0 22px",
            }}>
              Operating Principle
            </p>

            <div style={{ maxWidth: 700, marginBottom: 24 }}>
              <p style={{
                fontSize: "clamp(1.6rem, 2.8vw, 2.5rem)", fontWeight: 200,
                color: P.text, lineHeight: 1.25, margin: "0 0 4px",
                letterSpacing: "-0.03em",
              }}>
                Intelligence is no longer scarce.
              </p>
              <p style={{
                fontSize: "clamp(1.6rem, 2.8vw, 2.5rem)", fontWeight: 200,
                color: P.text, lineHeight: 1.25, margin: 0,
                letterSpacing: "-0.03em",
              }}>
                Structure,{" "}
                <span style={{ color: P.gold }}>judgment</span>
                , and execution are.
              </p>
            </div>

            <div style={{ width: 36, height: 1, background: P.goldBorder, marginBottom: 22 }} />

            <p style={{
              fontSize: "1rem", color: P.muted, lineHeight: 1.78,
              maxWidth: 540, margin: 0,
            }}>
              Cognitive Empire is built around preserving human judgment while increasing operational leverage. Every product and system reflects this principle.
            </p>
          </div>
        </section>

        {/* ══════════ ENTRY CTA ══════════ */}
        <section className="ce-c1">
          <div style={{
            maxWidth: 1280, margin: "0 auto", padding: "56px 48px 72px",
            display: "flex", flexDirection: "column", alignItems: "flex-start",
          }}>
            <p style={{
              fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.38em",
              textTransform: "uppercase", color: P.gold, margin: "0 0 16px",
            }}>
              Entry Point
            </p>

            <h2 style={{
              fontSize: "clamp(1.8rem, 3vw, 2.8rem)", fontWeight: 200,
              color: P.text, letterSpacing: "-0.035em", lineHeight: 1.1,
              margin: "0 0 12px",
            }}>
              Start with Connect.
            </h2>

            <p style={{ fontSize: "0.95rem", color: P.muted, lineHeight: 1.7, margin: "0 0 28px", maxWidth: 400 }}>
              Find the correct path into Cognitive Empire.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <Link href="/connect" className="ce-cta-primary" style={{
                fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.16em",
                textTransform: "uppercase", color: P.text,
                border: `1px solid rgba(197,162,111,0.48)`,
                background: "rgba(197,162,111,0.12)",
                padding: "10px 20px", display: "inline-flex", alignItems: "center",
              }}>
                Connect →
              </Link>
              <Link href="/signals" className="ce-cta-ghost" style={{
                fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.16em",
                textTransform: "uppercase", color: P.muted,
                border: `1px solid ${P.border}`, background: "transparent",
                padding: "10px 20px", display: "inline-flex", alignItems: "center",
              }}>
                Explore Signals →
              </Link>
            </div>
          </div>
        </section>

        {/* CE mark + tagline strip */}
        <div style={{
          borderTop:   `1px solid ${P.border}`,
          background:  P.bgDeep,
          padding:     "18px 48px",
          display:     "flex", alignItems: "center", gap: 12,
          maxWidth:    1280, margin: "0 auto",
        }}>
          <CitadelMark w={20} h={20} fill={`rgba(197,162,111,0.35)`} />
          <p style={{ fontSize: "0.68rem", color: P.dim, letterSpacing: "0.18em", margin: 0, textTransform: "uppercase" }}>
            Signal. Judgment. Systems.
          </p>
        </div>

        <CEFooter />
      </div>
    </>
  );
}
