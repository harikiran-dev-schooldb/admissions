import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [total, admitted, cancelled, pending, applicationSubmitted, entrancePending, interviewPending] = await Promise.all([
      prisma.admission.count(),
      prisma.admission.count({ where: { finalAdmission: "ADMITTED" } }),
      prisma.admission.count({ where: { finalAdmission: "CANCELLED" } }),
      prisma.admission.count({ where: { finalAdmission: "PENDING" } }),
      prisma.admission.count({ where: { application: "SUBMITTED" } }),
      prisma.admission.count({ where: { entrance: "PENDING" } }),
      prisma.admission.count({ where: { interview: "PENDING" } }),
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
