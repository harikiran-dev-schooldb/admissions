import { requireAccess } from "@/lib/auth/requireAccess";
import { NextResponse } from "next/server";
import { Prisma } from "@/src/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { feeCreateSchema, validationError } from "@/lib/validation/fees";
import { withDatabaseRetry } from "@/lib/dbRetry";

export async function GET() {
  const accessError = await requireAccess("read");
  if (accessError) return accessError;
  try {
    const fees = await withDatabaseRetry(() => prisma.feeRecord.findMany({
      orderBy: [{ academicYear: "desc" }, { age: "asc" }, { className: "asc" }],
    }));

    return NextResponse.json({ data: fees, total: fees.length });
  } catch (error) {
    console.error("GET_FEES_ERROR", error);
    return NextResponse.json({ error: "Failed to fetch fees" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const accessError = await requireAccess("admin");
  if (accessError) return accessError;
  try {
    const parsed = feeCreateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(validationError(parsed.error), { status: 400 });
    }

    const fee = await prisma.feeRecord.create({ data: parsed.data });
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
