import { getAuthorizedRole, requireAccess } from "@/lib/auth/requireAccess";
import { requireAuditActor, recordActivity } from "@/lib/audit/activity";
import { NextResponse } from "next/server";
import { Prisma } from "@/src/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { academicYearCreateSchema, validationError } from "@/lib/validation/fees";
import { withDatabaseRetry } from "@/lib/dbRetry";

export async function GET() {
  const accessError = await requireAccess("read");
  if (accessError) return accessError;
  const { role, error: roleError } = await getAuthorizedRole();
  if (roleError) return roleError;
  try {
    const academicYears = await withDatabaseRetry(() => prisma.academicYear.findMany({ orderBy: { academicYear: "desc" }, include: { _count: { select: { admissions: true } } } }));
    const populated = [...academicYears]
      .filter((year) => year.isActive)
      .sort((a, b) => b._count.admissions - a._count.admissions || b.academicYear.localeCompare(a.academicYear))[0];
    return NextResponse.json({
      data: academicYears.map(({ _count, ...year }) => ({
        ...year,
        ...(role === "admin"
          ? { admissionsCount: _count.admissions }
          : { isSuggested: year.academicYear === populated?.academicYear }),
      })),
      total: academicYears.length,
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("GET_ACADEMIC_YEARS_ERROR", error);
    return NextResponse.json({ error: "Failed to fetch academic years" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authorization = await requireAuditActor("admin");
  if (authorization.error) return authorization.error;
  const actor = authorization.actor;
  try {
    const parsed = academicYearCreateSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 });
    const academicYear = await prisma.$transaction(async (tx) => {
      const created = await tx.academicYear.create({ data: parsed.data });
      await recordActivity(tx, actor, {
        entityType: "ACADEMIC_YEAR", action: "CREATED", entityId: created.id,
        entityLabel: created.academicYear, after: created,
      });
      return created;
    });
    return NextResponse.json({ data: academicYear }, { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError) return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "This academic year already exists." }, { status: 409 });
    }
    console.error("CREATE_ACADEMIC_YEAR_ERROR", error);
    return NextResponse.json({ error: "Failed to create academic year" }, { status: 500 });
  }
}
