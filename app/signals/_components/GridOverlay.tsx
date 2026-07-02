"use client";

import { useEffect, useRef } from "react";

export function GridOverlay() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (!ref.current) return;
      const x = (e.clientX / window.innerWidth  - 0.5) * 10;
      const y = (e.clientY / window.innerHeight - 0.5) * 10;
      ref.current.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)`;
    };
    window.addEventListener("mousemove", handle, { passive: true });
    return () => window.removeEventListener("mousemove", handle);
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: "-30px",
        pointerEvents: "none",
        zIndex: 0,
        backgroundImage: [
          "linear-gradient(rgba(0,229,255,0.026) 1px, transparent 1px)",
          "linear-gradient(90deg, rgba(0,229,255,0.026) 1px, transparent 1px)",
        ].join(", "),
        backgroundSize: "64px 64px",
        transition: "transform 320ms ease-out",
        willChange: "transform",
      }}
    />
  );
}
