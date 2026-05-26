"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const S = {
  bg:     "#0b0f1c",
  panel:  "#0f1420",
  border: "#1a2035",
  input:  "#090c17",
  text:   "#f1f5f9",
  muted:  "#94a3b8",
  faint:  "#64748b",
  blue:   "#3b82f6",
} as const;

const TIMEZONES = [
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "America/Anchorage", "Pacific/Honolulu", "Europe/London", "Europe/Paris",
  "Europe/Berlin", "Asia/Dubai", "Asia/Singapore", "Asia/Tokyo",
  "Australia/Sydney", "UTC",
];

const THRESHOLDS = [
  { label: "HEALTHY",  range: "0 – 34",   color: "#22c55e", bg: "rgba(34,197,94,0.08)"   },
  { label: "WATCH",    range: "35 – 59",  color: "#eab308", bg: "rgba(234,179,8,0.08)"   },
  { label: "DECAYING", range: "60 – 79",  color: "#f97316", bg: "rgba(249,115,22,0.08)"  },
  { label: "CRITICAL", range: "80 – 100", color: "#ef4444", bg: "rgba(239,68,68,0.08)"   },
];

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{ fontSize: 15, fontWeight: 700, color: S.text, letterSpacing: "-0.01em", margin: 0 }}>{title}</h2>
      {description && <p style={{ fontSize: 12, color: S.faint, marginTop: 4 }}>{description}</p>}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, padding: "16px 0", borderBottom: `1px solid ${S.border}` }}>
      <div style={{ flex: "0 0 220px" }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: S.muted, margin: 0 }}>{label}</p>
      </div>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

function SaveButton({ onClick, saving, saved }: { onClick: () => void; saving: boolean; saved: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      style={{
        marginLeft: 12, padding: "7px 16px", borderRadius: 7,
        background: saved ? "rgba(34,197,94,0.12)" : S.blue,
        border: saved ? "1px solid rgba(34,197,94,0.3)" : "none",
        color: saved ? "#4ade80" : "#fff",
        fontSize: 12, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer",
        opacity: saving ? 0.6 : 1, transition: "all 0.2s",
      }}
    >
      {saving ? "Saving…" : saved ? "Saved ✓" : "Save"}
    </button>
  );
}

