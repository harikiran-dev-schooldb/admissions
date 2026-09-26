import { NextResponse } from "next/server";
import { Prisma } from "@/src/generated/prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const feeSchema = z.object({
  academicYear: z.string().trim().regex(/^\d{4}-\d{2}$/, "Use academic year format YYYY-YY"),
  termFee: z.coerce.number().int().nonnegative(),
  annualFees: z.coerce.number().int().nonnegative(),
  className: z.string().trim().min(1),
  age: z.string().trim().optional().nullable(),
});

export async function GET() {
  try {
    const fees = await prisma.feeRecord.findMany({
      orderBy: [{ academicYear: "desc" }, { age: "asc" }, { className: "asc" }],
    });

    return NextResponse.json({ data: fees, total: fees.length });
  } catch (error) {
    console.error("GET_FEES_ERROR", error);
    return NextResponse.json({ error: "Failed to fetch fees" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const parsed = feeSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const fee = await prisma.feeRecord.create({ data: parsed.data });
    return NextResponse.json({ data: fee }, { status: 201 });
  } catch (error) {
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
