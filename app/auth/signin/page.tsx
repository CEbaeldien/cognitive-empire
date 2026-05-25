"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const S = {
  bg:     "#080d1a",
  panel:  "#0f1629",
  border: "#1e2a45",
  input:  "#0b101e",
  blue:   "#3b82f6",
  text:   "#f1f5f9",
  muted:  "#94a3b8",
  faint:  "#64748b",
} as const;

export default function SignInPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setError(error.message); return; }
      if (data.session) {
        document.cookie = `sb-auth=1; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
      }
      router.replace("/app");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: S.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, -apple-system, sans-serif", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 40 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(59,130,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 4 L16 10 L4 16 L7 10 Z" fill="#3b82f6" />
            </svg>
          </div>
          <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.025em", color: S.text }}>Drift</span>
        </div>

        {/* Heading */}
        <h1 style={{ fontSize: 24, fontWeight: 700, color: S.text, textAlign: "center", margin: "0 0 32px", letterSpacing: "-0.02em" }}>
          Sign in to Drift
        </h1>

        {/* Card */}
        <div style={{ borderRadius: 12, border: `1px solid ${S.border}`, background: S.panel, padding: "32px" }}>
          <form onSubmit={handleSubmit}>

            {/* Email */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: S.muted, marginBottom: 7 }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@company.com"
                style={{ width: "100%", padding: "10px 13px", borderRadius: 7, border: `1px solid ${S.border}`, background: S.input, color: S.text, fontSize: 14, outline: "none", boxSizing: "border-box" }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: S.muted, marginBottom: 7 }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                style={{ width: "100%", padding: "10px 13px", borderRadius: 7, border: `1px solid ${S.border}`, background: S.input, color: S.text, fontSize: 14, outline: "none", boxSizing: "border-box" }}
              />
            </div>

            {/* Error */}
            {error && (
              <div style={{ marginBottom: 18, padding: "10px 13px", borderRadius: 7, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171", fontSize: 13, lineHeight: 1.5 }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{ width: "100%", padding: "11px", borderRadius: 7, background: S.blue, border: "none", color: "#fff", fontSize: 15, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.65 : 1, letterSpacing: "-0.01em", transition: "opacity 0.15s" }}
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>

            {/* Forgot */}
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <a href="#" style={{ fontSize: 13, color: S.faint, textDecoration: "none" }}>
                Forgot password?
              </a>
            </div>
          </form>
        </div>

        {/* Sign up */}
        <div style={{ marginTop: 24, textAlign: "center" }}>
          <p style={{ fontSize: 13, color: S.faint, margin: 0 }}>
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" style={{ color: S.blue, textDecoration: "none", fontWeight: 500 }}>
              Start your trial
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
