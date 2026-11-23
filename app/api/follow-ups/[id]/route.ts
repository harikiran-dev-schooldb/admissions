import { NextResponse, after } from "next/server";
import { queueAdminAlert, dispatchForRecipients } from "@/lib/notifications/events";
import { Prisma } from "@/src/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuditActor, recordActivity } from "@/lib/audit/activity";
import { followUpCompleteSchema } from "@/lib/validation/followUps";

type Context = { params: Promise<{ id: string }> };
const noStore = { "Cache-Control": "private, no-store, max-age=0" };

class CompletionConflict extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

export async function PATCH(req: Request, { params }: Context) {
  const authz = await requireAuditActor("workflow");
  if (authz.error) return authz.error;
  const actor = authz.actor;

  try {
    const { id } = await params;
    const parsed = followUpCompleteSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Choose a contact outcome and enter a note under 2000 characters" }, { status: 400 });
    }
    let alertRecipients: string[] = [];
    const updated = await prisma.$transaction(async (tx) => {
      const before = await tx.admissionFollowUp.findUnique({
        where: { id }, include: { admission: { select: { enquiryNo: true } } },
      });
      if (!before) throw new CompletionConflict("Follow-up not found", 404);
      if (actor.role !== "admin" && before.assignedToEmail !== actor.email) {
        throw new CompletionConflict("This follow-up belongs to another staff member", 403);
      }
      if (before.status !== "OPEN") throw new CompletionConflict("Follow-up already completed. Refresh the queue.", 409);
      const next = await tx.admissionFollowUp.update({
        where: { id, status: "OPEN", updatedAt: before.updatedAt },
        data: {
          status: "COMPLETED",
          outcome: parsed.data.outcome,
          completionNote: parsed.data.completionNote || null,
          completedAt: new Date(),
          completedByEmail: actor.email,
        },
      });
      await recordActivity(tx, actor, {
        entityType: "FOLLOW_UP", action: "COMPLETED", entityId: next.id,
        entityLabel: before.admission.enquiryNo, before, after: next,
      });
      alertRecipients = await queueAdminAlert(tx, {
        type: "FOLLOW_UP_COMPLETED", eventKey: `follow-up:${next.id}:completed`,
        title: "Parent follow-up completed",
        body: `Enquiry ${before.admission.enquiryNo} · Follow-up completed`,
      });
      return next;
    });
    if (alertRecipients.length) after(() => dispatchForRecipients(alertRecipients));
    return NextResponse.json({ data: updated }, { headers: noStore });
  } catch (error) {
    if (error instanceof CompletionConflict) {
      return NextResponse.json({ error: error.message }, { status: error.status, headers: noStore });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Another user updated this follow-up. Refresh and retry." }, { status: 409, headers: noStore });
    }
    if (error instanceof SyntaxError) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    console.error("COMPLETE_ADMISSION_FOLLOWUP_ERROR", error);
    return NextResponse.json({ error: "Unable to complete follow-up" }, { status: 500, headers: noStore });
  }
}
