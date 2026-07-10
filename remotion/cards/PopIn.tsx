import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

export const PopIn: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const scale = interpolate(frame, [0, 16], [0.92, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return <div style={{ opacity, transform: `scale(${scale})` }}>{children}</div>;
};
