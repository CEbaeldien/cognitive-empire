# CE Signals n8n Workflows

These JSON exports drive the CE Signals ingestion/decay/alerting pipeline in n8n.

## Credential handling

Every HTTP Request node uses a placeholder for secret values — `{{SUPABASE_SERVICE_KEY}}` and
`{{MESODMA_API_KEY}}` — instead of a literal key. **Placeholders are not resolved automatically on
import.** After importing a workflow into n8n:

1. Open each HTTP Request node's header parameters.
2. Replace the placeholder with a reference to an n8n credential (HTTP Header Auth credential type),
   not a pasted literal value.
3. Store the actual key only in n8n's credential store (or this repo's `.env.local`, which is
   gitignored). Never type a real key into a node's `value` field — anything saved that way gets
   exported verbatim the next time the workflow is downloaded, and this repo is public.

`SUPABASE_SERVICE_KEY` bypasses RLS on every table — treat it with the same care as the root
`.env.local`'s `SUPABASE_SERVICE_ROLE_KEY`.
