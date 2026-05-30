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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { resolution, status, resolved_by } = body;

  if (!status || (status !== "resolved" && status !== "dismissed")) {
    return NextResponse.json(
      { error: "Missing or invalid status: must be 'resolved' or 'dismissed'" },
      { status: 400 }
    );
  }

  const client = sb();
  const now    = new Date().toISOString();

  const { data, error } = await client
    .from("runtime_conflicts")
    .update({
      status,
      resolved_at:      now,
      resolved_by:      resolved_by ?? null,
      resolution_notes: resolution  ?? null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Clear conflicted state from affected memory records
  if (status === "resolved") {
    await client
      .from("runtime_memories")
      .update({ confidence: "confirmed", lifecycle_status: "active" })
      .eq("lifecycle_status", "conflicted");
  }

  return NextResponse.json(data);
}
