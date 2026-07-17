import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const maxDuration = 10;

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

const VALID_PRODUCTS = ["operator-kernel", "gravity-report"];

export async function POST(req: Request) {
  let body: { email?: string; product?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const product = body.product?.trim();

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }
  if (!product || !VALID_PRODUCTS.includes(product)) {
    return NextResponse.json({ error: "Invalid product" }, { status: 400 });
  }

  const sb = getServiceClient();
  const { error } = await sb.from("store_waitlist").insert({ email, product });

  if (error) {
    return NextResponse.json({ error: "Could not join waitlist" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
