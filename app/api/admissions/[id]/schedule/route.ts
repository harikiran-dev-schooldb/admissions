import { NextResponse, after } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuditActor, recordActivity } from "@/lib/audit/activity";
import { normalizeEmail, resolveAccessRole } from "@/lib/auth/accessPolicy";
import { queueUserAlert, dispatchForRecipients } from "@/lib/notifications/events";

type Context = { params: Promise<{ id: string }> };
const schema = z.object({
  kind: z.enum(["ENTRANCE", "INTERVIEW"]),
  scheduledAt: z.iso.datetime({ offset: true }),
  assignedToEmail: z.email().optional(),
}).strict();

export async function PATCH(req: Request, { params }: Context) {
  const authz = await requireAuditActor("workflow");
  if (authz.error) return authz.error;
  const actor = authz.actor;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose an appointment type, valid date/time and assignee" }, { status: 400 });
  const time = new Date(parsed.data.scheduledAt);
  if (time.getTime() < Date.now() || time.getTime() > Date.now() + 366 * 86_400_000) {
    return NextResponse.json({ error: "Schedule an appointment in the next 12 months" }, { status: 400 });
  }
  const assignedEmail = normalizeEmail(parsed.data.assignedToEmail ?? actor.email);
  if (actor.role !== "admin" && assignedEmail !== actor.email) {
    return NextResponse.json({ error: "Staff may schedule only for themselves" }, { status: 403 });
  }
  if (assignedEmail !== actor.email) {
    const member = await prisma.workspaceMember.findUnique({ where: { email: assignedEmail } });
    const validRole = resolveAccessRole(assignedEmail, process.env.ADMISSIONS_ADMIN_EMAILS, process.env.ADMISSIONS_STAFF_EMAILS, member);
    if (!validRole) return NextResponse.json({ error: "Choose an active team member" }, { status: 400 });
  }
  try {
    const { id } = await params;
    let recipients: string[] = [];
    const updated = await prisma.$transaction(async (tx) => {
      const previous = await tx.admission.findUnique({ where: { id } });
      if (!previous) return null;
      if (previous.finalAdmission !== "PENDING") throw new Error("Admission is closed");
      const isEntrance = parsed.data.kind === "ENTRANCE";
      const oldTime = isEntrance ? previous.entranceScheduledAt : previous.interviewScheduledAt;
      const oldEmail = isEntrance ? previous.entranceAssignedEmail : previous.interviewAssignedEmail;
      if (oldTime?.getTime() === time.getTime() && oldEmail === assignedEmail) return previous;
      const changed = await tx.admission.update({
        where: { id, updatedAt: previous.updatedAt },
        data: isEntrance
          ? { entranceScheduledAt: time, entranceAssignedEmail: assignedEmail }
          : { interviewScheduledAt: time, interviewAssignedEmail: assignedEmail },
      });
      await recordActivity(tx, actor, {
        entityType: "ADMISSION", action: "UPDATED", entityId: id,
        entityLabel: changed.enquiryNo, before: previous, after: changed,
      });
      const kind = isEntrance ? "ENTRANCE_SCHEDULED" : "INTERVIEW_SCHEDULED";
      const title = isEntrance ? "Entrance exam scheduled" : "Admission interview scheduled";
      const when = new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short",
      }).format(time);
      recipients = await queueUserAlert(tx, assignedEmail, {
        type: kind, eventKey: `schedule:${id}:${kind}:${changed.updatedAt.toISOString()}`,
        title, body: `Enquiry ${changed.enquiryNo} · ${when} IST`,
      });
      return changed;
    });
    if (!updated) return NextResponse.json({ error: "Admission not found" }, { status: 404 });
    if (recipients.length) after(() => dispatchForRecipients(recipients));
    return NextResponse.json({ data: updated }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof Error && error.message === "Admission is closed") {
      return NextResponse.json({ error: "Reopen the admission before scheduling" }, { status: 409 });
    }
    console.error("SCHEDULE_ADMISSION_ERROR", error instanceof Error ? error.name : "Unknown");
    return NextResponse.json({ error: "Unable to schedule appointment" }, { status: 500 });
  }
}
