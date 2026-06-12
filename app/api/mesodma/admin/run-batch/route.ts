import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { getPendingBatch } from "@/lib/mesodma/batch";

export const dynamic = "force-dynamic";
export const maxDuration = 10;

const ADMIN_EMAIL = "founder@cognitiveempire.com";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Validate the caller's Supabase session token — no secret exposed to client
  const auth = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
  const { data: { user }, error } = await auth.auth.getUser(token);

  if (error || !user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const batch = await getPendingBatch();
  return NextResponse.json(batch);
}
