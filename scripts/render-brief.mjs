// Content Engine — local Short-to-video renderer, single brief.
// Usage: node scripts/render-brief.mjs <content_brief_id>

import { loadEnvLocal, fetchBriefById, renderBrief } from "./lib/render-core.mjs";

loadEnvLocal();

async function main() {
  const id = process.argv[2];
  if (!id) {
    console.error("Usage: node scripts/render-brief.mjs <content_brief_id>");
    process.exit(1);
  }

  console.log(`Fetching content brief ${id}...`);
  const brief = await fetchBriefById(id);
  console.log(`Loaded "${brief.title}" (status: ${brief.status})`);
  if (brief.status !== "approved" && brief.status !== "reviewed") {
    console.warn(`Note: brief status is "${brief.status}" — rendering anyway.`);
  }

  console.log("Synthesizing audio and rendering video (this can take a minute)...");
  const { outputLocation, totalSeconds } = await renderBrief(brief);

  console.log(`Total composition length: ${totalSeconds.toFixed(1)}s`);
  console.log(`Done. Video written to ${outputLocation}`);
}

main().catch((err) => {
  console.error("render-brief failed:", err);
  process.exit(1);
});
