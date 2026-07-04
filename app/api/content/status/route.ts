import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 10;

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function GET(req: NextRequest) {
  const ids = req.nextUrl.searchParams.get("ids");
  if (!ids) return NextResponse.json({ error: "ids required" }, { status: 400 });

  const idList = ids.split(",").map(s => s.trim()).filter(Boolean);
  if (idList.length === 0) return NextResponse.json({ rows: [] });

  const sb = getServiceClient();
  const { data, error } = await sb
    .from("content_briefs")
    .select("id, format, title, output, status")
    .in("id", idList);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ rows: data ?? [] });
}
