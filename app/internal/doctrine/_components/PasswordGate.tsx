"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CEMark } from "@/app/components/CEMark";

export function PasswordGate() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/internal/doctrine/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Access denied.");
        setLoading(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Connection failed. Try again.");
      setLoading(false);
    }
  }

  return (
    <div
      className="ce-doctrine ce-reveal"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="command-card"
        style={{ width: "100%", maxWidth: 380, padding: "40px 32px" }}
      >
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              border: "1px solid var(--ce-gold-border)",
              background: "var(--ce-gold-soft)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CEMark style={{ width: 26, height: 26, color: "var(--ce-gold)" }} />
          </div>
        </div>

        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--ce-gold)",
              marginBottom: 6,
            }}
          >
            Restricted Access
          </div>
          <div style={{ fontSize: 20, fontWeight: 600, color: "var(--ce-white)", letterSpacing: "-0.02em" }}>
            CE Doctrine OS
          </div>
          <div style={{ fontSize: 12, color: "var(--ce-muted)", marginTop: 4 }}>
            Operator Kernel Internal Console
          </div>
        </div>

        <label
          style={{
            display: "block",
            fontSize: 11,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--ce-dim)",
            marginBottom: 8,
          }}
        >
          Password
        </label>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            background: "var(--ce-navy)",
            border: "1px solid var(--ce-border)",
            borderRadius: 10,
            padding: "11px 14px",
            color: "var(--ce-text)",
            fontSize: 14,
            outline: "none",
          }}
        />

        {error && (
          <div style={{ marginTop: 12, fontSize: 12.5, color: "#e2887a" }}>{error}</div>
        )}

        <button
          type="submit"
          disabled={loading || !password}
          style={{
            width: "100%",
            marginTop: 20,
            padding: "12px 0",
            borderRadius: 10,
            border: "1px solid var(--ce-gold-border)",
            background: loading ? "var(--ce-gold-soft)" : "var(--ce-gold)",
            color: loading ? "var(--ce-gold)" : "#1a1306",
            fontWeight: 600,
            fontSize: 13.5,
            letterSpacing: "0.02em",
            cursor: loading || !password ? "default" : "pointer",
            opacity: !password ? 0.6 : 1,
            transition: "all 150ms ease",
          }}
        >
          {loading ? "Verifying…" : "Enter Console"}
        </button>

        <div style={{ marginTop: 20, fontSize: 11, color: "var(--ce-dim)", textAlign: "center", lineHeight: 1.5 }}>
          Internal use only. Not indexed. Not linked from any public surface.
        </div>
      </form>
    </div>
  );
}
