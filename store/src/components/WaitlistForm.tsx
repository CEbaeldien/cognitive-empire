"use client";

import { useState } from "react";

export default function WaitlistForm({ product }: { product: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, product }),
      });
      if (!res.ok) throw new Error("request failed");
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div
        style={{
          border: "1px solid var(--ce-border-gold)",
          background: "rgba(201,169,97,0.06)",
          borderRadius: 6,
          padding: "14px 18px",
          color: "var(--ce-gold)",
          fontSize: "0.85rem",
        }}
      >
        You&rsquo;re on the list. We&rsquo;ll email you the moment checkout opens.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@company.com"
        style={{
          flex: "1 1 220px",
          background: "var(--ce-surface)",
          border: "1px solid var(--ce-border)",
          borderRadius: 5,
          padding: "11px 14px",
          color: "var(--ce-text)",
          fontSize: "0.85rem",
          outline: "none",
        }}
      />
      <button
        type="submit"
        disabled={status === "loading"}
        style={{
          background: "var(--ce-gold)",
          color: "#03050A",
          fontWeight: 700,
          fontSize: "0.78rem",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          border: "none",
          borderRadius: 5,
          padding: "11px 20px",
          cursor: status === "loading" ? "default" : "pointer",
          opacity: status === "loading" ? 0.7 : 1,
        }}
      >
        {status === "loading" ? "Joining…" : "Join the list"}
      </button>
      {status === "error" && (
        <p style={{ width: "100%", color: "#e87070", fontSize: "0.78rem", margin: 0 }}>
          Something went wrong. Please try again or email founder@cognitiveempire.com.
        </p>
      )}
    </form>
  );
}
