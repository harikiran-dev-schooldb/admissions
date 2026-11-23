/**
 * Friendly username for account history. The saved staff name is preferred;
 * legacy accounts without a name display the login username, not the full email.
 * Emails remain the immutable identifiers for authentication and audit records.
 */
export function displayMemberName(email: string | null | undefined, savedName?: string | null): string {
  const name = savedName?.trim();
  if (name) return name;
  const localPart = (email ?? "").trim().split("@")[0];
  return localPart || "Unknown user";
}

export function validMemberName(name: string) {
  const clean = name.trim().replace(/\s+/g, " ");
  return clean.length >= 2 && clean.length <= 120 && !/[\x00-\x1f\x7f]/.test(clean) ? clean : null;
}
