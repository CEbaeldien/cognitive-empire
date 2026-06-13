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
    actions: [
      { label: "Open Release →", href: "/operator-kernel",               tooltip: "Open the canonical source text."  },
      { label: "Read Canon →",   href: "/operator-kernel",               tooltip: "Read the full canon document."    },
      { label: "View Web →",     href: "/operator-kernel",               tooltip: "View the web version."           },
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
  { n: "01", title: "Clarity Over Noise",    desc: "We cut what obscures and keep what endures."     },
  { n: "02", title: "Structure Over Chaos",  desc: "Systems win. Always."                            },
  { n: "03", title: "Operator Sovereignty",  desc: "Authority lives with the operator."              },
  { n: "04", title: "Durability by Design",  desc: "Build for longevity. Everything else is maintenance." },
];

// ── Inline mark ───────────────────────────────────────────────────────────────
function CitadelMark({ w, h, fill }: { w: number; h: number; fill: string }) {
  return (
    <svg width={w} height={h} viewBox="0 0 106 82" fill="none" aria-hidden="true">
      <path
        fill={fill}
        fillRule="evenodd"
        d="M2,56 h12 v16 h-12 Z M17,44 h12 v28 h-12 Z M32,32 h12 v40 h-12 Z
           M47,18 h12 v54 h-12 Z M62,32 h12 v40 h-12 Z M77,44 h12 v28 h-12 Z
           M92,56 h12 v16 h-12 Z M2,72 h102 v6 h-102 Z
           M49,72 L49,54 C49,43 51,41 53,41 C55,41 57,43 57,54 L57,72 Z"
      />
    </svg>
  );
}

// ── Metadata row ──────────────────────────────────────────────────────────────
function MetaField({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  return (
    <div>
      <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: P.dim, margin: "0 0 3px" }}>
        {label}
      </p>
      <p style={{ fontSize: 12, fontWeight: 500, color: gold ? P.gold : P.text, margin: 0 }}>
        {value}
      </p>
    </div>
  );
}

