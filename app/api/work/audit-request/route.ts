import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, email, operation_description, symptom } = body as Record<string, string>;

  if (!name || !email) {
    return NextResponse.json({ error: "name and email are required" }, { status: 400 });
  }

  const { error } = await sb()
    .from("audit_requests")
    .insert({ name, email, operation_description: operation_description ?? null, symptom: symptom ?? null });

  if (error) {
    console.error("[audit-request] insert error:", error.message);
    return NextResponse.json({ error: "Failed to save request" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
