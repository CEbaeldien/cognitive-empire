import type { Metadata } from "next";
import Link from "next/link";
import CENav from "../components/CENav";
import CEFooter from "../components/CEFooter";
import { CEMark } from "../components/CEMark";

export const metadata: Metadata = {
  title: "CE Research — Canon Library | Cognitive Empire",
  description:
    "Canonical doctrine releases from Cognitive Empire. Ops Kernel and Maintenance Gravity.",
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
  goldDim:    "rgba(201,169,97,0.18)",
} as const;

type Action = { label: string; href: string | null; external?: boolean };

type Artifact = {
  n:        string;
  category: string;
  title:    string;
  subtitle: string;
  desc:     string;
  version:  string;
  status:   string;
  released: string;
  actions:  Action[];
};

const ARTIFACTS: Artifact[] = [
  {
    n:        "01",
    category: "DOCTRINE CORE",
    title:    "Ops Kernel",
    subtitle: "The operational core. Execution logic for operators.",
    desc:     "Ops Kernel defines the operational core of Cognitive Empire — execution logic, decision thresholds, and escalation structures for real-world operators.",
    version:  "1.0",
    status:   "Canon Current",
    released: "Jun 13, 2026",
    actions: [
      { label: "Open Release →",   href: "/operator-kernel" },
      { label: "Download PDF →",   href: "/downloads/ce-public-kernel.pdf", external: true },
    ],
  },
  {
    n:        "02",
    category: "DOCTRINE SYSTEM",
    title:    "Maintenance Gravity",
    subtitle: "Sustainment laws for systems that endure.",
    desc:     "Maintenance Gravity defines the invariants that sustain systems under entropy, stress, and scale. Every intelligent system creates maintenance mass.",
    version:  "1.0",
    status:   "Canon Current",
    released: "Jun 13, 2026",
    actions: [
      { label: "Open Release →",   href: "/maintenance-gravity" },
      { label: "Download PDF →",   href: null },
    ],
  },
];

