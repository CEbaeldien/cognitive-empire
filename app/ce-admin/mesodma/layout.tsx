"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const C = {
  bg:           "#09091c",
  sidebar:      "#07071a",
  panel:        "#0e0c1f",
  border:       "#1c1a35",
  accent:       "#00E0FF",
  accentBg:     "rgba(0,224,255,0.08)",
  accentBorder: "rgba(0,224,255,0.25)",
  text:         "#f1f5f9",
  muted:        "#94a3b8",
  faint:        "#64748b",
} as const;

const IcoIngest = () => (
  <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
    <rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M14.5 11v6M11.5 14h6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
  </svg>
);

const IcoSignal = () => (
  <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="2.5" fill="currentColor" />
    <path d="M10 1 L10 6M10 14 L10 19M1 10 L6 10M14 10 L19 10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
  </svg>
);

const IcoChevron = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const IcoGrid = () => (
  <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
    <rect x="2" y="2" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
    <rect x="11" y="2" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
    <rect x="2" y="11" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
    <rect x="11" y="11" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const IcoDot = () => (
  <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="10" cy="10" r="1" fill="currentColor" />
  </svg>
);

const IcoTrash = () => (
  <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
    <path d="M3 5h14M8 5V3h4v2M5 5l1 12h8l1-12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IcoLog = () => (
  <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
    <rect x="3" y="2" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const IcoBook = () => (
  <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
    <path d="M4 3h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5" />
    <path d="M10 3v14M7 7h2M7 10h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const IcoEye = () => (
  <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
    <path d="M1 10s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7z" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const NAV_MESODMA = [
  { href: "/ce-admin/mesodma",                    label: "Cockpit",             icon: <IcoGrid /> },
  { href: "/ce-admin/mesodma/first-pass-signals",  label: "First-Pass Signals", icon: <IcoSignal /> },
  { href: "/ce-admin/mesodma/candidate-evidence",  label: "Candidate Evidence", icon: <IcoDot /> },
  { href: "/ce-admin/mesodma/noise-corner",         label: "Noise Corner",       icon: <IcoTrash /> },
  { href: "/ce-admin/mesodma/runs-log",             label: "Runs Log",           icon: <IcoLog /> },
  { href: "/ce-admin/mesodma/training-examples",    label: "Training Examples",  icon: <IcoBook /> },
];

const NAV_CROSS = [
  { href: "/ce-admin/dr-e",    label: "Dr. E",         icon: <IcoSignal /> },
  { href: "/ce-admin/signals", label: "Signals Admin",  icon: <IcoEye /> },
];

export default function MesodmaAdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();

  const [authChecked, setAuthChecked] = useState(false);
  const [userEmail,   setUserEmail]   = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const email = session?.user?.email ?? null;
      setUserEmail(email);
      if (email !== "founder@cognitiveempire.com") {
        router.replace("/auth/signin");
        return;
      }
      setAuthChecked(true);
    });
  }, [router]);

  useEffect(() => {
    if (!showProfile) return;
    function onOut(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
    }
    document.addEventListener("mousedown", onOut);
    return () => document.removeEventListener("mousedown", onOut);
  }, [showProfile]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    document.cookie = "sb-auth=; path=/; max-age=0";
    router.replace("/auth/signin");
  }

  if (!authChecked) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <p style={{ fontSize: 13, color: C.faint }}>Checking authorization…</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: C.bg, color: C.text, fontFamily: "system-ui, -apple-system, sans-serif", WebkitFontSmoothing: "antialiased" }}>

      {/* SIDEBAR */}
      <aside style={{ width: 224, flexShrink: 0, display: "flex", flexDirection: "column", height: "100%", background: C.sidebar, borderRight: `1px solid ${C.border}` }}>

        {/* Brand */}
        <div style={{ padding: "18px 20px 14px" }}>
          <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.5em", textTransform: "uppercase", color: C.accent, margin: "0 0 6px" }}>CE Admin</p>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: C.accentBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `1px solid ${C.accentBorder}`, color: C.accent }}>
              <IcoIngest />
            </div>
            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.025em", color: C.text }}>Mesodma</span>
          </div>
        </div>

        <div style={{ margin: "0 16px", borderTop: `1px solid ${C.border}` }} />

        {/* Nav */}
        <nav style={{ padding: "12px 10px", flex: 1, overflow: "auto" }}>
          <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.45em", textTransform: "uppercase", color: C.faint, padding: "0 10px", marginBottom: 6 }}>Mesodma</p>
          {NAV_MESODMA.map(({ href, label, icon }) => {
            const active = href === "/ce-admin/mesodma"
              ? pathname === href
              : pathname.startsWith(href);
            return (
              <Link key={href} href={href} style={{ textDecoration: "none", display: "block" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, marginBottom: 2, background: active ? C.accentBg : "transparent", border: active ? `1px solid ${C.accentBorder}` : "1px solid transparent", color: active ? C.accent : C.faint, fontSize: 13, fontWeight: active ? 600 : 400, transition: "all 0.15s" }}>
                  <span style={{ opacity: active ? 1 : 0.6 }}>{icon}</span>
                  {label}
                </div>
              </Link>
            );
          })}

          <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.45em", textTransform: "uppercase", color: C.faint, padding: "14px 10px 6px" }}>Other Sections</p>
          {NAV_CROSS.map(({ href, label, icon }) => (
            <Link key={href} href={href} style={{ textDecoration: "none", display: "block" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, marginBottom: 2, background: "transparent", border: "1px solid transparent", color: C.faint, fontSize: 13, fontWeight: 400, transition: "all 0.15s" }}>
                <span style={{ opacity: 0.6 }}>{icon}</span>
                {label}
              </div>
            </Link>
          ))}
        </nav>

        <div style={{ margin: "0 16px", borderTop: `1px solid ${C.border}` }} />

        {/* Profile */}
        <div style={{ position: "relative", padding: "12px 14px" }} ref={profileRef}>
          <button
            onClick={() => setShowProfile(v => !v)}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "7px 8px", borderRadius: 8, cursor: "pointer", background: "transparent", border: "none", color: C.text }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: `linear-gradient(135deg, ${C.accent}55, #003344)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0, color: C.text }}>E</div>
              <div style={{ textAlign: "left" }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: C.text, margin: 0 }}>Dr. E</p>
                <p style={{ fontSize: 10, color: C.accent, margin: 0 }}>Admin</p>
              </div>
            </div>
            <span style={{ color: C.faint }}><IcoChevron /></span>
          </button>

          {showProfile && (
            <div style={{ position: "absolute", bottom: "100%", left: 8, right: 8, marginBottom: 8, borderRadius: 12, border: `1px solid ${C.border}`, background: "#0c0b1e", overflow: "hidden", boxShadow: "0 -8px 32px rgba(0,0,0,0.5)" }}>
              {userEmail && (
                <div style={{ borderBottom: `1px solid ${C.border}`, padding: "10px 16px" }}>
                  <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.35em", textTransform: "uppercase", color: C.faint, marginBottom: 3 }}>Signed in as</p>
                  <p style={{ fontSize: 11, color: C.muted }}>{userEmail}</p>
                </div>
              )}
              <button
                onClick={handleSignOut}
                style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "10px 16px", background: "transparent", border: "none", color: C.muted, fontSize: 12, cursor: "pointer", textAlign: "left" }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Sign out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <main style={{ flex: 1, overflowY: "auto", background: C.bg }}>
          {children}
        </main>
        <footer style={{ flexShrink: 0, borderTop: `1px solid ${C.border}`, background: C.bg, padding: "8px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, color: C.faint }}>Cognitive Empire · Mesodma</span>
          <span style={{ fontSize: 11, color: C.faint }}>Signal vs. Noise Engine — Humans review First-Pass Signals only</span>
        </footer>
      </div>
    </div>
  );
}
