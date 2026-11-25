import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuditActor, recordActivity } from "@/lib/audit/activity";
import { SCHOOL_CLASSES, capacityKey, policyKey } from "@/lib/admissions/yearPolicy";
import { planningSchema } from "@/lib/admissions/yearPolicySchema";
import { loadYearPolicy, loadCapacity } from "@/lib/admissions/yearPolicyServer";

const headers = { "Cache-Control": "private, no-store" };
export async function GET(req: Request) {
  const authz = await requireAuditActor("read");
  if (authz.error) return authz.error;
  const year = new URL(req.url).searchParams.get("academicYear") ?? "";
  if (!/^\d{4}-\d{2}$/.test(year)) return NextResponse.json({ error: "Select an academic year" }, { status: 400, headers });
  try {
    const active = await prisma.academicYear.findUnique({ where: { academicYear: year }, select: { isActive: true } });
    if (!active?.isActive) return NextResponse.json({ error: "Select an active academic year" }, { status: 400, headers });
    const policy = await loadYearPolicy(year);
    if (authz.actor.role !== "admin") return NextResponse.json({ data: { policy } }, { headers });
    const [capacity, counts] = await Promise.all([
      loadCapacity(year),
      prisma.admission.groupBy({ by: ["admClass", "finalAdmission"], where: { academicYear: year }, _count: { _all: true } }),
    ]);
    const seats = SCHOOL_CLASSES.map(name => {
      const records = counts.filter(row => row.admClass.trim().toUpperCase() === name);
      return { className: name, admitted: records.filter(row => row.finalAdmission === "ADMITTED").reduce((n,row) => n + row._count._all, 0),
        pending: records.filter(row => row.finalAdmission === "PENDING").reduce((n,row) => n + row._count._all, 0) };
    });
    return NextResponse.json({ data: { policy, capacity, seats } }, { headers });
  } catch (error) {
    console.error("GET_ADMISSION_YEAR_POLICY_ERROR", error);
    return NextResponse.json({ error: "Unable to load class planning" }, { status: 500, headers });
  }
}
export async function PUT(req: Request) {
  const authz = await requireAuditActor("admin");
  if (authz.error) return authz.error;
  try {
    const parsed = planningSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Enter a valid cutoff, both age bounds, and whole-number seat capacities" }, { status: 400, headers });
    const { academicYear, policy, capacity } = parsed.data;
    const active = await prisma.academicYear.findUnique({ where: { academicYear }, select: { isActive: true } });
    if (!active?.isActive) return NextResponse.json({ error: "Select an active academic year" }, { status: 400, headers });
    await prisma.$transaction(async tx => {
      for (const [key, value] of [[policyKey(academicYear), JSON.stringify(policy)], [capacityKey(academicYear), JSON.stringify(capacity)]] as const) {
        const before = await tx.admissionConfig.findUnique({ where: { key } });
        const after = await tx.admissionConfig.upsert({ where: { key }, update: { value }, create: { key, value } });
        await recordActivity(tx, authz.actor, { entityType: "SETTINGS", action: before ? "UPDATED" : "CREATED", entityId: key, entityLabel: key, before, after });
      }
    });
    return NextResponse.json({ data: { policy, capacity } }, { headers });
  } catch (error) {
    console.error("SAVE_ADMISSION_YEAR_POLICY_ERROR", error);
    return NextResponse.json({ error: "Unable to save class planning" }, { status: 500, headers });
  }
}
