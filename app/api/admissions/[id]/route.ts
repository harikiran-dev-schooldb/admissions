import { requireAccess } from "@/lib/auth/requireAccess";
import { requireAuditActor, recordActivity } from "@/lib/audit/activity";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { admissionUpdateSchema, validationError } from "@/lib/validation/admissions";
import { calculateAge, getEligibleClass } from "@/lib/eligibility";
import { getDefaultAgeAsOfDate } from "@/lib/admissionSettings";

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
      ...(parsed.data.student ? { student: parsed.data.student.toUpperCase() } : {}),
      ...(parsed.data.parent ? { parent: parsed.data.parent.toUpperCase() } : {}),
    };

    if (parsed.data.dob !== undefined || parsed.data.admClass !== undefined || parsed.data.academicYear !== undefined) {
      const dob = parsed.data.dob ?? existing.dob;
      const admClass = parsed.data.admClass ?? existing.admClass;
      const config = await prisma.admissionConfig.findUnique({ where: { key: "ageAsOfDate" } });
      const ageData = dob ? calculateAge(dob, config?.value ?? getDefaultAgeAsOfDate(academicYear)) : null;
      const eligibleClass = ageData ? getEligibleClass(ageData.years) : "NOT ELIGIBLE";
      Object.assign(data, {
        age: ageData?.text ?? null,
        eligibleClass,
        eligibleStatus: eligibleClass === admClass.trim().toUpperCase() ? "ELIGIBLE" : "NOT ELIGIBLE",
      });
    }

    const admission = await prisma.$transaction(async (tx) => {
      const before = await tx.admission.findUniqueOrThrow({ where: { id } });
      const updated = await tx.admission.update({ where: { id }, data });
      await recordActivity(tx, actor, {
        entityType: "ADMISSION", action: "UPDATED", entityId: id,
        entityLabel: updated.enquiryNo, before, after: updated,
      });
      return updated;
    });
    return NextResponse.json({ data: admission });
  } catch (error) {
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
    await prisma.$transaction(async (tx) => {
      const deleted = await tx.admission.delete({ where: { id } });
      await recordActivity(tx, actor, {
        entityType: "ADMISSION", action: "DELETED", entityId: id,
        entityLabel: deleted.enquiryNo, before: deleted,
      });
    });
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("DELETE_ADMISSION_ERROR", error);
    return NextResponse.json({ error: "Failed to delete admission" }, { status: 500 });
  }
}
