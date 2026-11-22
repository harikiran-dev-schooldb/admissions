import { NextResponse } from "next/server";
import type { Prisma } from "@/src/generated/prisma/client";
import { canAccess, type AccessLevel, type AccessRole } from "@/lib/auth/accessPolicy";
import { getAuthorizedRole } from "@/lib/auth/requireAccess";

export type AuditEntity = "ADMISSION" | "FEE" | "ACADEMIC_YEAR" | "SETTINGS" | "USER" | "FOLLOW_UP";
export type AuditAction = "CREATED" | "UPDATED" | "DELETED" | "STAGE_CHANGED" | "DEACTIVATED" | "REACTIVATED" | "ROLE_CHANGED" | "COMPLETED";
export type AuditActor = { email: string; name: string | null; role: AccessRole };
export type AuditValue = string | number | boolean | null;

/** Explicit allowlist prevents storing DOB, phone, parent details, tokens, etc. */
const auditableFields: Record<AuditEntity, readonly string[]> = {
  ADMISSION: ["enquiryNo","academicYear","admClass","eligibleStatus","application","entrance","interview","finalAdmission","admissionGiven"],
  FEE: ["academicYear","className","age","termFee","annualFees"],
  ACADEMIC_YEAR: ["academicYear","startDate","endDate","isActive"],
  SETTINGS: ["key","value"],
  USER: ["email","role","isActive"],
  // Private parent conversation notes never enter the shared audit log.
  FOLLOW_UP: ["assignedToEmail","dueAt","status","outcome"],
};

function valueToAudit(value: unknown): AuditValue {
  if (value instanceof Date) return value.toISOString();
  if (value === null || value === undefined) return null;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  return null;
}

export function diffAudit(
  entityType: AuditEntity,
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
): Record<string, { from: AuditValue; to: AuditValue }> {
  const changes: Record<string, { from: AuditValue; to: AuditValue }> = {};
  for (const field of auditableFields[entityType]) {
    if (!before && !after) continue;
    if (!before && !(field in (after ?? {}))) continue;
    if (!after && !(field in (before ?? {}))) continue;
    const from = valueToAudit(before?.[field]);
    const to = valueToAudit(after?.[field]);
    if (from !== to) changes[field] = { from, to };
  }
  return changes;
}

export async function requireAuditActor(level: AccessLevel) {
  const access = await getAuthorizedRole();
  if (access.error) return { actor: null, error: access.error } as const;
  if (!access.email || !access.role || !canAccess(access.role, level)) {
    return {
      actor: null,
      error: NextResponse.json({ error: "You do not have permission for this operation" }, { status: 403 }),
    } as const;
  }
  return { actor: { email: access.email, name: access.name, role: access.role } as AuditActor, error: null } as const;
}

export async function recordActivity(
  tx: Prisma.TransactionClient,
  actor: AuditActor,
  details: {
    entityType: AuditEntity;
    entityId: string;
    entityLabel: string;
    action: AuditAction;
    before?: Record<string, unknown> | null;
    after?: Record<string, unknown> | null;
  },
) {
  const changes = diffAudit(details.entityType, details.before ?? null, details.after ?? null);
  return tx.activityLog.create({
    data: {
      actorEmail: actor.email,
      actorName: actor.name,
      actorRole: actor.role,
      action: details.action,
      entityType: details.entityType,
      entityId: details.entityId,
      entityLabel: details.entityLabel.slice(0, 180),
      changes: changes as Prisma.InputJsonValue,
    },
  });
}
