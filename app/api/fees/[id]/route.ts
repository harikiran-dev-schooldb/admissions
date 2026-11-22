import { requireAccess } from "@/lib/auth/requireAccess";
import { requireAuditActor, recordActivity } from "@/lib/audit/activity";
import { NextResponse } from "next/server";
import { Prisma } from "@/src/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { feePatchSchema, feeReplaceSchema, validationError } from "@/lib/validation/fees";

type Context = { params: Promise<{ id: string }> };

function feeError(error: unknown, action: string) {
  if (error instanceof SyntaxError) {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") return NextResponse.json({ error: "Fee structure not found" }, { status: 404 });
    if (error.code === "P2002") return NextResponse.json({ error: "A fee structure already exists for this academic year and class." }, { status: 409 });
  }
  console.error(`${action}_FEE_ERROR`, error);
  return NextResponse.json({ error: `Failed to ${action.toLowerCase()} fee structure` }, { status: 500 });
}

export async function GET(_req: Request, { params }: Context) {
  const accessError = await requireAccess("read");
  if (accessError) return accessError;
  try {
    const { id } = await params;
    const fee = await prisma.feeRecord.findUnique({ where: { id } });
    if (!fee) return NextResponse.json({ error: "Fee structure not found" }, { status: 404 });
    return NextResponse.json({ data: fee });
  } catch (error) {
    return feeError(error, "GET");
  }
}

export async function PUT(req: Request, { params }: Context) {
  const authz = await requireAuditActor("admin");
  if (authz.error) return authz.error;
  const actor = authz.actor;
  try {
    const { id } = await params;
    const parsed = feeReplaceSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 });
    const fee = await prisma.$transaction(async (tx) => {
      const before = await tx.feeRecord.findUniqueOrThrow({ where: { id } });
      const updated = await tx.feeRecord.update({ where: { id }, data: { ...parsed.data, age: parsed.data.age ?? null } });
      await recordActivity(tx, actor, {
        entityType: "FEE", action: "UPDATED", entityId: id,
        entityLabel: `${updated.academicYear} · ${updated.className}`, before, after: updated,
      });
      return updated;
    });
    return NextResponse.json({ data: fee });
  } catch (error) {
    return feeError(error, "UPDATE");
  }
}

export async function PATCH(req: Request, { params }: Context) {
  const authz = await requireAuditActor("admin");
  if (authz.error) return authz.error;
  const actor = authz.actor;
  try {
    const { id } = await params;
    const parsed = feePatchSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 });
    const fee = await prisma.$transaction(async (tx) => {
      const before = await tx.feeRecord.findUniqueOrThrow({ where: { id } });
      const updated = await tx.feeRecord.update({ where: { id }, data: parsed.data });
      await recordActivity(tx, actor, {
        entityType: "FEE", action: "UPDATED", entityId: id,
        entityLabel: `${updated.academicYear} · ${updated.className}`, before, after: updated,
      });
      return updated;
    });
    return NextResponse.json({ data: fee });
  } catch (error) {
    return feeError(error, "UPDATE");
  }
}

export async function DELETE(_req: Request, { params }: Context) {
  const authz = await requireAuditActor("admin");
  if (authz.error) return authz.error;
  const actor = authz.actor;
  try {
    const { id } = await params;
    await prisma.$transaction(async (tx) => {
      const deleted = await tx.feeRecord.delete({ where: { id } });
      await recordActivity(tx, actor, {
        entityType: "FEE", action: "DELETED", entityId: id,
        entityLabel: `${deleted.academicYear} · ${deleted.className}`, before: deleted,
      });
    });
    return new Response(null, { status: 204 });
  } catch (error) {
    return feeError(error, "DELETE");
  }
}
