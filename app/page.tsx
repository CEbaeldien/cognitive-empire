"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function EntrancePage() {
  const router = useRouter();

  // Silent auto-redirect — no UI shown
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/home");
    }, 4200);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <>
      {/* Button hover — one rule, no animation library */}
      <style>{`.ce-enter:hover{border-color:rgba(59,130,246,0.75)!important;background:rgba(59,130,246,0.13)!important;}`}</style>

      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(160deg,#05070d 0%,#080d1a 55%,#0b1220 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Restrained blue atmospheric radial — CSS only, no animation */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 70% 50% at 50% 44%,rgba(59,130,246,0.07) 0%,transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            padding: "0 32px",
            maxWidth: 520,
            width: "100%",
            gap: 40,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 17,
              lineHeight: 1.8,
              color: "rgba(241,245,249,0.76)",
              letterSpacing: "0.01em",
            }}
          >
            Cognitive Empire turns abundant intelligence into operational power.
          </p>

          <button
            className="ce-enter"
            onClick={() => router.push("/home")}
            style={{
              padding: "13px 28px",
              border: "1px solid rgba(59,130,246,0.45)",
              background: "rgba(59,130,246,0.07)",
              color: "#f1f5f9",
              fontSize: 12,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "border-color 0.18s ease, background 0.18s ease",
              fontFamily: "inherit",
            }}
          >
            Enter Cognitive Empire →
          </button>
        </div>
      </div>
    </>
  );
}
