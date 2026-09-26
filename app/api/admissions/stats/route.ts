import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const academicYear = searchParams.get("academicYear")?.trim();
    const yearWhere = academicYear ? { academicYear } : {};

    const [total, admitted, cancelled, pending, applicationSubmitted, entrancePending, interviewPending] = await Promise.all([
      prisma.admission.count({ where: yearWhere }),
      prisma.admission.count({ where: { ...yearWhere, finalAdmission: "ADMITTED" } }),
      prisma.admission.count({ where: { ...yearWhere, finalAdmission: "CANCELLED" } }),
      prisma.admission.count({ where: { ...yearWhere, finalAdmission: "PENDING" } }),
      prisma.admission.count({ where: { ...yearWhere, application: "SUBMITTED" } }),
      prisma.admission.count({ where: { ...yearWhere, entrance: "PENDING" } }),
      prisma.admission.count({ where: { ...yearWhere, interview: "PENDING" } }),
    ]);

    return NextResponse.json({
      data: {
        total,
        admitted,
        cancelled,
        pending,
        applicationSubmitted,
        entrancePending,
        interviewPending,
        conversionRate: total ? Math.round((admitted / total) * 1000) / 10 : 0,
      },
    });
  } catch (error) {
    console.error("ADMISSIONS_STATS_ERROR", error);
    return NextResponse.json({ error: "Failed to load admission statistics" }, { status: 500 });
  }
}
