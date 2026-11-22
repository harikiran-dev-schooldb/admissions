import { Prisma } from "@/src/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { isBootstrapAdmin, normalizeEmail, emailSet } from "@/lib/auth/accessPolicy";

export type OtpPermission = { allowed: boolean; unavailable: boolean };

/** Email access is checked BEFORE sending OTP and again BEFORE session creation. */
export async function maySignInWithOtp(email: string): Promise<OtpPermission> {
  const normalized = normalizeEmail(email);
  if (!normalized || normalized.length > 254) return { allowed: false, unavailable: false };

  const admins = process.env.ADMISSIONS_ADMIN_EMAILS;
  if (!emailSet(admins).size) return { allowed: false, unavailable: true };
  if (isBootstrapAdmin(normalized, admins)) return { allowed: true, unavailable: false };

  try {
    const member = await prisma.workspaceMember.findUnique({
      where: { email: normalized },
      select: { isActive: true },
    });
    if (member) return { allowed: member.isActive, unavailable: false };
    return { allowed: emailSet(process.env.ADMISSIONS_STAFF_EMAILS).has(normalized), unavailable: false };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
      return { allowed: false, unavailable: true };
    }
    console.error("OTP_PERMISSION_CHECK_FAILED", error);
    return { allowed: false, unavailable: true };
  }
}
