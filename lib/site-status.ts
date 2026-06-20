export const siteHoldActive =
  process.env.NEXT_PUBLIC_SITE_HOLD === "true";

export const siteHoldMessage =
  "Cognitive Empire is undergoing structural reorganization. This page remains active — other sections return as they're ready.";

export const siteHoldExemptPaths: string[] = [
  "/",
  "/signals",
  "/legal",
  "/privacy",
  "/terms",
  "/refund",
  "/cookies",
  "/disclaimer",
];
