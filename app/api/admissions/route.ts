import { NextResponse } from "next/server";
import { Prisma } from "@/src/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { createEnquiryNumber, shouldSkipEntrance } from "@/lib/admissions";
import { admissionCreateSchema, validationError } from "@/lib/validation/admissions";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    const finalAdmission = searchParams.get("status");

    const admissions = await prisma.admission.findMany({
      where: {
        ...(finalAdmission && finalAdmission !== "ALL"
          ? { finalAdmission: finalAdmission as "PENDING" | "ADMITTED" | "CANCELLED" }
          : {}),
        ...(q
          ? {
              OR: [
                { student: { contains: q, mode: "insensitive" } },
                { parent: { contains: q, mode: "insensitive" } },
                { mobile: { contains: q } },
                { enquiryNo: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { enquiryDate: "desc" },
    });

    return NextResponse.json({ data: admissions, total: admissions.length });
  } catch (error) {
    console.error("GET_ADMISSIONS_ERROR", error);
    return NextResponse.json({ error: "Failed to fetch admissions" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const parsed = admissionCreateSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 });

    const body = parsed.data;
    const skipEntrance = shouldSkipEntrance(body.admClass);

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const admission = await prisma.admission.create({
          data: {
            enquiryNo: await createEnquiryNumber(),
            student: body.student.toUpperCase(),
            parent: body.parent.toUpperCase(),
            mobile: body.mobile,
            dob: body.dob,
            age: body.age ?? null,
            admClass: body.admClass,
            eligibleClass: body.eligibleClass ?? null,
            eligibleStatus: "ELIGIBLE",
            application: "NO",
            entrance: skipEntrance ? "NOT_REQUIRED" : "NOT_STARTED",
            interview: "NOT_STARTED",
            admissionGiven: "NOT_GIVEN",
            finalAdmission: "PENDING",
          },
        });
        return NextResponse.json({ data: admission }, { status: 201 });
      } catch (error) {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002" || attempt === 2) throw error;
      }
    }

    return NextResponse.json({ error: "Could not allocate enquiry number" }, { status: 409 });
  } catch (error) {
    console.error("CREATE_ADMISSION_ERROR", error);
    return NextResponse.json({ error: "Failed to create admission" }, { status: 500 });
  }
}
