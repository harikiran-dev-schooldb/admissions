import { requireAccess } from "@/lib/auth/requireAccess";
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
  const accessError = await requireAccess("admin");
  if (accessError) return accessError;
  try {
    const { id } = await params;
    const parsed = academicYearReplaceSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 });
    const academicYear = await prisma.academicYear.update({ where: { id }, data: { ...parsed.data, startDate: parsed.data.startDate ?? null, endDate: parsed.data.endDate ?? null, isActive: parsed.data.isActive ?? true } });
    return NextResponse.json({ data: academicYear });
  } catch (error) {
    return academicYearError(error, "UPDATE");
  }
}

export async function PATCH(req: Request, { params }: Context) {
  const accessError = await requireAccess("admin");
  if (accessError) return accessError;
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

    const academicYear = await prisma.academicYear.update({ where: { id }, data: parsed.data });
    return NextResponse.json({ data: academicYear });
  } catch (error) {
    return academicYearError(error, "UPDATE");
  }
}

export async function DELETE(_req: Request, { params }: Context) {
  const accessError = await requireAccess("admin");
  if (accessError) return accessError;
  try {
    const { id } = await params;
    await prisma.academicYear.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (error) {
    return academicYearError(error, "DELETE");
  }
}