// ── Release card ──────────────────────────────────────────────────────────────
function ReleaseCard({ rel, animClass }: { rel: Release; animClass: string }) {
  return (
    <div
      className={`ce-release-card ${animClass}`}
      style={{
        border:      `1px solid ${P.borderStrong}`,
        borderTop:   `2px solid ${P.goldBorder}`,
        background:  P.panel,
        borderRadius: 4,
        padding:     "26px 24px 20px",
        display:     "flex",
        flexDirection: "column",
        gap:         0,
      }}
    >
      {/* Header: icon + label + title */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 18 }}>
        <div style={{
          width: 38, height: 38, flexShrink: 0,
          border: `1px solid ${P.goldBorder}`,
          background: P.goldSoft,
          borderRadius: 3,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <CitadelMark w={18} h={14} fill={P.gold} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{
            fontSize: 8, fontWeight: 700, letterSpacing: "0.30em",
            textTransform: "uppercase", color: P.gold,
            display: "block", marginBottom: 5,
          }}>
            {rel.category}
          </span>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: P.text, margin: "0 0 3px", letterSpacing: "-0.01em", lineHeight: 1.2 }}>
            {rel.title}
          </h2>
          <p style={{ fontSize: 12, color: P.muted, margin: 0, lineHeight: 1.5 }}>{rel.subtitle}</p>
        </div>
      </div>

      {/* Metadata grid */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: "10px 16px",
        padding: "14px 0",
        borderTop: `1px solid ${P.border}`,
        borderBottom: `1px solid ${P.border}`,
        marginBottom: 14,
      }}>
        <MetaField label="Version"       value={rel.version}  />
        <MetaField label="Canon Status"  value={rel.status}   gold />
        <MetaField label="Released"      value={rel.released} />
        <MetaField label="Class"         value={rel.docClass} />
        <div style={{ gridColumn: "1 / -1" }}>
          <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: P.dim, margin: "0 0 3px" }}>
            Canon Priority
          </p>
          <p style={{ fontSize: 18, fontWeight: 800, color: P.gold, margin: 0, letterSpacing: "-0.02em", lineHeight: 1 }}>
            {rel.priority}
          </p>
        </div>
      </div>

      {/* Description */}
      <p style={{ fontSize: 12, color: P.muted, lineHeight: 1.75, margin: "0 0 16px" }}>
        {rel.description}
      </p>

      {/* Action row */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
        {rel.actions.map(action => {
          const disabled = !action.href;
          if (disabled) {
            return (
              <div
                key={action.label}
                className="ce-action-btn"
                data-disabled="true"
                style={{
                  fontSize: 10, fontWeight: 600, letterSpacing: "0.08em",
                  color: P.dim, padding: "5px 12px", borderRadius: 3,
                  border: `1px solid ${P.border}`,
                  background: "transparent", position: "relative",
                  cursor: "not-allowed", opacity: 0.38,
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
                fontSize: 10, fontWeight: 600, letterSpacing: "0.08em",
                color: P.muted, padding: "5px 12px", borderRadius: 3,
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

      {/* Footer bar */}
      <div style={{
        borderTop: `1px solid ${P.border}`, paddingTop: 10,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: P.dim }}>
          ID
        </span>
        <span style={{ fontSize: 9, fontFamily: "monospace", letterSpacing: "0.06em", color: P.dim }}>
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
        /* ── CE Research — Canon Command Center motion + interactions ── */

        @keyframes ce-fade-up {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        @keyframes ce-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .ce-hero     { opacity: 0; animation: ce-fade-up  700ms cubic-bezier(0.16,1,0.3,1)  60ms  forwards; }
        .ce-status   { opacity: 0; animation: ce-fade-up  700ms cubic-bezier(0.16,1,0.3,1) 180ms  forwards; }
        .ce-card-1   { opacity: 0; animation: ce-fade-up  700ms cubic-bezier(0.16,1,0.3,1) 300ms  forwards; }
        .ce-card-2   { opacity: 0; animation: ce-fade-up  700ms cubic-bezier(0.16,1,0.3,1) 420ms  forwards; }
        .ce-sidebar  { opacity: 0; animation: ce-fade-up  700ms cubic-bezier(0.16,1,0.3,1) 540ms  forwards; }
        .ce-quote    { opacity: 0; animation: ce-fade-in  900ms cubic-bezier(0.16,1,0.3,1) 660ms  forwards; }

        /* Release card */
        .ce-release-card {
          transition: transform 220ms ease-out, border-color 220ms ease-out, box-shadow 220ms ease-out;
        }
        .ce-release-card:hover {
          transform: translateY(-2px);
          border-top-color: rgba(197,162,111,0.65) !important;
          box-shadow: 0 0 0 1px rgba(197,162,111,0.10), 0 24px 80px rgba(0,0,0,0.35);
        }

        /* Action buttons */
        .ce-action-btn {
          transition: background 160ms ease-out, border-color 160ms ease-out, color 160ms ease-out;
        }
        .ce-action-btn:not([data-disabled="true"]):hover {
          background: rgba(197,162,111,0.08) !important;
          border-color: rgba(197,162,111,0.36) !important;
          color: #F4F7FB !important;
        }

        /* Tooltip */
        .ce-tooltip {
          position: absolute;
          bottom: calc(100% + 7px);
          left: 50%;
          transform: translateX(-50%);
          white-space: nowrap;
          font-size: 10px;
          color: #C5A26F;
          background: #080B12;
          border: 1px solid rgba(197,162,111,0.30);
          padding: 3px 8px;
          border-radius: 3px;
          pointer-events: none;
          opacity: 0;
          transition: opacity 140ms ease-out;
          letter-spacing: 0.04em;
          z-index: 20;
        }
        .ce-action-btn:hover .ce-tooltip { opacity: 1; }

        /* Principle rows */
        .ce-principle {
          transition: transform 160ms ease-out;
        }
        .ce-principle:hover { transform: translateX(4px); }
        .ce-principle:hover .ce-principle-title { color: #F4F7FB !important; }

        /* Tab hover */
        .ce-tab-inactive:hover span { color: #8B9AB3 !important; }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .ce-hero, .ce-status, .ce-card-1, .ce-card-2, .ce-sidebar, .ce-quote {
            opacity: 1; animation: none; transform: none;
          }
          .ce-release-card:hover { transform: none; }
          .ce-principle:hover    { transform: none; }
        }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: `
          radial-gradient(circle at 68% 0%, rgba(197,162,111,0.04) 0%, transparent 30%),
          linear-gradient(180deg, #05070B 0%, #07111F 50%, #05070B 100%)
        `,
        color: P.text,
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}>
        <CENav />

        {/* ══════════ HERO ══════════ */}
        <section style={{ borderBottom: `1px solid ${P.border}` }}>
          <div style={{
            maxWidth: 1280, margin: "0 auto", padding: "56px 48px 48px",
            display: "grid", gridTemplateColumns: "1fr 280px", gap: 48, alignItems: "start",
          }}>

            {/* Left */}
            <div className="ce-hero">
              <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.36em", textTransform: "uppercase", color: P.gold, marginBottom: 18 }}>
                Intelligence Layer — CE Research
              </p>
              <h1 style={{ fontSize: "clamp(2.2rem,3.5vw,3.25rem)", fontWeight: 300, letterSpacing: "-0.02em", color: P.text, lineHeight: 1.1, margin: "0 0 8px" }}>
                CE Research
              </h1>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.36em", textTransform: "uppercase", color: P.dim, margin: "0 0 22px" }}>
                Canon Command Center
              </p>
              <div style={{ width: 36, height: 1, background: P.goldBorder, marginBottom: 22 }} />
              <p style={{ fontSize: 15, color: P.muted, lineHeight: 1.8, maxWidth: 520, margin: 0 }}>
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
              <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.34em", textTransform: "uppercase", color: P.gold, margin: "0 0 18px" }}>
                Canon Status
              </p>

              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: P.dim, margin: "0 0 6px" }}>
                  Canonical Source
                </p>
                <p style={{ fontSize: 12, color: P.muted, lineHeight: 1.65, margin: 0 }}>
                  All doctrine and structural releases are operator-authorized.
                </p>
              </div>

              <div style={{ borderTop: `1px solid ${P.border}`, margin: "14px 0" }} />

              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: P.dim, margin: "0 0 6px" }}>
                  Last Canon Update
                </p>
                <p style={{ fontSize: 13, fontWeight: 600, color: P.text, margin: "0 0 2px" }}>Jun 13, 2026</p>
                <p style={{ fontSize: 11, color: P.dim, margin: 0 }}>11:06 PM UTC</p>
              </div>

              <div style={{ borderTop: `1px solid ${P.border}`, margin: "14px 0" }} />

              <div>
                <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: P.dim, margin: "0 0 10px" }}>
                  Active Releases
                </p>
                <p style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-0.04em", color: P.text, margin: "0 0 8px", lineHeight: 1 }}>2</p>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  fontSize: 10, fontWeight: 600, letterSpacing: "0.08em",
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
        <section style={{ borderBottom: `1px solid ${P.border}`, background: P.panel }}>
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
                    fontSize: 10, fontWeight: 700, letterSpacing: "0.20em",
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
                <span style={{ fontSize: 11, color: P.dim }}>Search canon…</span>
              </div>
              <div style={{
                display: "flex", alignItems: "center", gap: 5,
                border: `1px solid ${P.border}`, background: "#080B12",
                padding: "6px 12px", borderRadius: 3, cursor: "default",
              }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={P.dim} strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="10" y1="18" x2="14" y2="18"/>
                </svg>
                <span style={{ fontSize: 11, color: P.dim }}>Filters</span>
              </div>
              <span style={{ fontSize: 11, color: P.dim, padding: "0 4px" }}>
                Sort by: <span style={{ color: P.muted }}>Canon Priority</span>
              </span>
            </div>
          </div>
        </section>

        {/* ══════════ MAIN ══════════ */}
        <section style={{ maxWidth: 1280, margin: "0 auto", padding: "44px 48px 80px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 272px", gap: 36, alignItems: "start" }}>

            {/* Left: Canonical Releases */}
            <div>
              <div style={{ marginBottom: 28 }}>
                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.34em", textTransform: "uppercase", color: P.gold, margin: "0 0 5px" }}>
                  Canonical Releases
                </p>
                <p style={{ fontSize: 13, color: P.dim, margin: 0 }}>
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
                <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.34em", textTransform: "uppercase", color: P.gold, margin: "0 0 18px" }}>
                  Doctrine Principles
                </p>

                <div style={{ display: "flex", flexDirection: "column" }}>
                  {PRINCIPLES.map((pr, i) => (
                    <div key={pr.n}>
                      {i > 0 && <div style={{ height: 1, background: P.border }} />}
                      <div className="ce-principle" style={{ padding: "14px 0", cursor: "default" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                          <span style={{
                            fontSize: 9, fontWeight: 800, letterSpacing: "0.10em",
                            color: P.gold, flexShrink: 0, marginTop: 2,
                            fontFamily: "monospace",
                          }}>
                            {pr.n}
                          </span>
                          <div>
                            <p className="ce-principle-title" style={{
                              fontSize: 13, fontWeight: 700, color: P.text,
                              margin: "0 0 4px",
                              transition: "color 160ms ease-out",
                            }}>
                              {pr.title}
                            </p>
                            <p style={{ fontSize: 12, color: P.dim, margin: 0, lineHeight: 1.6 }}>
                              {pr.desc}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ borderTop: `1px solid ${P.border}`, paddingTop: 14, marginTop: 2 }}>
                  <a href="#" style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: "0.22em",
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
          <div style={{ maxWidth: 1280, margin: "0 auto", padding: "44px 48px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 22 }}>
              <div style={{ flexShrink: 0, marginTop: 6, opacity: 0.5 }}>
                <CitadelMark w={26} h={20} fill={P.gold} />
              </div>
              <div>
                <p style={{
                  fontSize: "clamp(1rem,1.8vw,1.3rem)", fontWeight: 300,
                  color: P.text, lineHeight: 1.65, margin: "0 0 10px",
                  letterSpacing: "0.01em", fontStyle: "italic",
                }}>
                  &ldquo;Canon is not suggestion. It is structure. Operate accordingly.&rdquo;
                </p>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.26em", textTransform: "uppercase", color: P.dim, margin: 0 }}>
                  — Cognitive Empire Doctrine
                </p>
              </div>
            </div>
          </div>
        </section>

        <CEFooter />
      </div>
    </>
  );
}