function ArtifactCard({ art, animClass }: { art: Artifact; animClass: string }) {
  return (
    <div className={`ce-artifact-card ${animClass}`} style={{
      background:    P.panel,
      border:        `1px solid ${P.borderMid}`,
      borderTop:     `2px solid ${P.goldDim}`,
      padding:       "28px 26px 24px",
      display:       "flex",
      flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 20 }}>
        <div style={{
          width: 38, height: 38, flexShrink: 0,
          border: `1px solid ${P.goldBorder}`,
          background: P.goldSoft,
          borderRadius: 3,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <CEMark style={{ width: 18, height: 18, color: P.gold }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{
            fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.32em",
            textTransform: "uppercase", color: P.gold,
            display: "block", marginBottom: 5,
          }}>
            {art.n} · {art.category}
          </span>
          <h2 style={{
            fontSize: "clamp(1.3rem, 2vw, 1.6rem)",
            fontWeight: 700, color: P.text,
            margin: "0 0 4px", letterSpacing: "-0.025em", lineHeight: 1.1,
          }}>
            {art.title}
          </h2>
          <p style={{ fontSize: "0.88rem", color: P.muted, margin: 0, lineHeight: 1.5 }}>
            {art.subtitle}
          </p>
        </div>
      </div>

      {/* Description */}
      <p style={{ fontSize: "0.88rem", color: P.muted, lineHeight: 1.7, margin: "0 0 20px", flex: 1 }}>
        {art.desc}
      </p>

      {/* Meta row */}
      <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
        {[
          { label: "Version", value: `v${art.version}` },
          { label: "Status",  value: art.status },
          { label: "Released", value: art.released },
        ].map(({ label, value }) => (
          <div key={label}>
            <p style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: P.dim, margin: "0 0 3px" }}>
              {label}
            </p>
            <p style={{ fontSize: "0.82rem", fontWeight: 500, color: P.gold, margin: 0 }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: P.border, marginBottom: 16 }} />

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {art.actions.map((a) =>
          a.href ? (
            <Link
              key={a.label}
              href={a.href}
              {...(a.external ? { target: "_blank", rel: "noreferrer" } : {})}
              className="ce-artifact-btn"
              style={{
                fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.14em",
                textTransform: "uppercase", color: P.text,
                border: `1px solid rgba(201,169,97,0.40)`,
                background: "rgba(201,169,97,0.08)",
                padding: "7px 14px", borderRadius: 2, textDecoration: "none",
                display: "inline-flex", alignItems: "center",
              }}
            >
              {a.label}
            </Link>
          ) : (
            <span key={a.label} style={{
              fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.14em",
              textTransform: "uppercase", color: P.dim,
              border: `1px solid ${P.border}`,
              padding: "7px 14px", borderRadius: 2, display: "inline-flex", alignItems: "center",
            }}>
              {a.label} (pending)
            </span>
          )
        )}
      </div>
    </div>
  );
}

export default function CEResearchPage() {
  return (
    <>
      <style>{`
        @keyframes ceReveal {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ce-r1 { opacity: 0; animation: ceReveal 280ms cubic-bezier(0.25,0.1,0.25,1.0)  60ms forwards; }
        .ce-r2 { opacity: 0; animation: ceReveal 280ms cubic-bezier(0.25,0.1,0.25,1.0) 120ms forwards; }
        .ce-r3 { opacity: 0; animation: ceReveal 280ms cubic-bezier(0.25,0.1,0.25,1.0) 160ms forwards; }

        .ce-artifact-btn {
          transition: background 160ms ease, border-color 160ms ease;
        }
        .ce-artifact-btn:hover {
          background: rgba(201,169,97,0.16) !important;
          border-color: rgba(201,169,97,0.60) !important;
        }

        .ce-artifact-card {
          transition: transform 220ms ease, border-top-color 220ms ease;
        }
        .ce-artifact-card:hover {
          transform: translateY(-2px);
          border-top-color: rgba(201,169,97,0.45) !important;
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation: none !important; transition: none !important; }
          .ce-r1,.ce-r2,.ce-r3 { opacity: 1; transform: none; }
        }

        @media (max-width: 860px) {
          .ce-artifacts-grid { grid-template-columns: 1fr !important; }
          .ce-wrap { padding: 40px 20px 64px !important; }
        }
      `}</style>

      <div style={{ background: P.bg, color: P.text, fontFamily: "system-ui, -apple-system, sans-serif", minHeight: "100vh" }}>
        <CENav />

        <div className="ce-wrap" style={{ maxWidth: 1280, margin: "0 auto", padding: "56px 48px 80px" }}>

          {/* Page header */}
          <div className="ce-r1" style={{ marginBottom: 40 }}>
            <p style={{
              fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.44em",
              textTransform: "uppercase", color: P.gold, margin: "0 0 10px",
              fontFamily: "monospace",
            }}>
              CE Research — Canon Library
            </p>
            <h1 style={{
              fontSize: "clamp(1.8rem, 3vw, 2.6rem)", fontWeight: 300,
              color: P.text, margin: "0 0 10px", letterSpacing: "-0.04em", lineHeight: 1.1,
            }}>
              Canonical Doctrine Releases
            </h1>
            <p style={{ fontSize: "0.88rem", color: P.muted, lineHeight: 1.7, maxWidth: 460, margin: 0 }}>
              Two public doctrine artifacts. Human-reviewed. Doctrine-governed.
            </p>
          </div>

          {/* Divider */}
          <div className="ce-r2" style={{ height: 1, background: P.border, marginBottom: 32 }} />

          {/* Artifacts grid */}
          <div className="ce-artifacts-grid ce-r3" style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 16,
          }}>
            {ARTIFACTS.map((art, i) => (
              <ArtifactCard key={art.n} art={art} animClass={i === 0 ? "ce-r2" : "ce-r3"} />
            ))}
          </div>

          {/* Footer mark */}
          <div style={{
            marginTop: 48, paddingTop: 20,
            borderTop: `1px solid ${P.border}`,
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <CEMark style={{ width: 14, height: 14, color: "rgba(201,169,97,0.28)" }} />
            <p style={{ fontSize: "0.6rem", color: P.dim, letterSpacing: "0.18em", margin: 0, textTransform: "uppercase" }}>
              Signal. Judgment. Systems.
            </p>
          </div>
        </div>

        <CEFooter />
      </div>
    </>
  );
}
