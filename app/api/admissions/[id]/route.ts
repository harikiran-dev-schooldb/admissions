import { requireAccess } from "@/lib/auth/requireAccess";
import { requireAuditActor, recordActivity } from "@/lib/audit/activity";
import { assertUniqueEnquiry, DuplicateEnquiry } from "@/lib/admissions/duplicateServer";
import { canonicalName } from "@/lib/admissions/duplicate";
import { archiveAdmission } from "@/lib/admissions/archive";
import { Prisma } from "@/src/generated/prisma/client";
import { alertReleasedSeat } from "@/lib/admissions/seatAlerts";
import { dispatchForRecipients } from "@/lib/notifications/events";
import { NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { admissionUpdateSchema, validationError } from "@/lib/validation/admissions";
import { calculateAge, getEligibleClass } from "@/lib/eligibility";
import { loadYearPolicy } from "@/lib/admissions/yearPolicyServer";
import { eligibleForPolicy } from "@/lib/admissions/yearPolicy";

type Context = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Context) {
  const accessError = await requireAccess("read");
  if (accessError) return accessError;
  const { id } = await params;
  const admission = await prisma.admission.findUnique({ where: { id } });
  if (!admission) return NextResponse.json({ error: "Admission not found" }, { status: 404 });
  return NextResponse.json({ data: admission });
}

export async function PATCH(req: Request, { params }: Context) {
  const authz = await requireAuditActor("admin");
  if (authz.error) return authz.error;
  const actor = authz.actor;
  try {
    const { id } = await params;
    const parsed = admissionUpdateSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 });

    const existing = await prisma.admission.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Admission not found" }, { status: 404 });

    const academicYear = parsed.data.academicYear ?? existing.academicYear;
    if (parsed.data.academicYear && parsed.data.academicYear !== existing.academicYear) {
      const managedYear = await prisma.academicYear.findUnique({ where: { academicYear } });
      if (!managedYear?.isActive) {
        return NextResponse.json({ error: "Choose an active academic year" }, { status: 400 });
      }
    }

    const data = {
      ...parsed.data,
      ...(parsed.data.student ? { student: canonicalName(parsed.data.student) } : {}),
      ...(parsed.data.parent ? { parent: parsed.data.parent.toUpperCase() } : {}),
    };

    if (parsed.data.dob !== undefined || parsed.data.admClass !== undefined || parsed.data.academicYear !== undefined) {
      const dob = parsed.data.dob ?? existing.dob;
      const admClass = parsed.data.admClass ?? existing.admClass;
      const policy = await loadYearPolicy(academicYear);
      const ageData = dob ? calculateAge(dob, policy.ageAsOfDate) : null;
      const eligibleClass = eligibleForPolicy(ageData, ageData ? getEligibleClass(ageData.years) : "NOT ELIGIBLE", admClass, policy.rules);
      Object.assign(data, {
        age: ageData?.text ?? null,
        eligibleClass,
        eligibleStatus: eligibleClass === admClass.trim().toUpperCase() ? "ELIGIBLE" : "NOT ELIGIBLE",
      });
    }

    const admission = await prisma.$transaction(async (tx) => {
      const before = await tx.admission.findUniqueOrThrow({ where: { id } });
      if (parsed.data.student !== undefined || parsed.data.mobile !== undefined || parsed.data.dob !== undefined || parsed.data.academicYear !== undefined) {
        await assertUniqueEnquiry(tx, { academicYear, student: parsed.data.student ?? before.student,
          mobile: parsed.data.mobile ?? before.mobile, dob: parsed.data.dob ?? before.dob }, id);
      }
      const updated = await tx.admission.update({ where: { id, updatedAt: existing.updatedAt }, data });
      await recordActivity(tx, actor, {
        entityType: "ADMISSION", action: "UPDATED", entityId: id,
        entityLabel: updated.enquiryNo, before, after: updated,
      });
      return updated;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return NextResponse.json({ data: admission });
  } catch (error) {
    if (error instanceof DuplicateEnquiry) return NextResponse.json({ error: error.message }, { status: 409 });
    if (error instanceof Prisma.PrismaClientKnownRequestError && ["P2025", "P2034"].includes(error.code)) return NextResponse.json({ error: "Record changed. Refresh before editing." }, { status: 409 });
    console.error("UPDATE_ADMISSION_ERROR", error);
    return NextResponse.json({ error: "Failed to update admission" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Context) {
  const authz = await requireAuditActor("admin");
  if (authz.error) return authz.error;
  const actor = authz.actor;
  try {
    const { id } = await params;
    const recipients=await prisma.$transaction(async (tx) => {
      const archived=await archiveAdmission(tx,id,actor);
      return archived.finalAdmission==="ADMITTED"?alertReleasedSeat(tx,archived,"archived"):[];
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    if(recipients.length)after(()=>dispatchForRecipients(recipients));
    return new Response(null, { status: 204 });
  } catch (error) {
    if(error instanceof Prisma.PrismaClientKnownRequestError && ["P2025","P2034","P2002"].includes(error.code)) return NextResponse.json({error:"Record changed. Refresh before archiving."},{status:409});
    console.error("DELETE_ADMISSION_ERROR", error);
    return NextResponse.json({ error: "Failed to delete admission" }, { status: 500 });
  }
}
