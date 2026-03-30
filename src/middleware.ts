import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextRequest, NextResponse } from "next/server";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 60;
const ipRequests = new Map<string, { count: number; resetAt: number }>();

function rateLimit(request: NextRequest): NextResponse | null {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const now = Date.now();
    const entry = ipRequests.get(ip);

    if (!entry || now > entry.resetAt) {
      ipRequests.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    } else {
      entry.count++;
      if (entry.count > RATE_LIMIT_MAX) {
        return NextResponse.json(
          { error: "Demo rate limit exceeded. Please try again later." },
          { status: 429 }
        );
      }
    }
  }
  return null;
}

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  // Demo rate limiting
  const rateLimitResponse = rateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  const { pathname } = req.nextUrl;

  // Protected routes that require authentication
  const protectedPaths = ["/dashboard", "/instructor", "/admin"];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isProtected && !req.auth) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Instructor-only routes
  if (pathname.startsWith("/instructor") && req.auth) {
    const role = req.auth.user?.role;
    if (role !== "INSTRUCTOR" && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // Admin-only routes
  if (pathname.startsWith("/admin") && req.auth) {
    if (req.auth.user?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/api/:path*", "/dashboard/:path*", "/instructor/:path*", "/admin/:path*"],
};