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
  panelHigh:  "#0D1726",
  border:     "rgba(255,255,255,0.07)",
  borderMid:  "rgba(255,255,255,0.10)",
  text:       "#E6EDF7",
  muted:      "#7A8BA6",
  dim:        "#4A5A70",
  gold:       "#C5A26F",
  goldSoft:   "rgba(197,162,111,0.09)",
  goldBorder: "rgba(197,162,111,0.32)",
  goldDim:    "rgba(197,162,111,0.16)",
} as const;

// ── Inline citadel mark ───────────────────────────────────────────────────────
function CitadelMark({ w, h, fill }: { w: number; h: number; fill: string }) {
  return (
    <svg width={w} height={h} viewBox="0 0 106 82" fill="none" aria-hidden="true">
      <path
        fill={fill} fillRule="evenodd"
        d="M2,56 h12 v16 h-12 Z M17,44 h12 v28 h-12 Z M32,32 h12 v40 h-12 Z
           M47,18 h12 v54 h-12 Z M62,32 h12 v40 h-12 Z M77,44 h12 v28 h-12 Z
           M92,56 h12 v16 h-12 Z M2,72 h102 v6 h-102 Z
           M49,72 L49,54 C49,43 51,41 53,41 C55,41 57,43 57,54 L57,72 Z"
      />
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
      {/* Concentric rings */}
      {[180, 140, 100, 60, 24].map((r, i) => (
        <circle key={r} cx="210" cy="210" r={r} stroke={i === 0 ? gold8 : i < 3 ? dim6 : gold14} strokeWidth={i === 2 ? 0.5 : 1} />
      ))}
      {/* Radial spokes */}
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i * 30 * Math.PI) / 180;
        return (
          <line
            key={i}
            x1={210 + Math.cos(angle) * 24}
            y1={210 + Math.sin(angle) * 24}
            x2={210 + Math.cos(angle) * 180}
            y2={210 + Math.sin(angle) * 180}
            stroke={gold8}
            strokeWidth="0.75"
          />
        );
      })}
      {/* Corner bracket marks at cardinal positions */}
      {[[210, 30], [380, 210], [210, 390], [40, 210]].map(([cx, cy], i) => (
        <g key={i} transform={`translate(${cx},${cy}) rotate(${i * 90})`}>
          <line x1="-6" y1="0" x2="6" y2="0" stroke={gold22} strokeWidth="1.5" />
          <line x1="0" y1="-6" x2="0" y2="6" stroke={gold22} strokeWidth="1.5" />
        </g>
      ))}
      {/* Data dots */}
      <circle cx="280" cy="150" r="2.5" fill={gold22} />
      <circle cx="145" cy="250" r="2"   fill={gold14} />
      <circle cx="310" cy="280" r="1.5" fill={gold8}  />
      <circle cx="170" cy="130" r="2"   fill={gold14} />
      {/* Scan arc (static decorative) */}
      <path
        d={`M210,210 L210,30 A180,180 0 0,1 ${210 + 180 * Math.sin((60 * Math.PI) / 180)},${210 - 180 * Math.cos((60 * Math.PI) / 180)} Z`}
        fill="rgba(197,162,111,0.025)"
        stroke="none"
      />
      {/* Cross-hair at center */}
      <circle cx="210" cy="210" r="3"   fill="none" stroke={gold22} strokeWidth="1" />
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
        background:   P.panel,
        border:       `1px solid ${P.borderMid}`,
        borderTop:    `2px solid ${P.goldBorder}`,
        padding:      "28px 26px 24px",
        display:      "flex",
        flexDirection:"column",
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
        <span style={{
          fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.28em",
          fontFamily: "monospace", color: P.gold,
        }}>
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

      {/* Title */}
      <h2 style={{
        fontSize: "clamp(1.25rem, 1.8vw, 1.5rem)", fontWeight: 700,
        color: P.text, margin: "0 0 12px", letterSpacing: "-0.02em", lineHeight: 1.15,
      }}>
        {title}
      </h2>

      {/* Description */}
      <p style={{ fontSize: "0.92rem", color: P.muted, lineHeight: 1.7, margin: "0 0 20px", flex: 1 }}>
        {description}
      </p>

      {/* Tags */}
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

      {/* Divider */}
      <div style={{ height: 1, background: P.border, marginBottom: 18 }} />

      {/* Buttons */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <a href={flowHref} className="ce-work-btn ce-work-btn--ghost" style={{
          fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.14em",
          textTransform: "uppercase", color: P.muted,
          border: `1px solid ${P.border}`,
          background: "transparent",
          padding: "7px 14px", borderRadius: 2,
          textDecoration: "none", display: "inline-flex", alignItems: "center",
        }}>
          Review Flow →
        </a>
        <a href={doctrineHref} className="ce-work-btn ce-work-btn--doctrine" style={{
          fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.14em",
          textTransform: "uppercase", color: P.gold,
          border: `1px solid ${P.goldDim}`,
          background: P.goldSoft,
          padding: "7px 14px", borderRadius: 2,
          textDecoration: "none", display: "inline-flex", alignItems: "center",
        }}>
          Doctrine Certified →
        </a>
        <a href={auditHref} className="ce-work-btn ce-work-btn--primary" style={{
          fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.14em",
          textTransform: "uppercase", color: P.text,
          border: `1px solid rgba(197,162,111,0.50)`,
          background: "rgba(197,162,111,0.12)",
          padding: "7px 14px", borderRadius: 2,
          textDecoration: "none", display: "inline-flex", alignItems: "center",
        }}>
          Request Audit →
        </a>
      </div>
    </div>
  );
}

