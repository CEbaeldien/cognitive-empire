import { NextRequest, NextResponse } from "next/server";
import { calculateDriftScore, type DriftOpportunityInput, type DriftScoreResult } from "@/lib/drift/scoring";

// ── Column name aliases ───────────────────────────────────────────────────────
const NAME_COLS    = ["opportunity_name", "opportunity", "deal_name", "deal", "name", "company", "account", "customer", "prospect"] as const;
const VALUE_COLS   = ["value", "amount", "deal_value", "arr", "revenue"] as const;
const ACTIVITY_COLS = ["last_activity_date", "last_activity", "last_contact", "last_contact_date"] as const;
const NEXT_ACTION_COLS = ["next_action", "next_step", "next_steps", "follow_up"] as const;
const STAGE_COLS   = ["stage", "deal_stage", "pipeline_stage"] as const;
const OWNER_COLS   = ["owner", "owner_name", "assigned_to", "rep", "sales_rep"] as const;
const PROB_COLS    = ["probability", "close_probability", "win_rate"] as const;

export type CsvHealth = {
  has_name:          boolean;
  has_value:         boolean;
  has_owner:         boolean;
  has_last_activity: boolean;
  has_next_action:   boolean;
  has_stage:         boolean;
  has_probability:   boolean;
  confidence:        "good" | "partial" | "limited";
  data_limited:      boolean;
};

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows = lines.slice(1).map((line) => {
    const vals = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? ""]));
  });
  return { headers, rows };
}

function pickCol(row: Record<string, string>, candidates: readonly string[]): string {
  for (const c of candidates) {
    if (row[c]?.trim()) return row[c].trim();
    const key = Object.keys(row).find(k => k.toLowerCase() === c);
    if (key && row[key]?.trim()) return row[key].trim();
  }
  return "";
}

function extractName(row: Record<string, string>, idx: number): string {
  const name = pickCol(row, NAME_COLS);
  if (name) return name;
  const id = row.id || row.ID || "";
  if (id && !/^\d+$/.test(id.trim())) return id.trim();
  return `Opportunity ${String(idx + 1).padStart(2, "0")}`;
}

function detectCsvHealth(headers: string[]): CsvHealth {
  const hSet = new Set(headers.map(x => x.toLowerCase()));
  const has = (...cols: readonly string[]) => cols.some(c => hSet.has(c));

  const has_name          = has(...NAME_COLS);
  const has_value         = has(...VALUE_COLS);
  const has_owner         = has(...OWNER_COLS);
  const has_last_activity = has(...ACTIVITY_COLS);
  const has_next_action   = has(...NEXT_ACTION_COLS);
  const has_stage         = has(...STAGE_COLS);
  const has_probability   = has(...PROB_COLS);

  const count = [has_name, has_value, has_owner, has_last_activity, has_next_action, has_stage, has_probability].filter(Boolean).length;
  const confidence: CsvHealth["confidence"] = count >= 5 ? "good" : count >= 3 ? "partial" : "limited";
  const data_limited = !has_last_activity && !has_next_action;

  return { has_name, has_value, has_owner, has_last_activity, has_next_action, has_stage, has_probability, confidence, data_limited };
}

function getRecommendedAction(result: DriftScoreResult): string {
  if (result.drift_level === "critical") {
    if (result.has_missing_next_action) return "Define a next action and schedule outreach within 24 hours.";
    if (result.has_overdue_followup)    return "Resolve overdue follow-ups before this deal goes cold.";
    return "Immediate re-engagement required. Assign an owner and set a firm deadline.";
  }
  if (result.drift_level === "decaying") {
    if (result.has_missing_next_action) return "Set a concrete next action before momentum is lost.";
    return "Re-engage within 48 hours to prevent critical decay.";
  }
  if (result.drift_level === "watch") {
    return "Monitor closely. Set a check-in reminder within the next 7 days.";
  }
  return "Maintain current cadence.";
}

function toOpportunity(row: Record<string, string>, idx: number): DriftOpportunityInput {
  const valueStr   = pickCol(row, VALUE_COLS);
  const probStr    = pickCol(row, PROB_COLS);
  const stageStr   = pickCol(row, STAGE_COLS);
  const lastAct    = pickCol(row, ACTIVITY_COLS);
  const nextAction = pickCol(row, NEXT_ACTION_COLS);
  const overdue    = row.overdue_followup_count || row.overdue_count || "0";

  return {
    id:                     extractName(row, idx),
    value:                  valueStr ? Number(valueStr) : null,
    probability:            probStr  ? Number(probStr)  : null,
    stage:                  stageStr || null,
    last_activity_date:     lastAct  || null,
    next_action:            nextAction || null,
    overdue_followup_count: Number(overdue) || 0,
  };
}

export async function POST(req: NextRequest) {
  let csvText: string;
  const ct = req.headers.get("content-type") ?? "";

  if (ct.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    csvText = await (file as File).text();
  } else {
    const body = await req.json().catch(() => null);
    if (!body?.csv) return NextResponse.json({ error: "Provide CSV text in body.csv or upload a file" }, { status: 400 });
    csvText = body.csv as string;
  }

  const { headers, rows } = parseCSV(csvText);
  if (rows.length === 0) return NextResponse.json({ error: "CSV has no data rows" }, { status: 400 });
  if (rows.length > 500) return NextResponse.json({ error: "Maximum 500 rows per request" }, { status: 400 });

  const csv_health  = detectCsvHealth(headers);
  const opportunities = rows.map((r, i) => toOpportunity(r, i));
  const rawResults  = opportunities.map(calculateDriftScore);

  const results = rawResults.map(r => ({
    ...r,
    recommended_action: getRecommendedAction(r),
  }));

  const total     = results.length;
  const critical  = results.filter(r => r.drift_level === "critical").length;
  const decaying  = results.filter(r => r.drift_level === "decaying").length;
  const watch     = results.filter(r => r.drift_level === "watch").length;
  const healthy   = results.filter(r => r.drift_level === "healthy").length;
  const totalAtRisk = results.reduce((s, r) => s + r.revenue_at_risk, 0);
  const avgScore    = Math.round(results.reduce((s, r) => s + r.drift_score, 0) / total);

  return NextResponse.json({
    summary:    { total, critical, decaying, watch, healthy, total_revenue_at_risk: totalAtRisk, avg_drift_score: avgScore },
    csv_health,
    results,
  });
}
