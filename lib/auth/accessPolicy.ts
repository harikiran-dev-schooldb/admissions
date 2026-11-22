export type AccessRole = "admin" | "staff";
export type AccessLevel = "read" | "admin";

function emails(value: string | undefined): Set<string> {
  return new Set((value ?? "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean));
}

/** Only named, verified Neon Auth users may access student records. Admin wins over staff. */
export function resolveAccessRole(
  email: string | null | undefined,
  adminEmails: string | undefined,
  staffEmails: string | undefined,
): AccessRole | null {
  if (!email?.trim() || emails(adminEmails).size === 0) return null;
  const address = email.trim().toLowerCase();
  if (emails(adminEmails).has(address)) return "admin";
  if (emails(staffEmails).has(address)) return "staff";
  return null;
}

export function canAccess(role: AccessRole | null, level: AccessLevel): boolean {
  if (role === "admin") return true;
  return level === "read" && role === "staff";
}
