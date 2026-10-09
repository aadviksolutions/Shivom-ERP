import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionCookie =
    request.cookies.get("buildstock_session") ||
    request.cookies.get("shivom_session");

  const isAuthenticated = Boolean(sessionCookie?.value);

  // Protected paths that require authentication
  const protectedPrefixes = [
    "/dashboard",
    "/sales",
    "/purchase",
    "/inventory",
    "/products",
    "/customers",
    "/suppliers",
    "/payments",
    "/accounts",
    "/quotations",
    "/reports",
    "/settings",
  ];

  const isProtected = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );

  // If user tries to access protected page while unauthenticated -> redirect to /login
  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If user is already authenticated and visits /login -> redirect to /dashboard
  if (pathname === "/login" && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api routes (except /api/auth)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, images/
     */
    "/((?!api|_next/static|_next/image|images|favicon.ico).*)",
  ],
};
