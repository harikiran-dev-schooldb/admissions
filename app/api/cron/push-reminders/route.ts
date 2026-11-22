import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWebPush } from "@/lib/notifications/webPush";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.VAPID_PRIVATE_KEY || !process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_SUBJECT) {
    return NextResponse.json({ error: "Push keys are not configured" }, { status: 503 });
  }
  const now = new Date();
  const hourAhead = new Date(now.getTime() + 60 * 60 * 1000);
  const tasks = await prisma.admissionFollowUp.findMany({
    where: { status: "OPEN", dueAt: { lte: hourAhead } },
    orderBy: { dueAt: "asc" },
    take: 100,
    select: { id: true, assignedToEmail: true, dueAt: true, admission: { select: { enquiryNo: true } } },
  });
  let sent = 0;
  let failed = 0;
  for (const task of tasks) {
    const overdue = task.dueAt.getTime() <= now.getTime();
    const kind = overdue ? "OVERDUE" : "DUE_SOON";
    const devices = await prisma.pushSubscription.findMany({ where: { email: task.assignedToEmail }, take: 20 });
    for (const device of devices) {
      // Unique key prevents repeated cron executions from sending duplicates.
      const claim = await prisma.pushDelivery.createMany({
        data: [{ subscriptionId: device.id, followUpId: task.id, reminderKind: kind }],
        skipDuplicates: true,
      });
      if (!claim.count) continue;
      try {
        const status = await sendWebPush(device, {
          title: overdue ? "Admission follow-up overdue" : "Admission follow-up due soon",
          body: `Enquiry ${task.admission.enquiryNo} needs attention`,
          url: "/admissions",
          tag: `follow-up-${task.id}-${kind}`,
        });
        if (status === 404 || status === 410) {
          await prisma.pushSubscription.delete({ where: { id: device.id } });
        } else if (status < 200 || status >= 300) {
          throw new Error(`Push provider returned ${status}`);
        } else sent++;
      } catch (error) {
        failed++;
        console.error("PUSH_DELIVERY_ERROR", error);
        await prisma.pushDelivery.deleteMany({ where: { subscriptionId: device.id, followUpId: task.id, reminderKind: kind } });
      }
    }
  }
  return NextResponse.json({ tasksChecked: tasks.length, sent, failed });
}
