import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
}

if (!serviceRoleKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
  },
});

export async function GET() {
  try {
    const [
      systemsResult,
      statesResult,
      decisionsResult,
      tasksResult,
      workflowsResult,
    ] = await Promise.all([
      supabase
        .from("runtime_systems")
        .select("*")
        .order("created_at", { ascending: true }),

      supabase
        .from("runtime_project_states")
        .select("*, runtime_systems(name)")
        .order("updated_at", { ascending: false }),

      supabase
        .from("runtime_decisions")
        .select("*")
        .order("created_at", { ascending: false }),

      supabase
        .from("runtime_tasks")
        .select("*")
        .order("created_at", { ascending: false }),

      supabase
        .from("runtime_workflows")
        .select("*")
        .order("created_at", { ascending: true }),
    ]);

    const errors = [
      systemsResult.error,
      statesResult.error,
      decisionsResult.error,
      tasksResult.error,
      workflowsResult.error,
    ].filter(Boolean);

    if (errors.length > 0) {
      return NextResponse.json(
        {
          error: "Failed to load runtime overview",
          details: errors,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      systems: systemsResult.data ?? [],
      projectStates: statesResult.data ?? [],
      decisions: decisionsResult.data ?? [],
      tasks: tasksResult.data ?? [],
      workflows: workflowsResult.data ?? [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unexpected runtime dashboard error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}