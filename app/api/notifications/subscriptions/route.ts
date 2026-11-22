import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuditActor } from "@/lib/audit/activity";
import { prisma } from "@/lib/prisma";
import { publicVapidKey } from "@/lib/notifications/webPush";

const subscriptionSchema = z.object({
  endpoint: z.url().max(2048).refine((value) => value.startsWith("https://"), "HTTPS required"),
  keys: z.object({ p256dh: z.string().min(40).max(256), auth: z.string().min(8).max(128) }),
});

export async function GET() {
  const authz = await requireAuditActor("read");
  if (authz.error) return authz.error;
  return NextResponse.json({ publicKey: publicVapidKey() }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const authz = await requireAuditActor("read");
  if (authz.error) return authz.error;
  const parsed = subscriptionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid push subscription" }, { status: 400 });
  const { endpoint, keys } = parsed.data;
  try {
    const existing = await prisma.pushSubscription.findUnique({ where: { endpoint } });
    if (existing && existing.email !== authz.actor.email) {
      return NextResponse.json({ error: "Subscription belongs to another account" }, { status: 409 });
    }
    await prisma.pushSubscription.upsert({
      where: { endpoint },
      create: { endpoint, email: authz.actor.email, p256dh: keys.p256dh, auth: keys.auth },
      update: { p256dh: keys.p256dh, auth: keys.auth },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PUSH_SUBSCRIPTION_SAVE_ERROR", error);
    return NextResponse.json({ error: "Unable to save push subscription" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const authz = await requireAuditActor("read");
  if (authz.error) return authz.error;
  const body = await request.json().catch(() => null);
  if (typeof body?.endpoint !== "string") return NextResponse.json({ error: "Endpoint required" }, { status: 400 });
  await prisma.pushSubscription.deleteMany({ where: { endpoint: body.endpoint, email: authz.actor.email } });
  return NextResponse.json({ ok: true });
}
