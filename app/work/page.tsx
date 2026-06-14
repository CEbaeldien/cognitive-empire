import type { Metadata } from "next";
import CENav from "../components/CENav";
import CEFooter from "../components/CEFooter";

export const metadata: Metadata = {
  title: "Work — Operational Systems | Cognitive Empire",
  description:
    "CE provides operational survivability systems for organizations that cannot afford structural failure.",
};

// ── Palette ───────────────────────────────────────────────────────────────────
const P = {
  bg:         "#05070B",
  bgDeep:     "#03050A",
  panel:      "#0A1221",
  panelDeep:  "#060C18",
  panelStep:  "#040A14",
  border:     "rgba(255,255,255,0.07)",
  borderMid:  "rgba(255,255,255,0.10)",
  text:       "#E6EDF7",
  muted:      "#7A8BA6",
  dim:        "#4A5A70",
  gold:       "#C5A26F",
  goldSoft:   "rgba(197,162,111,0.09)",
  goldBorder: "rgba(197,162,111,0.32)",
  goldDim:    "rgba(197,162,111,0.16)",
  goldFaint:  "rgba(197,162,111,0.10)",
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

// ── Radar SVG (hero right) ────────────────────────────────────────────────────
function RadarGraphic() {
  const gold8  = "rgba(197,162,111,0.08)";
  const gold14 = "rgba(197,162,111,0.14)";
  const gold22 = "rgba(197,162,111,0.22)";
  const dim6   = "rgba(255,255,255,0.06)";

  return (
    <svg
      width="420" height="420"
      viewBox="0 0 420 420"
      fill="none"
      aria-hidden="true"
      style={{ position: "absolute", right: -32, top: -48, pointerEvents: "none" }}
    >
      {[180, 140, 100, 60, 24].map((r, i) => (
        <circle key={r} cx="210" cy="210" r={r}
          stroke={i === 0 ? gold8 : i < 3 ? dim6 : gold14}
          strokeWidth={i === 2 ? 0.5 : 1} />
      ))}
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * 30 * Math.PI) / 180;
        return (
          <line key={i}
            x1={210 + Math.cos(a) * 24} y1={210 + Math.sin(a) * 24}
            x2={210 + Math.cos(a) * 180} y2={210 + Math.sin(a) * 180}
            stroke={gold8} strokeWidth="0.75" />
        );
      })}
      {([[210, 30], [380, 210], [210, 390], [40, 210]] as [number,number][]).map(([cx, cy], i) => (
        <g key={i} transform={`translate(${cx},${cy}) rotate(${i * 90})`}>
          <line x1="-6" y1="0" x2="6" y2="0" stroke={gold22} strokeWidth="1.5" />
          <line x1="0" y1="-6" x2="0" y2="6" stroke={gold22} strokeWidth="1.5" />
        </g>
      ))}
      <circle cx="280" cy="150" r="2.5" fill={gold22} />
      <circle cx="145" cy="250" r="2"   fill={gold14} />
      <circle cx="310" cy="280" r="1.5" fill={gold8}  />
      <circle cx="170" cy="130" r="2"   fill={gold14} />
      <path
        d={`M210,210 L210,30 A180,180 0 0,1 ${210 + 180 * Math.sin((60 * Math.PI) / 180)},${210 - 180 * Math.cos((60 * Math.PI) / 180)} Z`}
        fill="rgba(197,162,111,0.025)" stroke="none"
      />
      <circle cx="210" cy="210" r="3" fill="none" stroke={gold22} strokeWidth="1" />
      <line x1="203" y1="210" x2="217" y2="210" stroke={gold14} strokeWidth="0.75" />
      <line x1="210" y1="203" x2="210" y2="217" stroke={gold14} strokeWidth="0.75" />
    </svg>
  );
}

