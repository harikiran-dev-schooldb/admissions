import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAccess } from "@/lib/auth/requireAccess";
import { parseAuditPage } from "@/lib/audit/pagination";
import { displayMemberName } from "@/lib/users/displayMemberName";
import { sanitizeAdmissionChanges, type AdmissionLogItem } from "@/lib/admissions/admissionActivity";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "private, no-store, max-age=0" };
const PAGE_SIZE = 25;
type Context = { params: Promise<{ id: string }> };

/** Exact-student, role-authorized read-only history. Global audit logs remain admin-only. */
export async function GET(req: Request, { params }: Context) {
  const error = await requireAccess("read");
  if (error) return error;

  try {
    const { id } = await params;
    if (!id || id.length > 120) {
      return NextResponse.json({ error: "Invalid admission" }, { status: 400, headers: noStore });
    }
    const admission = await prisma.admission.findUnique({
      where: { id },
      select: { id: true, enquiryDate: true },
    });
    if (!admission) return NextResponse.json({ error: "Admission not found" }, { status: 404, headers: noStore });

    // Never match on name or enquiry number: both could mix histories of different students.
    const where = { entityType: "ADMISSION", entityId: admission.id };
    const [count, creation] = await Promise.all([
      prisma.activityLog.count({ where }),
      prisma.activityLog.findFirst({ where: { ...where, action: "CREATED" }, select: { id: true } }),
    ]);
    const showHistoricalDate = !creation;
    const total = count + (showHistoricalDate ? 1 : 0);
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const page = Math.min(parseAuditPage(new URL(req.url).searchParams.get("page")), pages);
    const skip = (page - 1) * PAGE_SIZE;
    const entries = await prisma.activityLog.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip,
      take: PAGE_SIZE,
      select: { id: true, action: true, actorEmail: true, actorName: true, createdAt: true, changes: true },
    });

    const emails = [...new Set(entries.map((entry) => entry.actorEmail))];
    const people = emails.length ? await prisma.workspaceMember.findMany({
      where: { email: { in: emails } },
      select: { email: true, name: true },
    }) : [];
    const names = new Map(people.map((person) => [person.email, person.name]));
    const data: AdmissionLogItem[] = entries.map((entry) => ({
      id: entry.id,
      action: entry.action,
      actorName: displayMemberName(entry.actorEmail, names.get(entry.actorEmail) || entry.actorName),
      createdAt: entry.createdAt.toISOString(),
      changes: sanitizeAdmissionChanges(entry.changes),
      historical: false,
    }));

    // Preserve the oldest known date without fabricating an actor or individual stage timestamps.
    if (showHistoricalDate && skip <= count && skip + PAGE_SIZE > count) {
      data.push({
        id: "historical-enquiry-date",
        action: "HISTORICAL_DATE",
        actorName: null,
        createdAt: admission.enquiryDate.toISOString(),
        changes: [],
        historical: true,
      });
    }

    return NextResponse.json({ data, page, pages, total, pageSize: PAGE_SIZE }, { headers: noStore });
  } catch (caught) {
    console.error("GET_ADMISSION_PROFILE_LOGS_ERROR", caught);
    return NextResponse.json({ error: "Unable to load admission history" }, { status: 500, headers: noStore });
  }
}
