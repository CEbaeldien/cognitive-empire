import React from "react";
import { AbsoluteFill } from "remotion";
import { COLORS, FONT_MONO, FONT_SANS } from "../theme";
import { FadeIn } from "./FadeIn";
import { RevealText } from "./RevealText";

export const StructuralClaimCard: React.FC<{ text: string; durationInFrames: number }> = ({
  text,
  durationInFrames,
}) => (
  <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 110px" }}>
    <FadeIn>
      <div
        style={{
          fontFamily: FONT_MONO,
          fontSize: 26,
          fontWeight: 500,
          letterSpacing: 4,
          color: COLORS.gold,
          textAlign: "center",
          textTransform: "uppercase",
          marginBottom: 40,
        }}
      >
        The Structural Claim
      </div>
      <RevealText
        text={text}
        durationInFrames={durationInFrames}
        style={{
          fontFamily: FONT_SANS,
          fontWeight: 500,
          fontSize: 62,
          lineHeight: 1.28,
          color: COLORS.white,
          textAlign: "center",
        }}
      />
    </FadeIn>
  </AbsoluteFill>
);
