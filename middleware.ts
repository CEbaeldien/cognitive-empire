import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Inlined here to avoid Edge Runtime module-factory issues with lib/ imports.
// Source of truth for components is lib/site-status.ts.
const HOLD_ACTIVE = process.env.NEXT_PUBLIC_SITE_HOLD === "true";
const HOLD_EXEMPT = new Set([
  "/",
  "/signals",
  "/legal",
  "/privacy",
  "/terms",
  "/refund",
  "/cookies",
  "/disclaimer",
]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Site hold: redirect every non-exempt page path to home.
  // API routes bypass the hold so backend functionality stays intact.
  if (HOLD_ACTIVE && !pathname.startsWith("/api/") && !pathname.startsWith("/admin") && !pathname.startsWith("/ce-admin") && !pathname.startsWith("/auth") && !HOLD_EXEMPT.has(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url, 307);
  }

  const isAuthenticated = !!request.cookies.get("sb-auth")?.value;

  const isProtected =
    pathname.startsWith("/admin/");

  const isAuthPage =
    pathname === "/auth/signin" ||
    pathname === "/auth/signup";

  if (isProtected && !isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/signin";
    return NextResponse.redirect(url);
  }

  if (isAuthPage && isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/ce-admin";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|media/|auth/callback).*)" ],
};
