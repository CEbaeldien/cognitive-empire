import Link from "next/link";

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:       "#080d1a",
  panel:    "#0f1629",
  border:   "#1e2a45",
  text:     "#f1f5f9",
  muted:    "#64748b",
  faint:    "#334155",
  critical: "#ef4444",
  decaying: "#f97316",
  watch:    "#eab308",
  blue:     "#3b82f6",
} as const;

// ── Mock intervention queue rows (hero visual) ────────────────────────────────
const MOCK_ROWS = [
  {
    account:    "Meridian Health Systems",
    deal:       "Enterprise License Agreement",
    stage:      "Negotiation",
    exposure:   "$204,000",
    pct:        "32.4%",
    level:      "critical",
    badge:      "CRITICAL",
    badgeColor: C.critical,
    leftColor:  C.critical,
    reasons:    ["No meaningful activity for 14+ days", "No next action defined", "High-value opportunity stalling"],
    action:     "Define next action immediately and assign a due date.",
  },
  {
    account:    "Veritas Capital Partners",
    deal:       "VCF – Phase 2 Expansion",
    stage:      "Proposal",
    exposure:   "$105,750",
    pct:        "16.8%",
    level:      "decaying",
    badge:      "DECAYING",
    badgeColor: C.decaying,
    leftColor:  C.decaying,
    reasons:    ["Close date slipped 3 weeks", "No activity in 12 days", "Next step not defined"],
    action:     "Re-establish timeline and confirm stakeholder engagement.",
  },
  {
    account:    "Northwind Industries",
    deal:       "Platform Renewal",
    stage:      "Qualify",
    exposure:   "$48,000",
    pct:        "7.6%",
    level:      "watch",
    badge:      "WATCH",
    badgeColor: C.watch,
    leftColor:  C.watch,
    reasons:    ["No activity in 9 days", "Stakeholder engagement is low"],
    action:     "Schedule follow-up with decision maker.",
  },
];

// ── Step data ─────────────────────────────────────────────────────────────────
const STEPS = [
  { n: "01", title: "Snapshot",          desc: "Import your pipeline via CSV. No CRM integration required." },
  { n: "02", title: "Decay Detection",   desc: "Drift scores every opportunity deterministically using time and engagement signals." },
  { n: "03", title: "Intervention Queue", desc: "Prioritized actions surface automatically, ranked by exposure and urgency." },
  { n: "04", title: "Evidence Recording", desc: "Log what you did, when, and what the outcome was. Every action is timestamped." },
  { n: "05", title: "Weekly Reality",    desc: "Client-ready report generated automatically. No assembly required." },
  { n: "06", title: "Next Snapshot",     desc: "Repeat. Decay never stops. Neither does your visibility." },
];

