import { buildStageUpdate, validateStageTransition } from "@/lib/admissionTransitionRules";
import { getNextAdmissionAction } from "@/lib/admissions/nextAction";
import { requireAuditActor, recordActivity } from "@/lib/audit/activity";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/src/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse, after } from "next/server";
import { queueAdminAlert, dispatchForRecipients } from "@/lib/notifications/events";
import { admissionStageSchema, validationError } from "@/lib/validation/admissions";

class StageConflict extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

const noStore = { "Cache-Control": "private, no-store" };

export async function PATCH(req: Request) {
  const authz = await requireAuditActor("workflow");
  if (authz.error) return authz.error;
  const actor = authz.actor;

  try {
    const parsed = admissionStageSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(validationError(parsed.error), { status: 400, headers: noStore });
    }

    const { id, field, value } = parsed.data;
    let alertRecipients: string[] = [];
    const updated = await prisma.$transaction(async (tx) => {
      const current = await tx.admission.findUnique({ where: { id } });
      if (!current) throw new StageConflict("This enquiry was not found. Refresh the directory.", 404);

      // Always validate against the latest saved state, not an earlier
      // snapshot loaded before the transaction.
      const message = validateStageTransition(current, field, value);
      if (message) throw new StageConflict(message, 409);
      if (current[field] === value) return current;

      const data = buildStageUpdate(current, field, value);
      // Two users should never silently overwrite each other's stage updates.
      // Include the @updatedAt version in the conditional update predicate.
      const changed = await tx.admission.update({
        where: { id, updatedAt: current.updatedAt },
        data,
      });
      // Retire only automatically generated tasks for stages no longer current.
      // Manual parent follow-ups are never changed by workflow automation.
      const nextAction = getNextAdmissionAction(changed);
      const workflowTasks = await tx.admissionFollowUp.findMany({
        where: { admissionId: id, status: "OPEN", note: { startsWith: "[WORKFLOW:" } },
      });
      for (const task of workflowTasks) {
        if (changed.finalAdmission === "PENDING" && task.note?.startsWith(`[WORKFLOW:${nextAction.stage}]`)) continue;
        const retired = await tx.admissionFollowUp.update({
          where: { id: task.id }, data: {
            status: "COMPLETED", outcome: "OTHER",
            completionNote: "Automatically closed because the admission workflow changed.",
            completedAt: new Date(), completedByEmail: actor.email,
          },
        });
        await recordActivity(tx, actor, { entityType: "FOLLOW_UP", action: "COMPLETED",
          entityId: task.id, entityLabel: changed.enquiryNo, before: task, after: retired });
      }
      const action = getNextAdmissionAction(changed);
      if (changed.finalAdmission === "PENDING" && action.priority !== "complete") {
        const taskMarker = `[WORKFLOW:${action.stage}]`;
        const existing = await tx.admissionFollowUp.findFirst({
          where: { admissionId: id, status: "OPEN", note: { startsWith: taskMarker } },
          select: { id: true },
        });
        if (!existing) {
          const dueAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
          const task = await tx.admissionFollowUp.create({
            data: { admissionId: id, assignedToEmail: actor.email, dueAt,
              note: `${taskMarker} ${action.title}. ${action.description}`,
              createdByEmail: actor.email },
          });
          await recordActivity(tx, actor, { entityType: "FOLLOW_UP", action: "CREATED",
            entityId: task.id, entityLabel: changed.enquiryNo, after: task });
        }
      }
      await recordActivity(tx, actor, {
        entityType: "ADMISSION",
        action: "STAGE_CHANGED",
        entityId: id,
        entityLabel: changed.enquiryNo,
        before: current,
        after: changed,
      });
      const events = [
        ...(current.application !== "SUBMITTED" && changed.application === "SUBMITTED"
          ? [{ type: "APPLICATION_SUBMITTED" as const, title: "Application submitted", body: `Application submitted · ${changed.enquiryNo}` }] : []),
        ...(current.finalAdmission !== "ADMITTED" && changed.finalAdmission === "ADMITTED"
          ? [{ type: "STUDENT_ADMITTED" as const, title: "Student admitted", body: `Admission confirmed · ${changed.enquiryNo}` }] : []),
        ...(current.finalAdmission !== "CANCELLED" && changed.finalAdmission === "CANCELLED"
          ? [{ type: "ADMISSION_CANCELLED" as const, title: "Admission cancelled", body: `Admission cancelled · ${changed.enquiryNo}` }] : []),
      ];
      for (const event of events) {
        const recipients = await queueAdminAlert(tx, {
          ...event, eventKey: `admission:${id}:${event.type}:${changed.updatedAt.toISOString()}`,
        });
        alertRecipients = [...new Set([...alertRecipients, ...recipients])];
      }
      return changed;
    });

    revalidatePath("/admissions");
    if (alertRecipients.length) after(() => dispatchForRecipients(alertRecipients));
    return NextResponse.json({ success: true, data: updated }, { headers: noStore });
  } catch (error) {
    if (error instanceof StageConflict) {
      return NextResponse.json({ error: error.message }, { status: error.status, headers: noStore });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({
        error: "This enquiry was changed by another user. Refresh and try again.",
      }, { status: 409, headers: noStore });
    }
    console.error("PATCH_STAGE_ERROR", error);
    return NextResponse.json({ error: "Unable to save stage. Please try again." }, { status: 500, headers: noStore });
  }
}
