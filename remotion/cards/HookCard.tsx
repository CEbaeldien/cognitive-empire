import React from "react";
import { AbsoluteFill } from "remotion";
import { COLORS, FONT_SANS } from "../theme";
import { FadeIn } from "./FadeIn";

export const HookCard: React.FC<{ text: string; durationInFrames: number }> = ({ text }) => (
  <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 110px" }}>
    <FadeIn>
      <div
        style={{
          fontFamily: FONT_SANS,
          fontWeight: 700,
          fontSize: 84,
          lineHeight: 1.16,
          color: COLORS.white,
          textAlign: "center",
          letterSpacing: -1,
        }}
      >
        {text}
      </div>
      <div
        style={{
          width: 96,
          height: 4,
          background: COLORS.gold,
          margin: "44px auto 0",
          borderRadius: 2,
        }}
      />
    </FadeIn>
  </AbsoluteFill>
);
