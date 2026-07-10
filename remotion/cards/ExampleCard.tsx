import React from "react";
import { AbsoluteFill } from "remotion";
import { COLORS, FONT_MONO, FONT_SANS } from "../theme";
import { FadeIn } from "./FadeIn";
import { RevealText } from "./RevealText";

export const ExampleCard: React.FC<{ text: string; durationInFrames: number }> = ({
  text,
  durationInFrames,
}) => (
  <AbsoluteFill style={{ justifyContent: "center", alignItems: "flex-start", padding: "0 120px" }}>
    <FadeIn>
      <div
        style={{
          fontFamily: FONT_MONO,
          fontSize: 24,
          fontWeight: 500,
          letterSpacing: 4,
          color: COLORS.gold,
          textTransform: "uppercase",
          marginBottom: 36,
        }}
      >
        Example
      </div>
      <RevealText
        text={text}
        durationInFrames={durationInFrames}
        style={{
          fontFamily: FONT_SANS,
          fontWeight: 400,
          fontSize: 48,
          lineHeight: 1.42,
          color: COLORS.white,
          textAlign: "left",
        }}
      />
    </FadeIn>
  </AbsoluteFill>
);
