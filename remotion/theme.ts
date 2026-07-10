import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadGeistMono } from "@remotion/google-fonts/GeistMono";

const { fontFamily: geistFamily } = loadGeist("normal", { weights: ["400", "500", "700"] });
const { fontFamily: geistMonoFamily } = loadGeistMono("normal", { weights: ["400", "500"] });

export const FONT_SANS = geistFamily;
export const FONT_MONO = geistMonoFamily;

export const COLORS = {
  bg: "#03050A",
  gold: "#C9A961",
  goldDim: "rgba(201, 169, 97, 0.45)",
  white: "#EEF3FA",
  whiteDim: "rgba(238, 243, 250, 0.6)",
};
