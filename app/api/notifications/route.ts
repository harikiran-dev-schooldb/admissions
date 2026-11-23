import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuditActor } from "@/lib/audit/activity";

const noStore = { "Cache-Control": "private, no-store, max-age=0" };

export async function GET() {
  const authz = await requireAuditActor("read");
  if (authz.error) return authz.error;
  const email = authz.actor.email;
  try {
    // Tenant boundary: all alerts and operational tasks belong to the caller.
    const where = { assignedToEmail: email, status: "OPEN" as const };
    const [tasks, taskCount, events, preferences] = await Promise.all([
      prisma.admissionFollowUp.findMany({
        where, take: 30, orderBy: [{ dueAt: "asc" }, { id: "asc" }],
        select: {
          id: true, dueAt: true, assignedToEmail: true, note: true,
          admission: { select: { enquiryNo: true, student: true } },
        },
      }),
      prisma.admissionFollowUp.count({ where }),
      prisma.notificationEvent.findMany({
        where: { email }, take: 40, orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      }),
      prisma.notificationPreference.findMany({ where: { email }, select: { type: true, inAppEnabled: true } }),
    ]);
    const allowed = new Map(preferences.map((p) => [p.type, p.inAppEnabled]));
    const eventItems = events.filter((event) => allowed.get(event.type) !== false).map((event) => ({
      id: `event:${event.id}`, kind: "EVENT" as const,
      title: event.title, note: event.body, eventType: event.type,
      readAt: event.readAt, href: event.href,
      dueAt: event.createdAt, assignedToEmail: email,
      admission: { enquiryNo: event.title, student: "" },
    }));
    const taskItems = tasks.map((task) => ({ ...task, kind: "FOLLOW_UP" as const }));
    return NextResponse.json({
      data: [...eventItems, ...taskItems], total: eventItems.length + taskCount,
    }, { headers: noStore });
  } catch {
    console.error("NOTIFICATIONS_GET_ERROR");
    return NextResponse.json({ error: "Unable to load notifications" }, { status: 500, headers: noStore });
  }
}

const readSchema = z.object({ ids: z.array(z.string().min(1).max(120)).min(1).max(100) }).strict();

export async function PATCH(request: Request) {
  const authz = await requireAuditActor("read");
  if (authz.error) return authz.error;
  const parsed = readSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid notifications" }, { status: 400, headers: noStore });
  const ids = parsed.data.ids.filter((id) => id.startsWith("event:")).map((id) => id.slice("event:".length));
  if (ids.length) {
    await prisma.notificationEvent.updateMany({
      where: { id: { in: ids }, email: authz.actor.email, readAt: null },
      data: { readAt: new Date() },
    });
  }
  return NextResponse.json({ ok: true }, { headers: noStore });
}
