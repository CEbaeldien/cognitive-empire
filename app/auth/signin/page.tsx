"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const S = {
  bg:           "#09091c",
  panel:        "#0e0c1f",
  border:       "#1c1a35",
  input:        "#07071a",
  accent:       "#00E0FF",
  accentBg:     "rgba(0,224,255,0.08)",
  accentBorder: "rgba(0,224,255,0.25)",
  text:         "#f1f5f9",
  muted:        "#94a3b8",
  faint:        "#64748b",
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
          <div style={{ width: 44, height: 44, borderRadius: 12, background: S.accentBg, border: `1px solid ${S.accentBorder}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <circle cx="4"  cy="4"  r="1.5" fill={S.accent} />
              <circle cx="10" cy="4"  r="1.5" fill={S.accent} />
              <circle cx="16" cy="4"  r="1.5" fill={S.accent} />
              <circle cx="4"  cy="10" r="1.5" fill={S.accent} />
              <circle cx="10" cy="10" r="1.5" fill={S.accent} />
              <circle cx="16" cy="10" r="1.5" fill={S.accent} />
              <circle cx="4"  cy="16" r="1.5" fill={S.accent} />
              <circle cx="10" cy="16" r="1.5" fill={S.accent} />
              <circle cx="16" cy="16" r="1.5" fill={S.accent} />
            </svg>
          </div>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.5em", textTransform: "uppercase", color: S.accent, marginBottom: 4 }}>CE Admin</span>
          <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.025em", color: S.text }}>Cognitive Empire</span>
        </div>

        {/* Heading */}
        <h1 style={{ fontSize: 24, fontWeight: 700, color: S.text, textAlign: "center", margin: "0 0 32px", letterSpacing: "-0.02em" }}>
          Sign in to CE Admin
        </h1>

        {/* Card */}
        <div style={{ borderRadius: 12, border: `1px solid ${S.border}`, background: S.panel, padding: "32px" }}>

          {/* GitHub OAuth */}
          <button
            type="button"
            onClick={() => supabase.auth.signInWithOAuth({ provider: "github", options: { redirectTo: window.location.origin + "/auth/callback" } })}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "11px", borderRadius: 7, background: "#161b22", border: `1px solid ${S.accentBorder}`, color: S.text, fontSize: 15, fontWeight: 600, cursor: "pointer", letterSpacing: "-0.01em", marginBottom: 20 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844a9.59 9.59 0 012.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            Continue with GitHub
          </button>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: S.border }} />
            <span style={{ fontSize: 12, color: S.faint }}>or</span>
            <div style={{ flex: 1, height: 1, background: S.border }} />
          </div>

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
              style={{ width: "100%", padding: "11px", borderRadius: 7, background: S.accent, border: "none", color: "#000", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.65 : 1, letterSpacing: "-0.01em", transition: "opacity 0.15s" }}
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

        <div style={{ marginTop: 24, textAlign: "center" }}>
          <p style={{ fontSize: 11, color: S.faint, margin: 0, letterSpacing: "0.05em" }}>
            Cognitive Empire · Internal Access Only
          </p>
        </div>

      </div>
    </div>
  );
}
