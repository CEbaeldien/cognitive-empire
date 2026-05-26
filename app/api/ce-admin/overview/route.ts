import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function GET() {
  const client = sb();

  const [workspacesRes, membersRes, opportunitiesRes, scoresRes, interventionsRes] =
    await Promise.all([
      client.schema("drift").from("workspaces").select("*").order("created_at", { ascending: false }),
      client.schema("drift").from("workspace_members").select("workspace_id, email, role, status"),
      client.schema("drift").from("opportunities").select("id, workspace_id, value, status").eq("status", "open"),
      client
        .schema("drift")
        .from("scores")
        .select("opportunity_id, workspace_id, drift_score, drift_level, scored_at, revenue_at_risk")
        .order("scored_at", { ascending: false })
        .limit(5000),
      client
        .schema("drift")
        .from("interventions")
        .select("id, workspace_id, created_at, title, recommended_action, status")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

  // Auth users via admin API
  let authUsers: any[] = [];
  try {
    const { data } = await client.auth.admin.listUsers({ perPage: 500 });
    authUsers = data?.users ?? [];
  } catch {}

  // Optional tables — graceful fallback
  let scoringRunsRaw: any[] = [];
  try {
    const { data } = await client
      .schema("drift")
      .from("scoring_runs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    scoringRunsRaw = data ?? [];
  } catch {}

  let importLogsRaw: any[] = [];
  try {
    const { data } = await client
      .schema("drift")
      .from("import_batches")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    importLogsRaw = data ?? [];
  } catch {}

  // ── Derived data ──────────────────────────────────────────────────────────────

  const workspaces: any[] = workspacesRes.data ?? [];
  const members: any[]    = membersRes.data ?? [];
  const opps: any[]       = opportunitiesRes.data ?? [];
  const scores: any[]     = scoresRes.data ?? [];
  const interventions: any[] = interventionsRes.data ?? [];

  // Latest score per opportunity
  const latestScore = new Map<string, any>();
  for (const s of scores) {
    if (!latestScore.has(s.opportunity_id)) latestScore.set(s.opportunity_id, s);
  }

  // Opps / members / last-scored per workspace
  const oppsByWs   = new Map<string, any[]>();
  const membersByWs = new Map<string, any[]>();
  const lastScoredByWs = new Map<string, string>();

  for (const o of opps) {
    const arr = oppsByWs.get(o.workspace_id) ?? [];
    arr.push(o);
    oppsByWs.set(o.workspace_id, arr);
  }
  for (const m of members) {
    const arr = membersByWs.get(m.workspace_id) ?? [];
    arr.push(m);
    membersByWs.set(m.workspace_id, arr);
  }
  for (const s of scores) {
    const existing = lastScoredByWs.get(s.workspace_id);
    if (!existing || s.scored_at > existing) lastScoredByWs.set(s.workspace_id, s.scored_at);
  }

  // Workspace rows
  const workspaceRows = workspaces.map((ws: any) => {
    const wsOpps   = oppsByWs.get(ws.id) ?? [];
    const revenue  = wsOpps.reduce((s: number, o: any) => s + Number(o.value ?? 0), 0);
    const critical = wsOpps.filter((o: any) => latestScore.get(o.id)?.drift_level === "critical").length;
    const critPct  = wsOpps.length > 0 ? critical / wsOpps.length : 0;
    const health   = critPct > 0.3 ? "CRITICAL" : critPct > 0.1 ? "AT RISK" : "HEALTHY";
    const wsMembers = membersByWs.get(ws.id) ?? [];
    const owner = wsMembers.find((m: any) => ["admin","owner"].includes(m.role)) ?? wsMembers[0];
    return {
      id: ws.id,
      name: ws.name,
      status: ws.status,
      created_at: ws.created_at,
      owner_email: owner?.email ?? null,
      opportunities_count: wsOpps.length,
      critical_count: critical,
      revenue,
      last_scored: lastScoredByWs.get(ws.id) ?? null,
      health_status: health,
    };
  });

  // KPIs
  const totalCritical = opps.filter((o: any) => latestScore.get(o.id)?.drift_level === "critical").length;
  const totalRevenue  = opps.reduce((s: number, o: any) => s + Number(o.value ?? 0), 0);
  const kpis = {
    total_workspaces:   workspaces.length,
    total_operators:    new Set(members.filter((m: any) => m.status === "active").map((m: any) => m.email)).size,
    total_opportunities: opps.length,
    critical_decay:     totalCritical,
    total_revenue:      totalRevenue,
  };

  // Users table
  const memberEmailToWs = new Map<string, { workspace_name: string; role: string }>();
  for (const m of members) {
    const ws = workspaces.find((w: any) => w.id === m.workspace_id);
    if (ws) memberEmailToWs.set(m.email, { workspace_name: ws.name, role: m.role });
  }
  const users = authUsers.map((u: any) => {
    const wsInfo = memberEmailToWs.get(u.email ?? "");
    return {
      id: u.id,
      email: u.email ?? "",
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at ?? null,
      workspace_name: wsInfo?.workspace_name ?? null,
      role: wsInfo?.role ?? null,
      status: u.banned_until ? "banned" : "active",
    };
  });

  // System health — row counts
  const [wsCount, oppCount, scoreCount, ivCount, acctCount] = await Promise.all([
    client.schema("drift").from("workspaces").select("*", { count: "exact", head: true }),
    client.schema("drift").from("opportunities").select("*", { count: "exact", head: true }),
    client.schema("drift").from("scores").select("*", { count: "exact", head: true }),
    client.schema("drift").from("interventions").select("*", { count: "exact", head: true }),
    client.schema("drift").from("accounts").select("*", { count: "exact", head: true }),
  ]);
  const system = {
    db: {
      workspaces:    wsCount.count ?? 0,
      opportunities: oppCount.count ?? 0,
      scores:        scoreCount.count ?? 0,
      interventions: ivCount.count ?? 0,
      accounts:      acctCount.count ?? 0,
    },
    last_scored_at:     scores[0]?.scored_at ?? null,
    supabase_connected: true,
  };

  // Scoring runs — real table or derived from scores
  let scoringRuns: any[] = [];
  if (scoringRunsRaw.length > 0) {
    scoringRuns = scoringRunsRaw.map((sr: any) => ({
      workspace_name:       workspaces.find((w: any) => w.id === sr.workspace_id)?.name ?? "Unknown",
      scored_at:            sr.created_at ?? sr.scored_at,
      opportunities_scored: sr.opportunities_scored ?? 0,
      critical_found:       sr.critical_found ?? 0,
      avg_score:            sr.avg_score ?? 0,
    }));
  } else {
    const runMap = new Map<string, { workspace_name: string; scored_at: string; arr: number[]; critical: number }>();
    for (const s of scores) {
      const date = (s.scored_at ?? "").split("T")[0];
      const key  = `${s.workspace_id}:${date}`;
      const ws   = workspaces.find((w: any) => w.id === s.workspace_id);
      const cur  = runMap.get(key);
      if (!cur) {
        runMap.set(key, { workspace_name: ws?.name ?? "Unknown", scored_at: s.scored_at, arr: [Number(s.drift_score ?? 0)], critical: s.drift_level === "critical" ? 1 : 0 });
      } else {
        cur.arr.push(Number(s.drift_score ?? 0));
        if (s.drift_level === "critical") cur.critical++;
      }
    }
    scoringRuns = Array.from(runMap.values())
      .map(r => ({
        workspace_name:       r.workspace_name,
        scored_at:            r.scored_at,
        opportunities_scored: r.arr.length,
        critical_found:       r.critical,
        avg_score:            r.arr.length ? Math.round(r.arr.reduce((a, b) => a + b, 0) / r.arr.length) : 0,
      }))
      .sort((a, b) => b.scored_at.localeCompare(a.scored_at))
      .slice(0, 50);
  }

  // Import logs
  const importLogs = importLogsRaw.map((il: any) => ({
    id:             il.id,
    workspace_name: workspaces.find((w: any) => w.id === il.workspace_id)?.name ?? "Unknown",
    created_at:     il.created_at,
    file:           il.file_name ?? il.source ?? "—",
    total:          il.total ?? 0,
    successful:     il.successful ?? il.total ?? 0,
    failed:         il.failed ?? 0,
    status:         il.status ?? "completed",
  }));

  // Activity feed
  const feed = [
    ...interventions.slice(0, 10).map((iv: any) => ({
      timestamp:      iv.created_at,
      workspace_name: workspaces.find((w: any) => w.id === iv.workspace_id)?.name ?? "Unknown",
      event:          `Intervention created: ${iv.title ?? iv.recommended_action ?? "Action required"}`,
      type:           "intervention",
    })),
    ...scores.slice(0, 5).map((s: any) => ({
      timestamp:      s.scored_at,
      workspace_name: workspaces.find((w: any) => w.id === s.workspace_id)?.name ?? "Unknown",
      event:          "Scoring run completed",
      type:           "score",
    })),
  ]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 10);

  return NextResponse.json({ kpis, workspaces: workspaceRows, users, system, scoring_runs: scoringRuns, import_logs: importLogs, activity_feed: feed });
}
