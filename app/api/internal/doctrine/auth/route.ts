import { NextResponse } from "next/server";
import { checkPassword, expectedSessionValue, DOCTRINE_COOKIE_NAME } from "@/lib/doctrine/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!process.env.CE_INTERNAL_PASSWORD) {
    return NextResponse.json(
      { error: "CE_INTERNAL_PASSWORD is not configured on the server." },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";

  if (!checkPassword(password)) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const sessionValue = expectedSessionValue();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(DOCTRINE_COOKIE_NAME, sessionValue!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/internal/doctrine",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
