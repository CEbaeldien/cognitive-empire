// Hunt Engine — person/company extraction from pasted LinkedIn post/profile
// text. Used by Batch Inject when a block includes pasted text but is
// missing explicit name/role/company. Operates only on text the operator
// pastes in themselves — never fetches linkedin.com directly (ToS, and
// login-walled so it would fail anyway).

import Anthropic from "@anthropic-ai/sdk";

const ENRICH_MODEL = "claude-sonnet-5";
const MAX_TOKENS = 512;

export type EnrichResult = {
  person_name: string | null;
  person_role: string | null;
  company_name: string | null;
  signal_summary: string | null;
};

const SYSTEM_PROMPT = `You extract structured fields from a pasted LinkedIn post or profile snippet for a sales-prospecting tool. You are NOT verifying identity — just extracting what the text states.

Extract:
- person_name: the person's full name if stated, else null
- person_role: their job title/role if stated (e.g. "Founder", "CTO"), else null
- company_name: their company if stated, else null
- signal_summary: 1-2 factual sentences summarizing what the post/profile says, no interpretation; null if the text is too thin to summarize

Output JSON only. No prose. No markdown. Exactly this schema:
{"person_name": "string or null", "person_role": "string or null", "company_name": "string or null", "signal_summary": "string or null"}`;

// Throws on any failure (API error, malformed response) — callers own the
// decision of what to do with a failed enrichment (e.g. log an event and
// still insert the row rather than dropping it).
export async function enrichPerson(pastedText: string): Promise<EnrichResult> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const message = await anthropic.messages.create({
    model: ENRICH_MODEL,
    max_tokens: MAX_TOKENS,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: pastedText.slice(0, 4000) }],
  });

  const rawText = message.content.find((b) => b.type === "text")?.text ?? "";
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("no JSON in enrichment response");

  const parsed = JSON.parse(jsonMatch[0]) as Partial<EnrichResult>;

  return {
    person_name: typeof parsed.person_name === "string" ? parsed.person_name : null,
    person_role: typeof parsed.person_role === "string" ? parsed.person_role : null,
    company_name: typeof parsed.company_name === "string" ? parsed.company_name : null,
    signal_summary: typeof parsed.signal_summary === "string" ? parsed.signal_summary : null,
  };
}
