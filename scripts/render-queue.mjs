// Content Engine — unattended batch render queue.
// Usage: node scripts/render-queue.mjs
// Processes every brief flagged render_queued (via the "Generate Video"
// button on /ce-admin/content/new, or set directly) sequentially — one
// Remotion render at a time, since local CPU can't handle parallel renders
// well. One brief failing never stops the queue; it's marked render_failed
// and the run continues.

import {
  loadEnvLocal,
  getServiceClient,
  assertRenderable,
  renderBrief,
} from "./lib/render-core.mjs";

loadEnvLocal();

async function fetchQueue(sb) {
  const { data, error } = await sb
    .from("content_briefs")
    .select("*")
    .eq("format", "short")
    .eq("status", "approved")
    .eq("render_queued", true)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Queue fetch failed: ${error.message}`);
  return data ?? [];
}

async function markRendering(sb, id) {
  const { error } = await sb.from("content_briefs").update({ status: "rendering" }).eq("id", id);
  if (error) throw new Error(`Failed to mark ${id} as rendering: ${error.message}`);
}

async function markRendered(sb, id, outputLocation) {
  const { error } = await sb
    .from("content_briefs")
    .update({
      status: "rendered",
      rendered_video_path: outputLocation,
      rendered_at: new Date().toISOString(),
      render_queued: false,
      error_note: null,
    })
    .eq("id", id);
  if (error) throw new Error(`Failed to mark ${id} as rendered: ${error.message}`);
}

async function markFailed(sb, id, message) {
  const { error } = await sb
    .from("content_briefs")
    .update({ status: "render_failed", render_queued: false, error_note: message.slice(0, 2000) })
    .eq("id", id);
  if (error) console.error(`  Also failed to write error_note for ${id}: ${error.message}`);
}

async function main() {
  const sb = getServiceClient();

  console.log("Fetching render queue (format=short, status=approved, render_queued=true)...");
  const queue = await fetchQueue(sb);

  if (queue.length === 0) {
    console.log("Nothing to render. 0 rendered, 0 failed, 0 skipped.");
    return;
  }

  console.log(`Queue: ${queue.length} brief(s).\n`);

  let rendered = 0;
  let failed = 0;
  const skipped = 0;

  for (let i = 0; i < queue.length; i++) {
    const brief = queue[i];
    console.log(`[${i + 1}/${queue.length}] "${brief.title ?? brief.id}"`);

    try {
      assertRenderable(brief);
      await markRendering(sb, brief.id);
      const { outputLocation, totalSeconds } = await renderBrief(brief);
      await markRendered(sb, brief.id, outputLocation);
      console.log(`  -> rendered (${totalSeconds.toFixed(1)}s): ${outputLocation}\n`);
      rendered++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`  -> FAILED: ${message}\n`);
      await markFailed(sb, brief.id, message);
      failed++;
    }
  }

  console.log(`${rendered} rendered, ${failed} failed, ${skipped} skipped (already rendered).`);
}

main().catch((err) => {
  console.error("render-queue failed:", err);
  process.exit(1);
});
