import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

test("login implements a two-step Neon Auth OTP flow with no password field", () => {
  const page = readFileSync(resolve(process.cwd(), "app/login/page.tsx"), "utf8");
  assert.match(page, /emailOtp\.sendVerificationOtp/);
  assert.match(page, /signIn\.emailOtp/);
  assert.match(page, /one-time-code/);
  assert.doesNotMatch(page, /type="password"|signIn\.email\(/);
});

test("app does not expose password reset screens", () => {
  for (const path of ["app/forgot-password/page.tsx", "app/reset-password/page.tsx"]) {
    const page = readFileSync(resolve(process.cwd(), path), "utf8");
    assert.match(page, /redirect\("\/login"\)/);
    assert.doesNotMatch(page, /new-password|requestPasswordReset|resetPassword\(/);
  }
});

test("auth route denies password login and new account signups", () => {
  const route = readFileSync(resolve(process.cwd(), "app/api/auth/[...path]/route.ts"), "utf8");
  assert.match(route, /"\/api\/auth\/sign-in\/email"/);
  assert.match(route, /pathname\.startsWith\("\/api\/auth\/sign-up"\)/);
  assert.match(route, /maySignInWithOtp/);
  assert.match(route, /"\/api\/auth\/sign-in\/email-otp"/);
  assert.match(route, /"\/api\/auth\/email-otp\/send-verification-otp"/);
});

test("OTP permission check consults membership and denies disabled users", () => {
  const guard = readFileSync(resolve(process.cwd(), "lib/auth/otpAccess.ts"), "utf8");
  assert.match(guard, /prisma\.workspaceMember\.findUnique/);
  assert.match(guard, /member\.isActive/);
  assert.match(guard, /isBootstrapAdmin/);
});
