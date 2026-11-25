import { NextResponse } from "next/server";
import { requireAuditActor } from "@/lib/audit/activity";
import { prisma } from "@/lib/prisma";
import { indiaTodayBounds } from "@/lib/followUps/indiaDayBounds";
import type { Prisma } from "@/src/generated/prisma/client";

const headers = { "Cache-Control": "private, no-store" };
export async function GET(req: Request) {
  const authz = await requireAuditActor("read");
  if (authz.error) return authz.error;
  const { actor } = authz;
  const url = new URL(req.url);
  const year = url.searchParams.get("academicYear") ?? "";
  const days = Number(url.searchParams.get("days") ?? 7);
  if (!/^\d{4}-\d{2}$/.test(year) || ![1,7,30].includes(days)) return NextResponse.json({ error: "Invalid academic year or calendar range" }, { status: 400, headers });
  try {
    const active = await prisma.academicYear.findUnique({ where: { academicYear: year }, select: { isActive: true } });
    if (!active?.isActive) return NextResponse.json({ error: "Select an active academic year" }, { status: 400, headers });
    const { start } = indiaTodayBounds();
    const end = new Date(start.getTime() + days * 86400000);
    const range = { gte: start, lt: end };
    const admissionScope: Prisma.AdmissionWhereInput = { academicYear: year, finalAdmission: "PENDING" };
    const followUpScope: Prisma.AdmissionFollowUpWhereInput = { admission: { academicYear: year }, status: "OPEN",
      ...(actor.role === "staff" ? { assignedToEmail: actor.email } : {}) };
    const identity = { id: true, enquiryNo: true, student: true, admClass: true } as const;
    const [calls, entrance, interview, summary] = await Promise.all([
      prisma.admissionFollowUp.findMany({ where: { ...followUpScope, dueAt: range }, orderBy: [{ dueAt: "asc" }, { id: "asc" }], take: 101,
        select: { id: true, dueAt: true, admission: { select: identity } } }),
      prisma.admission.findMany({ where: { ...admissionScope, entranceScheduledAt: range, entrance: "PENDING",
        ...(actor.role === "staff" ? { entranceAssignedEmail: actor.email } : {}) },
        orderBy: [{ entranceScheduledAt: "asc" }, { id: "asc" }], take: 101, select: { ...identity, entranceScheduledAt: true } }),
      prisma.admission.findMany({ where: { ...admissionScope, interviewScheduledAt: range, interview: "PENDING",
        ...(actor.role === "staff" ? { interviewAssignedEmail: actor.email } : {}) },
        orderBy: [{ interviewScheduledAt: "asc" }, { id: "asc" }], take: 101, select: { ...identity, interviewScheduledAt: true } }),
      actor.role === "admin" ? Promise.all([
        prisma.admission.count({ where: { academicYear: year } }),
        prisma.admission.count({ where: { academicYear: year, finalAdmission: "ADMITTED" } }),
        prisma.admission.count({ where: { ...admissionScope, application: { in: ["NO","YES"] } } }),
        prisma.admissionFollowUp.count({ where: { ...followUpScope, dueAt: { lt: start } } }),
      ]).then(([enquiries, admitted, pendingApplications, overdue]) => ({ enquiries, admitted, pendingApplications, overdue })) : Promise.resolve(null),
    ]);
    const events = [
      ...calls.map((item) => ({ id: "call-" + item.id, admissionId: item.admission.id, student: item.admission.student, enquiryNo: item.admission.enquiryNo, admClass: item.admission.admClass, kind: "Parent follow-up", at: item.dueAt })),
      ...entrance.flatMap((item) => item.entranceScheduledAt ? [{ id: "entrance-" + item.id, admissionId: item.id, student: item.student, enquiryNo: item.enquiryNo, admClass: item.admClass, kind: "Entrance", at: item.entranceScheduledAt }] : []),
      ...interview.flatMap((item) => item.interviewScheduledAt ? [{ id: "interview-" + item.id, admissionId: item.id, student: item.student, enquiryNo: item.enquiryNo, admClass: item.admClass, kind: "Interview", at: item.interviewScheduledAt }] : []),
    ].sort((a,b) => a.at.getTime() - b.at.getTime() || a.id.localeCompare(b.id));
    return NextResponse.json({ data: { events: events.slice(0,100), truncated: events.length > 100, summary } }, { headers });
  } catch (error) {
    console.error("ADMISSION_WORKSPACE_ERROR", error);
    return NextResponse.json({ error: "Unable to load daily workspace" }, { status: 500, headers });
  }
}
