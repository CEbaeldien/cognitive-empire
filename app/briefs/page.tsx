import type { Metadata } from "next";
import CENav from "../components/CENav";
import CEFooter from "../components/CEFooter";

export const metadata: Metadata = {
  title: "CE Research — Canon Command Center | Cognitive Empire",
  description:
    "The canonical library for Cognitive Empire doctrine, principles, and structural releases.",
};

// ── Palette ───────────────────────────────────────────────────────────────────
const P = {
  bg:          "#05070B",
  bgNav:       "#07111F",
  panel:       "#0D1524",
  panelHigh:   "#111C30",
  border:      "rgba(255,255,255,0.08)",
  borderStrong:"rgba(255,255,255,0.12)",
  text:        "#E6EDF7",
  muted:       "#8B9AB3",
  dim:         "#5E6B80",
  gold:        "#C5A26F",
  goldSoft:    "rgba(197,162,111,0.10)",
  goldBorder:  "rgba(197,162,111,0.38)",
  goldDim:     "rgba(197,162,111,0.20)",
} as const;

// ── Types ─────────────────────────────────────────────────────────────────────
type ReleaseAction = {
  label:    string;
  href:     string | null;
  tooltip:  string;
  external?: boolean;
};

type Release = {
  id:          string;
  priority:    string;
  category:    string;
  title:       string;
  subtitle:    string;
  description: string;
  version:     string;
  status:      string;
  released:    string;
  docClass:    string;
  primary?:    boolean;
  actions:     ReleaseAction[];
};

// ── Data ──────────────────────────────────────────────────────────────────────
const RELEASES: Release[] = [
  {
    id:          "CE-DOC-OPS-KERNEL-1.0",
    priority:    "01",
    category:    "DOCTRINE",
    title:       "Ops Kernel",
    subtitle:    "The operational core. Execution logic for operators.",
    description: "Ops Kernel defines the operational core of Cognitive Empire. It codifies execution logic, decision thresholds, and escalation structures for real-world operators.",
    version:     "1.0",
    status:      "Canon Current",
    released:    "Jun 13, 2026",
    docClass:    "Doctrine Core",
    primary:     true,
    actions: [
      { label: "Open Release →", href: "/operator-kernel",                tooltip: "Open the canonical source text."  },
      { label: "Read Canon →",   href: "/operator-kernel",                tooltip: "Read the full canon document."    },
      { label: "View Web →",     href: "/operator-kernel",                tooltip: "View the web version."           },
      { label: "Download PDF →", href: "/downloads/ce-public-kernel.pdf", tooltip: "Download the PDF release.", external: true },
    ],
  },
  {
    id:          "CE-DOC-MAINT-GRAVITY-1.0",
    priority:    "02",
    category:    "DOCTRINE",
    title:       "Maintenance Gravity",
    subtitle:    "Sustainment laws for systems that endure.",
    description: "Maintenance Gravity defines the invariants that sustain systems under entropy, stress, and scale.",
    version:     "1.0",
    status:      "Canon Current",
    released:    "Jun 13, 2026",
    docClass:    "Doctrine System",
    actions: [
      { label: "Open Release →", href: "/maintenance-gravity", tooltip: "Open the canonical source text."   },
      { label: "Read Canon →",   href: "/maintenance-gravity", tooltip: "Read the full canon document."     },
      { label: "View Web →",     href: "/maintenance-gravity", tooltip: "View the web version."            },
      { label: "Download PDF →", href: null,                   tooltip: "PDF pending. Not yet available."  },
    ],
  },
];

const PRINCIPLES = [
  { n: "01", title: "Clarity Over Noise",    desc: "We cut what obscures and keep what endures."          },
  { n: "02", title: "Structure Over Chaos",  desc: "Systems win. Always."                                 },
  { n: "03", title: "Operator Sovereignty",  desc: "Authority lives with the operator."                   },
  { n: "04", title: "Durability by Design",  desc: "Build for longevity. Everything else is maintenance." },
];

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

// ── Metadata field ────────────────────────────────────────────────────────────
function MetaField({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  return (
    <div>
      <p style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: P.dim, margin: "0 0 3px" }}>
        {label}
      </p>
      <p style={{ fontSize: "0.95rem", fontWeight: 500, color: gold ? P.gold : P.text, margin: 0, lineHeight: 1.3 }}>
        {value}
      </p>
    </div>
  );
}

