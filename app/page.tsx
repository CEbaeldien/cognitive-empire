"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

function EntranceLogoMark() {
  return (
    <div className="relative flex items-center justify-center">
      <div
        className="absolute"
        style={{
          width: 160,
          height: 160,
          background: "radial-gradient(circle, rgba(0,212,255,0.12) 0%, transparent 70%)",
          filter: "blur(20px)",
        }}
      />
      <svg width="88" height="88" viewBox="0 0 88 88" fill="none">
        <polygon
          points="44,4 80.37,22 80.37,66 44,84 7.63,66 7.63,22"
          fill="rgba(0,212,255,0.04)"
          stroke="#00d4ff"
          strokeWidth="1.5"
        />
        <polygon
          points="44,18 68,31 68,57 44,70 20,57 20,31"
          fill="none"
          stroke="#00d4ff"
          strokeWidth="1"
          opacity="0.35"
        />
        <polygon
          points="44,30 56,37 56,51 44,58 32,51 32,37"
          fill="none"
          stroke="#00d4ff"
          strokeWidth="0.8"
          opacity="0.2"
        />
        <text
          x="44"
          y="51"
          textAnchor="middle"
          fill="#00d4ff"
          fontSize="22"
          fontFamily="monospace"
          fontWeight="700"
          letterSpacing="2"
        >
          CE
        </text>
      </svg>
    </div>
  );
}

export default function EntrancePage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(4);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          router.push("/home");
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [router]);

  return (
    <div
      className="min-h-screen bg-[#050505] flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        backgroundImage:
          "radial-gradient(circle, rgba(0,212,255,0.055) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }}
    >
      {/* Ambient center glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(0,212,255,0.04) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center text-center px-8 max-w-lg w-full">
        <EntranceLogoMark />

        <p className="text-[10px] text-[#4b5563] uppercase tracking-[0.45em] mt-10 mb-8">
          Cognitive Empire
        </p>

        <h1 className="text-[2.6rem] leading-tight font-thin text-white tracking-tight mb-5">
          Intelligence. Structure. Execution.
        </h1>

        <p className="text-sm text-[#6b7280] leading-relaxed mb-12 max-w-sm">
          Cognitive Empire builds systems that turn intelligence into operational power.
        </p>

        <button
          onClick={() => router.push("/home")}
          className="w-full max-w-md border border-white/30 text-white text-sm py-3.5 px-6 uppercase tracking-widest hover:border-white/60 hover:bg-white/5 transition-all duration-200"
        >
          Enter Cognitive Empire →
        </button>

        <p className="text-[#3b3b4f] text-xs mt-5 tracking-wider">
          {countdown > 0
            ? `Redirecting to Home in ${countdown}...`
            : "Redirecting..."}
        </p>
      </div>

      <div className="absolute bottom-8 left-0 right-0 flex justify-center">
        <p className="text-[#2e2e42] text-[10px] uppercase tracking-[0.55em]">
          Signal. · Judgment. · Systems.
        </p>
      </div>
    </div>
  );
}
