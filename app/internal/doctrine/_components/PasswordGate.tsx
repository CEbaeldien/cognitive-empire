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
    <div className="ce-doctrine ce-reveal doctrine-auth-screen">
      <form
        onSubmit={handleSubmit}
        className="doctrine-card doctrine-auth-card"
      >
        <div className="doctrine-auth-mark-wrap">
          <div className="doctrine-brand-mark" style={{ width: 58, height: 58, borderRadius: 15 }}>
            <CEMark style={{ width: 27, height: 27, color: "var(--ce-gold)" }} />
          </div>
        </div>

        <div className="doctrine-auth-copy">
          <div className="doctrine-panel-kicker">Restricted Access</div>
          <div className="doctrine-auth-title">CE Doctrine OS</div>
          <div className="doctrine-auth-subtitle">Operator Kernel Internal Console</div>
        </div>

        <label className="doctrine-auth-label">Password</label>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="doctrine-auth-input"
        />

        {error && (
          <div className="doctrine-auth-error">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading || !password}
          className="doctrine-primary-button"
        >
          {loading ? "Verifying..." : "Enter Console"}
        </button>

        <div className="doctrine-auth-footnote">
          Internal use only. Not indexed. Not linked from any public surface.
        </div>
      </form>
    </div>
  );
}
