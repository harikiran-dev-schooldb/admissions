import { NextResponse, type NextRequest } from "next/server";

export async function proxy(req: NextRequest) {
  const token = req.cookies.get("sb-access-token")?.value;
  const pathname = req.nextUrl.pathname;

  if (token) {
    const authUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (authUrl && apiKey) {
      const userResponse = await fetch(`${authUrl}/auth/v1/user`, {
        headers: { Authorization: `Bearer ${token}`, apikey: apiKey },
        cache: "no-store",
      });

      if (userResponse.ok) return NextResponse.next();
    }
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const login = new URL("/login", req.url);
  login.searchParams.set("next", pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/admissions/:path*", "/fees/:path*", "/api/admissions/:path*", "/api/fees/:path*"],
};
