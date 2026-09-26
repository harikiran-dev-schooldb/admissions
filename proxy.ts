import { auth } from "@/lib/auth/server";

export default auth.middleware({
  loginUrl: "/login",
});

export const config = {
  matcher: [
    "/admissions/:path*",
    "/fees/:path*",
    "/api/admissions/:path*",
    "/api/fees/:path*",
  ],
};
