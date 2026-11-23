import { NextResponse } from "next/server";
import { requireAuditActor } from "@/lib/audit/activity";
import { deliverPushToEmail } from "@/lib/notifications/deliverToEmail";

export const runtime = "nodejs";
const noStore = { "Cache-Control": "private, no-store, max-age=0" };

/** User-triggered diagnostic: sends a push only to the current user's devices. */
export async function POST() {
  const authz = await requireAuditActor("read");
  if (authz.error) return authz.error;

  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY || !process.env.VAPID_SUBJECT) {
    return NextResponse.json({ error: "Server push keys are not configured" }, { status: 503, headers: noStore });
  }

  try {
    const result = await deliverPushToEmail(authz.actor.email, {
      title: "SchoolDB test notification",
      body: "Push notifications are connected for this device. Follow-up reminders will appear here.",
      tag: "schooldb-push-test",
      url: "/admissions",
    });
    if (!result.subscribed) {
      return NextResponse.json({ error: "No push subscription for this account. Disable and re-enable background alerts in the bell, then retry.", ...result }, { status: 409, headers: noStore });
    }
    if (!result.accepted) {
      return NextResponse.json({ error: "Push service did not accept the test. Re-enable alerts and check device notification permissions.", ...result }, { status: 502, headers: noStore });
    }
    return NextResponse.json({ ...result, message: "Test push accepted by the provider. Check your device's notification center." }, { headers: noStore });
  } catch {
    console.error("PUSH_TEST_FAILED");
    return NextResponse.json({ error: "Unable to send the test notification right now" }, { status: 500, headers: noStore });
  }
}
