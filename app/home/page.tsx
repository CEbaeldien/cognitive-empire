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
        @keyframes ceReveal {
          from { opacity: 0; transform: translateY(18px); filter: blur(4px); }
          to   { opacity: 1; transform: translateY(0);    filter: blur(0);   }
        }

        .ce-s1  { opacity: 0; animation: ceReveal 700ms cubic-bezier(0.16,1,0.3,1) 120ms forwards; }
        .ce-s2  { opacity: 0; animation: ceReveal 700ms cubic-bezier(0.16,1,0.3,1) 180ms forwards; }
        .ce-s3  { opacity: 0; animation: ceReveal 700ms cubic-bezier(0.16,1,0.3,1) 240ms forwards; }
        .ce-s4  { opacity: 0; animation: ceReveal 700ms cubic-bezier(0.16,1,0.3,1) 300ms forwards; }
        .ce-s5  { opacity: 0; animation: ceReveal 700ms cubic-bezier(0.16,1,0.3,1) 360ms forwards; }
        .ce-p1  { opacity: 0; animation: ceReveal 800ms cubic-bezier(0.16,1,0.3,1) 400ms forwards; }
        .ce-c1  { opacity: 0; animation: ceReveal 800ms cubic-bezier(0.16,1,0.3,1) 460ms forwards; }

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
          .ce-s1, .ce-s2, .ce-s3, .ce-s4, .ce-s5,
          .ce-p1, .ce-c1 { opacity: 1; transform: none; filter: none; }
        }
      `}</style>

      <div style={{
        background: P.bgDeep,
        color: P.text,
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}>
        <CENav />

        {/* ══════════ HERO — full-screen animation ══════════ */}
        <section
          aria-label="Cognitive Empire — Structuring Intelligence."
          style={{
            height: "calc(100vh - 68px)",
            background: "#03050A",
            overflow: "hidden",
            borderBottom: `1px solid ${P.border}`,
          }}
        >
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            src="/media/ce-structuring-intelligence.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              display: "block",
            }}
          />
        </section>

        {/* ══════════ PUBLIC SYSTEMS ══════════ */}
        <section style={{
          background: `linear-gradient(180deg, #05070B 0%, #07111F 60%, #05070B 100%)`,
          borderBottom: `1px solid ${P.border}`,
        }}>
          <div style={{ maxWidth: 1280, margin: "0 auto", padding: "52px 48px" }}>

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

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 14 }}>
              {SYSTEMS.slice(0, 3).map((s, i) => (
                <SystemCard key={s.n} {...s} animClass={`ce-s${i + 1}`} />
              ))}
            </div>

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
          borderTop:  `1px solid ${P.border}`,
          background: P.bgDeep,
          padding:    "18px 48px",
          display:    "flex", alignItems: "center", gap: 12,
          maxWidth:   1280, margin: "0 auto",
        }}>
          <CitadelMark w={20} h={20} fill="rgba(197,162,111,0.35)" />
          <p style={{ fontSize: "0.68rem", color: P.dim, letterSpacing: "0.18em", margin: 0, textTransform: "uppercase" }}>
            Signal. Judgment. Systems.
          </p>
        </div>

        <CEFooter />
      </div>
    </>
  );
}
