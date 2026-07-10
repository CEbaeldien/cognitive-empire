import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { COLORS, FONT_MONO } from "./theme";
import type { BriefVideoProps, Segment, Card as CardData } from "./types";
import { HookCard } from "./cards/HookCard";
import { StructuralClaimCard } from "./cards/StructuralClaimCard";
import { ExampleCard } from "./cards/ExampleCard";
import { OperatorMoveCard } from "./cards/OperatorMoveCard";
import { DoctrineCloseCard } from "./cards/DoctrineCloseCard";
import { CEMark } from "./cards/CEMark";
import { Background } from "./cards/Background";

const CARD_BY_TYPE: Record<Segment["type"], React.FC<{ text: string; durationInFrames: number }>> = {
  hook: HookCard,
  claim: StructuralClaimCard,
  example: ExampleCard,
  move: OperatorMoveCard,
  close: DoctrineCloseCard,
};

function withOffsets<T extends { durationInFrames: number }>(items: T[]): Array<T & { from: number }> {
  const result: Array<T & { from: number }> = [];
  for (const item of items) {
    const from = result.length ? result[result.length - 1].from + result[result.length - 1].durationInFrames : 0;
    result.push({ ...item, from });
  }
  return result;
}

export const BriefVideo: React.FC<BriefVideoProps> = ({ segments }) => {
  const placedSegments = withOffsets(segments);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      <Background />

      {placedSegments.map((segment, i) => {
        const Card = CARD_BY_TYPE[segment.type];
        const placedCards = withOffsets<CardData>(segment.cards);

        return (
          <Sequence key={i} from={segment.from} durationInFrames={segment.durationInFrames}>
            <Audio src={staticFile(segment.audioFile)} />
            {placedCards.map((card, j) => (
              <Sequence key={j} from={card.from} durationInFrames={card.durationInFrames}>
                <Card text={card.text} durationInFrames={card.durationInFrames} />
              </Sequence>
            ))}
          </Sequence>
        );
      })}

      <AbsoluteFill
        style={{
          justifyContent: "flex-end",
          alignItems: "center",
          paddingBottom: 64,
          pointerEvents: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, opacity: 0.35 }}>
          <CEMark size={22} color={COLORS.gold} />
          <span style={{ fontFamily: FONT_MONO, fontSize: 18, letterSpacing: 3, color: COLORS.white }}>
            COGNITIVE EMPIRE
          </span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
