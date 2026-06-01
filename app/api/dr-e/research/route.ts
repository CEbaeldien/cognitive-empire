// Minimum role: service_role (bypasses RLS on dre_research)
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
  const thread_type = searchParams.get("thread_type");
  const status      = searchParams.get("status");
  const limit       = Math.min(200, parseInt(searchParams.get("limit")  ?? "50", 10));
  const offset      =              parseInt(searchParams.get("offset") ?? "0",  10);

  let q = sb()
    .from("dre_research")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (thread_type) q = q.eq("thread_type", thread_type);
  if (status)      q = q.eq("status",      status);

  const { data, error, count } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ threads: data ?? [], total: count ?? 0 });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { title, thread_type, status, decay_status, summary, evidence_links, related_signals, related_projects, next_action } = body;

  if (!title) {
    return NextResponse.json({ error: "Missing required field: title" }, { status: 400 });
  }

  const { data, error } = await sb()
    .from("dre_research")
    .insert({
      title,
      thread_type:      thread_type      ?? "investigation",
      status:           status           ?? "active",
      decay_status:     decay_status     ?? "fresh",
      summary:          summary          ?? null,
      evidence_links:   evidence_links   ?? [],
      related_signals:  related_signals  ?? [],
      related_projects: related_projects ?? [],
      next_action:      next_action      ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
