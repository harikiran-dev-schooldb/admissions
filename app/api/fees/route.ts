import { requireAccess } from "@/lib/auth/requireAccess";
import { requireAuditActor, recordActivity } from "@/lib/audit/activity";
import { NextResponse } from "next/server";
import { Prisma } from "@/src/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { feeCreateSchema, validationError } from "@/lib/validation/fees";
import { withDatabaseRetry } from "@/lib/dbRetry";

export async function GET(req: Request) {
  const accessError = await requireAccess("read");
  if (accessError) return accessError;
  const searchParams = new URL(req.url).searchParams;
  const academicYear = searchParams.get("academicYear")?.trim();
  const yearsOnly = searchParams.get("yearsOnly") === "true";
  if (!yearsOnly && (!academicYear || !/^\d{4}-\d{2}$/.test(academicYear))) {
    return NextResponse.json({ error: "Choose a valid academic year" }, { status: 400 });
  }
  try {
    // Active configured years only; legacy and archived fee years stay stored but hidden.
    if (yearsOnly) {
      const years = await withDatabaseRetry(() => prisma.academicYear.findMany({
        where: { isActive: true },
        select: { academicYear: true },
        orderBy: { academicYear: "desc" },
      }));
      return NextResponse.json({ data: years, total: years.length }, { headers: { "Cache-Control": "private, no-store" } });
    }
    const matchingYear = await withDatabaseRetry(() => prisma.academicYear.findUnique({
      where: { academicYear: academicYear! },
      select: { isActive: true },
    }));
    if (!matchingYear?.isActive) {
      return NextResponse.json({ data: [], total: 0 }, { headers: { "Cache-Control": "private, no-store" } });
    }
    const fees = await withDatabaseRetry(() => prisma.feeRecord.findMany({
      where: { academicYear },
      orderBy: [{ academicYear: "desc" }, { age: "asc" }, { className: "asc" }],
    }));

    return NextResponse.json({ data: fees, total: fees.length }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("GET_FEES_ERROR", error);
    return NextResponse.json({ error: "Failed to fetch fees" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authz = await requireAuditActor("admin");
  if (authz.error) return authz.error;
  const actor = authz.actor;
  try {
    const parsed = feeCreateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(validationError(parsed.error), { status: 400 });
    }

    const year = await prisma.academicYear.findUnique({ where: { academicYear: parsed.data.academicYear } });
    if (!year?.isActive) return NextResponse.json({ error: "Choose an active academic year" }, { status: 400 });
    const fee = await prisma.$transaction(async (tx) => {
      const created = await tx.feeRecord.create({ data: parsed.data });
      await recordActivity(tx, actor, {
        entityType: "FEE", action: "CREATED", entityId: created.id,
        entityLabel: `${created.academicYear} · ${created.className}`, after: created,
      });
      return created;
    });
    return NextResponse.json({ data: fee }, { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "A fee structure already exists for this academic year and class." },
        { status: 409 },
      );
    }

    console.error("CREATE_FEE_ERROR", error);
    return NextResponse.json({ error: "Failed to create fee" }, { status: 500 });
  }
}