// ── Pricing data ──────────────────────────────────────────────────────────────
const PLANS = [
  {
    name:       "Operator",
    price:      "$149",
    period:     "/mo",
    tagline:    "For individual fractional CROs managing a small book.",
    features:   ["1–4 clients", "Full decay detection", "Intervention queue", "Evidence tracking", "Weekly reports", "CSV import"],
    cta:        "Start Operator Trial",
    ctaHref:    "/auth/signup?tier=operator",
    note:       "14 days free",
    highlight:  false,
  },
  {
    name:       "Pro",
    price:      "$249",
    period:     "/mo",
    tagline:    "For operators running multiple client engagements.",
    features:   ["5–15 clients", "Everything in Operator", "Priority support", "Multi-client view"],
    cta:        "Start Pro Trial",
    ctaHref:    "/auth/signup?tier=pro",
    note:       "14 days free",
    highlight:  true,
  },
  {
    name:       "Agency",
    price:      "$499",
    period:     "/mo",
    tagline:    "For RevOps agencies running large client portfolios.",
    features:   ["Unlimited clients", "Team access", "Agency-level reporting", "Dedicated onboarding"],
    cta:        "Request Agency Access",
    ctaHref:    "mailto:founder@cognitiveempire.com",
    note:       "Custom setup included",
    highlight:  false,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
export default function DriftMarketingPage() {
  return (
    <>
      {/* Smooth scroll */}
      <style>{`html{scroll-behavior:smooth}`}</style>

      <div style={{ background: C.bg, color: C.text, fontFamily: "system-ui, -apple-system, sans-serif", minHeight: "100vh" }}>

        {/* ══════════ NAV ══════════ */}
        <nav style={{
          position: "sticky", top: 0, zIndex: 50,
          background: C.bg, borderBottom: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 40px", height: 56,
        }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(59,130,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
                <path d="M4 4 L16 10 L4 16 L7 10 Z" fill="#3b82f6" />
              </svg>
            </div>
            <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.02em", color: "#f8fafc" }}>Drift</span>
          </div>

          {/* Nav right */}
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <Link href="/auth/signin" style={{ fontSize: 13, color: C.muted, textDecoration: "none" }}>
              Sign In
            </Link>
            <Link href="/auth/signup?tier=pro" style={{
              fontSize: 13, fontWeight: 600, color: C.text,
              padding: "7px 18px", borderRadius: 6,
              border: `1px solid ${C.border}`,
              background: C.panel,
              textDecoration: "none",
            }}>
              Start Pro Trial
            </Link>
          </div>
        </nav>

        {/* ══════════ HERO ══════════ */}
        <section style={{ maxWidth: 1120, margin: "0 auto", padding: "128px 40px 96px" }}>
          <p style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: C.blue, marginBottom: 28 }}>
            Revenue Triage Software
          </p>

          <h1 style={{ fontSize: 72, fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.03em", color: "#ffffff", maxWidth: 760, margin: "0 0 32px" }}>
            Most revenue dies from neglect, not bad deals.
          </h1>

          <p style={{ fontSize: 20, fontWeight: 400, lineHeight: 1.625, color: "#cbd5e1", maxWidth: 672, margin: "0 0 48px" }}>
            Drift turns stale CRM data into operational pressure. It detects decay, ranks risk, and forces proof of execution — so neglected revenue doesn't disappear quietly.
          </p>

          {/* CTAs */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
            <Link href="/auth/signup?tier=pro" style={{
              fontSize: 16, fontWeight: 600, color: "#fff",
              padding: "16px 32px", borderRadius: 7,
              background: C.blue, border: "none",
              textDecoration: "none", letterSpacing: "-0.01em",
            }}>
              Start Pro Trial
            </Link>
            <a href="#pricing" style={{
              fontSize: 16, fontWeight: 600, color: "#94a3b8",
              padding: "16px 32px", borderRadius: 7,
              border: `1px solid ${C.border}`,
              background: "transparent",
              textDecoration: "none",
            }}>
              View Pricing
            </a>
          </div>
          <p style={{ fontSize: 12, color: C.faint }}>14 days free. No credit card required.</p>

          {/* Mock intervention table */}
          <div style={{ marginTop: 56, borderRadius: 10, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            {/* Table header */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "2fr 0.7fr 0.85fr 1.6fr 1.9fr 0.8fr",
              background: C.panel,
              borderBottom: `1px solid ${C.border}`,
              padding: "10px 0",
            }}>
              {["OPPORTUNITY", "STAGE", "EXPOSURE", "DECAY REASONS", "REQUIRED INTERVENTION", "URGENCY"].map((h, i) => (
                <div key={h} style={{ padding: "0 16px", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.35em", color: C.muted }}>
                  {h}
                </div>
              ))}
            </div>

            {/* Rows */}
            {MOCK_ROWS.map((row, idx) => (
              <div
                key={row.account}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 0.7fr 0.85fr 1.6fr 1.9fr 0.8fr",
                  alignItems: "start",
                  borderLeft: `2.5px solid ${row.leftColor}`,
                  borderTop: idx > 0 ? `1px solid rgba(30,42,69,0.7)` : "none",
                  background: idx % 2 === 0 ? "#090e1c" : "#0a1020",
                }}
              >
                {/* Account */}
                <div style={{ padding: "16px 16px" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>{row.account}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{row.deal}</div>
                </div>
                {/* Stage */}
                <div style={{ padding: "16px 16px" }}>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>{row.stage}</div>
                  <div style={{ fontSize: 10, fontWeight: 600, marginTop: 4, color: row.badgeColor }}>{row.level === "critical" ? "High-Risk" : row.level === "decaying" ? "At Risk" : "Watch"}</div>
                </div>
                {/* Exposure */}
                <div style={{ padding: "16px 16px" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: row.badgeColor }}>{row.exposure}</div>
                  <div style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>{row.pct}</div>
                </div>
                {/* Decay reasons */}
                <div style={{ padding: "16px 16px" }}>
                  <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                    {row.reasons.map(r => (
                      <li key={r} style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 11, color: "#64748b", marginBottom: 5 }}>
                        <span style={{ width: 4, height: 4, borderRadius: "50%", background: C.faint, flexShrink: 0, marginTop: 5 }} />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
                {/* Intervention */}
                <div style={{ padding: "16px 16px" }}>
                  <div style={{ fontSize: 12, color: "#cbd5e1", lineHeight: 1.5 }}>{row.action}</div>
                </div>
                {/* Urgency */}
                <div style={{ padding: "16px 16px" }}>
                  <span style={{
                    display: "inline-block",
                    padding: "5px 10px", borderRadius: 4,
                    border: `1px solid ${row.badgeColor}`,
                    color: row.badgeColor,
                    fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
                    background: `${row.badgeColor}12`,
                  }}>
                    {row.badge}
                  </span>
                </div>
              </div>
            ))}

            {/* Table footer */}
            <div style={{ background: C.panel, borderTop: `1px solid ${C.border}`, padding: "8px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, color: C.muted }}>Showing 3 of 3 interventions</span>
              <span style={{ fontSize: 11, color: C.blue }}>View all interventions →</span>
            </div>
          </div>
        </section>

        {/* ══════════ PROBLEM ══════════ */}
        <section style={{ borderTop: `1px solid ${C.border}`, padding: "96px 40px" }}>
          <div style={{ maxWidth: 1120, margin: "0 auto" }}>
            <p style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: C.blue, marginBottom: 24 }}>
              The Problem
            </p>
            <h2 style={{ fontSize: 48, fontWeight: 700, letterSpacing: "-0.025em", color: "#ffffff", maxWidth: 700, margin: "0 0 72px", lineHeight: 1.25 }}>
              Your CRM stores opportunities. Drift shows which ones are dying.
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 40 }}>
              {[
                {
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="1" y1="1" x2="23" y2="23" /><path d="M16.72 11.06A10.94 10.94 0 0119 12.55" /><path d="M5 12.55a10.94 10.94 0 015.17-2.39" /><path d="M10.71 5.05A16 16 0 0122.56 9" /><path d="M1.42 9a15.91 15.91 0 014.7-2.88" /><path d="M8.53 16.11a6 6 0 016.95 0" /><line x1="12" y1="20" x2="12.01" y2="20" />
                    </svg>
                  ),
                  title: "No activity signal",
                  desc: "You don't know which deals have gone silent until it's too late.",
                },
                {
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
                    </svg>
                  ),
                  title: "No intervention priority",
                  desc: "Everything looks urgent. Nothing gets actioned.",
                },
                {
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
                    </svg>
                  ),
                  title: "No execution proof",
                  desc: "You can't show clients what you did or why it worked.",
                },
              ].map(item => (
                <div key={item.title} style={{ padding: "36px 36px 40px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.panel }}>
                  <div style={{ marginBottom: 20 }}>{item.icon}</div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, color: "#ffffff", marginBottom: 12 }}>{item.title}</h3>
                  <p style={{ fontSize: 16, color: "#cbd5e1", lineHeight: 1.625, margin: 0 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════ HOW IT WORKS ══════════ */}
        <section style={{ borderTop: `1px solid ${C.border}`, padding: "96px 40px" }}>
          <div style={{ maxWidth: 1120, margin: "0 auto" }}>
            <p style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: C.blue, marginBottom: 24 }}>
              The Core Loop
            </p>
            <h2 style={{ fontSize: 48, fontWeight: 700, letterSpacing: "-0.025em", color: "#ffffff", margin: "0 0 72px", lineHeight: 1.25 }}>
              Six steps from pipeline import to revenue protection.
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
              {STEPS.map((step) => (
                <div key={step.n} style={{ display: "flex", gap: 20, padding: "32px 28px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.panel }}>
                  <div style={{ fontSize: 30, fontWeight: 900, color: C.blue, lineHeight: 1, flexShrink: 0, width: 36 }}>
                    {step.n}
                  </div>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: "#ffffff", marginBottom: 10 }}>{step.title}</h3>
                    <p style={{ fontSize: 14, color: "#cbd5e1", lineHeight: 1.625, margin: 0 }}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════ PRICING ══════════ */}
        <section id="pricing" style={{ borderTop: `1px solid ${C.border}`, padding: "96px 40px" }}>
          <div style={{ maxWidth: 1120, margin: "0 auto" }}>
            <p style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: C.blue, marginBottom: 24 }}>
              Pricing
            </p>
            <h2 style={{ fontSize: 48, fontWeight: 700, letterSpacing: "-0.025em", color: "#ffffff", margin: "0 0 72px", lineHeight: 1.25 }}>
              Most serious operators start with Pro.
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, alignItems: "start" }}>
              {PLANS.map(plan => (
                <div
                  key={plan.name}
                  style={{
                    borderRadius: 10,
                    border: plan.highlight ? `2px solid ${C.blue}` : `1px solid ${C.border}`,
                    background: plan.highlight ? "#0d1a2e" : C.panel,
                    padding: "40px 32px",
                    position: "relative",
                    boxShadow: plan.highlight ? "0 0 40px rgba(59,130,246,0.12)" : "none",
                  }}
                >
                  {plan.highlight && (
                    <div style={{
                      position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                      background: C.blue, color: "#fff",
                      fontSize: 10, fontWeight: 800, letterSpacing: "0.1em",
                      padding: "4px 14px", borderRadius: 20, textTransform: "uppercase",
                      whiteSpace: "nowrap",
                    }}>
                      Recommended
                    </div>
                  )}

                  <h3 style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94a3b8", marginBottom: 20 }}>
                    {plan.name}
                  </h3>

                  <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 10 }}>
                    <span style={{ fontSize: 60, fontWeight: 900, letterSpacing: "-0.03em", color: "#ffffff", lineHeight: 1 }}>{plan.price}</span>
                    <span style={{ fontSize: 20, color: "#94a3b8" }}>{plan.period}</span>
                  </div>

                  <p style={{ fontSize: 16, color: "#94a3b8", lineHeight: 1.55, marginBottom: 32 }}>{plan.tagline}</p>

                  <ul style={{ margin: "0 0 36px", padding: 0, listStyle: "none" }}>
                    {plan.features.map(f => (
                      <li key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 16, color: "#cbd5e1", marginBottom: 14 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={plan.highlight ? C.blue : C.muted} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={plan.ctaHref}
                    style={{
                      display: "block", textAlign: "center",
                      fontSize: 16, fontWeight: 600, textDecoration: "none",
                      padding: "12px 24px", borderRadius: 6,
                      color: plan.highlight ? "#fff" : "#f1f5f9",
                      background: plan.highlight ? C.blue : "transparent",
                      border: `1px solid ${plan.highlight ? C.blue : C.border}`,
                      marginBottom: 14,
                    }}
                  >
                    {plan.cta}
                  </Link>
                  <p style={{ fontSize: 12, textAlign: "center", color: C.faint }}>{plan.note}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════ FINAL CTA ══════════ */}
        <section style={{ borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: "96px 40px", background: "#060a15" }}>
          <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
            <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.025em", color: "#f8fafc", marginBottom: 16, lineHeight: 1.2 }}>
              Import your pipeline. See where revenue is decaying.
            </h2>
            <p style={{ fontSize: 15, color: "#64748b", marginBottom: 36, lineHeight: 1.6 }}>
              14 days free. No credit card required. Results in minutes.
            </p>
            <Link href="/auth/signup?tier=pro" style={{
              display: "inline-block",
              fontSize: 15, fontWeight: 700, textDecoration: "none",
              padding: "14px 40px", borderRadius: 8,
              color: "#fff", background: C.blue,
              letterSpacing: "-0.01em",
            }}>
              Start Pro Trial
            </Link>
          </div>
        </section>

        {/* ══════════ FOOTER ══════════ */}
        <footer style={{ padding: "32px 40px", borderTop: `1px solid ${C.border}` }}>
          <div style={{ maxWidth: 1120, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {/* Wordmark */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 22, height: 22, borderRadius: 4, background: "rgba(59,130,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="10" height="10" viewBox="0 0 20 20" fill="none">
                  <path d="M4 4 L16 10 L4 16 L7 10 Z" fill="#3b82f6" />
                </svg>
              </div>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#f8fafc" }}>Drift</span>
            </div>

            {/* Links */}
            <div style={{ display: "flex", gap: 28 }}>
              {[
                { label: "Sign In",  href: "/auth/signin" },
                { label: "Pricing",  href: "#pricing" },
                { label: "Contact",  href: "mailto:founder@cognitiveempire.com" },
              ].map(l => (
                <Link key={l.label} href={l.href} style={{ fontSize: 12, color: C.muted, textDecoration: "none" }}>
                  {l.label}
                </Link>
              ))}
            </div>

            {/* Right */}
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 11, color: C.faint, marginBottom: 3 }}>A Cognitive Empire product</p>
              <p style={{ fontSize: 11, color: C.faint }}>© {new Date().getFullYear()} Cognitive Empire. All rights reserved.</p>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