// ── Flow step ─────────────────────────────────────────────────────────────────
function FlowStep({ n, title, body, last }: { n: string; title: string; body: string; last?: boolean }) {
  return (
    <div style={{ display: "flex", gap: 0, flex: 1 }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
          <span style={{
            fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.12em",
            fontFamily: "monospace", color: P.gold,
            border: `1px solid ${P.goldDim}`, background: P.goldSoft,
            padding: "2px 7px", borderRadius: 2, flexShrink: 0, marginTop: 1,
          }}>
            {n}
          </span>
          <p style={{ fontSize: "0.85rem", fontWeight: 700, color: P.text, margin: 0, lineHeight: 1.3 }}>
            {title}
          </p>
        </div>
        <p style={{ fontSize: "0.82rem", color: P.muted, lineHeight: 1.65, margin: 0 }}>
          {body}
        </p>
      </div>
      {!last && (
        <div style={{
          width: 28, flexShrink: 0, display: "flex", alignItems: "flex-start",
          paddingTop: 7, justifyContent: "center",
        }}>
          <svg width="16" height="8" viewBox="0 0 16 8" fill="none" aria-hidden="true">
            <path d="M0 4H13M10 1L14 4L10 7" stroke="rgba(197,162,111,0.35)" strokeWidth="1" strokeLinecap="round"/>
          </svg>
        </div>
      )}
    </div>
  );
}

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

        .ce-hero-text  { opacity: 0; animation: ceReveal 800ms cubic-bezier(0.16,1,0.3,1)   0ms forwards; }
        .ce-hero-radar { opacity: 0; animation: ceReveal 800ms cubic-bezier(0.16,1,0.3,1) 120ms forwards; }
        .ce-work-card-1{ opacity: 0; animation: ceReveal 800ms cubic-bezier(0.16,1,0.3,1) 280ms forwards; }
        .ce-work-card-2{ opacity: 0; animation: ceReveal 800ms cubic-bezier(0.16,1,0.3,1) 380ms forwards; }
        .ce-doctrine-note { opacity: 0; animation: ceReveal 800ms cubic-bezier(0.16,1,0.3,1) 440ms forwards; }
        .ce-flow-1     { opacity: 0; animation: ceReveal 800ms cubic-bezier(0.16,1,0.3,1) 520ms forwards; }
        .ce-flow-2     { opacity: 0; animation: ceReveal 800ms cubic-bezier(0.16,1,0.3,1) 600ms forwards; }

        .ce-work-card {
          transition: transform 260ms cubic-bezier(0.22,1,0.36,1), border-color 260ms ease, box-shadow 260ms ease;
        }
        .ce-work-card:hover {
          transform: translateY(-3px);
          border-top-color: rgba(197,162,111,0.58) !important;
          box-shadow: 0 20px 60px rgba(0,0,0,0.32), 0 0 0 1px rgba(197,162,111,0.10);
        }

        .ce-work-btn { transition: background 180ms ease, border-color 180ms ease, color 180ms ease, transform 180ms ease; }
        .ce-work-btn--ghost:hover  { border-color: rgba(255,255,255,0.20) !important; color: #E6EDF7 !important; transform: translateX(2px); }
        .ce-work-btn--doctrine:hover { background: rgba(197,162,111,0.16) !important; border-color: rgba(197,162,111,0.45) !important; transform: translateX(2px); }
        .ce-work-btn--primary:hover  { background: rgba(197,162,111,0.20) !important; border-color: rgba(197,162,111,0.70) !important; transform: translateX(2px); }

        .ce-flow-card {
          transition: border-color 240ms ease;
        }
        .ce-flow-card:hover { border-color: rgba(197,162,111,0.20) !important; }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; }
          .ce-hero-text, .ce-hero-radar,
          .ce-work-card-1, .ce-work-card-2,
          .ce-doctrine-note, .ce-flow-1, .ce-flow-2 { opacity: 1; transform: none; filter: none; }
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
          <div style={{
            maxWidth: 1280, margin: "0 auto", padding: "56px 48px 52px",
            display: "grid", gridTemplateColumns: "1fr 420px", gap: 48, alignItems: "center",
          }}>
            {/* Left */}
            <div className="ce-hero-text">
              <p style={{
                fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.38em",
                textTransform: "uppercase", color: P.gold, marginBottom: 22,
              }}>
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

            {/* Right: Radar */}
            <div className="ce-hero-radar" style={{ position: "relative", height: 360 }}>
              <RadarGraphic />
            </div>
          </div>
        </section>

        {/* ══════════ SYSTEM CARDS ══════════ */}
        <section>
          <div style={{ maxWidth: 1280, margin: "0 auto", padding: "48px 48px 0" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
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
                doctrineHref="/briefs"
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
                doctrineHref="/briefs"
                auditHref="/connect?audit=maintenance-gravity"
              />
            </div>
          </div>
        </section>

        {/* ══════════ DOCTRINE CERTIFIED NOTE ══════════ */}
        <div className="ce-doctrine-note" style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 48px 0" }}>
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 12,
            border: `1px solid ${P.goldDim}`, background: P.goldSoft,
            padding: "14px 18px", borderRadius: 3,
          }}>
            <CitadelMark w={18} h={14} fill={P.gold} />
            <p style={{ fontSize: "0.78rem", color: P.muted, margin: 0, lineHeight: 1.65 }}>
              <span style={{ color: P.gold, fontWeight: 700 }}>Doctrine Certified</span> means the system follows CE operational and visual doctrine constraints:{" "}
              <span style={{ color: P.text }}>clarity over noise, structure over chaos, operator sovereignty, and durability by design.</span>
            </p>
          </div>
        </div>

        {/* ══════════ OPERATIONAL REVIEW FLOW ══════════ */}
        <section style={{ maxWidth: 1280, margin: "0 auto", padding: "60px 48px 72px" }}>
          {/* Section header */}
          <div style={{ marginBottom: 40 }}>
            <p style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.36em", textTransform: "uppercase", color: P.gold, margin: "0 0 10px" }}>
              Operational Protocol
            </p>
            <h2 style={{
              fontSize: "clamp(1.8rem, 3vw, 2.6rem)", fontWeight: 300,
              color: P.text, margin: "0 0 12px", letterSpacing: "-0.03em", lineHeight: 1.1,
            }}>
              Operational Review Flow
            </h2>
            <p style={{ fontSize: "0.95rem", color: P.muted, lineHeight: 1.7, maxWidth: 520, margin: 0 }}>
              Each system follows a bounded review path: intake, diagnosis, doctrine check, output, and continuity handoff.
            </p>
          </div>

          {/* Flow 01 */}
          <div id="revenue-discipline-flow" className="ce-flow-1 ce-flow-card" style={{
            border:      `1px solid ${P.border}`,
            borderLeft:  `2px solid ${P.goldBorder}`,
            background:  P.panel,
            padding:     "26px 28px 24px",
            marginBottom: 16,
            borderRadius: 2,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
              <span style={{ fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.16em", fontFamily: "monospace", color: P.gold }}>
                FLOW 01
              </span>
              <div style={{ height: 1, flex: 1, background: P.border }} />
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: P.text, letterSpacing: "0.04em" }}>
                Revenue Discipline Review Flow
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr auto 1fr auto 1fr", gap: 0, alignItems: "flex-start" }}>
              <FlowStep
                n="01" title="Intake"
                body="Pipeline snapshot, CRM export, or structured revenue workflow input."
              />
              <FlowStep
                n="02" title="Decay Detection"
                body="Identify stale opportunities, weak follow-up, missing next steps, forecast pollution, and execution leakage."
              />
              <FlowStep
                n="03" title="Discipline Map"
                body="Produce Drift Score, Revenue Leak Map, priority interventions, and forecast reliability warning."
              />
              <FlowStep
                n="04" title="Handoff"
                body="Deliver audit output through Dr. E Connect with next-step routing and optional beta monitoring path."
                last
              />
            </div>
          </div>

          {/* Flow 02 */}
          <div id="maintenance-gravity-flow" className="ce-flow-2 ce-flow-card" style={{
            border:      `1px solid ${P.border}`,
            borderLeft:  `2px solid ${P.goldBorder}`,
            background:  P.panel,
            padding:     "26px 28px 24px",
            borderRadius: 2,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
              <span style={{ fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.16em", fontFamily: "monospace", color: P.gold }}>
                FLOW 02
              </span>
              <div style={{ height: 1, flex: 1, background: P.border }} />
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: P.text, letterSpacing: "0.04em" }}>
                Maintenance Gravity Review Flow
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr auto 1fr auto 1fr", gap: 0, alignItems: "flex-start" }}>
              <FlowStep
                n="01" title="Intake"
                body="System, workflow, automation, AI process, or operational structure is submitted for review."
              />
              <FlowStep
                n="02" title="Gravity Detection"
                body="Identify hidden maintenance load, automation debt, governance gaps, ownership drift, and continuity risk."
              />
              <FlowStep
                n="03" title="Survivability Map"
                body="Produce maintenance burden map, risk zones, rationalization priorities, and continuity recommendations."
              />
              <FlowStep
                n="04" title="Handoff"
                body="Deliver audit output through Dr. E Connect with recommended action path and system follow-up."
                last
              />
            </div>
          </div>
        </section>

        <CEFooter />
      </div>
    </>
  );
}
