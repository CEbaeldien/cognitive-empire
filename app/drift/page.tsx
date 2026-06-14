import Link from "next/link";

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:       "#05080F",
  panel:    "#0C1220",
  panel2:   "#0F1729",
  border:   "#1E2A45",
  text:     "#EEF3FA",
  muted:    "#7A8DA6",
  faint:    "#2A3A55",
  gold:     "#C9A961",
  goldDim:  "rgba(201,169,97,0.28)",
  goldBg:   "rgba(201,169,97,0.07)",
  critical: "#ef4444",
  decaying: "#f97316",
  watch:    "#eab308",
} as const;

// ── Data ──────────────────────────────────────────────────────────────────────
const MOCK_ROWS = [
  {
    account:    "Meridian Health Systems",
    deal:       "Enterprise License Agreement",
    stage:      "Negotiation",
    riskLabel:  "High-Risk",
    exposure:   "$204,000",
    pct:        "32.4%",
    badge:      "CRITICAL",
    color:      C.critical,
    reasons:    ["No meaningful activity for 14+ days", "No next action defined", "High-value opportunity stalling"],
    action:     "Define next action immediately and assign a due date.",
  },
  {
    account:    "Veritas Capital Partners",
    deal:       "VCF – Phase 2 Expansion",
    stage:      "Proposal",
    riskLabel:  "At Risk",
    exposure:   "$105,750",
    pct:        "16.8%",
    badge:      "DECAYING",
    color:      C.decaying,
    reasons:    ["Close date slipped 3 weeks", "No activity in 12 days", "Next step not defined"],
    action:     "Re-establish timeline and confirm stakeholder engagement.",
  },
  {
    account:    "Northwind Industries",
    deal:       "Platform Renewal",
    stage:      "Qualify",
    riskLabel:  "Watch",
    exposure:   "$48,000",
    pct:        "7.6%",
    badge:      "WATCH",
    color:      C.watch,
    reasons:    ["No activity in 9 days", "Stakeholder engagement is low"],
    action:     "Schedule follow-up with decision maker.",
  },
];

const STEPS = [
  { n: "01", title: "Snapshot",            desc: "Import your pipeline via CSV. No CRM integration required." },
  { n: "02", title: "Decay Detection",     desc: "Drift scores every opportunity deterministically using time and engagement signals." },
  { n: "03", title: "Intervention Queue",  desc: "Prioritized actions surface automatically, ranked by exposure and urgency." },
  { n: "04", title: "Evidence Recording",  desc: "Log what you did, when, and what the outcome was. Every action is timestamped." },
  { n: "05", title: "Weekly Reality",      desc: "Client-ready report generated automatically. No assembly required." },
  { n: "06", title: "Next Snapshot",       desc: "Repeat. Decay never stops. Neither does your visibility." },
];

const PLANS = [
  {
    name:      "Operator",
    price:     "$149",
    period:    "/mo",
    tagline:   "For individual fractional CROs managing a small book.",
    features:  ["1–4 clients", "Full decay detection", "Intervention queue", "Evidence tracking", "Weekly reports", "CSV import"],
    cta:       "Start Operator Trial",
    ctaHref:   "/auth/signup?tier=operator",
    note:      "14 days free",
    highlight: false,
  },
  {
    name:      "Pro",
    price:     "$249",
    period:    "/mo",
    tagline:   "For operators running multiple client engagements.",
    features:  ["5–15 clients", "Everything in Operator", "Priority support", "Multi-client view"],
    cta:       "Start Pro Trial",
    ctaHref:   "/auth/signup?tier=pro",
    note:      "14 days free",
    highlight: true,
  },
  {
    name:      "Agency",
    price:     "$499",
    period:    "/mo",
    tagline:   "For RevOps agencies running large client portfolios.",
    features:  ["Unlimited clients", "Team access", "Agency-level reporting", "Dedicated onboarding"],
    cta:       "Request Agency Access",
    ctaHref:   "mailto:founder@cognitiveempire.com",
    note:      "Custom setup included",
    highlight: false,
  },
];

