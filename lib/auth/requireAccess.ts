import { NextResponse } from "next/server";
import { Prisma } from "@/src/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/server";
import { displayMemberName } from "@/lib/users/displayMemberName";
import {
  canAccess,
  normalizeEmail,
  resolveAccessRole,
  type AccessLevel,
  type AccessRole,
} from "@/lib/auth/accessPolicy";

export type { AccessLevel, AccessRole };
type AccessResult = {
  role: AccessRole | null;
  email: string | null;
  name: string | null;
  error: NextResponse | null;
};

function reject(error: string, status: number): AccessResult {
  return { role: null, email: null, name: null, error: NextResponse.json({ error }, { status }) };
}

/**
 * The authenticated Neon session is the only source for the caller's email.
 * Bootstrap admins cannot lose access through database role changes.
 * All other roles are resolved from the live membership table on each request.
 */
export async function getAuthorizedRole(): Promise<AccessResult> {
  if (process.env.NODE_ENV !== "production" && process.env.LOCAL_AUTH_BYPASS === "true") {
    return { role: "admin", email: "local-admin@localhost.invalid", name: "Local Administrator", error: null };
  }

  const admins = process.env.ADMISSIONS_ADMIN_EMAILS;
  if (!admins?.split(",").some((email) => email.trim())) {
    return reject("Admissions bootstrap administrator is not configured", 503);
  }

  try {
    const { data } = await auth.getSession();
    const email = data?.user?.email ? normalizeEmail(data.user.email) : null;
    if (!email) return reject("Authentication required", 401);
    const name = typeof data?.user?.name === "string" ? data.user.name.trim().slice(0, 120) : null;

    // No database dependency is needed to recover from a broken migration.
    const bootstrapRole = resolveAccessRole(email, admins, undefined);
    if (bootstrapRole === "admin") return { role: "admin", email, name: displayMemberName(email, name), error: null };

    const member = await prisma.workspaceMember.findUnique({
      where: { email },
      select: { role: true, isActive: true, name: true },
    });

    const role = resolveAccessRole(
      email,
      admins,
      process.env.ADMISSIONS_STAFF_EMAILS,
      member,
    );
    if (!role) return reject("You do not have access to this workspace", 403);
    return { role, email, name: displayMemberName(email, member?.name || name), error: null };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
      return reject("Database setup is incomplete. An administrator must apply the database migrations.", 503);
    }
    console.error("ADMISSIONS_AUTH_ERROR", error);
    return reject("Unable to verify your session", 503);
  }
}

export async function requireAccess(level: AccessLevel): Promise<NextResponse | null> {
  const { role, error } = await getAuthorizedRole();
  if (error) return error;
  if (!canAccess(role, level)) {
    return NextResponse.json({ error: "You do not have permission for this operation" }, { status: 403 });
  }
  return null;
}

export async function requireAdminIdentity(): Promise<{ email: string; error: null } | { email: null; error: NextResponse }> {
  const session = await getAuthorizedRole();
  if (session.error) return { email: null, error: session.error };
  if (session.role !== "admin" || !session.email) {
    return { email: null, error: NextResponse.json({ error: "Administrator access required" }, { status: 403 }) };
  }
  return { email: session.email, error: null };
}
