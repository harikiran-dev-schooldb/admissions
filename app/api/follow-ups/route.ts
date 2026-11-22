import { NextResponse } from "next/server";
import { Prisma } from "@/src/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuditActor, recordActivity } from "@/lib/audit/activity";
import { normalizeEmail, resolveAccessRole } from "@/lib/auth/accessPolicy";
import { admissionFollowUpId, followUpCreateSchema } from "@/lib/validation/followUps";
import { parsePage } from "@/lib/admissions/pagination";

const noStore = { "Cache-Control": "private, no-store, max-age=0" };
const PAGE_SIZE = 30;

export async function GET(req: Request) {
  const authz = await requireAuditActor("read");
  if (authz.error) return authz.error;
  const actor = authz.actor;
  const url = new URL(req.url);
  const admissionId = url.searchParams.get("admissionId");
  const academicYear = url.searchParams.get("academicYear");
  const status = url.searchParams.get("status") ?? "OPEN";
  if (admissionId && !admissionFollowUpId.safeParse(admissionId).success) {
    return NextResponse.json({ error: "Invalid enquiry ID" }, { status: 400 });
  }
  if (!admissionId && (!academicYear || !/^\d{4}-\d{2}$/.test(academicYear))) {
    return NextResponse.json({ error: "Choose an academic year" }, { status: 400 });
  }
  if (status !== "OPEN" && status !== "COMPLETED" && status !== "ALL") {
    return NextResponse.json({ error: "Invalid follow-up status" }, { status: 400 });
  }
  const before = url.searchParams.get("before");
  const after = url.searchParams.get("after");
  if ([before, after].some((date) => date !== null && (!date || !Number.isFinite(Date.parse(date))))) {
    return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
  }
  const dueAt: Prisma.DateTimeFilter | undefined = before || after
    ? { ...(before ? { lt: new Date(before) } : {}), ...(after ? { gte: new Date(after) } : {}) }
    : undefined;
  const where: Prisma.AdmissionFollowUpWhereInput = {
    ...(admissionId ? { admissionId } : { admission: { academicYear: academicYear! } }),
    ...(actor.role === "staff" ? { assignedToEmail: actor.email } : {}),
    ...(status !== "ALL" ? { status } : {}),
    ...(dueAt ? { dueAt } : {}),
  };
  const page = parsePage(url.searchParams.get("page"));
  try {
    const [items, total] = await Promise.all([
      prisma.admissionFollowUp.findMany({
        where,
        orderBy: admissionId ? [{ createdAt: "desc" }, { id: "desc" }] : status === "COMPLETED" ? [{ completedAt: "desc" }, { id: "desc" }] : [{ dueAt: "asc" }, { id: "asc" }],
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: { admission: { select: { id: true, enquiryNo: true, student: true, admClass: true, finalAdmission: true } } },
      }),
      prisma.admissionFollowUp.count({ where }),
    ]);
    return NextResponse.json({ data: items, total, page, pageSize: PAGE_SIZE }, { headers: noStore });
  } catch (error) {
    console.error("GET_ADMISSION_FOLLOWUPS_ERROR", error);
    return NextResponse.json({ error: "Could not load follow-ups" }, { status: 500, headers: noStore });
  }
}

class FollowUpConflict extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

export async function POST(req: Request) {
  const authz = await requireAuditActor("workflow");
  if (authz.error) return authz.error;
  const actor = authz.actor;
  try {
    const parsed = followUpCreateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid follow-up details", issues: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const { admissionId, dueAt, note } = parsed.data;
    const assignedToEmail = normalizeEmail(parsed.data.assignedToEmail ?? actor.email);
    if (actor.role !== "admin" && assignedToEmail !== actor.email) {
      return NextResponse.json({ error: "Staff may assign follow-ups only to themselves" }, { status: 403 });
    }
    if (actor.role === "admin" && assignedToEmail !== actor.email) {
      const member = await prisma.workspaceMember.findUnique({ where: { email: assignedToEmail } });
      if (!resolveAccessRole(assignedToEmail, process.env.ADMISSIONS_ADMIN_EMAILS, process.env.ADMISSIONS_STAFF_EMAILS, member)) {
        return NextResponse.json({ error: "Choose an active team member" }, { status: 400 });
      }
    }
    const created = await prisma.$transaction(async (tx) => {
      const admission = await tx.admission.findUnique({ where: { id: admissionId }, select: { enquiryNo: true, finalAdmission: true } });
      if (!admission) throw new FollowUpConflict("Enquiry not found", 404);
      if (admission.finalAdmission !== "PENDING") {
        throw new FollowUpConflict("Reopen the enquiry before scheduling a new follow-up", 409);
      }
      const item = await tx.admissionFollowUp.create({
        data: { admissionId, assignedToEmail, dueAt: new Date(dueAt), note: note || null, createdByEmail: actor.email },
      });
      await recordActivity(tx, actor, {
        entityType: "FOLLOW_UP", action: "CREATED", entityId: item.id,
        entityLabel: admission.enquiryNo, after: item,
      });
      return item;
    });
    return NextResponse.json({ data: created }, { status: 201, headers: noStore });
  } catch (error) {
    if (error instanceof FollowUpConflict) return NextResponse.json({ error: error.message }, { status: error.status, headers: noStore });
    if (error instanceof SyntaxError) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    console.error("CREATE_ADMISSION_FOLLOWUP_ERROR", error);
    return NextResponse.json({ error: "Unable to schedule follow-up" }, { status: 500, headers: noStore });
  }
}
