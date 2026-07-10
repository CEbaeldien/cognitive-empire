import React from "react";
import { AbsoluteFill } from "remotion";
import { COLORS, FONT_MONO, FONT_SANS } from "../theme";
import { PopIn } from "./PopIn";

export const OperatorMoveCard: React.FC<{ text: string; durationInFrames: number }> = ({ text }) => (
  <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 90px" }}>
    <PopIn>
      <div
        style={{
          border: `3px solid ${COLORS.gold}`,
          borderRadius: 16,
          padding: "72px 64px",
        }}
      >
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
          Operator Move
        </div>
        <div
          style={{
            fontFamily: FONT_SANS,
            fontWeight: 700,
            fontSize: 54,
            lineHeight: 1.3,
            color: COLORS.white,
            textAlign: "center",
          }}
        >
          {text}
        </div>
      </div>
    </PopIn>
  </AbsoluteFill>
);
