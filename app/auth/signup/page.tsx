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

const TIERS = [
  { id: "operator", label: "Operator", price: "$149/mo", desc: "1–4 clients" },
  { id: "pro",      label: "Pro",      price: "$249/mo", desc: "5–15 clients" },
] as const;

type Tier = (typeof TIERS)[number]["id"];

export default function SignUpPage() {
  const router = useRouter();
  const [name,            setName]            = useState("");
  const [email,           setEmail]           = useState("");
  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [tier,            setTier]            = useState<Tier>("pro");
  const [error,           setError]           = useState<string | null>(null);
  const [success,         setSuccess]         = useState(false);
  const [loading,         setLoading]         = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name, tier },
        },
      });
      if (error) { setError(error.message); return; }

      if (data.session) {
        document.cookie = `sb-auth=1; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
        router.replace("/app");
      } else {
        // Email confirmation required
        setSuccess(true);
      }
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div style={{ minHeight: "100vh", background: S.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, -apple-system, sans-serif", padding: "24px" }}>
        <div style={{ width: "100%", maxWidth: 400, textAlign: "center" }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(34,197,94,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: S.text, marginBottom: 10, letterSpacing: "-0.02em" }}>Check your email</h2>
          <p style={{ fontSize: 14, color: S.muted, lineHeight: 1.6, marginBottom: 28 }}>
            We sent a confirmation link to <strong style={{ color: S.text }}>{email}</strong>. Click it to activate your account.
          </p>
          <Link href="/auth/signin" style={{ fontSize: 13, color: S.blue, textDecoration: "none" }}>Back to sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: S.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, -apple-system, sans-serif", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(59,130,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 4 L16 10 L4 16 L7 10 Z" fill="#3b82f6" />
            </svg>
          </div>
          <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.025em", color: S.text }}>Drift</span>
        </div>

        {/* Heading */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: S.text, margin: "0 0 8px", letterSpacing: "-0.02em" }}>
            Start your free trial
          </h1>
          <p style={{ fontSize: 14, color: S.faint, margin: 0 }}>14 days free. No credit card required.</p>
        </div>

        {/* Card */}
        <div style={{ borderRadius: 12, border: `1px solid ${S.border}`, background: S.panel, padding: "32px" }}>
          <form onSubmit={handleSubmit}>

            {/* Full name */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: S.muted, marginBottom: 7 }}>Full name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                autoComplete="name"
                placeholder="Jane Smith"
                style={{ width: "100%", padding: "10px 13px", borderRadius: 7, border: `1px solid ${S.border}`, background: S.input, color: S.text, fontSize: 14, outline: "none", boxSizing: "border-box" }}
              />
            </div>

            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: S.muted, marginBottom: 7 }}>Email</label>
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
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: S.muted, marginBottom: 7 }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="Min. 8 characters"
                style={{ width: "100%", padding: "10px 13px", borderRadius: 7, border: `1px solid ${S.border}`, background: S.input, color: S.text, fontSize: 14, outline: "none", boxSizing: "border-box" }}
              />
            </div>

            {/* Confirm password */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: S.muted, marginBottom: 7 }}>Confirm password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="••••••••"
                style={{ width: "100%", padding: "10px 13px", borderRadius: 7, border: `1px solid ${S.border}`, background: S.input, color: S.text, fontSize: 14, outline: "none", boxSizing: "border-box" }}
              />
            </div>

            {/* Tier selector */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: S.muted, marginBottom: 10 }}>Plan</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {TIERS.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTier(t.id)}
                    style={{
                      padding: "12px 14px",
                      borderRadius: 8,
                      border: tier === t.id ? `1.5px solid ${S.blue}` : `1px solid ${S.border}`,
                      background: tier === t.id ? "rgba(59,130,246,0.08)" : S.input,
                      color: tier === t.id ? S.text : S.muted,
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.1s",
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{t.label}</div>
                    <div style={{ fontSize: 12, color: tier === t.id ? "#94a3b8" : S.faint }}>{t.price}</div>
                    <div style={{ fontSize: 11, color: S.faint, marginTop: 2 }}>{t.desc}</div>
                  </button>
                ))}
              </div>
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
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>
        </div>

        {/* Sign in */}
        <div style={{ marginTop: 24, textAlign: "center" }}>
          <p style={{ fontSize: 13, color: S.faint, margin: 0 }}>
            Already have an account?{" "}
            <Link href="/auth/signin" style={{ color: S.blue, textDecoration: "none", fontWeight: 500 }}>
              Sign in
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