// ── System card ───────────────────────────────────────────────────────────────
function SystemCard({
  number, icon, title, description, tags,
  flowHref, doctrineHref, auditHref, animClass,
}: {
  number:       string;
  icon:         React.ReactNode;
  title:        string;
  description:  string;
  tags:         string[];
  flowHref:     string;
  doctrineHref: string;
  auditHref:    string;
  animClass:    string;
}) {
  return (
    <div
      className={`ce-work-card ${animClass}`}
      style={{
        background:    P.panel,
        border:        `1px solid ${P.borderMid}`,
        borderTop:     `2px solid ${P.goldBorder}`,
        padding:       "28px 26px 24px",
        display:       "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
        <span style={{ fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.28em", fontFamily: "monospace", color: P.gold }}>
          {number}
        </span>
        <div style={{
          width: 34, height: 34, border: `1px solid ${P.goldBorder}`,
          background: P.goldSoft, borderRadius: 3,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          {icon}
        </div>
      </div>
      <h2 style={{ fontSize: "clamp(1.25rem, 1.8vw, 1.5rem)", fontWeight: 700, color: P.text, margin: "0 0 12px", letterSpacing: "-0.02em", lineHeight: 1.15 }}>
        {title}
      </h2>
      <p style={{ fontSize: "0.92rem", color: P.muted, lineHeight: 1.7, margin: "0 0 20px", flex: 1 }}>
        {description}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 22 }}>
        {tags.map(tag => (
          <span key={tag} style={{
            fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.22em",
            textTransform: "uppercase", color: P.gold,
            border: `1px solid ${P.goldDim}`, background: P.goldSoft,
            padding: "3px 9px", borderRadius: 2,
          }}>
            {tag}
          </span>
        ))}
      </div>
      <div style={{ height: 1, background: P.border, marginBottom: 18 }} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <a href={flowHref} className="ce-work-btn ce-work-btn--ghost" style={{
          fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase",
          color: P.muted, border: `1px solid ${P.border}`, background: "transparent",
          padding: "7px 14px", borderRadius: 2, textDecoration: "none", display: "inline-flex", alignItems: "center",
        }}>
          Review Flow →
        </a>
        <a href={doctrineHref} className="ce-work-btn ce-work-btn--doctrine" style={{
          fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase",
          color: P.gold, border: `1px solid ${P.goldDim}`, background: P.goldSoft,
          padding: "7px 14px", borderRadius: 2, textDecoration: "none", display: "inline-flex", alignItems: "center",
        }}>
          Doctrine Certified →
        </a>
        <a href={auditHref} className="ce-work-btn ce-work-btn--primary" style={{
          fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase",
          color: P.text, border: `1px solid rgba(197,162,111,0.50)`, background: "rgba(197,162,111,0.12)",
          padding: "7px 14px", borderRadius: 2, textDecoration: "none", display: "inline-flex", alignItems: "center",
        }}>
          Request Audit →
        </a>
      </div>
    </div>
  );
}

// ── Step module (command-center panel unit) ───────────────────────────────────
function StepModule({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="ce-step-module" style={{
      flex: 1,
      background: P.panelStep,
      border: `1px solid rgba(255,255,255,0.065)`,
      padding: "18px 16px 16px",
      position: "relative",
      minWidth: 0,
    }}>
      {/* Corner bracket accent — top right */}
      <svg
        width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true"
        style={{ position: "absolute", top: 8, right: 8, opacity: 0.28 }}
      >
        <path d="M10 0 L10 5 M10 0 L5 0" stroke={P.gold} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>

      {/* Step badge */}
      <span style={{
        display: "inline-block",
        fontSize: "0.58rem", fontWeight: 800, letterSpacing: "0.14em",
        fontFamily: "monospace", color: P.gold,
        border: `1px solid ${P.goldDim}`, background: P.goldFaint,
        padding: "2px 8px", borderRadius: 2, marginBottom: 10,
      }}>
        {n}
      </span>

      {/* Title */}
      <p style={{ fontSize: "0.88rem", fontWeight: 700, color: P.text, margin: "0 0 8px", lineHeight: 1.25, letterSpacing: "-0.01em" }}>
        {title}
      </p>

      {/* Body */}
      <p style={{ fontSize: "0.78rem", color: P.muted, lineHeight: 1.68, margin: 0 }}>
        {body}
      </p>
    </div>
  );
}

// ── Step connector arrow ──────────────────────────────────────────────────────
function StepConnector() {
  return (
    <div className="ce-flow-connector" style={{
      width: 36, flexShrink: 0,
      display: "flex", alignItems: "flex-start",
      justifyContent: "center", paddingTop: 26,
    }}>
      <svg width="20" height="10" viewBox="0 0 20 10" fill="none" aria-hidden="true">
        <line x1="0" y1="5" x2="15" y2="5" stroke="rgba(197,162,111,0.28)" strokeWidth="1" />
        <path d="M12 2L17 5L12 8" stroke="rgba(197,162,111,0.28)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}

// ── Flow panel (command-center board) ────────────────────────────────────────
type StepData = { n: string; title: string; body: string };

function FlowPanel({
  id, flowNum, title, steps, animClass,
}: {
  id:        string;
  flowNum:   string;
  title:     string;
  steps:     StepData[];
  animClass: string;
}) {
  return (
    <div
      id={id}
      className={`ce-flow-panel ${animClass}`}
      style={{
        border:      `1px solid rgba(197,162,111,0.15)`,
        borderTop:   `1px solid rgba(197,162,111,0.36)`,
        borderRadius: 3,
        overflow:    "hidden",
        /* Subtle grid texture */
        backgroundImage: [
          `linear-gradient(rgba(197,162,111,0.022) 1px, transparent 1px)`,
          `linear-gradient(90deg, rgba(197,162,111,0.022) 1px, transparent 1px)`,
          `linear-gradient(180deg, ${P.panelDeep} 0%, ${P.panel} 100%)`,
        ].join(", "),
        backgroundSize: "36px 36px, 36px 36px, 100% 100%",
      }}
    >
      {/* Header strip */}
      <div className="ce-flow-header" style={{
        background: P.panelDeep,
        borderBottom: `1px solid rgba(197,162,111,0.10)`,
        padding: "12px 22px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        {/* Left: flow label + divider + title */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{
            fontSize: "0.58rem", fontWeight: 800, letterSpacing: "0.26em",
            fontFamily: "monospace", color: P.gold,
            textTransform: "uppercase",
          }}>
            FLOW {flowNum}
          </span>
          <div style={{ width: 1, height: 14, background: "rgba(197,162,111,0.18)" }} />
          <span style={{
            fontSize: "0.75rem", fontWeight: 600, color: P.text,
            letterSpacing: "0.02em",
          }}>
            {title}
          </span>
        </div>

        {/* Right: micro-labels */}
        <div className="ce-flow-header-right" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{
            fontSize: "0.56rem", fontWeight: 700, letterSpacing: "0.24em",
            textTransform: "uppercase", color: P.dim,
          }}>
            DOCTRINE CERTIFIED
          </span>
          <div style={{ width: 1, height: 10, background: P.dim, opacity: 0.3 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(197,162,111,0.60)", display: "inline-block", flexShrink: 0 }} />
            <span style={{
              fontSize: "0.56rem", fontWeight: 700, letterSpacing: "0.22em",
              textTransform: "uppercase", color: "rgba(197,162,111,0.70)",
            }}>
              ACTIVE
            </span>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="ce-flow-steps" style={{ display: "flex", alignItems: "stretch", padding: "20px 20px 18px", gap: 0 }}>
        {steps.flatMap((step, i) => {
          const els: React.ReactNode[] = [<StepModule key={step.n} {...step} />];
          if (i < steps.length - 1) els.push(<StepConnector key={`c${i}`} />);
          return els;
        })}
      </div>

      {/* Footer strip */}
      <div style={{
        background: P.panelDeep,
        borderTop: `1px solid rgba(255,255,255,0.04)`,
        padding: "9px 22px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{
          fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.24em",
          textTransform: "uppercase", color: P.dim,
        }}>
          REVIEW SEQUENCE · CE PROTOCOL
        </span>
        <span style={{
          fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.18em",
          fontFamily: "monospace", color: P.dim,
        }}>
          04 STEPS
        </span>
      </div>
    </div>
  );
}

// ── Doctrine certification strip ──────────────────────────────────────────────
function DoctrineCertStrip({ animClass }: { animClass: string }) {
  return (
    <div className={`${animClass} ce-cert-strip-inner`} style={{
      borderTop:    `1px solid rgba(197,162,111,0.18)`,
      borderBottom: `1px solid rgba(255,255,255,0.05)`,
      background:   P.panelDeep,
      padding:      "14px 22px",
      display:      "flex", alignItems: "center", gap: 0,
      marginTop:    16,
    }}>
      {/* Mark + label */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <CitadelMark w={18} h={18} fill={P.gold} />
        <span style={{
          fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.26em",
          textTransform: "uppercase", color: P.gold,
        }}>
          DOCTRINE CERTIFIED
        </span>
      </div>

      {/* Separator */}
      <div style={{ width: 1, height: 16, background: "rgba(197,162,111,0.22)", margin: "0 18px", flexShrink: 0 }} />

      {/* Constraints */}
      <p className="ce-cert-strip-text" style={{ fontSize: "0.7rem", color: P.dim, margin: 0, lineHeight: 1.5, letterSpacing: "0.04em" }}>
        <span style={{ color: "rgba(197,162,111,0.55)" }}>·</span>{" "}
        Clarity over Noise
        {"  "}
        <span style={{ color: "rgba(197,162,111,0.40)" }}>·</span>
        {"  "}
        Structure over Chaos
        {"  "}
        <span style={{ color: "rgba(197,162,111,0.40)" }}>·</span>
        {"  "}
        Operator Sovereignty
        {"  "}
        <span style={{ color: "rgba(197,162,111,0.40)" }}>·</span>
        {"  "}
        Durability by Design
      </p>
    </div>
  );
}

// ── Flow data ─────────────────────────────────────────────────────────────────
const REVENUE_STEPS: StepData[] = [
  {
    n: "01", title: "Intake",
    body: "Pipeline snapshot, CRM export, or structured revenue workflow input.",
  },
  {
    n: "02", title: "Decay Detection",
    body: "Identify stale opportunities, weak follow-up, missing next steps, forecast pollution, and execution leakage.",
  },
  {
    n: "03", title: "Discipline Map",
    body: "Produce Drift Score, Revenue Leak Map, priority interventions, and forecast reliability warning.",
  },
  {
    n: "04", title: "Handoff",
    body: "Deliver audit output through Dr. E Connect with next-step routing and optional beta monitoring path.",
  },
];

const GRAVITY_STEPS: StepData[] = [
  {
    n: "01", title: "Intake",
    body: "System, workflow, automation, AI process, or operational structure is submitted for review.",
  },
  {
    n: "02", title: "Gravity Detection",
    body: "Identify hidden maintenance load, automation debt, governance gaps, ownership drift, and continuity risk.",
  },
  {
    n: "03", title: "Survivability Map",
    body: "Produce maintenance burden map, risk zones, rationalization priorities, and continuity recommendations.",
  },
  {
    n: "04", title: "Handoff",
    body: "Deliver audit output through Dr. E Connect with recommended action path and system follow-up.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
export default function WorkPage() {
  return (
    <>
      <style>{`
        html { scroll-behavior: smooth; }

        @keyframes ceReveal {
          from { opacity: 0; transform: translateY(16px); filter: blur(4px); }
          to   { opacity: 1; transform: translateY(0);    filter: blur(0);   }
        }

        .ce-hero-text   { opacity: 0; animation: ceReveal 800ms cubic-bezier(0.16,1,0.3,1)   0ms forwards; }
        .ce-hero-radar  { opacity: 0; animation: ceReveal 800ms cubic-bezier(0.16,1,0.3,1) 120ms forwards; }
        .ce-work-card-1 { opacity: 0; animation: ceReveal 800ms cubic-bezier(0.16,1,0.3,1) 280ms forwards; }
        .ce-work-card-2 { opacity: 0; animation: ceReveal 800ms cubic-bezier(0.16,1,0.3,1) 380ms forwards; }
        .ce-flow-hdr    { opacity: 0; animation: ceReveal 800ms cubic-bezier(0.16,1,0.3,1) 480ms forwards; }
        .ce-flow-1      { opacity: 0; animation: ceReveal 800ms cubic-bezier(0.16,1,0.3,1) 560ms forwards; }
        .ce-flow-2      { opacity: 0; animation: ceReveal 800ms cubic-bezier(0.16,1,0.3,1) 640ms forwards; }
        .ce-cert-strip  { opacity: 0; animation: ceReveal 800ms cubic-bezier(0.16,1,0.3,1) 720ms forwards; }

        /* System cards */
        .ce-work-card {
          transition: transform 260ms cubic-bezier(0.22,1,0.36,1), border-color 260ms ease, box-shadow 260ms ease;
        }
        .ce-work-card:hover {
          transform: translateY(-3px);
          border-top-color: rgba(197,162,111,0.58) !important;
          box-shadow: 0 20px 60px rgba(0,0,0,0.32), 0 0 0 1px rgba(197,162,111,0.10);
        }

        /* System card buttons */
        .ce-work-btn { transition: background 180ms ease, border-color 180ms ease, color 180ms ease, transform 180ms ease; }
        .ce-work-btn--ghost:hover    { border-color: rgba(255,255,255,0.20) !important; color: #E6EDF7 !important; transform: translateX(2px); }
        .ce-work-btn--doctrine:hover { background: rgba(197,162,111,0.16) !important; border-color: rgba(197,162,111,0.45) !important; transform: translateX(2px); }
        .ce-work-btn--primary:hover  { background: rgba(197,162,111,0.20) !important; border-color: rgba(197,162,111,0.70) !important; transform: translateX(2px); }

        /* Flow panels */
        .ce-flow-panel {
          transition: border-top-color 260ms ease, box-shadow 260ms ease;
        }
        .ce-flow-panel:hover {
          border-top-color: rgba(197,162,111,0.55) !important;
          box-shadow: 0 16px 48px rgba(0,0,0,0.28);
        }

        /* Step modules */
        .ce-step-module {
          transition: border-color 220ms ease, background 220ms ease;
        }
        .ce-step-module:hover {
          border-color: rgba(197,162,111,0.22) !important;
          background: rgba(4,12,22,0.95) !important;
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; }
          .ce-hero-text, .ce-hero-radar,
          .ce-work-card-1, .ce-work-card-2,
          .ce-flow-hdr, .ce-flow-1, .ce-flow-2, .ce-cert-strip {
            opacity: 1; transform: none; filter: none;
          }
        }

        /* ── Mobile responsive ── */
        @media (max-width: 768px) {
          /* Hero: stack, hide radar */
          .ce-work-hero-grid { grid-template-columns: 1fr !important; }
          .ce-work-hero-root { padding: 40px 20px 36px !important; }
          .ce-work-radar     { display: none !important; }

          /* System cards: single column */
          .ce-work-cards-wrap { padding: 36px 20px 0 !important; }
          .ce-work-cards-grid { grid-template-columns: 1fr !important; }

          /* Flow panels: stack steps vertically */
          .ce-flow-section   { padding: 40px 20px 60px !important; }
          .ce-flow-steps     { flex-direction: column !important; align-items: stretch !important; padding: 16px 14px 14px !important; gap: 0 !important; }
          .ce-flow-connector { display: none !important; }
          .ce-step-module    { min-width: 0 !important; margin-bottom: 8px; }
          .ce-flow-header    { flex-wrap: wrap !important; gap: 6px !important; padding: 10px 14px !important; }
          .ce-flow-header-right { display: none !important; }
          .ce-cert-strip-inner  { flex-wrap: wrap !important; gap: 8px !important; padding: 12px 16px !important; }
          .ce-cert-strip-text   { font-size: 0.65rem !important; }
        }

      `}</style>

      <div style={{
        minHeight: "100vh",
        background: `linear-gradient(180deg, #07111F 0%, ${P.bg} 25%, ${P.bgDeep} 100%)`,
        color: P.text,
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}>
        <CENav />

        {/* ══════════ HERO ══════════ */}
        <section style={{ borderBottom: `1px solid ${P.border}` }}>
          <div className="ce-work-hero-root ce-work-hero-grid" style={{
            maxWidth: 1280, margin: "0 auto", padding: "56px 48px 52px",
            display: "grid", gridTemplateColumns: "1fr 420px", gap: 48, alignItems: "center",
          }}>
            <div className="ce-hero-text">
              <p style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.38em", textTransform: "uppercase", color: P.gold, marginBottom: 22 }}>
                Cognitive Empire — Work
              </p>
              <h1 style={{
                fontSize: "clamp(3.2rem, 5.5vw, 5.8rem)",
                fontWeight: 200, letterSpacing: "-0.04em",
                color: P.text, lineHeight: 1.06, margin: "0 0 22px",
              }}>
                Operational<br />Survivability<br />Systems
              </h1>
              <div style={{ width: 36, height: 1, background: P.goldBorder, marginBottom: 22 }} />
              <p style={{ fontSize: "1.05rem", color: P.muted, lineHeight: 1.75, maxWidth: 460, margin: "0 0 16px" }}>
                CE designs and implements operational systems for organizations that cannot afford structural failure. These are not services, consulting engagements, or advisory arrangements.
              </p>
              <p style={{ fontSize: "0.92rem", color: P.dim, fontStyle: "italic", letterSpacing: "0.02em", margin: 0 }}>
                Systems, not services.
              </p>
            </div>
            <div className="ce-hero-radar ce-work-radar" style={{ position: "relative", height: 360 }}>
              <RadarGraphic />
            </div>
          </div>
        </section>

        {/* ══════════ SYSTEM CARDS ══════════ */}
        <section>
          <div className="ce-work-cards-wrap" style={{ maxWidth: 1280, margin: "0 auto", padding: "48px 48px 0" }}>
            <div className="ce-work-cards-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <SystemCard
                number="01"
                animClass="ce-work-card-1"
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={P.gold} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                }
                title="Revenue Discipline Audits"
                description="Identifies where revenue execution is decaying through stale opportunities, weak follow-up, missing next steps, poor pipeline hygiene, and unreliable forecasting."
                tags={["Pipeline Decay Detection", "Execution Discipline"]}
                flowHref="#revenue-discipline-flow"
                doctrineHref="/ce-research"
                auditHref="/connect?audit=revenue-discipline"
              />
              <SystemCard
                number="02"
                animClass="ce-work-card-2"
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={P.gold} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                }
                title="Maintenance Gravity Audit"
                description="Identifies where operational maintenance load, complexity, automation debt, governance gaps, and continuity risk are consuming disproportionate capacity relative to value output."
                tags={["System Survivability", "Operational Drag"]}
                flowHref="#maintenance-gravity-flow"
                doctrineHref="/ce-research"
                auditHref="/connect?audit=maintenance-gravity"
              />
            </div>
          </div>
        </section>

        {/* ══════════ OPERATIONAL REVIEW FLOW ══════════ */}
        <section className="ce-flow-section" style={{ maxWidth: 1280, margin: "0 auto", padding: "64px 48px 80px" }}>

          {/* Section header */}
          <div className="ce-flow-hdr" style={{ marginBottom: 36 }}>
            <p style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.38em", textTransform: "uppercase", color: P.gold, margin: "0 0 10px" }}>
              Operational Protocol
            </p>
            <h2 style={{
              fontSize: "clamp(1.8rem, 3vw, 2.5rem)", fontWeight: 300,
              color: P.text, margin: "0 0 12px", letterSpacing: "-0.03em", lineHeight: 1.1,
            }}>
              Operational Review Flow
            </h2>
            <p style={{ fontSize: "0.92rem", color: P.muted, lineHeight: 1.7, maxWidth: 500, margin: 0 }}>
              Each system follows a bounded review path: intake, diagnosis, doctrine check, output, and continuity handoff.
            </p>
          </div>

          {/* Panel 01 */}
          <div style={{ marginBottom: 16 }}>
            <FlowPanel
              id="revenue-discipline-flow"
              flowNum="01"
              title="Revenue Discipline Review Flow"
              steps={REVENUE_STEPS}
              animClass="ce-flow-1"
            />
          </div>

          {/* Panel 02 */}
          <FlowPanel
            id="maintenance-gravity-flow"
            flowNum="02"
            title="Maintenance Gravity Review Flow"
            steps={GRAVITY_STEPS}
            animClass="ce-flow-2"
          />

          {/* Doctrine certification strip */}
          <DoctrineCertStrip animClass="ce-cert-strip" />
        </section>

        <CEFooter />
      </div>
    </>
  );
}
