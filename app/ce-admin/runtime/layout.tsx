"use client";

import { useEffect, useState } from "react";
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

const NAV_CROSS = [
  { href: "/ce-admin/dr-e", label: "Dr. E" },
];

const NAV = [
  { href: "/ce-admin/runtime",         label: "Dashboard" },
  { href: "/ce-admin/runtime/control", label: "Control Panel" },
];

const GridIcon = () => (
  <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
    <circle cx="4"  cy="4"  r="1.5" fill="currentColor" />
    <circle cx="10" cy="4"  r="1.5" fill="currentColor" />
    <circle cx="16" cy="4"  r="1.5" fill="currentColor" />
    <circle cx="4"  cy="10" r="1.5" fill="currentColor" />
    <circle cx="10" cy="10" r="1.5" fill="currentColor" />
    <circle cx="16" cy="10" r="1.5" fill="currentColor" />
    <circle cx="4"  cy="16" r="1.5" fill="currentColor" />
    <circle cx="10" cy="16" r="1.5" fill="currentColor" />
    <circle cx="16" cy="16" r="1.5" fill="currentColor" />
  </svg>
);

export default function RuntimeAdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email !== "founder@cognitiveempire.com") {
        router.replace("/auth/signin");
        return;
      }
      setAuthChecked(true);
    });
  }, [router]);

  if (!authChecked) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <p style={{ fontSize: 13, color: C.faint }}>Checking authorization…</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: C.bg, color: C.text, fontFamily: "system-ui, -apple-system, sans-serif", WebkitFontSmoothing: "antialiased" }}>

      {/* ── SIDEBAR ────────────────────────────────────────────────────── */}
      <aside style={{ width: 224, flexShrink: 0, display: "flex", flexDirection: "column", height: "100%", background: C.sidebar, borderRight: `1px solid ${C.border}` }}>

        {/* Brand */}
        <div style={{ padding: "18px 20px 14px" }}>
          <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.5em", textTransform: "uppercase", color: C.accent, margin: "0 0 6px" }}>CE Admin</p>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: C.accentBg, border: `1px solid ${C.accentBorder}`, color: C.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <GridIcon />
            </div>
            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.025em", color: C.text }}>Runtime</span>
          </div>
        </div>

        <div style={{ margin: "0 16px", borderTop: `1px solid ${C.border}` }} />

        {/* Nav */}
        <nav style={{ padding: "12px 10px", flex: 1 }}>
          <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.45em", textTransform: "uppercase", color: C.faint, padding: "0 10px", marginBottom: 6 }}>CE Admin</p>
          {NAV_CROSS.map(({ href, label }) => (
            <Link key={href} href={href} style={{ textDecoration: "none", display: "block" }}>
              <div style={{
                display: "flex", alignItems: "center", padding: "9px 12px",
                borderRadius: 8, marginBottom: 2,
                background: "transparent",
                border: "1px solid transparent",
                color: C.faint,
                fontSize: 13, fontWeight: 400,
                transition: "all 0.12s",
              }}>
                {label}
              </div>
            </Link>
          ))}
          <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.45em", textTransform: "uppercase", color: C.faint, padding: "14px 10px 6px" }}>Runtime</p>
          {NAV.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href} style={{ textDecoration: "none", display: "block" }}>
                <div style={{
                  display: "flex", alignItems: "center", padding: "9px 12px",
                  borderRadius: 8, marginBottom: 2,
                  background: active ? C.accentBg  : "transparent",
                  border:     active ? `1px solid ${C.accentBorder}` : "1px solid transparent",
                  color:      active ? C.accent : C.faint,
                  fontSize: 13, fontWeight: active ? 600 : 400,
                  transition: "all 0.12s",
                }}>
                  {label}
                </div>
              </Link>
            );
          })}
        </nav>

        <div style={{ margin: "0 16px", borderTop: `1px solid ${C.border}` }} />

        <div style={{ padding: "12px 16px" }}>
          <p style={{ fontSize: 10, color: C.faint, margin: 0 }}>Cognitive Empire · Runtime</p>
        </div>
      </aside>

      {/* ── MAIN ───────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <main style={{ flex: 1, overflowY: "auto", background: C.bg }}>
          {children}
        </main>
        <footer style={{ flexShrink: 0, borderTop: `1px solid ${C.border}`, background: C.bg, padding: "8px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, color: C.faint }}>Cognitive Empire · Runtime Admin</span>
          <span style={{ fontSize: 11, color: C.faint }}>Internal operational registry</span>
        </footer>
      </div>
    </div>
  );
}
