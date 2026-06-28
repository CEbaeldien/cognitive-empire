import { NextRequest, NextResponse } from "next/server";
import { calculateDriftScore, type DriftOpportunityInput, type DriftScoreResult } from "@/lib/drift/scoring";

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).map((line) => {
    const vals = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? ""]));
  });
}

function toOpportunity(row: Record<string, string>, idx: number): DriftOpportunityInput {
  return {
    id:                     row.id || row.ID || `row_${idx}`,
    value:                  row.value != null && row.value !== "" ? Number(row.value) : null,
    probability:            row.probability != null && row.probability !== "" ? Number(row.probability) : null,
    stage:                  row.stage || null,
    last_activity_date:     row.last_activity_date || row.last_activity || null,
    next_action:            row.next_action || null,
    overdue_followup_count: Number(row.overdue_followup_count ?? row.overdue_count ?? 0) || 0,
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

  const rows = parseCSV(csvText);
  if (rows.length === 0) {
    return NextResponse.json({ error: "CSV has no data rows" }, { status: 400 });
  }
  if (rows.length > 500) {
    return NextResponse.json({ error: "Maximum 500 rows per request" }, { status: 400 });
  }

  const opportunities = rows.map((r, i) => toOpportunity(r, i));
  const results: DriftScoreResult[] = opportunities.map(calculateDriftScore);

  const total = results.length;
  const critical = results.filter((r) => r.drift_level === "critical").length;
  const decaying  = results.filter((r) => r.drift_level === "decaying").length;
  const watch     = results.filter((r) => r.drift_level === "watch").length;
  const healthy   = results.filter((r) => r.drift_level === "healthy").length;
  const totalAtRisk = results.reduce((s, r) => s + r.revenue_at_risk, 0);
  const avgScore    = Math.round(results.reduce((s, r) => s + r.drift_score, 0) / total);

  return NextResponse.json({
    summary: { total, critical, decaying, watch, healthy, total_revenue_at_risk: totalAtRisk, avg_drift_score: avgScore },
    results,
  });
}
