import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthenticated = !!request.cookies.get("sb-auth")?.value;

  const isProtected =
    pathname === "/app" ||
    pathname.startsWith("/app/") ||
    pathname.startsWith("/admin/") ||
    pathname === "/drift/workspace" ||
    pathname.startsWith("/drift/workspace/");

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
    url.pathname = "/app";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/app",
    "/app/:path+",
    "/admin/:path+",
    "/drift/workspace",
    "/drift/workspace/:path+",
    "/auth/signin",
    "/auth/signup",
  ],
};
