// Single source of truth for "is this brief eligible to be queued for local
// video rendering" — imported by both app/api/content/render/route.ts
// (Next.js, decides whether a click is allowed) and scripts/render-queue.mjs
// (Node CLI, decides what to pick up). Plain JS (no TS, no Node-only APIs)
// so both runtimes can import it directly with zero build step.
//
// The actual TTS + Remotion render pipeline is NOT shared here on purpose:
// it takes 2-5 minutes and needs @remotion/renderer's headless Chrome, which
// cannot run inside a Vercel serverless/edge function (see maxDuration=10
// convention across every route in this app). Only the local CLI queue
// script ever calls scripts/lib/render-core.mjs.

export const RENDERABLE_STATUSES = ["approved", "render_failed", "rendered"];

export function validateRenderRequest(brief) {
  if (!brief) return { ok: false, error: "Brief not found." };
  if (brief.format !== "short") {
    return { ok: false, error: "Only Short-format briefs can be rendered." };
  }
  if (!RENDERABLE_STATUSES.includes(brief.status)) {
    return { ok: false, error: "Only approved Short briefs can be rendered." };
  }
  return { ok: true };
}

// Fields to write when a brief is queued (first time, or retry/re-render).
export function queueFields() {
  return { status: "approved", render_queued: true, error_note: null };
}
