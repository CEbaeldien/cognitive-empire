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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status");
  const task_type   = searchParams.get("task_type");
  const limit       = Math.min(200, parseInt(searchParams.get("limit")  ?? "50", 10));
  const offset      =              parseInt(searchParams.get("offset") ?? "0",  10);

  let q = sb()
    .from("runtime_tasks")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (statusParam) {
    const statuses = statusParam.split(",").map((s) => s.trim()).filter(Boolean);
    if (statuses.length === 1) {
      q = q.eq("status", statuses[0]);
    } else if (statuses.length > 1) {
      q = q.in("status", statuses);
    }
  }

  // task_type maps to the 'system' column in runtime_tasks
  if (task_type) q = q.eq("system", task_type);

  const { data, error, count } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    tasks:  data  ?? [],
    count:  count ?? 0,
    limit,
    offset,
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  const {
    title, description, task_type, status, priority,
    assigned_to, due_date, related_system_id,
    blocked_reason, reversibility_class, notes, created_by,
  } = body;

  if (!title || !status) {
    return NextResponse.json(
      { error: "Missing required fields: title, status" },
      { status: 400 }
    );
  }

  const { data, error } = await sb()
    .from("runtime_tasks")
    .insert({
      title,
      description:        description        ?? null,
      system:             task_type          ?? null,
      status,
      priority:           priority           ?? null,
      assigned_to:        assigned_to        ?? null,
      due_date:           due_date           ?? null,
      related_system_id:  related_system_id  ?? null,
      blocked_reason:     blocked_reason     ?? null,
      reversibility_class: reversibility_class ?? null,
      notes:              notes              ?? null,
      created_by:         created_by         ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
