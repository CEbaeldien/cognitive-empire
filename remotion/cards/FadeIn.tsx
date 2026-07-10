import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

export const FadeIn: React.FC<{ children: React.ReactNode; delay?: number; frames?: number }> = ({
  children,
  delay = 0,
  frames = 18,
}) => {
  const frame = useCurrentFrame();
  const local = frame - delay;
  const opacity = interpolate(local, [0, frames], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const y = interpolate(local, [0, frames], [16, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return <div style={{ opacity, transform: `translateY(${y}px)` }}>{children}</div>;
};
