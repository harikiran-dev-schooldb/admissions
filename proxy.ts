import { auth } from "@/lib/auth/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const authMiddleware = auth.middleware({
  loginUrl: "/login",
});

export default function proxy(request: NextRequest) {
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.LOCAL_AUTH_BYPASS === "true"
  ) {
    return NextResponse.next();
  }

  return authMiddleware(request);
}

export const config = {
  matcher: [
    "/admissions/:path*",
    "/fees/:path*",
    "/academic-years/:path*",
    "/settings/:path*",
    "/analytics/:path*",
    "/api/admissions/:path*",
    "/api/follow-ups/:path*",
    "/api/fees/:path*",
    "/api/academic-years/:path*",
    "/api/settings/:path*",
    "/api/access/:path*",
    "/users/:path*",
    "/api/users/:path*",
    "/audit-logs/:path*",
    "/api/audit-logs/:path*",
  ],
};
