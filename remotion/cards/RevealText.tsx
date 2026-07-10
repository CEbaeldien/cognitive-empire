import React, { useMemo } from "react";
import { interpolate, useCurrentFrame } from "remotion";

// Grows the text word-by-word across the first ~72% of the card's on-screen
// time, then holds at full text — an approximate sync to speech pacing
// without needing real word-level TTS timestamps.
export const RevealText: React.FC<{
  text: string;
  durationInFrames: number;
  style: React.CSSProperties;
}> = ({ text, durationInFrames, style }) => {
  const frame = useCurrentFrame();
  const words = useMemo(() => text.split(/\s+/).filter(Boolean), [text]);
  const revealEnd = Math.max(1, Math.round(durationInFrames * 0.72));

  const visibleCount = Math.min(
    words.length,
    Math.max(
      1,
      Math.ceil(
        interpolate(frame, [0, revealEnd], [0, words.length], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      )
    )
  );

  return <div style={style}>{words.slice(0, visibleCount).join(" ")}</div>;
};
