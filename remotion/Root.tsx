import React from "react";
import { Composition } from "remotion";
import { BriefVideo } from "./BriefVideo";
import { briefVideoSchema, type BriefVideoProps } from "./types";

const defaultProps: BriefVideoProps = {
  segments: [
    {
      type: "hook",
      audioFile: "silence.mp3",
      durationInFrames: 90,
      cards: [{ text: "Sample hook line.", durationInFrames: 90 }],
    },
  ],
  fps: 30,
  width: 1080,
  height: 1920,
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="BriefVideo"
      component={BriefVideo}
      schema={briefVideoSchema}
      fps={30}
      width={1080}
      height={1920}
      durationInFrames={90}
      defaultProps={defaultProps}
      calculateMetadata={async ({ props }) => {
        const total = props.segments.reduce((sum, s) => sum + s.durationInFrames, 0);
        return {
          durationInFrames: total > 0 ? total : 90,
          fps: props.fps,
          width: props.width,
          height: props.height,
        };
      }}
    />
  );
};
