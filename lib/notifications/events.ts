import type { Prisma } from "@/src/generated/prisma/client";
import { emailSet, resolveAccessRole } from "@/lib/auth/accessPolicy";
import { canReceiveAlert, isAlertType, type AlertType } from "@/lib/notifications/catalog";
import { prisma } from "@/lib/prisma";
import { deliverPushToEmail } from "@/lib/notifications/deliverToEmail";

export type NotificationPayload = {
  type: AlertType;
  eventKey: string;
  title: string;
  body: string;
  href?: string;
};

/** Insert alongside the business transaction; retry-safe for the same event/user. */
export async function queueUserAlert(tx: Prisma.TransactionClient, email: string, event: NotificationPayload): Promise<string[]> {
  const recipient = email.trim().toLowerCase();
  if (!recipient) return [];
  await tx.notificationEvent.createMany({
    data: [{ email: recipient, eventKey: event.eventKey, type: event.type,
      title: event.title.slice(0, 130), body: event.body.slice(0, 350),
      href: event.href?.startsWith("/") && !event.href.startsWith("//") ? event.href : "/admissions" }],
    skipDuplicates: true,
  });
  return [recipient];
}

export async function queueAdminAlert(tx: Prisma.TransactionClient, event: NotificationPayload): Promise<string[]> {
  const members = await tx.workspaceMember.findMany({
    where: { role: "ADMIN", isActive: true }, select: { email: true },
  });
  const recipients = [...new Set([
    ...emailSet(process.env.ADMISSIONS_ADMIN_EMAILS),
    ...members.map((member) => member.email.trim().toLowerCase()),
  ])].filter(Boolean);
  if (recipients.length) {
    await tx.notificationEvent.createMany({
      data: recipients.map((email) => ({
        email, eventKey: event.eventKey, type: event.type,
        title: event.title.slice(0, 130), body: event.body.slice(0, 350),
        href: event.href?.startsWith("/") && !event.href.startsWith("//") ? event.href : "/admissions",
      })),
      skipDuplicates: true,
    });
  }
  return recipients;
}

/** Claim queued alerts atomically to prevent duplicate sends across serverless instances. */
export async function dispatchPendingAlerts(emails?: string[]) {
  const now = new Date();
  const pending = await prisma.notificationEvent.findMany({
    where: {
      pushSentAt: null,
      createdAt: { gte: new Date(now.getTime() - 7 * 86_400_000) },
      ...(emails ? { email: { in: [...new Set(emails.map((e) => e.toLowerCase()))] } } : {}),
      OR: [{ pushClaimedAt: null }, { pushClaimedAt: { lt: new Date(now.getTime() - 10 * 60_000) } }],
    },
    orderBy: { createdAt: "asc" },
    take: 50,
  });
  const preferences = await prisma.notificationPreference.findMany({
    where: { email: { in: [...new Set(pending.map((n) => n.email))] } },
  });
  const lookup = new Map(preferences.map((p) => [`${p.email}:${p.type}`, p]));
  const members = await prisma.workspaceMember.findMany({
    where: { email: { in: [...new Set(pending.map((n) => n.email))] } },
    select: { email: true, role: true, isActive: true },
  });
  const byEmail = new Map(members.map((member) => [member.email, member]));
  let accepted = 0;
  let failed = 0;
  for (const event of pending) {
    const role = resolveAccessRole(event.email, process.env.ADMISSIONS_ADMIN_EMAILS,
      process.env.ADMISSIONS_STAFF_EMAILS, byEmail.get(event.email));
    if (!role || !isAlertType(event.type) || !canReceiveAlert(role, event.type)) continue;
    if (lookup.get(`${event.email}:${event.type}`)?.pushEnabled === false) continue;
    const claim = await prisma.notificationEvent.updateMany({
      where: {
        id: event.id, pushSentAt: null,
        OR: [{ pushClaimedAt: null }, { pushClaimedAt: { lt: new Date(now.getTime() - 10 * 60_000) } }],
      },
      data: { pushClaimedAt: now },
    });
    if (!claim.count) continue;
    try {
      const result = await deliverPushToEmail(event.email, {
        title: event.title, body: event.body, url: event.href, tag: `schooldb-event-${event.id}`,
      });
      if (result.accepted) {
        await prisma.notificationEvent.update({ where: { id: event.id }, data: { pushSentAt: new Date() } });
        accepted += result.accepted;
      } else {
        if (result.failed) failed += result.failed;
        await prisma.notificationEvent.update({ where: { id: event.id }, data: { pushClaimedAt: null } });
      }
    } catch (error) {
      failed++;
      console.error("NOTIFICATION_EVENT_PUSH_FAILED", error instanceof Error ? error.name : "Unknown");
      await prisma.notificationEvent.update({ where: { id: event.id }, data: { pushClaimedAt: null } });
    }
  }
  return { checked: pending.length, accepted, failed };
}

export async function dispatchForRecipients(emails: string[]) {
  if (!emails.length) return;
  try {
    await dispatchPendingAlerts(emails);
  } catch {
    // Persisted events remain available in the bell and for next cron retry.
    console.error("NOTIFICATION_DISPATCH_FAILED");
  }
}