// ── Release card ──────────────────────────────────────────────────────────────
function ReleaseCard({ rel, animClass }: { rel: Release; animClass: string }) {
  const borderTopColor = rel.primary
    ? "rgba(197,162,111,0.55)"
    : "rgba(197,162,111,0.35)";

  return (
    <div
      className={`ce-release-card ${animClass}${rel.primary ? " primary-canon" : ""}`}
      style={{
        border:        `1px solid ${rel.primary ? "rgba(197,162,111,0.22)" : P.borderStrong}`,
        borderTop:     `2px solid ${borderTopColor}`,
        background:    P.panel,
        borderRadius:  4,
        padding:       "28px 26px 22px",
        display:       "flex",
        flexDirection: "column",
      }}
    >
      {/* Header: icon + label + title */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 20 }}>
        <div style={{
          width: 42, height: 42, flexShrink: 0,
          border: `1px solid ${P.goldBorder}`,
          background: P.goldSoft,
          borderRadius: 3,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <CitadelMark w={20} h={20} fill={P.gold} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{
            fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.32em",
            textTransform: "uppercase", color: P.gold,
            display: "block", marginBottom: 6,
          }}>
            {rel.category}
          </span>
          <h2 style={{
            fontSize: "clamp(1.35rem, 2.1vw, 1.65rem)",
            fontWeight: 700, color: P.text,
            margin: "0 0 5px", letterSpacing: "-0.025em", lineHeight: 1.1,
          }}>
            {rel.title}
          </h2>
          <p style={{ fontSize: "1.02rem", color: P.muted, margin: 0, lineHeight: 1.5 }}>
            {rel.subtitle}
          </p>
        </div>
      </div>

      {/* Metadata grid */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: "12px 18px",
        padding: "16px 0",
        borderTop:    `1px solid ${P.border}`,
        borderBottom: `1px solid ${P.border}`,
        marginBottom: 16,
      }}>
        <MetaField label="Version"      value={rel.version}  />
        <MetaField label="Canon Status" value={rel.status}   gold />
        <MetaField label="Released"     value={rel.released} />
        <MetaField label="Class"        value={rel.docClass} />
        <div style={{ gridColumn: "1 / -1" }}>
          <p style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: P.dim, margin: "0 0 4px" }}>
            Canon Priority
          </p>
          <p style={{ fontSize: "1.5rem", fontWeight: 800, color: P.gold, margin: 0, letterSpacing: "-0.03em", lineHeight: 1 }}>
            {rel.priority}
          </p>
        </div>
      </div>

      {/* Description */}
      <p style={{ fontSize: "1rem", color: P.muted, lineHeight: 1.75, margin: "0 0 18px" }}>
        {rel.description}
      </p>

      {/* Actions */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
        {rel.actions.map(action => {
          const disabled = !action.href;
          if (disabled) {
            return (
              <div
                key={action.label}
                className="ce-action-btn"
                data-disabled="true"
                style={{
                  fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.12em",
                  color: P.dim, padding: "6px 14px", borderRadius: 3,
                  border: `1px solid ${P.border}`,
                  background: "transparent", position: "relative",
                  cursor: "not-allowed", opacity: 0.35,
                  userSelect: "none",
                }}
              >
                PDF Pending
                <span className="ce-tooltip">{action.tooltip}</span>
              </div>
            );
          }
          return (
            <a
              key={action.label}
              href={action.href!}
              target={action.external ? "_blank" : undefined}
              rel={action.external ? "noreferrer" : undefined}
              className="ce-action-btn"
              style={{
                fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.12em",
                color: P.muted, padding: "6px 14px", borderRadius: 3,
                border: `1px solid ${P.border}`,
                background: "transparent", position: "relative",
                textDecoration: "none", display: "inline-flex", alignItems: "center",
              }}
            >
              {action.label}
              <span className="ce-tooltip">{action.tooltip}</span>
            </a>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{
        borderTop: `1px solid ${P.border}`, paddingTop: 11,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginTop: "auto",
      }}>
        <span style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: P.dim }}>
          ID
        </span>
        <span style={{ fontSize: "0.68rem", fontFamily: "monospace", letterSpacing: "0.06em", color: P.dim }}>
          {rel.id}
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function CEResearchPage() {
  return (
    <>
      <style>{`
        /* ── CE Research — Canon Command Center v2 motion system ── */

        /* Premium entrance — blur + translate + opacity */
        @keyframes ceReveal {
          from {
            opacity: 0;
            transform: translateY(18px);
            filter: blur(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }

        /* Background atmosphere pulse */
        @keyframes ceAtmosphere {
          from { transform: translate3d(0, 0, 0)     scale(1);     }
          to   { transform: translate3d(-8px, 6px, 0) scale(1.025); }
        }

        /* Staggered reveals */
        .ce-hero    { opacity: 0; animation: ceReveal 850ms cubic-bezier(0.16,1,0.3,1)   0ms forwards; }
        .ce-status  { opacity: 0; animation: ceReveal 850ms cubic-bezier(0.16,1,0.3,1) 120ms forwards; }
        .ce-tabs    { opacity: 0; animation: ceReveal 850ms cubic-bezier(0.16,1,0.3,1) 220ms forwards; }
        .ce-card-1  { opacity: 0; animation: ceReveal 850ms cubic-bezier(0.16,1,0.3,1) 320ms forwards; }
        .ce-card-2  { opacity: 0; animation: ceReveal 850ms cubic-bezier(0.16,1,0.3,1) 400ms forwards; }
        .ce-sidebar { opacity: 0; animation: ceReveal 850ms cubic-bezier(0.16,1,0.3,1) 420ms forwards; }
        .ce-quote   { opacity: 0; animation: ceReveal 850ms cubic-bezier(0.16,1,0.3,1) 520ms forwards; }

        /* Atmosphere layer */
        .ce-research-bg::before {
          content: "";
          position: fixed;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(circle at 18% 18%, rgba(197,162,111,0.035), transparent 26%),
            radial-gradient(circle at 72%  8%, rgba(255,255,255,0.018), transparent 32%),
            radial-gradient(circle at 50% 80%, rgba(11,18,32,0.55),     transparent 42%);
          animation: ceAtmosphere 18s ease-in-out infinite alternate;
          opacity: 0.9;
          z-index: 0;
        }
        .ce-page-content {
          position: relative;
          z-index: 1;
        }

        /* Release cards */
        .ce-release-card {
          transition:
            transform     260ms cubic-bezier(0.22,1,0.36,1),
            border-color  260ms ease,
            box-shadow    260ms ease,
            background    260ms ease;
        }
        .ce-release-card:hover {
          transform: translateY(-4px) scale(1.006);
          border-top-color: rgba(197,162,111,0.65) !important;
          background: linear-gradient(
            180deg,
            rgba(197,162,111,0.045) 0%,
            rgba(13,21,36,0.96)    100%
          ) !important;
          box-shadow:
            0 0 0 1px rgba(197,162,111,0.12),
            0 24px 80px rgba(0,0,0,0.38);
        }
        .primary-canon {
          border-color: rgba(197,162,111,0.22) !important;
        }

        /* Action buttons */
        .ce-action-btn {
          transition:
            background    200ms ease,
            border-color  200ms ease,
            color         200ms ease,
            transform     200ms ease;
        }
        .ce-action-btn:not([data-disabled="true"]):hover {
          transform: translateX(2px);
          background:   rgba(197,162,111,0.08) !important;
          border-color: rgba(197,162,111,0.42) !important;
          color: #F4F7FB !important;
        }

        /* Tooltip */
        .ce-tooltip {
          position: absolute;
          bottom: calc(100% + 7px);
          left: 50%;
          transform: translateX(-50%);
          white-space: nowrap;
          font-size: 0.65rem;
          color: #C5A26F;
          background: #080B12;
          border: 1px solid rgba(197,162,111,0.30);
          padding: 3px 9px;
          border-radius: 3px;
          pointer-events: none;
          opacity: 0;
          transition: opacity 140ms ease-out;
          letter-spacing: 0.05em;
          z-index: 20;
        }
        .ce-action-btn:hover .ce-tooltip { opacity: 1; }

        /* Principle rows */
        .ce-principle {
          transition:
            transform     220ms cubic-bezier(0.22,1,0.36,1),
            border-color  220ms ease;
        }
        .ce-principle:hover { transform: translateX(4px); }
        .ce-principle:hover .ce-principle-title { color: #F4F7FB !important; }

        /* Tab hover */
        .ce-tab-inactive:hover span { color: #8B9AB3 !important; }

        /* Reduced motion — full stop */
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation: none !important;
            transition: none !important;
            scroll-behavior: auto !important;
          }
          .ce-hero, .ce-status, .ce-tabs,
          .ce-card-1, .ce-card-2, .ce-sidebar, .ce-quote {
            opacity: 1;
            transform: none;
            filter: none;
          }
        }
      `}</style>

      {/* Atmosphere wrapper */}
      <div className="ce-research-bg" style={{
        minHeight: "100vh",
        background: `
          radial-gradient(circle at 68% 0%, rgba(197,162,111,0.04) 0%, transparent 30%),
          linear-gradient(180deg, #05070B 0%, #07111F 50%, #05070B 100%)
        `,
        color: P.text,
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}>
        {/* All page content above the atmosphere layer */}
        <div className="ce-page-content">
          <CENav />

          {/* ══════════ HERO ══════════ */}
          <section style={{ borderBottom: `1px solid ${P.border}` }}>
            <div style={{
              maxWidth: 1280, margin: "0 auto", padding: "56px 48px 48px",
              display: "grid", gridTemplateColumns: "1fr 280px", gap: 48, alignItems: "start",
            }}>

              {/* Left */}
              <div className="ce-hero">
                <p style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.36em", textTransform: "uppercase", color: P.gold, marginBottom: 20 }}>
                  Intelligence Layer — CE Research
                </p>
                <h1 style={{
                  fontSize: "clamp(3.8rem, 6vw, 6.5rem)",
                  fontWeight: 300, letterSpacing: "-0.055em",
                  color: P.text, lineHeight: 1.05, margin: "0 0 10px",
                }}>
                  CE Research
                </h1>
                <p style={{
                  fontSize: "1.25rem", fontWeight: 700, letterSpacing: "0.18em",
                  textTransform: "uppercase", color: P.dim, margin: "0 0 24px",
                }}>
                  Canon Command Center
                </p>
                <div style={{ width: 40, height: 1, background: P.goldBorder, marginBottom: 24 }} />
                <p style={{ fontSize: "1.08rem", color: P.muted, lineHeight: 1.75, maxWidth: 520, margin: 0 }}>
                  The canonical library for doctrine, principles, and structural releases.{" "}
                  <span style={{ color: P.text }}>Authoritative. Durable. Operator-grade.</span>
                </p>
              </div>

              {/* Right: Canon Status Panel */}
              <div className="ce-status" style={{
                border:     `1px solid ${P.border}`,
                borderTop:  `2px solid ${P.goldBorder}`,
                background: P.panel,
                padding:    "22px 22px",
              }}>
                <p style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.34em", textTransform: "uppercase", color: P.gold, margin: "0 0 18px" }}>
                  Canon Status
                </p>

                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: P.dim, margin: "0 0 6px" }}>
                    Canonical Source
                  </p>
                  <p style={{ fontSize: "0.88rem", color: P.muted, lineHeight: 1.65, margin: 0 }}>
                    All doctrine and structural releases are operator-authorized.
                  </p>
                </div>

                <div style={{ borderTop: `1px solid ${P.border}`, margin: "14px 0" }} />

                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: P.dim, margin: "0 0 6px" }}>
                    Last Canon Update
                  </p>
                  <p style={{ fontSize: "0.92rem", fontWeight: 600, color: P.text, margin: "0 0 2px" }}>Jun 13, 2026</p>
                  <p style={{ fontSize: "0.82rem", color: P.dim, margin: 0 }}>11:06 PM UTC</p>
                </div>

                <div style={{ borderTop: `1px solid ${P.border}`, margin: "14px 0" }} />

                <div>
                  <p style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: P.dim, margin: "0 0 10px" }}>
                    Active Releases
                  </p>
                  <p style={{ fontSize: "2.4rem", fontWeight: 800, letterSpacing: "-0.04em", color: P.text, margin: "0 0 8px", lineHeight: 1 }}>2</p>
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.08em",
                    color: P.gold, padding: "3px 10px", borderRadius: 3,
                    border: `1px solid ${P.goldDim}`, background: P.goldSoft,
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: P.gold, display: "inline-block" }} />
                    Canon Current
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* ══════════ TAB ROW ══════════ */}
          <section className="ce-tabs" style={{ borderBottom: `1px solid ${P.border}`, background: P.panel }}>
            <div style={{
              maxWidth: 1280, margin: "0 auto", padding: "0 48px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              {/* Tabs */}
              <div style={{ display: "flex" }}>
                {[
                  { label: "Canon Library", active: true  },
                  { label: "Principles",    active: false },
                  { label: "Release Notes", active: false },
                  { label: "Changelog",     active: false },
                ].map(tab => (
                  <div
                    key={tab.label}
                    className={tab.active ? undefined : "ce-tab-inactive"}
                    style={{
                      padding: "13px 18px",
                      borderBottom: tab.active ? `2px solid ${P.gold}` : "2px solid transparent",
                      cursor: tab.active ? "default" : "pointer",
                    }}
                  >
                    <span style={{
                      fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.20em",
                      textTransform: "uppercase",
                      color: tab.active ? P.gold : P.dim,
                      transition: "color 150ms",
                    }}>
                      {tab.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Search + filters */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 7,
                  border: `1px solid ${P.border}`, background: "#080B12",
                  padding: "6px 12px", borderRadius: 3, width: 170,
                }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={P.dim} strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <span style={{ fontSize: "0.72rem", color: P.dim }}>Search canon…</span>
                </div>
                <div style={{
                  display: "flex", alignItems: "center", gap: 5,
                  border: `1px solid ${P.border}`, background: "#080B12",
                  padding: "6px 12px", borderRadius: 3, cursor: "default",
                }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={P.dim} strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="10" y1="18" x2="14" y2="18"/>
                  </svg>
                  <span style={{ fontSize: "0.72rem", color: P.dim }}>Filters</span>
                </div>
                <span style={{ fontSize: "0.72rem", color: P.dim, padding: "0 4px" }}>
                  Sort by: <span style={{ color: P.muted }}>Canon Priority</span>
                </span>
              </div>
            </div>
          </section>

          {/* ══════════ MAIN ══════════ */}
          <section style={{ maxWidth: 1280, margin: "0 auto", padding: "44px 48px 80px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 288px", gap: 36, alignItems: "start" }}>

              {/* Left: Canonical Releases */}
              <div>
                <div style={{ marginBottom: 28 }}>
                  <p style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.34em", textTransform: "uppercase", color: P.gold, margin: "0 0 6px" }}>
                    Canonical Releases
                  </p>
                  <p style={{ fontSize: "0.88rem", color: P.dim, margin: 0 }}>
                    Operator-authorized doctrine and structural systems.
                  </p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                  <ReleaseCard rel={RELEASES[0]} animClass="ce-card-1" />
                  <ReleaseCard rel={RELEASES[1]} animClass="ce-card-2" />
                </div>
              </div>

              {/* Right: Doctrine Principles */}
              <div className="ce-sidebar">
                <div style={{
                  border:    `1px solid ${P.border}`,
                  borderTop: `2px solid ${P.goldBorder}`,
                  background: P.panel,
                  padding:   "22px 20px",
                  position:  "sticky",
                  top:       80,
                }}>
                  <p style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.34em", textTransform: "uppercase", color: P.gold, margin: "0 0 18px" }}>
                    Doctrine Principles
                  </p>

                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {PRINCIPLES.map((pr, i) => (
                      <div key={pr.n}>
                        {i > 0 && <div style={{ height: 1, background: P.border }} />}
                        <div className="ce-principle" style={{ padding: "16px 0", cursor: "default" }}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                            <span style={{
                              fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.10em",
                              color: P.gold, flexShrink: 0, marginTop: 3,
                              fontFamily: "monospace",
                            }}>
                              {pr.n}
                            </span>
                            <div>
                              <p className="ce-principle-title" style={{
                                fontSize: "1rem", fontWeight: 600, color: P.text,
                                margin: "0 0 5px",
                                transition: "color 220ms ease-out",
                              }}>
                                {pr.title}
                              </p>
                              <p style={{ fontSize: "0.9rem", color: P.dim, margin: 0, lineHeight: 1.6 }}>
                                {pr.desc}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ borderTop: `1px solid ${P.border}`, paddingTop: 16, marginTop: 4 }}>
                    <a href="#" style={{
                      fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.22em",
                      textTransform: "uppercase", color: P.gold, textDecoration: "none",
                    }}>
                      View All Principles →
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ══════════ QUOTE STRIP ══════════ */}
          <section className="ce-quote" style={{ borderTop: `1px solid ${P.border}`, background: "#06090E" }}>
            <div style={{ maxWidth: 1280, margin: "0 auto", padding: "48px 48px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 24 }}>
                <div style={{ flexShrink: 0, marginTop: 6, opacity: 0.45 }}>
                  <CitadelMark w={28} h={28} fill={P.gold} />
                </div>
                <div>
                  <p style={{
                    fontSize: "clamp(1.1rem, 2vw, 1.45rem)",
                    fontWeight: 300, color: P.text, lineHeight: 1.65,
                    margin: "0 0 12px", letterSpacing: "0.01em", fontStyle: "italic",
                  }}>
                    &ldquo;Canon is not suggestion. It is structure. Operate accordingly.&rdquo;
                  </p>
                  <p style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.26em", textTransform: "uppercase", color: P.dim, margin: 0 }}>
                    — Cognitive Empire Doctrine
                  </p>
                </div>
              </div>
            </div>
          </section>

          <CEFooter />
        </div>
      </div>
    </>
  );
}
