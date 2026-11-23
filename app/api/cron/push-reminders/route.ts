import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWebPush } from "@/lib/notifications/webPush";
import { queueAdminAlert, dispatchPendingAlerts } from "@/lib/notifications/events";
import { indiaDayWindow } from "@/lib/notifications/catalog";
import { resolveAccessRole } from "@/lib/auth/accessPolicy";

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
  const reminderPreferences = await prisma.notificationPreference.findMany({
    where: { type: { in: ["FOLLOW_UP_DUE", "FOLLOW_UP_OVERDUE"] } },
    select: { email: true, type: true, pushEnabled: true },
  });
  const prefs = new Map(reminderPreferences.map((p) => [`${p.email}:${p.type}`, p.pushEnabled]));
  const members = await prisma.workspaceMember.findMany({
    where: { email: { in: [...new Set(tasks.map((task) => task.assignedToEmail.toLowerCase()))] } },
    select: { email: true, role: true, isActive: true },
  });
  const memberByEmail = new Map(members.map((member) => [member.email, member]));
  let sent = 0;
  let failed = 0;
  for (const task of tasks) {
    const assigneeEmail = task.assignedToEmail.toLowerCase();
    if (!resolveAccessRole(assigneeEmail, process.env.ADMISSIONS_ADMIN_EMAILS,
      process.env.ADMISSIONS_STAFF_EMAILS, memberByEmail.get(assigneeEmail))) continue;
    const overdue = task.dueAt.getTime() <= now.getTime();
    const kind = overdue ? "OVERDUE" : "DUE_SOON";
    const preferenceType = overdue ? "FOLLOW_UP_OVERDUE" : "FOLLOW_UP_DUE";
    if (prefs.get(`${task.assignedToEmail.toLowerCase()}:${preferenceType}`) === false) continue;
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
  // Once-daily summary reports the previous completed IST calendar day.
  const { start, end, label } = indiaDayWindow(now);
  let summariesQueued = 0;
  try {
    const [enquiries, pendingAdmissions, transitions] = await Promise.all([
      prisma.admission.count({ where: { enquiryDate: { gte: start, lt: end } } }),
      prisma.admission.count({ where: { finalAdmission: "PENDING" } }),
      prisma.activityLog.findMany({
        where: { entityType: "ADMISSION", action: "STAGE_CHANGED", createdAt: { gte: start, lt: end } },
        select: { changes: true },
      }),
    ]);
    const outcome = (name: "ADMITTED" | "CANCELLED") => transitions.filter((row) => {
      const changes = row.changes as Record<string, { to?: string }> | null;
      return changes?.finalAdmission?.to === name;
    }).length;
    const admitted = outcome("ADMITTED");
    const cancelled = outcome("CANCELLED");
    const recipients = await prisma.$transaction((tx) => queueAdminAlert(tx, {
      type: "DAILY_SUMMARY", eventKey: `daily-admissions:${label}`,
      title: `Admissions summary · ${label}`,
      body: `${enquiries} new enquiries · ${admitted} admitted · ${cancelled} cancelled · ${pendingAdmissions} pending overall`,
    }));
    summariesQueued = recipients.length;
  } catch {
    console.error("DAILY_ADMISSION_SUMMARY_FAILED");
  }
  // Retry queued event pushes if an earlier request ended before delivery.
  let eventPushes = { checked: 0, accepted: 0, failed: 0 };
  try {
    eventPushes = await dispatchPendingAlerts();
  } catch {
    console.error("QUEUED_NOTIFICATION_RETRY_FAILED");
  }
  return NextResponse.json({ tasksChecked: tasks.length, sent, failed, summariesQueued, eventPushes });
}
