"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export const C = {
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
  input:        "#0a0919",
} as const;

const IcoSignal = () => (
  <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="2.5" fill="currentColor" />
    <path d="M10 1 L10 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    <path d="M10 14 L10 19" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    <path d="M1 10 L6 10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    <path d="M14 10 L19 10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
  </svg>
);

const IcoList = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);

const IcoPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IcoChevron = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const IcoReview = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
  </svg>
);

const NAV: { href: string; label: string; icon: React.ReactNode; badge?: boolean }[] = [
  { href: "/ce-admin/signals",        label: "All Signals",   icon: <IcoList /> },
  { href: "/ce-admin/signals/review", label: "Review Queue",  icon: <IcoReview />, badge: true },
  { href: "/ce-admin/signals/new",    label: "New Signal",    icon: <IcoPlus /> },
];

function isNavActive(href: string, pathname: string): boolean {
  if (href === "/ce-admin/signals/new") return pathname === "/ce-admin/signals/new";
  if (href === "/ce-admin/signals/review") {
    return pathname === "/ce-admin/signals/review" || pathname.endsWith("/review");
  }
  // "All Signals": list page + signal detail edit pages
  return (
    pathname === "/ce-admin/signals" ||
    (pathname.startsWith("/ce-admin/signals/") &&
      pathname !== "/ce-admin/signals/new" &&
      pathname !== "/ce-admin/signals/review" &&
      !pathname.endsWith("/review"))
  );
}

export default function SignalsAdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();

  const [authChecked,  setAuthChecked]  = useState(false);
  const [userEmail,    setUserEmail]    = useState<string | null>(null);
  const [showProfile,  setShowProfile]  = useState(false);
  const [reviewCount,  setReviewCount]  = useState<number | null>(null);
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
    fetch("/api/signals?status=in_review&limit=1")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setReviewCount(d.total ?? 0); })
      .catch(() => {});
  }, [pathname]);

  useEffect(() => {
    if (!showProfile) return;
    function onClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
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

      {/* ── SIDEBAR ─────────────────────────────────────────────────────────── */}
      <aside style={{ width: 224, flexShrink: 0, display: "flex", flexDirection: "column", height: "100%", background: C.sidebar, borderRight: `1px solid ${C.border}` }}>

        {/* Brand */}
        <div style={{ padding: "18px 20px 14px" }}>
          <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.5em", textTransform: "uppercase", color: C.accent, margin: "0 0 6px" }}>CE Admin</p>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: C.accentBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `1px solid ${C.accentBorder}`, color: C.accent }}>
              <IcoSignal />
            </div>
            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.025em", color: C.text }}>Signals</span>
          </div>
        </div>

        <div style={{ margin: "0 16px", borderTop: `1px solid ${C.border}` }} />

        {/* Nav */}
        <nav style={{ padding: "12px 10px", flex: 1, overflow: "auto" }}>
          <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.45em", textTransform: "uppercase", color: C.faint, padding: "0 10px", marginBottom: 6 }}>Navigation</p>
          {NAV.map(({ href, label, icon, badge }) => {
            const active = isNavActive(href, pathname);
            const count = badge && reviewCount != null ? reviewCount : null;
            return (
              <Link key={href} href={href} style={{ textDecoration: "none", display: "block" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
                  borderRadius: 8, marginBottom: 2,
                  background: active ? C.accentBg : "transparent",
                  border:     active ? `1px solid ${C.accentBorder}` : "1px solid transparent",
                  color:      active ? C.accent : C.faint,
                  fontSize: 13, fontWeight: active ? 600 : 400,
                  transition: "all 0.15s",
                }}>
                  <span style={{ opacity: active ? 1 : 0.6 }}>{icon}</span>
                  <span style={{ flex: 1 }}>{label}</span>
                  {count != null && count > 0 && (
                    <span style={{ padding: "1px 7px", borderRadius: 10, background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.3)", color: "#fbbf24", fontSize: 10, fontWeight: 700 }}>
                      {count}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        <div style={{ margin: "0 16px", borderTop: `1px solid ${C.border}` }} />

        {/* Profile */}
        <div style={{ position: "relative", padding: "12px 14px" }} ref={profileRef}>
          <button
            onClick={() => setShowProfile((v) => !v)}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "7px 8px", borderRadius: 8, cursor: "pointer", background: "transparent", border: "none", color: C.text }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: `linear-gradient(135deg, ${C.accent}55, #003344)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0, color: C.text }}>
                E
              </div>
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

      {/* ── MAIN ────────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <main style={{ flex: 1, overflowY: "auto", background: C.bg }}>
          {children}
        </main>
        <footer style={{ flexShrink: 0, borderTop: `1px solid ${C.border}`, background: C.bg, padding: "8px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, color: C.faint }}>Cognitive Empire · Signals Admin</span>
          <span style={{ fontSize: 11, color: C.faint }}>No signal publishes without human review approval</span>
        </footer>
      </div>
    </div>
  );
}
