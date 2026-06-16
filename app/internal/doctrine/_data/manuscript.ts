import manuscriptContent from "@/lib/doctrine/manuscript-content.json";

export interface ManuscriptChapter {
  id: string;
  title: string;
  html: string;
}

export interface ManuscriptPart {
  id: string;
  label: string;
  chapterIds: string[];
}

export const manuscriptParts: ManuscriptPart[] = [
  { id: "part-i", label: "Part I — The Structural Shift", chapterIds: ["ch1", "ch2", "ch3"] },
  { id: "part-ii", label: "Part II — The Operator OS", chapterIds: ["ch4", "ch5", "ch6", "ch7"] },
  { id: "part-iii", label: "Part III — Agency & Markets", chapterIds: ["ch8", "ch9", "ch10"] },
  { id: "part-iv", label: "Part IV — Work & Identity", chapterIds: ["ch11", "ch12"] },
  { id: "part-v", label: "Part V — Operational Continuity", chapterIds: ["ch13", "ch14", "ch15"] },
  { id: "part-vi", label: "Part VI — The Horizon", chapterIds: ["ch16", "ch17"] },
  { id: "part-vii", label: "Part VII — Pressure & Consequence", chapterIds: ["ch18", "ch19"] },
  {
    id: "part-viii",
    label: "Part VIII — Artifacts",
    chapterIds: ["appendix-a", "appendix-b", "appendix-c", "appendix-d", "epilogue"],
  },
];

const content = manuscriptContent as Record<string, { title: string; html: string }>;

export const manuscriptChapters: ManuscriptChapter[] = manuscriptParts.flatMap((part) =>
  part.chapterIds.map((id) => ({
    id,
    title: content[id].title,
    html: content[id].html,
  }))
);

export function getChapter(id: string): ManuscriptChapter | undefined {
  return manuscriptChapters.find((c) => c.id === id);
}

export function getPartForChapter(chapterId: string): ManuscriptPart | undefined {
  return manuscriptParts.find((p) => p.chapterIds.includes(chapterId));
}

export const manuscriptTitle = "Intelligence Is Abundant. Judgment Is Power.";
export const manuscriptSubtitle = "The Operator Kernel for Intelligence-Abundant Systems";
export const manuscriptDescription =
  "A doctrine text for operators, architects, and institutions navigating the structural consequences of abundant intelligence.";
