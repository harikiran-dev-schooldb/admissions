import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuditActor } from "@/lib/audit/activity";
import { prisma } from "@/lib/prisma";
import { canReceiveAlert, getAlertOptions, isAlertType } from "@/lib/notifications/catalog";

const noStore = { "Cache-Control": "private, no-store, max-age=0" };
const updateSchema = z.object({
  type: z.string(),
  inAppEnabled: z.boolean(),
  pushEnabled: z.boolean(),
}).strict();

export async function GET() {
  const authz = await requireAuditActor("read");
  if (authz.error) return authz.error;
  const { email, role } = authz.actor;
  const saved = await prisma.notificationPreference.findMany({ where: { email } });
  const byType = new Map(saved.map((item) => [item.type, item]));
  return NextResponse.json({
    data: getAlertOptions(role).map((item) => ({
      ...item,
      inAppEnabled: byType.get(item.type)?.inAppEnabled ?? true,
      pushEnabled: byType.get(item.type)?.pushEnabled ?? true,
    })),
  }, { headers: noStore });
}

export async function PATCH(request: Request) {
  const authz = await requireAuditActor("read");
  if (authz.error) return authz.error;
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !isAlertType(parsed.data.type) || !canReceiveAlert(authz.actor.role, parsed.data.type)) {
    return NextResponse.json({ error: "Invalid notification preferences for this role" }, { status: 400, headers: noStore });
  }
  const { type, inAppEnabled, pushEnabled } = parsed.data;
  await prisma.notificationPreference.upsert({
    where: { email_type: { email: authz.actor.email, type } },
    create: { email: authz.actor.email, type, inAppEnabled, pushEnabled },
    update: { inAppEnabled, pushEnabled },
  });
  return NextResponse.json({ ok: true }, { headers: noStore });
}
