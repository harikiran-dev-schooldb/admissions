import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { canAccess, resolveAccessRole, type AccessLevel, type AccessRole } from "@/lib/auth/accessPolicy";

export type { AccessLevel, AccessRole };

type AccessResult = { role: AccessRole | null; error: NextResponse | null };

function reject(error: string, status: number): AccessResult {
  return { role: null, error: NextResponse.json({ error }, { status }) };
}

/**
 * Server-trusted roles. No role is taken from a request body, query string,
 * client cookie, or unverified user metadata.
 */
export async function getAuthorizedRole(): Promise<AccessResult> {
  if (process.env.NODE_ENV !== "production" && process.env.LOCAL_AUTH_BYPASS === "true") {
    return { role: "admin", error: null };
  }

  const admins = process.env.ADMISSIONS_ADMIN_EMAILS;
  if (!admins?.split(",").some((email) => email.trim())) {
    return reject("Admissions administrators are not configured", 503);
  }

  try {
    const { data } = await auth.getSession();
    const email = data?.user?.email;
    if (!email) return reject("Authentication required", 401);

    const role = resolveAccessRole(email, admins, process.env.ADMISSIONS_STAFF_EMAILS);
    if (!role) return reject("You do not have access to this workspace", 403);
    return { role, error: null };
  } catch (error) {
    console.error("ADMISSIONS_AUTH_ERROR", error);
    return reject("Unable to verify your session", 503);
  }
}

export async function requireAccess(level: AccessLevel): Promise<NextResponse | null> {
  const { role, error } = await getAuthorizedRole();
  if (error) return error;
  if (!canAccess(role, level)) {
    return NextResponse.json({ error: "Only an administrator can change school records" }, { status: 403 });
  }
  return null;
}
