import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function GET() {
  try {
    const client = sb();
    const [
      systemsRes,
      memoriesRes,
      tasksRes,
      projectsRes,
      approvalsRes,
      conflictsRes,
    ] = await Promise.all([
      client.from("runtime_systems").select("*").order("name", { ascending: true }),
      client.from("runtime_memories").select("id, type, confidence, lifecycle_status, title, updated_at").order("updated_at", { ascending: false }).limit(50),
      client.from("runtime_tasks").select("*").order("created_at", { ascending: false }).limit(50),
      client.from("runtime_projects").select("*").order("created_at", { ascending: false }),
      client.from("runtime_approvals").select("*").eq("status", "pending").order("requested_at", { ascending: false }),
      client.from("runtime_conflicts").select("*").eq("status", "open").order("detected_at", { ascending: false }),
    ]);

    const errors = [
      systemsRes.error,
      memoriesRes.error,
      tasksRes.error,
      projectsRes.error,
      approvalsRes.error,
      conflictsRes.error,
    ].filter(Boolean);

    if (errors.length > 0) {
      return NextResponse.json(
        { error: "Failed to load runtime overview", details: errors },
        { status: 500 }
      );
    }

    return NextResponse.json({
      systems:   systemsRes.data   ?? [],
      memories:  memoriesRes.data  ?? [],
      tasks:     tasksRes.data     ?? [],
      projects:  projectsRes.data  ?? [],
      approvals: approvalsRes.data ?? [],
      conflicts: conflictsRes.data ?? [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Unexpected runtime overview error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
