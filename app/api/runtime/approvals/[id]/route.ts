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

const ACTION_STATUS: Record<string, string> = {
  approve: "approved",
  reject:  "rejected",
  cancel:  "cancelled",
};

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { action, notes, reviewed_by } = body;

  if (!action || !(action in ACTION_STATUS)) {
    return NextResponse.json(
      { error: "Missing or invalid action: must be 'approve', 'reject', or 'cancel'" },
      { status: 400 }
    );
  }

  const { data, error } = await sb()
    .from("runtime_approvals")
    .update({
      status:      ACTION_STATUS[action],
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewed_by ?? null,
      notes:       notes       ?? null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
