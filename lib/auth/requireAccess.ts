import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";

export type AccessLevel = "read" | "staff" | "admin";

function emailSet(value: string | undefined) {
  return new Set((value ?? "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean));
}

// Fail closed: configure ADMISSIONS_ADMIN_EMAILS before enabling production access.
export async function requireAccess(level: AccessLevel): Promise<NextResponse | null> {
  if (process.env.NODE_ENV !== "production" && process.env.LOCAL_AUTH_BYPASS === "true") {
    return null;
  }
  const admins = emailSet(process.env.ADMISSIONS_ADMIN_EMAILS);
  if (admins.size === 0) {
    return NextResponse.json({ error: "Admissions administrators are not configured" }, { status: 503 });
  }
  try {
    const { data } = await auth.getSession();
    const email = data?.user?.email?.trim().toLowerCase();
    if (!email) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    if (admins.has(email)) return null;
    if (level !== "admin" && emailSet(process.env.ADMISSIONS_STAFF_EMAILS).has(email)) return null;
    return NextResponse.json({ error: "You do not have permission to perform this operation" }, { status: 403 });
  } catch (error) {
    console.error("ADMISSIONS_AUTH_ERROR", error);
    return NextResponse.json({ error: "Unable to verify your session" }, { status: 503 });
  }
}
