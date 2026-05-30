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

  const [
    systemsTotalRes,
    activeSystemsRes,
    brokenSystemsRes,
    pendingApprovalsRes,
    openConflictsRes,
    staleMemoriesRes,
    recentChecksRes,
  ] = await Promise.all([
    client.from("runtime_systems").select("*", { count: "exact", head: true }),
    client.from("runtime_systems").select("*", { count: "exact", head: true }).eq("status", "active"),
    client.from("runtime_systems").select("*", { count: "exact", head: true }).eq("health_status", "broken"),
    client.from("runtime_approvals").select("*", { count: "exact", head: true }).eq("status", "pending"),
    client.from("runtime_conflicts").select("*", { count: "exact", head: true }).eq("status", "open"),
    client.from("runtime_memories").select("*", { count: "exact", head: true }).eq("lifecycle_status", "stale"),
    client
      .from("runtime_health_checks")
      .select("id, system_id, status, check_type, notes, checked_at")
      .order("checked_at", { ascending: false })
      .limit(10),
  ]);

  if (systemsTotalRes.error)     return NextResponse.json({ error: systemsTotalRes.error.message },     { status: 500 });
  if (activeSystemsRes.error)    return NextResponse.json({ error: activeSystemsRes.error.message },    { status: 500 });
  if (brokenSystemsRes.error)    return NextResponse.json({ error: brokenSystemsRes.error.message },    { status: 500 });
  if (pendingApprovalsRes.error) return NextResponse.json({ error: pendingApprovalsRes.error.message }, { status: 500 });
  if (openConflictsRes.error)    return NextResponse.json({ error: openConflictsRes.error.message },    { status: 500 });
  if (staleMemoriesRes.error)    return NextResponse.json({ error: staleMemoriesRes.error.message },    { status: 500 });
  if (recentChecksRes.error)     return NextResponse.json({ error: recentChecksRes.error.message },     { status: 500 });

  return NextResponse.json({
    systems_count:        systemsTotalRes.count     ?? 0,
    active_systems:       activeSystemsRes.count    ?? 0,
    broken_systems:       brokenSystemsRes.count    ?? 0,
    pending_approvals:    pendingApprovalsRes.count  ?? 0,
    open_conflicts:       openConflictsRes.count     ?? 0,
    stale_memories:       staleMemoriesRes.count     ?? 0,
    recent_health_checks: recentChecksRes.data       ?? [],
  });
}