// ── CE Mark (locked monogram) ─────────────────────────────────────────────────
function CEMark({ w = 24, h = 24, fill = "#EEF3FA" }: { w?: number; h?: number; fill?: string }) {
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

// ── Inline sidebar icons ──────────────────────────────────────────────────────
function IconGrid({ color }: { color: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="6" height="6" rx="1" stroke={color} strokeWidth="1.4"/>
      <rect x="9" y="1" width="6" height="6" rx="1" stroke={color} strokeWidth="1.4"/>
      <rect x="1" y="9" width="6" height="6" rx="1" stroke={color} strokeWidth="1.4"/>
      <rect x="9" y="9" width="6" height="6" rx="1" stroke={color} strokeWidth="1.4"/>
    </svg>
  );
}
function IconList({ color }: { color: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <line x1="4" y1="4"  x2="14" y2="4"  stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="4" y1="8"  x2="14" y2="8"  stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="4" y1="12" x2="14" y2="12" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
      <circle cx="2" cy="4"  r="1" fill={color}/>
      <circle cx="2" cy="8"  r="1" fill={color}/>
      <circle cx="2" cy="12" r="1" fill={color}/>
    </svg>
  );
}
function IconBar({ color }: { color: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1"  y="8"  width="3" height="7" rx="1" fill={color}/>
      <rect x="6"  y="5"  width="3" height="10" rx="1" fill={color}/>
      <rect x="11" y="2"  width="3" height="13" rx="1" fill={color}/>
    </svg>
  );
}
function IconGear({ color }: { color: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
    </svg>
  );
}

// ── Dashboard preview (hero right column) ─────────────────────────────────────
function DashboardPreview() {
  return (
    <div style={{
      borderRadius: 12,
      border: `1px solid ${C.border}`,
      background: C.panel,
      overflow: "hidden",
      boxShadow: "0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(201,169,97,0.06)",
    }}>
      {/* Browser chrome */}
      <div style={{
        background: "#08090F",
        borderBottom: `1px solid ${C.border}`,
        padding: "9px 14px",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <div style={{ display: "flex", gap: 5 }}>
          {["#3A3A4A", "#3A3A4A", "#3A3A4A"].map((c, i) => (
            <span key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />
          ))}
        </div>
        <div style={{ flex: 1, textAlign: "center", fontSize: 10, color: C.faint, letterSpacing: "0.04em" }}>
          drift.cognitiveempire.com
        </div>
      </div>

      {/* App shell */}
      <div style={{ display: "flex", height: 320 }}>

        {/* Sidebar */}
        <div style={{
          width: 44, flexShrink: 0,
          borderRight: `1px solid ${C.border}`,
          background: "#07090E",
          display: "flex", flexDirection: "column", alignItems: "center",
          paddingTop: 14, gap: 14,
        }}>
          <CEMark w={18} h={18} fill={C.gold} />
          <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { icon: <IconGrid color={C.gold} />,  active: true  },
              { icon: <IconList color={C.faint} />, active: false },
              { icon: <IconBar  color={C.faint} />, active: false },
              { icon: <IconGear color={C.faint} />, active: false },
            ].map(({ icon, active }, i) => (
              <div key={i} style={{
                width: 30, height: 30,
                display: "flex", alignItems: "center", justifyContent: "center",
                borderRadius: 5,
                background: active ? C.goldBg : "transparent",
                border: active ? `1px solid ${C.goldDim}` : "1px solid transparent",
              }}>
                {icon}
              </div>
            ))}
          </div>
        </div>

        {/* Main */}
        <div style={{ flex: 1, padding: "14px 16px", overflowY: "hidden" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.28em", color: C.muted, textTransform: "uppercase", margin: "0 0 3px" }}>Drift</p>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: 0 }}>Intervention Queue</p>
            </div>
            <span style={{
              fontSize: 9, fontWeight: 600, color: C.gold,
              padding: "2px 9px", borderRadius: 20,
              border: `1px solid ${C.goldDim}`, background: C.goldBg,
            }}>Live</span>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
            <div style={{ padding: "9px 10px", borderRadius: 5, border: `1px solid ${C.border}`, background: "#07090E" }}>
              <p style={{ fontSize: 7, color: C.muted, margin: "0 0 3px", letterSpacing: "0.1em", textTransform: "uppercase" }}>At Risk Revenue</p>
              <p style={{ fontSize: 13, fontWeight: 800, color: C.text, margin: 0, letterSpacing: "-0.02em" }}>$357,750</p>
            </div>
            {[
              { label: "Critical", n: "3",  color: C.critical },
              { label: "Decaying", n: "6",  color: C.decaying },
              { label: "Watch",    n: "11", color: C.watch    },
            ].map(s => (
              <div key={s.label} style={{ padding: "9px 10px", borderRadius: 5, border: `1px solid ${C.border}`, background: "#07090E" }}>
                <p style={{ fontSize: 7, color: s.color, margin: "0 0 3px", letterSpacing: "0.1em", textTransform: "uppercase" }}>{s.label}</p>
                <p style={{ fontSize: 15, fontWeight: 800, color: s.color, margin: 0 }}>{s.n}</p>
              </div>
            ))}
          </div>

          {/* Mini table */}
          <div style={{ borderRadius: 5, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            <div style={{
              display: "grid", gridTemplateColumns: "1.5fr 0.7fr 0.65fr 0.65fr",
              background: "#07090E", borderBottom: `1px solid ${C.border}`,
              padding: "6px 10px",
            }}>
              {["OPPORTUNITY", "STAGE", "EXPOSURE", "STATUS"].map(h => (
                <span key={h} style={{ fontSize: 7, fontWeight: 700, letterSpacing: "0.22em", color: C.muted, textTransform: "uppercase" }}>{h}</span>
              ))}
            </div>
            {MOCK_ROWS.map((row, i) => (
              <div key={row.account} style={{
                display: "grid", gridTemplateColumns: "1.5fr 0.7fr 0.65fr 0.65fr",
                alignItems: "center",
                borderLeft: `2px solid ${row.color}`,
                borderTop: i > 0 ? `1px solid ${C.border}` : "none",
                background: i % 2 === 0 ? "#08090F" : "#090D1A",
                padding: "7px 10px",
              }}>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 600, color: C.text, margin: "0 0 1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.account}</p>
                  <p style={{ fontSize: 9, color: C.muted, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.deal}</p>
                </div>
                <p style={{ fontSize: 9, color: C.muted, margin: 0 }}>{row.stage}</p>
                <p style={{ fontSize: 10, fontWeight: 600, color: row.color, margin: 0 }}>{row.exposure}</p>
                <span style={{
                  fontSize: 7, fontWeight: 700, letterSpacing: "0.1em",
                  padding: "2px 5px", borderRadius: 3,
                  color: row.color, border: `1px solid ${row.color}`,
                  background: `${row.color}18`,
                  display: "inline-block",
                }}>
                  {row.badge}
                </span>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function DriftMarketingPage() {
  return (
    <>
      <style>{`
        html { scroll-behavior: smooth; }
        *, *::before, *::after { box-sizing: border-box; }
        .d-cta-gold:hover   { opacity: 0.88; }
        .d-cta-ghost:hover  { border-color: rgba(201,169,97,0.4); color: #EEF3FA; }
        .d-nav-link:hover   { color: #EEF3FA !important; }
        .d-step:hover       { border-color: rgba(201,169,97,0.28) !important; }
        .d-plan:hover       { transform: translateY(-3px); }
        .d-footer-link:hover { color: #7A8DA6 !important; }
      `}</style>

      <div style={{ background: C.bg, color: C.text, fontFamily: "system-ui, -apple-system, sans-serif", minHeight: "100vh" }}>

        {/* ══════════ NAV ══════════ */}
        <nav style={{
          position: "sticky", top: 0, zIndex: 50,
          background: "rgba(5,8,15,0.96)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: `1px solid ${C.border}`,
          display: "flex", alignItems: "center",
          padding: "0 40px", height: 56, gap: 0,
        }}>
          {/* Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <CEMark />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: C.muted }}>Cognitive Empire</span>
            <span style={{ width: 1, height: 16, background: C.border, flexShrink: 0 }} />
            <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "0.06em", color: C.text }}>DRIFT</span>
          </div>

          {/* Center nav */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 28 }}>
            {[
              { label: "Overview",    href: "#" },
              { label: "How It Works", href: "#how-it-works" },
              { label: "Pricing",     href: "#pricing" },
              { label: "For Agencies", href: "#pricing" },
              { label: "Resources",   href: "#" },
            ].map(({ label, href }) => (
              <a key={label} href={href} className="d-nav-link" style={{
                fontSize: 13, color: C.muted, textDecoration: "none",
                transition: "color 150ms",
              }}>
                {label}
              </a>
            ))}
          </div>

          {/* Right */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
            <Link href="/auth/signin" className="d-nav-link" style={{ fontSize: 13, color: C.muted, textDecoration: "none", transition: "color 150ms" }}>
              Sign In
            </Link>
            <Link href="/auth/signup?tier=pro" style={{
              fontSize: 13, fontWeight: 600, color: "#08090F",
              padding: "7px 18px", borderRadius: 6,
              background: C.gold, textDecoration: "none",
              letterSpacing: "0.02em",
            }}>
              Start Pro Trial
            </Link>
          </div>
        </nav>

        {/* ══════════ HERO ══════════ */}
        <section style={{ maxWidth: 1200, margin: "0 auto", padding: "100px 40px 80px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 72, alignItems: "center" }}>

            {/* Left */}
            <div>
              <p style={{
                fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                letterSpacing: "0.32em", color: C.gold, marginBottom: 26,
              }}>
                Revenue Triage Software
              </p>

              <h1 style={{
                fontSize: "clamp(2.5rem, 4vw, 3.75rem)",
                fontWeight: 900, lineHeight: 1.07, letterSpacing: "-0.03em",
                color: C.text, margin: "0 0 26px",
              }}>
                Most revenue dies<br />
                from{" "}
                <span style={{ color: C.gold }}>neglect</span>
                , not<br />
                bad deals.
              </h1>

              <p style={{
                fontSize: 16, lineHeight: 1.75, color: C.muted,
                maxWidth: 500, margin: "0 0 44px",
              }}>
                Drift turns stale CRM data into operational pressure. It detects decay, ranks risk, and forces proof of execution — so neglected revenue doesn't disappear quietly.
              </p>

              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <Link href="/auth/signup?tier=pro" className="d-cta-gold" style={{
                  fontSize: 15, fontWeight: 700, color: "#08090F",
                  padding: "13px 28px", borderRadius: 6,
                  background: C.gold, textDecoration: "none",
                  transition: "opacity 150ms", letterSpacing: "0.01em",
                }}>
                  Start Pro Trial
                </Link>
                <a href="#pricing" className="d-cta-ghost" style={{
                  fontSize: 15, fontWeight: 600, color: C.muted,
                  padding: "13px 28px", borderRadius: 6,
                  border: `1px solid ${C.border}`,
                  textDecoration: "none",
                  transition: "border-color 150ms, color 150ms",
                }}>
                  View Pricing
                </a>
              </div>

              <p style={{ fontSize: 13, color: C.faint }}>14 days free. No credit card required.</p>
            </div>

            {/* Right: dashboard preview */}
            <div>
              <DashboardPreview />
            </div>
          </div>
        </section>

        {/* ══════════ LIVE INTERVENTION QUEUE ══════════ */}
        <section style={{ borderTop: `1px solid ${C.border}`, padding: "72px 40px" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>

            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 32 }}>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.32em", color: C.gold, margin: "0 0 10px" }}>
                  Live Intervention Queue
                </p>
                <p style={{ fontSize: 15, color: C.muted, margin: 0 }}>
                  Drift surfaces your most at-risk revenue so operators act before it&apos;s too late.
                </p>
              </div>
              <a href="#" style={{ fontSize: 13, color: C.gold, textDecoration: "none", whiteSpace: "nowrap", paddingBottom: 2 }}>
                View all interventions →
              </a>
            </div>

            <div style={{ borderRadius: 10, border: `1px solid ${C.border}`, overflow: "hidden" }}>
              {/* Header row */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "2fr 0.7fr 0.85fr 1.6fr 1.9fr 0.8fr",
                background: C.panel2, borderBottom: `1px solid ${C.border}`,
                padding: "10px 0",
              }}>
                {["OPPORTUNITY", "STAGE", "EXPOSURE", "DECAY REASONS", "REQUIRED INTERVENTION", "URGENCY"].map(h => (
                  <div key={h} style={{ padding: "0 16px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.25em", color: C.muted }}>
                    {h}
                  </div>
                ))}
              </div>

              {MOCK_ROWS.map((row, idx) => (
                <div key={row.account} style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 0.7fr 0.85fr 1.6fr 1.9fr 0.8fr",
                  alignItems: "start",
                  borderLeft: `2.5px solid ${row.color}`,
                  borderTop: idx > 0 ? `1px solid rgba(30,42,69,0.7)` : "none",
                  background: idx % 2 === 0 ? "#07090F" : "#090D1A",
                }}>
                  <div style={{ padding: "20px 16px" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{row.account}</div>
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>{row.deal}</div>
                  </div>
                  <div style={{ padding: "20px 16px" }}>
                    <div style={{ fontSize: 13, color: C.muted }}>{row.stage}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, marginTop: 4, color: row.color }}>{row.riskLabel}</div>
                  </div>
                  <div style={{ padding: "20px 16px" }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: row.color }}>{row.exposure}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{row.pct}</div>
                  </div>
                  <div style={{ padding: "20px 16px" }}>
                    <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                      {row.reasons.map(r => (
                        <li key={r} style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 12, color: C.muted, marginBottom: 5 }}>
                          <span style={{ width: 3, height: 3, borderRadius: "50%", background: C.faint, flexShrink: 0, marginTop: 5 }} />
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div style={{ padding: "20px 16px" }}>
                    <div style={{ fontSize: 13, color: "#CBD5E1", lineHeight: 1.55 }}>{row.action}</div>
                  </div>
                  <div style={{ padding: "20px 16px" }}>
                    <span style={{
                      display: "inline-block",
                      padding: "4px 12px", borderRadius: 4,
                      border: `1px solid ${row.color}`,
                      color: row.color,
                      fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
                      background: `${row.color}12`,
                    }}>
                      {row.badge}
                    </span>
                  </div>
                </div>
              ))}

              <div style={{ background: C.panel2, borderTop: `1px solid ${C.border}`, padding: "8px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: C.muted }}>Showing 3 of 3 interventions</span>
                <span style={{ fontSize: 11, color: C.gold }}>View all interventions →</span>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════ PROBLEM ══════════ */}
        <section style={{ borderTop: `1px solid ${C.border}`, padding: "96px 40px" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.32em", color: C.gold, marginBottom: 20 }}>
              The Problem
            </p>
            <h2 style={{ fontSize: "clamp(1.8rem, 3vw, 2.75rem)", fontWeight: 800, letterSpacing: "-0.025em", color: C.text, maxWidth: 680, margin: "0 0 60px", lineHeight: 1.2 }}>
              Your CRM stores opportunities. Drift shows which ones are dying.
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
              {[
                {
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.critical} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0119 12.55"/><path d="M5 12.55a10.94 10.94 0 015.17-2.39"/><path d="M10.71 5.05A16 16 0 0122.56 9"/><path d="M1.42 9a15.91 15.91 0 014.7-2.88"/><path d="M8.53 16.11a6 6 0 016.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>
                    </svg>
                  ),
                  title: "No activity signal",
                  desc:  "You don't know which deals have gone silent until it's too late.",
                },
                {
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.decaying} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                    </svg>
                  ),
                  title: "No intervention priority",
                  desc:  "Everything looks urgent. Nothing gets actioned.",
                },
                {
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.watch} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
                    </svg>
                  ),
                  title: "No execution proof",
                  desc:  "You can't show clients what you did or why it worked.",
                },
              ].map(item => (
                <div key={item.title} style={{
                  padding: "32px 28px 36px", borderRadius: 8,
                  border: `1px solid ${C.border}`, background: C.panel,
                }}>
                  <div style={{ marginBottom: 18 }}>{item.icon}</div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 10 }}>{item.title}</h3>
                  <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.65, margin: 0 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════ CORE LOOP ══════════ */}
        <section id="how-it-works" style={{ borderTop: `1px solid ${C.border}`, padding: "96px 40px" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.32em", color: C.gold, marginBottom: 20 }}>
              The Core Loop
            </p>
            <h2 style={{ fontSize: "clamp(1.8rem, 3vw, 2.75rem)", fontWeight: 800, letterSpacing: "-0.025em", color: C.text, margin: "0 0 60px", lineHeight: 1.2 }}>
              Six steps from pipeline import to revenue protection.
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              {STEPS.map(step => (
                <div key={step.n} className="d-step" style={{
                  display: "flex", gap: 18,
                  padding: "26px 22px", borderRadius: 8,
                  border: `1px solid ${C.border}`, background: C.panel,
                  transition: "border-color 200ms",
                }}>
                  <div style={{
                    fontSize: 24, fontWeight: 900, color: C.goldDim,
                    lineHeight: 1, flexShrink: 0, width: 32, letterSpacing: "-0.03em",
                  }}>
                    {step.n}
                  </div>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 7 }}>{step.title}</h3>
                    <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.65, margin: 0 }}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════ PRICING ══════════ */}
        <section id="pricing" style={{ borderTop: `1px solid ${C.border}`, padding: "96px 40px" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.32em", color: C.gold, marginBottom: 20 }}>
              Pricing
            </p>
            <h2 style={{ fontSize: "clamp(1.8rem, 3vw, 2.75rem)", fontWeight: 800, letterSpacing: "-0.025em", color: C.text, margin: "0 0 60px", lineHeight: 1.2 }}>
              Most serious operators start with Pro.
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, alignItems: "stretch" }}>
              {PLANS.map(plan => (
                <div key={plan.name} className="d-plan" style={{
                  borderRadius: 10,
                  border: plan.highlight ? `1px solid ${C.goldDim}` : `1px solid ${C.border}`,
                  background: plan.highlight ? "#0D1525" : C.panel,
                  padding: "36px 28px",
                  position: "relative",
                  boxShadow: plan.highlight ? `0 0 60px rgba(201,169,97,0.06)` : "none",
                  display: "flex", flexDirection: "column",
                  transition: "transform 200ms",
                }}>
                  {plan.highlight && (
                    <div style={{
                      position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)",
                      background: C.gold, color: "#08090F",
                      fontSize: 9, fontWeight: 800, letterSpacing: "0.14em",
                      padding: "3px 14px", borderRadius: 20, textTransform: "uppercase",
                      whiteSpace: "nowrap",
                    }}>
                      Recommended
                    </div>
                  )}

                  <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.22em", color: C.muted, marginBottom: 18 }}>
                    {plan.name}
                  </h3>

                  <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 8 }}>
                    <span style={{ fontSize: 50, fontWeight: 900, letterSpacing: "-0.03em", color: C.text, lineHeight: 1 }}>{plan.price}</span>
                    <span style={{ fontSize: 17, color: C.muted }}>{plan.period}</span>
                  </div>

                  <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6, marginBottom: 28 }}>{plan.tagline}</p>

                  <ul style={{ margin: "0 0 28px", padding: 0, listStyle: "none" }}>
                    {plan.features.map(f => (
                      <li key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#CBD5E1", marginBottom: 11 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={plan.highlight ? C.gold : C.faint} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <div style={{ marginTop: "auto" }}>
                    <Link href={plan.ctaHref} style={{
                      display: "block", textAlign: "center",
                      fontSize: 14, fontWeight: 700, textDecoration: "none",
                      padding: "11px 20px", borderRadius: 6,
                      color: plan.highlight ? "#08090F" : C.text,
                      background: plan.highlight ? C.gold : "transparent",
                      border: `1px solid ${plan.highlight ? C.gold : C.border}`,
                      marginBottom: 12,
                    }}>
                      {plan.cta}
                    </Link>
                    <p style={{ fontSize: 11, textAlign: "center", color: C.faint, margin: 0 }}>{plan.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════ FINAL CTA ══════════ */}
        <section style={{ borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: "96px 40px", background: "#060810" }}>
          <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
            <h2 style={{ fontSize: "clamp(1.5rem, 2.5vw, 2.25rem)", fontWeight: 800, letterSpacing: "-0.025em", color: C.text, marginBottom: 14, lineHeight: 1.2 }}>
              Import your pipeline. See where revenue is decaying.
            </h2>
            <p style={{ fontSize: 14, color: C.muted, marginBottom: 32, lineHeight: 1.65 }}>
              14 days free. No credit card required. Results in minutes.
            </p>
            <Link href="/auth/signup?tier=pro" className="d-cta-gold" style={{
              display: "inline-block",
              fontSize: 14, fontWeight: 700, textDecoration: "none",
              padding: "13px 36px", borderRadius: 6,
              color: "#08090F", background: C.gold,
              transition: "opacity 150ms", letterSpacing: "0.01em",
            }}>
              Start Pro Trial
            </Link>
          </div>
        </section>

        {/* ══════════ FOOTER ══════════ */}
        <footer style={{ padding: "56px 40px 32px", background: C.bg, borderTop: `1px solid ${C.border}` }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>

            {/* Top grid */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1.7fr", gap: 48, marginBottom: 48 }}>

              {/* Brand column */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <CEMark w={24} h={24} />
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: C.muted }}>Cognitive Empire</span>
                  <span style={{ width: 1, height: 13, background: C.border, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", color: C.text }}>DRIFT</span>
                </div>
                <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.65, maxWidth: 240 }}>
                  Revenue triage software for fractional CROs and RevOps operators.
                </p>
              </div>

              {/* Product */}
              <div>
                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.24em", textTransform: "uppercase", color: C.muted, marginBottom: 16 }}>Product</p>
                {["Overview", "How It Works", "Pricing", "For Agencies"].map(l => (
                  <p key={l} style={{ margin: "0 0 10px" }}>
                    <a href="#" className="d-footer-link" style={{ fontSize: 13, color: C.faint, textDecoration: "none", transition: "color 150ms" }}>{l}</a>
                  </p>
                ))}
              </div>

              {/* Resources */}
              <div>
                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.24em", textTransform: "uppercase", color: C.muted, marginBottom: 16 }}>Resources</p>
                {["Blog", "Case Studies", "Guides", "Support"].map(l => (
                  <p key={l} style={{ margin: "0 0 10px" }}>
                    <a href="#" className="d-footer-link" style={{ fontSize: 13, color: C.faint, textDecoration: "none", transition: "color 150ms" }}>{l}</a>
                  </p>
                ))}
              </div>

              {/* Company */}
              <div>
                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.24em", textTransform: "uppercase", color: C.muted, marginBottom: 16 }}>Company</p>
                {[
                  { label: "About",    href: "#" },
                  { label: "Security", href: "#" },
                  { label: "Privacy",  href: "/privacy" },
                  { label: "Terms",    href: "/terms" },
                ].map(l => (
                  <p key={l.label} style={{ margin: "0 0 10px" }}>
                    <Link href={l.href} className="d-footer-link" style={{ fontSize: 13, color: C.faint, textDecoration: "none", transition: "color 150ms" }}>{l.label}</Link>
                  </p>
                ))}
              </div>

              {/* Newsletter */}
              <div>
                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.24em", textTransform: "uppercase", color: C.muted, marginBottom: 12 }}>Stay informed</p>
                <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.65, marginBottom: 16 }}>
                  Insights on revenue discipline, decay prevention, and execution.
                </p>
                <div style={{ display: "flex" }}>
                  <input
                    type="email"
                    placeholder="Email address"
                    style={{
                      flex: 1, fontSize: 13, color: C.text,
                      background: C.panel, border: `1px solid ${C.border}`,
                      borderRight: "none", borderRadius: "6px 0 0 6px",
                      padding: "9px 14px", outline: "none",
                    }}
                  />
                  <button type="button" style={{
                    fontSize: 15, color: "#08090F",
                    background: C.gold, border: "none",
                    borderRadius: "0 6px 6px 0",
                    padding: "0 16px", cursor: "pointer",
                    flexShrink: 0,
                  }}>
                    →
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom bar */}
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 24, textAlign: "center" }}>
              <p style={{ fontSize: 11, color: C.faint, margin: 0 }}>
                © {new Date().getFullYear()} Cognitive Empire. All rights reserved.
              </p>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
