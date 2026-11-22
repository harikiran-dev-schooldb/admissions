export type AccessRole = "admin" | "staff";
export type AccessLevel = "read" | "enquiry" | "workflow" | "admin";

export type StoredMembership = {
  role: "ADMIN" | "STAFF";
  isActive: boolean;
};

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function emailSet(value: string | undefined): Set<string> {
  return new Set((value ?? "").split(",").map(normalizeEmail).filter(Boolean));
}

export function isBootstrapAdmin(email: string, adminEmails: string | undefined): boolean {
  return emailSet(adminEmails).has(normalizeEmail(email));
}

/**
 * A bootstrap administrator can never be demoted from the dashboard.
 * Database membership takes precedence over legacy staff environment grants,
 * including inactive records (revocation tombstones).
 */
export function resolveAccessRole(
  email: string | null | undefined,
  adminEmails: string | undefined,
  staffEmails: string | undefined,
  member?: StoredMembership | null,
): AccessRole | null {
  if (!email?.trim() || emailSet(adminEmails).size === 0) return null;
  const address = normalizeEmail(email);
  if (isBootstrapAdmin(address, adminEmails)) return "admin";
  if (member) return member.isActive ? member.role.toLowerCase() as AccessRole : null;
  if (emailSet(staffEmails).has(address)) return "staff";
  return null;
}

export function canAccess(role: AccessRole | null, level: AccessLevel): boolean {
  if (role === "admin") return true;
  return role === "staff" && level !== "admin";
}
