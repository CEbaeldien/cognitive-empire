import { z } from "zod";

export const cardSchema = z.object({
  text: z.string(),
  durationInFrames: z.number(),
});

export const segmentSchema = z.object({
  type: z.enum(["hook", "claim", "example", "move", "close"]),
  audioFile: z.string(),
  durationInFrames: z.number(),
  cards: z.array(cardSchema),
});

export const briefVideoSchema = z.object({
  segments: z.array(segmentSchema),
  fps: z.number(),
  width: z.number(),
  height: z.number(),
});

export type SegmentType = z.infer<typeof segmentSchema>["type"];
export type Card = z.infer<typeof cardSchema>;
export type Segment = z.infer<typeof segmentSchema>;
export type BriefVideoProps = z.infer<typeof briefVideoSchema>;
