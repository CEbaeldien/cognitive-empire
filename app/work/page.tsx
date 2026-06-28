"use client";

import { useState } from "react";
import CENav from "../components/CENav";
import CEFooter from "../components/CEFooter";

const P = {
  bg:         "#03050A",
  panel:      "#0A1221",
  panelDeep:  "#060C18",
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

const SYSTEM_OPTIONS = [
  "Software / product system",
  "AI or automation workflow",
  "Operations process",
  "Team execution system",
];

const SYMPTOM_OPTIONS = [
  "Hard to change without breaking things",
  "Nobody fully understands it anymore",
  "Constant small fires / maintenance overhead",
  "Works but can't delegate or scale it",
];

type FormState = {
  name:        string;
  email:       string;
  system_type: string;
  symptom:     string;
  description: string;
};

export default function WorkPage() {
  const [form, setForm] = useState<FormState>({
    name:        "",
    email:       "",
    system_type: "",
    symptom:     "",
    description: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/work/audit-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:                  form.name,
          email:                 form.email,
          operation_description: `${form.system_type}${form.description ? ` — ${form.description}` : ""}`,
          symptom:               form.symptom,
        }),
      });
      if (!res.ok) throw new Error("Request failed");
      setSubmitted(true);
    } catch {
      setError("Submission failed. Please try again or email directly.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    background:  P.panelDeep,
    border:      `1px solid ${P.borderMid}`,
    color:       P.text,
    fontSize:    "0.88rem",
    padding:     "10px 14px",
    width:       "100%",
    outline:     "none",
    fontFamily:  "system-ui, -apple-system, sans-serif",
    lineHeight:  1.5,
  } as const;

  return (
    <>
      <style>{`
        @keyframes ceReveal {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ce-w1 { opacity: 0; animation: ceReveal 280ms cubic-bezier(0.25,0.1,0.25,1.0)  60ms forwards; }
        .ce-w2 { opacity: 0; animation: ceReveal 280ms cubic-bezier(0.25,0.1,0.25,1.0) 120ms forwards; }
        .ce-w3 { opacity: 0; animation: ceReveal 280ms cubic-bezier(0.25,0.1,0.25,1.0) 180ms forwards; }

        .ce-work-input:focus { border-color: rgba(201,169,97,0.40) !important; }

        .ce-opt-btn {
          font-size: 0.68rem; font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase;
          border: 1px solid rgba(255,255,255,0.10);
          background: transparent;
          color: rgba(122,141,166,1);
          padding: 7px 14px;
          cursor: pointer;
          transition: border-color 150ms ease, color 150ms ease, background 150ms ease;
          white-space: nowrap;
        }
        .ce-opt-btn:hover {
          border-color: rgba(201,169,97,0.30);
          color: #EEF3FA;
        }
        .ce-opt-btn.active {
          border-color: rgba(201,169,97,0.55);
          background: rgba(201,169,97,0.09);
          color: #C9A961;
        }

        .ce-submit-btn {
          font-size: 0.72rem; font-weight: 700; letter-spacing: 0.16em;
          text-transform: uppercase; color: #EEF3FA;
          border: 1px solid rgba(201,169,97,0.48);
          background: rgba(201,169,97,0.10);
          padding: 11px 28px;
          cursor: pointer;
          transition: background 160ms ease, border-color 160ms ease;
          display: inline-flex; align-items: center; gap: 6px;
        }
        .ce-submit-btn:hover:not(:disabled) {
          background: rgba(201,169,97,0.20);
          border-color: rgba(201,169,97,0.70);
        }
        .ce-submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation: none !important; transition: none !important; }
          .ce-w1,.ce-w2,.ce-w3 { opacity: 1; transform: none; }
        }

        @media (max-width: 768px) {
          .ce-work-wrap { padding: 40px 20px 64px !important; }
          .ce-work-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={{ background: P.bg, color: P.text, fontFamily: "system-ui, -apple-system, sans-serif", minHeight: "100vh" }}>
        <CENav />

        <div className="ce-work-wrap" style={{ maxWidth: 860, margin: "0 auto", padding: "56px 48px 80px" }}>

          {/* Page header */}
          <div className="ce-w1" style={{ marginBottom: 36 }}>
            <p style={{
              fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.44em",
              textTransform: "uppercase", color: P.gold, margin: "0 0 10px",
              fontFamily: "monospace",
            }}>
              Cognitive Empire — Work
            </p>
            <h1 style={{
              fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", fontWeight: 300,
              color: P.text, margin: "0 0 14px", letterSpacing: "-0.04em", lineHeight: 1.1,
            }}>
              Maintenance Gravity Audit
            </h1>
            <p style={{ fontSize: "0.95rem", color: P.muted, lineHeight: 1.7, maxWidth: 520, margin: 0 }}>
              Identify where your system accumulates hidden maintenance load, governance gaps, and continuity debt before they become structural failure.
            </p>
          </div>

          {/* Divider */}
          <div className="ce-w1" style={{ height: 1, background: P.border, marginBottom: 32 }} />

          {submitted ? (
            <div className="ce-w2" style={{
              background: P.panel, border: `1px solid ${P.goldBorder}`,
              borderTop: `2px solid ${P.gold}`,
              padding: "36px 32px",
            }}>
              <p style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.32em", textTransform: "uppercase", color: P.gold, margin: "0 0 12px" }}>
                Request Received
              </p>
              <p style={{ fontSize: "1.05rem", color: P.text, margin: "0 0 10px" }}>
                We will review your system and be in touch.
              </p>
              <p style={{ fontSize: "0.85rem", color: P.muted, margin: 0 }}>
                Maintenance Gravity audits are delivered through Dr. E with recommended action path.
              </p>
            </div>
          ) : (
            <form className="ce-w2" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>

              {/* Name + Email */}
              <div className="ce-work-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: P.dim, display: "block", marginBottom: 6 }}>
                    Name
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Your name"
                    value={form.name}
                    onChange={set("name")}
                    className="ce-work-input"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: P.dim, display: "block", marginBottom: 6 }}>
                    Email
                  </label>
                  <input
                    required
                    type="email"
                    placeholder="your@email.com"
                    value={form.email}
                    onChange={set("email")}
                    className="ce-work-input"
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* System type */}
              <div>
                <label style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: P.dim, display: "block", marginBottom: 10 }}>
                  What system is under pressure?
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {SYSTEM_OPTIONS.map((o) => (
                    <button
                      key={o}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, system_type: o }))}
                      className={`ce-opt-btn${form.system_type === o ? " active" : ""}`}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </div>

              {/* Symptom */}
              <div>
                <label style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: P.dim, display: "block", marginBottom: 10 }}>
                  Primary symptom
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {SYMPTOM_OPTIONS.map((o) => (
                    <button
                      key={o}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, symptom: o }))}
                      className={`ce-opt-btn${form.symptom === o ? " active" : ""}`}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: P.dim, display: "block", marginBottom: 6 }}>
                  Describe the system (optional)
                </label>
                <textarea
                  rows={4}
                  placeholder="What does it do, how long has it been running, what makes it hard to maintain…"
                  value={form.description}
                  onChange={set("description")}
                  className="ce-work-input"
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>

              {error && (
                <p style={{ fontSize: "0.82rem", color: "#E07070", margin: 0 }}>{error}</p>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <button type="submit" disabled={loading} className="ce-submit-btn">
                  {loading ? "Submitting…" : "Request Audit →"}
                </button>
                <p style={{ fontSize: "0.72rem", color: P.dim, margin: 0 }}>
                  Delivered through Dr. E. No spam.
                </p>
              </div>

            </form>
          )}

          {/* Doctrine note */}
          <div className="ce-w3" style={{
            marginTop: 40, paddingTop: 20,
            borderTop: `1px solid ${P.border}`,
          }}>
            <p style={{ fontSize: "0.75rem", color: P.dim, lineHeight: 1.7, margin: 0 }}>
              <span style={{ color: P.gold }}>Maintenance Gravity</span> is the accumulating operational drag created when intelligent systems enter production. Audits expose hidden maintenance load, governance gaps, and continuity risk before they become structural debt.
            </p>
          </div>

        </div>

        <CEFooter />
      </div>
    </>
  );
}
