import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const workspaceId = process.env.DRIFT_WORKSPACE_ID!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

// POST /api/drift/accounts — create a new account for this workspace
export async function POST(req: Request) {
  try {
    const { name, contact_name, contact_email } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .schema("drift")
      .from("accounts")
      .insert({
        workspace_id: workspaceId,
        name: name.trim(),
        ...(contact_name?.trim() && { contact_name: contact_name.trim() }),
        ...(contact_email?.trim() && { contact_email: contact_email.trim() }),
      })
      .select("id, name, contact_name, contact_email")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ account: data }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
