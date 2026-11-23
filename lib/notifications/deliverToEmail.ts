import { prisma } from "@/lib/prisma";
import { sendWebPush } from "@/lib/notifications/webPush";

type PushPayload = { title: string; body: string; tag: string; url: string };
export type PushSummary = { subscribed: number; accepted: number; failed: number; expired: number };

/**
 * Send only to devices registered to the authenticated/assigned email.
 * HTTP 2xx means a push service accepted the message, not that the OS displayed it.
 * Invalid subscriptions are removed; other failures are logged without leaking endpoints.
 */
export async function deliverPushToEmail(email: string, payload: PushPayload): Promise<PushSummary> {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { email: email.trim().toLowerCase() }, take: 20,
  });
  const summary: PushSummary = { subscribed: subscriptions.length, accepted: 0, failed: 0, expired: 0 };

  const outcomes = await Promise.all(subscriptions.map(async (subscription) => {
    try {
      const status = await sendWebPush(subscription, payload);
      if (status === 404 || status === 410) {
        await prisma.pushSubscription.deleteMany({ where: { id: subscription.id } });
        return "expired" as const;
      }
      if (status >= 200 && status < 300) return "accepted" as const;
      console.error("PUSH_PROVIDER_REJECTED", status);
    } catch {
      console.error("PUSH_PROVIDER_REQUEST_FAILED");
    }
    return "failed" as const;
  }));

  for (const outcome of outcomes) summary[outcome]++;
  return summary;
}
