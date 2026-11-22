import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuditActor } from "@/lib/audit/activity";

export async function GET() {
  const authz = await requireAuditActor("read");
  if (authz.error) return authz.error;
  const actor = authz.actor;
  try {
    // Always restrict notifications to the signed-in member, including administrators.
    const where = { assignedToEmail: actor.email, status: "OPEN" as const };
    const [data, total] = await Promise.all([
      prisma.admissionFollowUp.findMany({
        where,
        take: 30,
        orderBy: [{ dueAt: "asc" }, { id: "asc" }],
        select: {
          id: true, dueAt: true, assignedToEmail: true, note: true,
          admission: { select: { enquiryNo: true, student: true } },
        },
      }),
      prisma.admissionFollowUp.count({ where }),
    ]);
    return NextResponse.json({ data, total }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
  } catch (error) {
    console.error("NOTIFICATIONS_GET_ERROR", error);
    return NextResponse.json({ error: "Unable to load notifications" }, { status: 500 });
  }
}