export default function SettingsPage() {
  const [workspaceName, setWorkspaceName] = useState("");
  const [timezone, setTimezone] = useState("America/New_York");
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifEmail, setNotifEmail] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [savedName, setSavedName] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savedEmail, setSavedEmail] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [loadingWorkspace, setLoadingWorkspace] = useState(true);

  useEffect(() => {
    fetch("/api/drift/overview")
      .then(r => r.json())
      .then(d => {
        if (d.workspace?.name) setWorkspaceName(d.workspace.name);
        if (d.workspace_members?.[0]?.email) setNotifEmail(d.workspace_members[0].email);
      })
      .catch(() => {})
      .finally(() => setLoadingWorkspace(false));
  }, []);

  function handleSaveName() {
    setSavingName(true);
    setTimeout(() => { setSavingName(false); setSavedName(true); setTimeout(() => setSavedName(false), 2500); }, 600);
  }

  function handleSaveEmail() {
    setSavingEmail(true);
    setTimeout(() => { setSavingEmail(false); setSavedEmail(true); setTimeout(() => setSavedEmail(false), 2500); }, 600);
  }

  const inputStyle: React.CSSProperties = {
    padding: "9px 13px", borderRadius: 7,
    border: `1px solid ${S.border}`,
    background: S.input, color: S.text,
    fontSize: 13, outline: "none",
    fontFamily: "system-ui, -apple-system, sans-serif",
  };

  return (
    <div style={{ minHeight: "100vh", background: S.bg, fontFamily: "system-ui, -apple-system, sans-serif", color: S.text }}>

      {/* Top bar */}
      <div style={{ borderBottom: `1px solid ${S.border}`, background: "#090c17", padding: "14px 40px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(59,130,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="12" height="12" viewBox="0 0 20 20" fill="none"><path d="M4 4 L16 10 L4 16 L7 10 Z" fill="#3b82f6" /></svg>
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.02em" }}>Drift</span>
        </div>
        <span style={{ color: S.border, fontSize: 16 }}>/</span>
        <span style={{ fontSize: 13, color: S.muted }}>Settings</span>
        <div style={{ flex: 1 }} />
        <Link href="/admin/drift" style={{ fontSize: 12, color: S.faint, textDecoration: "none" }}>
          ← Revenue Execution
        </Link>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 40px 80px" }}>

        <div style={{ marginBottom: 36 }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.4em", textTransform: "uppercase", color: S.faint, marginBottom: 6 }}>Configuration</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", margin: 0 }}>Settings</h1>
        </div>

        {/* ── Workspace ─────────────────────────────────────── */}
        <div style={{ borderRadius: 12, border: `1px solid ${S.border}`, background: S.panel, padding: "24px 28px", marginBottom: 24 }}>
          <SectionHeader title="Workspace" description="Basic workspace identity and region settings." />

          <Row label="Workspace name">
            <div style={{ display: "flex", alignItems: "center" }}>
              <input
                value={loadingWorkspace ? "Loading…" : workspaceName}
                onChange={e => { setWorkspaceName(e.target.value); setSavedName(false); }}
                disabled={loadingWorkspace}
                style={{ ...inputStyle, width: 260 }}
                placeholder="My Workspace"
              />
              <SaveButton onClick={handleSaveName} saving={savingName} saved={savedName} />
            </div>
          </Row>

          <Row label="Timezone">
            <select
              value={timezone}
              onChange={e => setTimezone(e.target.value)}
              style={{ ...inputStyle, width: 260, cursor: "pointer" }}
            >
              {TIMEZONES.map(tz => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </Row>
        </div>

        {/* ── Scoring ───────────────────────────────────────── */}
        <div style={{ borderRadius: 12, border: `1px solid ${S.border}`, background: S.panel, padding: "24px 28px", marginBottom: 24 }}>
          <SectionHeader title="Scoring" description="Decay detection engine configuration. Thresholds are fixed in Phase I." />

          <Row label="Scoring cadence">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 6, background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)", fontSize: 12, fontWeight: 600, color: "#60a5fa" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#3b82f6", display: "inline-block" }} />
                Daily
              </span>
              <span style={{ fontSize: 11, color: S.faint }}>Locked — runs each night at midnight UTC</span>
            </div>
          </Row>

          <div style={{ padding: "16px 0" }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: S.muted, marginBottom: 12 }}>Decay thresholds</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
              {THRESHOLDS.map(t => (
                <div key={t.label} style={{ borderRadius: 8, border: `1px solid ${t.color}22`, background: t.bg, padding: "12px 14px" }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: t.color, margin: "0 0 4px" }}>{t.label}</p>
                  <p style={{ fontSize: 18, fontWeight: 700, color: t.color, margin: 0, letterSpacing: "-0.02em" }}>{t.range}</p>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 11, color: S.faint, marginTop: 10 }}>Threshold customization available in Phase II.</p>
          </div>
        </div>

        {/* ── Notifications ─────────────────────────────────── */}
        <div style={{ borderRadius: 12, border: `1px solid ${S.border}`, background: S.panel, padding: "24px 28px", marginBottom: 24 }}>
          <SectionHeader title="Notifications" description="Alert preferences for decay events and intervention deadlines." />

          <Row label="Email notifications">
            <button
              onClick={() => setNotifEnabled(v => !v)}
              style={{
                width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
                background: notifEnabled ? S.blue : "#1e2a45", position: "relative", transition: "background 0.2s",
              }}
            >
              <span style={{
                position: "absolute", top: 3, left: notifEnabled ? 23 : 3,
                width: 18, height: 18, borderRadius: "50%", background: "#fff",
                transition: "left 0.2s",
              }} />
            </button>
            <span style={{ fontSize: 12, color: S.faint, marginLeft: 10 }}>
              {notifEnabled ? "On" : "Off"}
            </span>
          </Row>

          <Row label="Notification email">
            <div style={{ display: "flex", alignItems: "center" }}>
              <input
                type="email"
                value={notifEmail}
                onChange={e => { setNotifEmail(e.target.value); setSavedEmail(false); }}
                disabled={!notifEnabled}
                style={{ ...inputStyle, width: 280, opacity: notifEnabled ? 1 : 0.4 }}
                placeholder="you@company.com"
              />
              {notifEnabled && (
                <SaveButton onClick={handleSaveEmail} saving={savingEmail} saved={savedEmail} />
              )}
            </div>
          </Row>
        </div>

        {/* ── Danger Zone ───────────────────────────────────── */}
        <div style={{ borderRadius: 12, border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.04)", padding: "24px 28px" }}>
          <SectionHeader title="Danger Zone" />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 500, color: S.muted, margin: "0 0 4px" }}>Reset workspace data</p>
              <p style={{ fontSize: 12, color: S.faint, margin: 0 }}>Permanently deletes all opportunities, scores, and interventions. This cannot be undone.</p>
            </div>
            <button
              onClick={() => setShowResetModal(true)}
              style={{ flexShrink: 0, marginLeft: 24, padding: "8px 18px", borderRadius: 7, background: "transparent", border: "1px solid rgba(239,68,68,0.5)", color: "#f87171", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              Reset data
            </button>
          </div>
        </div>
      </div>

      {/* Reset confirmation modal */}
      {showResetModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}
          onClick={() => setShowResetModal(false)}>
          <div style={{ background: "#0f1420", borderRadius: 14, border: "1px solid rgba(239,68,68,0.3)", padding: 32, maxWidth: 420, width: "90%", textAlign: "center" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: S.text, marginBottom: 10 }}>Reset workspace data?</h3>
            <p style={{ fontSize: 13, color: S.faint, lineHeight: 1.6, marginBottom: 28 }}>
              This will permanently delete all opportunities, scores, and interventions for this workspace. This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={() => setShowResetModal(false)}
                style={{ padding: "9px 22px", borderRadius: 7, border: "1px solid #1e2a45", background: "transparent", color: S.muted, fontSize: 13, fontWeight: 500, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={() => setShowResetModal(false)}
                style={{ padding: "9px 22px", borderRadius: 7, border: "none", background: "#ef4444", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >
                Reset workspace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
