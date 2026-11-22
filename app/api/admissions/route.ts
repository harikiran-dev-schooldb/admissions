import { requireAccess } from "@/lib/auth/requireAccess";
import { NextResponse } from "next/server";
import { Prisma } from "@/src/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { createEnquiryNumber, shouldSkipEntrance } from "@/lib/admissions";
import { admissionCreateSchema, validationError } from "@/lib/validation/admissions";
import { withDatabaseRetry } from "@/lib/dbRetry";
import { calculateAge, getEligibleClass } from "@/lib/eligibility";
import { getDefaultAgeAsOfDate } from "@/lib/admissionSettings";
import { parsePage, parsePageSize, getPagination } from "@/lib/admissions/pagination";

export async function GET(req: Request) {
  const accessError = await requireAccess("read");
  if (accessError) return accessError;
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim().slice(0, 120);
    const academicYear = searchParams.get("academicYear")?.trim();
    const classFilter = searchParams.get("class")?.trim();
    const finalAdmission = searchParams.get("status");
    const application = searchParams.get("application");
    const status = ["PENDING", "ADMITTED", "CANCELLED"].includes(finalAdmission ?? "")
      ? finalAdmission as "PENDING" | "ADMITTED" | "CANCELLED"
      : undefined;
    const applicationStatus = ["NO", "YES", "SUBMITTED"].includes(application ?? "")
      ? application as "NO" | "YES" | "SUBMITTED"
      : undefined;

    const where: Prisma.AdmissionWhereInput = {
      ...(academicYear ? { academicYear } : {}),
      ...(classFilter && classFilter !== "ALL" ? { admClass: classFilter } : {}),
      ...(status ? { finalAdmission: status } : {}),
      ...(applicationStatus ? { application: applicationStatus } : {}),
      ...(q ? {
        OR: [
          { student: { contains: q, mode: "insensitive" } },
          { parent: { contains: q, mode: "insensitive" } },
          { mobile: { contains: q } },
          { enquiryNo: { contains: q, mode: "insensitive" } },
          { admClass: { contains: q, mode: "insensitive" } },
        ],
      } : {}),
    };

    // Existing analytics clients omit page and still receive the full yearly dataset.
    // Directory clients request a page, so all search/filter/pagination work stays in SQL.
    if (searchParams.has("page")) {
      const requestedPage = parsePage(searchParams.get("page"));
      const pageSize = parsePageSize(searchParams.get("pageSize"));
      const total = await withDatabaseRetry(() => prisma.admission.count({ where }));
      const pagination = getPagination(total, requestedPage, pageSize);
      const admissions = await withDatabaseRetry(() => prisma.admission.findMany({
        where,
        orderBy: [{ enquiryDate: "desc" }, { id: "asc" }],
        skip: pagination.skip,
        take: pageSize,
      }));
      return NextResponse.json({
        data: admissions,
        total,
        page: pagination.page,
        pageSize,
        totalPages: pagination.totalPages,
      }, { headers: { "Cache-Control": "private, no-store" } });
    }

    const admissions = await withDatabaseRetry(() => prisma.admission.findMany({
      where,
      orderBy: [{ enquiryDate: "desc" }, { id: "asc" }],
    }));

    return NextResponse.json({ data: admissions, total: admissions.length });
  } catch (error) {
    console.error("GET_ADMISSIONS_ERROR", error);
    return NextResponse.json({ error: "Failed to fetch admissions" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const accessError = await requireAccess("enquiry");
  if (accessError) return accessError;
  try {
    const parsed = admissionCreateSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 });

    const body = parsed.data;
    const managedYear = await prisma.academicYear.findUnique({ where: { academicYear: body.academicYear } });
    if (!managedYear?.isActive) {
      return NextResponse.json({ error: "Choose an active academic year before creating an admission" }, { status: 400 });
    }
    const config = await prisma.admissionConfig.findUnique({ where: { key: "ageAsOfDate" } });
    const ageData = calculateAge(body.dob, config?.value ?? getDefaultAgeAsOfDate(body.academicYear));
    const eligibleClass = ageData ? getEligibleClass(ageData.years) : "NOT ELIGIBLE";
    const eligibleStatus = eligibleClass === body.admClass.trim().toUpperCase() ? "ELIGIBLE" : "NOT ELIGIBLE";
    const skipEntrance = shouldSkipEntrance(body.admClass);

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const admission = await prisma.admission.create({
          data: {
            academicYear: body.academicYear,
            enquiryNo: await createEnquiryNumber(),
            student: body.student.toUpperCase(),
            parent: body.parent.toUpperCase(),
            mobile: body.mobile,
            dob: body.dob,
            age: ageData?.text ?? null,
            admClass: body.admClass,
            eligibleClass,
            eligibleStatus,
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
