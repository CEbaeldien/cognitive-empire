import React from "react";
import { AbsoluteFill } from "remotion";
import { COLORS, FONT_SANS } from "../theme";
import { FadeIn } from "./FadeIn";
import { CEMark } from "./CEMark";

export const DoctrineCloseCard: React.FC<{ text: string; durationInFrames: number }> = ({ text }) => (
  <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 130px" }}>
    <FadeIn frames={34}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 48 }}>
        <CEMark size={56} color={COLORS.goldDim} />
      </div>
      <div
        style={{
          fontFamily: FONT_SANS,
          fontWeight: 400,
          fontSize: 44,
          lineHeight: 1.4,
          color: COLORS.whiteDim,
          textAlign: "center",
          letterSpacing: 0.5,
        }}
      >
        {text}
      </div>
    </FadeIn>
  </AbsoluteFill>
);
