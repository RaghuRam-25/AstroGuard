import { NextRequest, NextResponse } from "next/server";

const ROLE_ROUTES: Record<string, string> = {
  astronaut: "/astronaut",
  medical_officer: "/medical",
  mission_control: "/mission-control",
  admin: "/admin",
};

const PROTECTED_PREFIXES = ["/astronaut", "/medical", "/mission-control", "/admin"];
const PUBLIC_ROUTES = ["/", "/login", "/register", "/about", "/unauthorized"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    PUBLIC_ROUTES.some((route) => pathname === route) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/public") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (!isProtected) {
    return NextResponse.next();
  }

  const token = req.cookies.get("astro_token")?.value;

  if (!token) {
    // On separate frontend/backend domains, the backend HTTP-only cookie is not
    // visible here. Client guards call /api/auth/me and backend APIs enforce auth.
    return NextResponse.next();
  }

  try {
    const payloadBase64 = token.split(".")[1];
    if (!payloadBase64) {
      return NextResponse.next();
    }

    const payload = JSON.parse(atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/")));
    const allowedPrefix = ROLE_ROUTES[payload.role];

    if (!allowedPrefix) {
      return NextResponse.next();
    }

    const isAccessingWrongRole = PROTECTED_PREFIXES.some(
      (prefix) => pathname.startsWith(prefix) && prefix !== allowedPrefix
    );

    if (isAccessingWrongRole) {
      const unauthorizedUrl = req.nextUrl.clone();
      unauthorizedUrl.pathname = "/unauthorized";
      return NextResponse.redirect(unauthorizedUrl);
    }
  } catch {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.svg|astronaut-avatar.png|public).*)",
  ],
};
