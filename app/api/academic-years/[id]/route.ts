import { requireAccess } from "@/lib/auth/requireAccess";
import { requireAuditActor, recordActivity } from "@/lib/audit/activity";
import { NextResponse } from "next/server";
import { Prisma } from "@/src/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { academicYearPatchSchema, academicYearReplaceSchema, validationError } from "@/lib/validation/fees";

type Context = { params: Promise<{ id: string }> };

function academicYearError(error: unknown, action: string) {
  if (error instanceof SyntaxError) return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") return NextResponse.json({ error: "Academic year not found" }, { status: 404 });
    if (error.code === "P2002") return NextResponse.json({ error: "This academic year already exists." }, { status: 409 });
    if (error.code === "P2003") return NextResponse.json({ error: "This academic year is used by admissions or fees. Archive it instead of deleting it." }, { status: 409 });
  }
  console.error(`${action}_ACADEMIC_YEAR_ERROR`, error);
  return NextResponse.json({ error: `Failed to ${action.toLowerCase()} academic year` }, { status: 500 });
}

export async function GET(_req: Request, { params }: Context) {
  const accessError = await requireAccess("read");
  if (accessError) return accessError;
  try {
    const { id } = await params;
    const academicYear = await prisma.academicYear.findUnique({ where: { id } });
    if (!academicYear) return NextResponse.json({ error: "Academic year not found" }, { status: 404 });
    return NextResponse.json({ data: academicYear });
  } catch (error) {
    return academicYearError(error, "GET");
  }
}

export async function PUT(req: Request, { params }: Context) {
  const authorization = await requireAuditActor("admin");
  if (authorization.error) return authorization.error;
  const actor = authorization.actor;
  try {
    const { id } = await params;
    const parsed = academicYearReplaceSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 });
    const academicYear = await prisma.$transaction(async (tx) => {
      const before = await tx.academicYear.findUniqueOrThrow({ where: { id } });
      const updated = await tx.academicYear.update({ where: { id }, data: { ...parsed.data, startDate: parsed.data.startDate ?? null, endDate: parsed.data.endDate ?? null, isActive: parsed.data.isActive ?? true } });
      await recordActivity(tx, actor, {
        entityType: "ACADEMIC_YEAR", action: "UPDATED", entityId: id,
        entityLabel: updated.academicYear, before, after: updated,
      });
      return updated;
    });
    return NextResponse.json({ data: academicYear });
  } catch (error) {
    return academicYearError(error, "UPDATE");
  }
}

export async function PATCH(req: Request, { params }: Context) {
  const authorization = await requireAuditActor("admin");
  if (authorization.error) return authorization.error;
  const actor = authorization.actor;
  try {
    const { id } = await params;
    const parsed = academicYearPatchSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 });

    const existing = await prisma.academicYear.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Academic year not found" }, { status: 404 });
    const startDate = parsed.data.startDate === undefined ? existing.startDate : parsed.data.startDate;
    const endDate = parsed.data.endDate === undefined ? existing.endDate : parsed.data.endDate;
    if (startDate && endDate && startDate > endDate) {
      return NextResponse.json(
        { error: "Validation failed", issues: { formErrors: [], fieldErrors: { endDate: ["End date must be on or after start date"] } } },
        { status: 400 },
      );
    }

    const academicYear = await prisma.$transaction(async (tx) => {
      const before = await tx.academicYear.findUniqueOrThrow({ where: { id } });
      const updated = await tx.academicYear.update({ where: { id }, data: parsed.data });
      await recordActivity(tx, actor, {
        entityType: "ACADEMIC_YEAR", action: "UPDATED", entityId: id,
        entityLabel: updated.academicYear, before, after: updated,
      });
      return updated;
    });
    return NextResponse.json({ data: academicYear });
  } catch (error) {
    return academicYearError(error, "UPDATE");
  }
}

export async function DELETE(_req: Request, { params }: Context) {
  const authorization = await requireAuditActor("admin");
  if (authorization.error) return authorization.error;
  const actor = authorization.actor;
  try {
    const { id } = await params;
    await prisma.$transaction(async (tx) => {
      const year = await tx.academicYear.findUniqueOrThrow({where:{id}});
      if(await tx.admissionArchive.count({where:{academicYear:year.academicYear}}))throw new Error("ARCHIVED_ADMISSIONS_EXIST");
      const deleted = await tx.academicYear.delete({ where: { id } });
      await recordActivity(tx, actor, {
        entityType: "ACADEMIC_YEAR", action: "DELETED", entityId: id,
        entityLabel: deleted.academicYear, before: deleted,
      });
    });
    return new Response(null, { status: 204 });
  } catch (error) {
    if(error instanceof Error && error.message==="ARCHIVED_ADMISSIONS_EXIST") return NextResponse.json({error:"Restore archived admissions before deleting this academic year."},{status:409});
    return academicYearError(error, "DELETE");
  }
}
