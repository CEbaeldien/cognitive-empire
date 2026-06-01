# CE Signals — n8n Workflow Activation Guide

All 7 workflows exist as JSON files in `n8n/workflows/`. They must be imported into a running
n8n instance and activated manually. This guide covers the activation order, credential
requirements, and how to do a manual test run of each.

---

## Prerequisites

- A running n8n instance (n8n Cloud, self-hosted, or Railway)
- The CE Signals app deployed at `https://cognitiveempire.com`
- Supabase service role key
- OpenAI API key
- `MESODMA_API_KEY` value from `.env.local` (currently: `ce-mesodma-2026`)

---

## Credentials to Configure in n8n

Before activating any workflow, add these credentials in the n8n UI under **Settings → Credentials**:

| Credential Name | Type | Value |
|---|---|---|
| `CE Supabase Service Key` | HTTP Header Auth | Key: `apikey`, Value: `sb_secret_nGFx1BL5M8sreweA_…` |
| `CE Mesodma Bearer` | HTTP Header Auth | Key: `Authorization`, Value: `Bearer ce-mesodma-2026` |

> The Decay, Review Alert, Source Health, Convergence Scanner, and Stale Cleanup workflows
> call Supabase directly via HTTP Request nodes. Each has the service role key hardcoded —
> replace with the credential reference after import so the key isn't exposed in workflow JSON.

---

## Activation Order

Activate in this order. Each stage depends on the previous one having run at least once.

### Stage 1 — Ingestion (activate first)

**Workflow:** `ce-signals-ingestion.json`
**Schedule:** Every 6 hours (`0 */6 * * *`)
**What it does:** POSTs to `https://cognitiveempire.com/api/mesodma/ingest` with the Bearer
token. Mesodma fetches all active RSS sources, deduplicates against existing `raw_items`,
runs GPT-4o-mini extraction, and writes extracted items to `raw_items`.

**Steps to activate:**
1. In n8n, go to Workflows → Import → paste `n8n/workflows/ce-signals-ingestion.json`
2. Confirm the HTTP Request node targets `https://cognitiveempire.com/api/mesodma/ingest`
3. Confirm the `Authorization` header is `Bearer ce-mesodma-2026`
4. Click **Active** toggle

**Manual test:** Click **Execute Workflow** (without activating). The response body should
contain `sources_processed`, `total_extracted`, `total_skipped`. A `200` with `sources_processed: 0`
means no active sources in the DB — verify the sources table has `is_active = true` rows.

---

### Stage 2 — Source Health Monitor (activate second)

**Workflow:** `ce-signals-source-health.json`
**Schedule:** Daily at 04:00 UTC
**What it does:** Fetches all active sources, checks whether `last_fetched_at` is stale
(older than 2× `fetch_interval`), and marks overdue sources as `ingestion_status = 'blocked'`.
Outputs an alert payload with the source name and blocked reason — wire up an email or
Slack node after the "Alert: Source Blocked" Set node to actually deliver the notification.

**Steps to activate:**
1. Import `n8n/workflows/ce-signals-source-health.json`
2. Optionally add a Send Email or Slack node after "Alert: Source Blocked" to receive alerts
3. Toggle **Active**

**Manual test:** Execute. The Code node (`Check Source Health`) should log either
`all_sources_healthy` or list blocked sources. Check n8n execution log for output.

---

### Stage 3 — Review Alert (activate after first signals reach in_review)

**Workflow:** `ce-signals-review-alert.json`
**Schedule:** Daily at 08:00 UTC
**What it does:** Queries `signals` where `status = in_review`, counts them, and outputs a
summary payload. Add an email or Slack node after "Alert: Signals Pending" to actually
deliver the notification to `founder@cognitiveempire.com`.

**Steps to activate:**
1. Import `ce-signals-review-alert.json`
2. Add notification delivery node (email/Slack) after "Alert: Signals Pending"
3. Toggle **Active**

**Manual test:** Execute. If no signals are `in_review`, the "No Signals In Review" NoOp branch
runs silently. Submit a test signal to review queue first to verify the alert fires.

---

### Stage 4 — Decay (activate after first signals are published)

**Workflow:** `ce-signals-decay.json`
**Schedule:** Weekly, Sundays at 06:00 UTC
**What it does:** Fetches published signals older than 14 days, increments their
`decay_factor` by 0.1 each run, and sets `status = 'decaying'` once `decay_factor ≥ 0.8`.

**Steps to activate:**
1. Import `ce-signals-decay.json`
2. Toggle **Active**

**Manual test:** Execute. With zero published signals the Code node returns early with a
log message. Publish a test signal first, then manually execute to verify the PATCH fires.

---

### Stage 5 — Convergence Scanner, Stale Cleanup, Weekly Summary

**Workflows:** `ce-signals-convergence-scanner.json`, `ce-signals-stale-cleanup.json`,
`ce-signals-weekly-summary.json`

Review each workflow's logic before activating. These are secondary pipelines that operate on
signals already in the DB. Activate them only after Stages 1–4 are running and the signal
table has meaningful data.

**Steps:** Import each, review the trigger schedule and node logic, then toggle **Active**.

---

## Current State (as of 2026-06-01)

| Workflow | File | Status | Notes |
|---|---|---|---|
| Ingestion | `ce-signals-ingestion.json` | Inactive | Must activate first |
| Source Health | `ce-signals-source-health.json` | Inactive | All 18 sources show `last_fetched_at: null` |
| Review Alert | `ce-signals-review-alert.json` | Inactive | Needs notification node wired up |
| Decay | `ce-signals-decay.json` | Inactive | No published signals yet |
| Convergence Scanner | `ce-signals-convergence-scanner.json` | Inactive | Activate after signals published |
| Stale Cleanup | `ce-signals-stale-cleanup.json` | Inactive | Activate after signals published |
| Weekly Summary | `ce-signals-weekly-summary.json` | Inactive | Activate after signals published |

**602 raw_items** are already extracted in the DB (from a prior one-off run) with
`signal_processing_status = pending`. Use the Mesodma Cockpit at `/ce-admin/mesodma`
to promote them to signal drafts without waiting for the n8n ingestion workflow.

---

## Triggering Ingestion Without n8n

To run ingestion manually (e.g., before n8n is configured):

```bash
curl -X POST https://cognitiveempire.com/api/mesodma/ingest \
  -H "Authorization: Bearer ce-mesodma-2026" \
  -H "Content-Type: application/json"
```

Or use the **Run Ingest Now** button in the Mesodma Cockpit at `/ce-admin/mesodma`.

---

## Known Issues to Fix Before Activating

1. **Category mismatch in extracted data**: Mesodma's extraction prompt uses a stale category
   enum (`ai_infrastructure`, `labor_displacement`, etc.) that doesn't match the current
   `signal_category` DB enum (`intelligence`, `physical_systems`, etc.). The `possible_category`
   field in `extracted_fields` JSONB is unreliable. Human curation in the Promote modal
   (which shows the correct categories) is the fix.

2. **Orphaned raw_items**: The 602 existing raw_items reference a source UUID that was
   deleted/replaced when sources were re-seeded. Their `sources` join will return null.
   Future ingestion runs will re-fetch from the same RSS feeds under new source UUIDs,
   potentially creating duplicates if the same `external_id` appears under a different
   `source_id`. Monitor the first ingestion run carefully.

3. **n8n workflows hardcode the service role key** in HTTP Request node headers. After
   import, replace the hardcoded values with n8n Credential references to avoid exposing
   the key in workflow JSON exports.
