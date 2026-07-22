import { NextResponse } from "next/server";

import { auth } from "@/auth";

const ADMIN_PREFIX = "/admin";
const PROTECTED_PREFIXES = ["/account", "/checkout", "/orders"];
const AUTH_PAGES = ["/login", "/register"];

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const { pathname, search } = nextUrl;

  const isAuthPage = AUTH_PAGES.some((page) => matchesPrefix(pathname, page));
  if (isAuthPage) {
    if (session?.user) {
      return NextResponse.redirect(new URL("/", nextUrl));
    }
    return NextResponse.next();
  }

  const isAdminRoute = matchesPrefix(pathname, ADMIN_PREFIX);
  if (isAdminRoute) {
    if (!session?.user) {
      const loginUrl = new URL("/login", nextUrl);
      loginUrl.searchParams.set("callbackUrl", pathname + search);
      return NextResponse.redirect(loginUrl);
    }
    if (session.user.role !== "ADMIN") {
      const homeUrl = new URL("/", nextUrl);
      homeUrl.searchParams.set("error", "forbidden");
      return NextResponse.redirect(homeUrl);
    }
    return NextResponse.next();
  }

  const isProtectedRoute = PROTECTED_PREFIXES.some((prefix) =>
    matchesPrefix(pathname, prefix)
  );
  if (isProtectedRoute && !session?.user) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

// No corre sobre /api, assets de _next, ni archivos estáticos (cualquier
// path con extensión, ej. favicon.ico, .svg).
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*$).*)"],
};
