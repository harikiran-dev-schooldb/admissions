import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isBootstrapAdmin, normalizeEmail } from "@/lib/auth/accessPolicy";
import { requireAuditActor, recordActivity } from "@/lib/audit/activity";
import { validMemberName } from "@/lib/users/displayMemberName";

const schema = z.object({
  email: z.email().max(254),
  name: z.string().trim().min(2).max(120),
}).strict();
const noStore = { "Cache-Control": "private, no-store, max-age=0" };

/**
 * Protected admin access is configured in environment variables, but those
 * identities might not have a WorkspaceMember record. This only edits the
 * display name; it cannot change their access or authentication settings.
 */
export async function PATCH(req: Request) {
  const authz = await requireAuditActor("admin");
  if (authz.error) return authz.error;
  const actor = authz.actor;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid account and display name" }, { status: 400, headers: noStore });
  const email = normalizeEmail(parsed.data.email);
  const name = validMemberName(parsed.data.name);
  if (!name) return NextResponse.json({ error: "Display name must contain 2–120 characters" }, { status: 400, headers: noStore });
  if (!isBootstrapAdmin(email, process.env.ADMISSIONS_ADMIN_EMAILS)) {
    return NextResponse.json({ error: "This profile is not a protected administrator" }, { status: 403, headers: noStore });
  }

  try {
    const member = await prisma.$transaction(async (tx) => {
      const before = await tx.workspaceMember.findUnique({ where: { email } });
      if (before?.name === name) return before;
      const updated = before
        ? await tx.workspaceMember.update({ where: { email }, data: { name, updatedBy: actor.email } })
        : await tx.workspaceMember.create({
            data: { email, name, role: "ADMIN", isActive: true, createdBy: actor.email, updatedBy: actor.email },
          });
      await tx.workspaceMemberAudit.create({
        data: {
          memberEmail: email, actorEmail: actor.email, action: "NAME_CHANGED",
          beforeRole: before?.role ?? null, afterRole: updated.role,
          beforeActive: before?.isActive ?? null, afterActive: updated.isActive,
        },
      });
      await recordActivity(tx, actor, {
        entityType: "USER", action: "UPDATED", entityId: updated.id,
        entityLabel: name, before, after: updated,
      });
      return updated;
    });
    return NextResponse.json({ data: { email: member.email, name: member.name } }, { headers: noStore });
  } catch (error) {
    console.error("UPDATE_BOOTSTRAP_DISPLAY_NAME_ERROR", error instanceof Error ? error.name : "Unknown");
    return NextResponse.json({ error: "Unable to save display name" }, { status: 500, headers: noStore });
  }
}
