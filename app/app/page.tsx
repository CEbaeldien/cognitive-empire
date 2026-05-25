"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function AppPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace("/auth/signin");
        return;
      }
      setEmail(session.user.email ?? null);
    });
  }, [router]);

  if (!email) {
    return (
      <div style={{ minHeight: "100vh", background: "#080d1a", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 13, color: "#475569", fontFamily: "system-ui, sans-serif" }}>Loading…</span>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#080d1a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        {/* Logo */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(59,130,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 4 L16 10 L4 16 L7 10 Z" fill="#3b82f6" />
            </svg>
          </div>
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#f8fafc", letterSpacing: "-0.025em", marginBottom: 10 }}>
          Welcome to Drift
        </h1>
        <p style={{ fontSize: 14, color: "#64748b", marginBottom: 36 }}>{email}</p>

        <Link
          href="/drift/workspace"
          style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 28px", borderRadius: 8, background: "#3b82f6", color: "#fff", textDecoration: "none", fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}
        >
          Go to your workspace
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
