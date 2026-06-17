import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, parseSession } from "@/lib/session";

async function hasSession(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return false;
  return (await parseSession(token)) !== null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authenticated = await hasSession(request);

  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(authenticated ? "/dashboard" : "/login", request.url),
    );
  }

  if (pathname.startsWith("/dashboard")) {
    if (!authenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  if ((pathname === "/login" || pathname === "/register") && authenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/login", "/register"],
};
