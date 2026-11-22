import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isBootstrapAdmin } from "@/lib/auth/accessPolicy";
import { requireAuditActor, recordActivity } from "@/lib/audit/activity";

type Context = { params: Promise<{ id: string }> };
const updateSchema = z.object({
  role: z.enum(["ADMIN", "STAFF"]).optional(),
  isActive: z.boolean().optional(),
}).strict().refine((value) => value.role !== undefined || value.isActive !== undefined, {
  message: "Nothing to update",
});

export async function PATCH(req: Request, { params }: Context) {
  const authorization = await requireAuditActor("admin");
  if (authorization.error) return authorization.error;
  const actor = authorization.actor;
  try {
    const parsed = updateSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid role or account status" }, { status: 400 });
    const { id } = await params;
    const member = await prisma.workspaceMember.findUnique({ where: { id } });
    if (!member) return NextResponse.json({ error: "Account not found" }, { status: 404 });

    if (member.email === actor.email || isBootstrapAdmin(member.email, process.env.ADMISSIONS_ADMIN_EMAILS)) {
      return NextResponse.json({ error: "A protected administrator or your own account cannot be changed here" }, { status: 403 });
    }

    const nextRole = parsed.data.role ?? member.role;
    const nextActive = parsed.data.isActive ?? member.isActive;
    if (nextRole === member.role && nextActive === member.isActive) {
      return NextResponse.json({ data: member }, { headers: { "Cache-Control": "no-store" } });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const record = await tx.workspaceMember.update({
        where: { id },
        data: {
          role: nextRole,
          isActive: nextActive,
          updatedBy: actor.email,
        },
      });
      const action = !nextActive && member.isActive ? "DEACTIVATED" :
        nextActive && !member.isActive ? "REACTIVATED" : "ROLE_CHANGED";
      await tx.workspaceMemberAudit.create({
        data: {
          memberEmail: member.email,
          actorEmail: actor.email,
          action,
          beforeRole: member.role,
          afterRole: nextRole,
          beforeActive: member.isActive,
          afterActive: nextActive,
        },
      });
      await recordActivity(tx, actor, {
        entityType: "USER", action, entityId: record.id,
        entityLabel: record.email, before: member, after: record,
      });
      return record;
    });
    return NextResponse.json({ data: updated }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof SyntaxError) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    console.error("UPDATE_WORKSPACE_USER_ERROR", error);
    return NextResponse.json({ error: "Unable to update user. Check database migrations." }, { status: 500 });
  }
}
