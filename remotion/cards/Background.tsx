import React from "react";
import { AbsoluteFill } from "remotion";

// Adapts the site's .ce-grid hero texture (faint 1px grid + soft gold glow)
// for video so beats read as one branded system, not plain slides.
export const Background: React.FC = () => (
  <AbsoluteFill>
    <AbsoluteFill
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
        backgroundSize: "64px 64px",
      }}
    />
    <AbsoluteFill
      style={{
        background: "radial-gradient(circle at 50% 30%, rgba(201,169,97,0.05), transparent 55%)",
      }}
    />
  </AbsoluteFill>
);
