import { requireAccess } from "@/lib/auth/requireAccess";
import { NextResponse } from "next/server";
import { Prisma } from "@/src/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { academicYearCreateSchema, validationError } from "@/lib/validation/fees";
import { withDatabaseRetry } from "@/lib/dbRetry";

export async function GET() {
  const accessError = await requireAccess("read");
  if (accessError) return accessError;
  try {
    const academicYears = await withDatabaseRetry(() => prisma.academicYear.findMany({ orderBy: { academicYear: "desc" } }));
    return NextResponse.json({ data: academicYears, total: academicYears.length });
  } catch (error) {
    console.error("GET_ACADEMIC_YEARS_ERROR", error);
    return NextResponse.json({ error: "Failed to fetch academic years" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const accessError = await requireAccess("admin");
  if (accessError) return accessError;
  try {
    const parsed = academicYearCreateSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 });
    const academicYear = await prisma.academicYear.create({ data: parsed.data });
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
