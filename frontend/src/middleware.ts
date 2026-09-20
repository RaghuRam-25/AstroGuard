import { NextRequest, NextResponse } from "next/server";

// Role-to-route prefix mapping
const ROLE_ROUTES: Record<string, string> = {
  astronaut: "/astronaut",
  medical_officer: "/medical",
  mission_control: "/mission-control",
  admin: "/admin",
};

// Protected route prefixes (require authentication)
const PROTECTED_PREFIXES = ["/astronaut", "/medical", "/mission-control", "/admin"];

// Public routes (no auth required)
const PUBLIC_ROUTES = ["/", "/login", "/about", "/unauthorized"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow public pages and Next.js internals
  if (
    PUBLIC_ROUTES.some((p) => pathname === p) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/public") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check if this is a protected route
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (!isProtected) {
    return NextResponse.next();
  }

  // Read the access token cookie (set as HTTP-only by backend)
  const token = req.cookies.get("astro_token")?.value;

  if (!token) {
    // Not authenticated — redirect to login
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Decode JWT payload WITHOUT verification (verification happens on backend)
  // This is only used for client-side routing decisions — backend enforces real auth
  try {
    const payloadBase64 = token.split(".")[1];
    if (!payloadBase64) throw new Error("Invalid token");
    const payload = JSON.parse(atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/")));
    const role: string = payload.role;

    // Determine which prefix this user is allowed to access
    const allowedPrefix = ROLE_ROUTES[role];

    // Check if they're trying to access a different role's section
    const isAccessingWrongRole = PROTECTED_PREFIXES.some(
      (prefix) => pathname.startsWith(prefix) && prefix !== allowedPrefix
    );

    if (isAccessingWrongRole) {
      const unauthorizedUrl = req.nextUrl.clone();
      unauthorizedUrl.pathname = "/unauthorized";
      return NextResponse.redirect(unauthorizedUrl);
    }

    return NextResponse.next();
  } catch {
    // Token malformed — redirect to login
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.svg|astronaut-avatar.png|public).*)",
  ],
};
