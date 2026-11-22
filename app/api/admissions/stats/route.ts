import { requireAccess } from "@/lib/auth/requireAccess";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdmissionWhere } from "@/lib/admissions/filterQuery";

export async function GET(req: Request) {
  const accessError = await requireAccess("admin");
  if (accessError) return accessError;
  try {
    const { searchParams } = new URL(req.url);
    const academicYear = searchParams.get("academicYear")?.trim();
    const yearWhere = academicYear ? { academicYear } : {};
    const where = getAdmissionWhere(searchParams);

    const [total, yearTotal, admitted, cancelled, pending, applicationSubmitted, entrancePending, interviewPending, applicationsTaken, entrancePassed, interviewSelected, classes] = await Promise.all([
      prisma.admission.count({ where }),
      prisma.admission.count({ where: yearWhere }),
      prisma.admission.count({ where: { ...where, finalAdmission: "ADMITTED" } }),
      prisma.admission.count({ where: { ...where, finalAdmission: "CANCELLED" } }),
      prisma.admission.count({ where: { ...where, finalAdmission: "PENDING" } }),
      prisma.admission.count({ where: { ...where, application: "SUBMITTED" } }),
      prisma.admission.count({ where: { ...where, entrance: "PENDING" } }),
      prisma.admission.count({ where: { ...where, interview: "PENDING" } }),
      prisma.admission.count({ where: { ...where, application: { in: ["YES", "SUBMITTED"] } } }),
      prisma.admission.count({ where: { ...where, entrance: "PASS" } }),
      prisma.admission.count({ where: { ...where, interview: "SELECTED" } }),
      prisma.admission.findMany({ where: yearWhere, distinct: ["admClass"], select: { admClass: true }, orderBy: { admClass: "asc" } }),
    ]);

    return NextResponse.json({
      data: {
        total,
        yearTotal,
        admitted,
        cancelled,
        pending,
        applicationSubmitted,
        applicationsTaken,
        entrancePassed,
        interviewSelected,
        classOptions: classes.map((entry) => entry.admClass).filter(Boolean),
        entrancePending,
        interviewPending,
        conversionRate: total ? Math.round((admitted / total) * 1000) / 10 : 0,
      },
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("ADMISSIONS_STATS_ERROR", error);
    return NextResponse.json({ error: "Failed to load admission statistics" }, { status: 500 });
  }
}
