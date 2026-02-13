import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "fluvex_session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(SESSION_COOKIE)?.value;

  // Routes protégées : rediriger vers login si pas de session
  if (pathname.startsWith("/dashboard")) {
    if (!sessionCookie || sessionCookie.length < 10) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // Si déjà connecté, rediriger login/register vers dashboard
  if ((pathname === "/login" || pathname === "/register") && sessionCookie && sessionCookie.length >= 10) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
