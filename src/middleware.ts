import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionCookie =
    request.cookies.get("buildstock_session") ||
    request.cookies.get("shivom_session");

  let userRole: string | null = null;
  let isAuthenticated = false;

  if (sessionCookie?.value) {
    try {
      const decoded = atob(sessionCookie.value);
      const parsed = JSON.parse(decoded);
      if (parsed && parsed.id && parsed.role) {
        isAuthenticated = true;
        userRole = parsed.role;
      }
    } catch {
      isAuthenticated = false;
    }
  }

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

  // SERVER-SIDE ROLE-BASED ACCESS CONTROL (DIRECT URL GUARDS)
  if (isAuthenticated && userRole) {
    // 1. Settings & Users management: Strictly Owner/Admin only
    if (pathname.startsWith("/settings")) {
      if (userRole !== "ADMIN") {
        const url = new URL("/dashboard", request.url);
        url.searchParams.set("denied", "settings");
        return NextResponse.redirect(url);
      }
    }

    // 2. Sensitive Profit and Loss Report: Strictly Admin only
    if (pathname.startsWith("/reports/profit")) {
      if (userRole !== "ADMIN") {
        const url = new URL("/dashboard", request.url);
        url.searchParams.set("denied", "profit");
        return NextResponse.redirect(url);
      }
    }

    // 3. Restricted Banking and Ledgers: Cash & Bank, Supplier Ledger, Payables are Admin only
    if (
      pathname.startsWith("/accounts/cash-bank") ||
      pathname.startsWith("/accounts/supplier-ledger") ||
      pathname.startsWith("/accounts/payables")
    ) {
      if (userRole !== "ADMIN") {
        const url = new URL("/dashboard", request.url);
        url.searchParams.set("denied", "accounts");
        return NextResponse.redirect(url);
      }
    }

    // 4. Purchase Operations: Accessible only by Admin and Store
    if (pathname.startsWith("/purchase")) {
      if (userRole !== "ADMIN" && userRole !== "STORE") {
        const url = new URL("/dashboard", request.url);
        url.searchParams.set("denied", "purchase");
        return NextResponse.redirect(url);
      }
    }

    // 5. Sales & Quotations: Accessible only by Admin and Billing
    if (pathname.startsWith("/sales") || pathname.startsWith("/quotations")) {
      if (userRole !== "ADMIN" && userRole !== "BILLING") {
        const url = new URL("/dashboard", request.url);
        url.searchParams.set("denied", "sales");
        return NextResponse.redirect(url);
      }
    }

    // 6. Stock Variance & Godown Management: Accessible only by Admin and Store
    if (
      pathname.startsWith("/inventory/adjustments") ||
      pathname.startsWith("/inventory/godowns")
    ) {
      if (userRole !== "ADMIN" && userRole !== "STORE") {
        const url = new URL("/dashboard", request.url);
        url.searchParams.set("denied", "inventory");
        return NextResponse.redirect(url);
      }
    }
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
