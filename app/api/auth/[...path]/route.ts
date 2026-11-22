import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/server";
import { maySignInWithOtp } from "@/lib/auth/otpAccess";

const handlers = auth.handler();
export const GET = handlers.GET;

type AuthRouteContext = { params: Promise<{ path: string[] }> };

const otpRequestSchema = z.object({
  email: z.email().max(254),
  type: z.literal("sign-in"),
}).passthrough();
const otpVerificationSchema = z.object({
  email: z.email().max(254),
  otp: z.string().regex(/^\d{6}$/),
}).passthrough();

/**
 * Reject password login and public sign-up at this application's auth proxy.
 * OTP issuing is permitted only for current admin/staff membership.
 * The hosted Neon Auth service validates expiry, attempts and code uniqueness.
 */
export async function POST(request: Request, context: AuthRouteContext) {
  const { pathname } = new URL(request.url);
  if (
    pathname === "/api/auth/sign-in/email" ||
    pathname.startsWith("/api/auth/sign-up") ||
    pathname.startsWith("/api/auth/forget-password") ||
    pathname.startsWith("/api/auth/reset-password") ||
    pathname === "/api/auth/request-password-reset" ||
    pathname.startsWith("/api/auth/email-otp/request-password-reset") ||
    pathname.startsWith("/api/auth/email-otp/reset-password")
  ) {
    return NextResponse.json({ error: "Password sign-in is disabled. Use email OTP." }, { status: 403 });
  }

  const send = pathname === "/api/auth/email-otp/send-verification-otp";
  const verify = pathname === "/api/auth/sign-in/email-otp";
  if (send || verify) {
    let json: unknown;
    try {
      json = await request.clone().json();
    } catch {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const validated = send ? otpRequestSchema.safeParse(json) : otpVerificationSchema.safeParse(json);
    if (!validated.success) return NextResponse.json({ error: "Enter a valid email and verification code" }, { status: 400 });

    const { email } = validated.data;
    const permission = await maySignInWithOtp(email);
    if (permission.unavailable) {
      return NextResponse.json({ error: "Sign-in is temporarily unavailable" }, { status: 503 });
    }
    if (!permission.allowed) {
      if (send) {
        // Avoid disclosing which emails belong to employees. Do not send a code.
        return NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
      }
      return NextResponse.json({ error: "Invalid or expired verification code" }, { status: 401 });
    }
  }

  return handlers.POST(request, context);
}
