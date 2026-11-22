import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getDefaultAgeAsOfDate } from "@/lib/admissionSettings";
import { requireAccess } from "@/lib/auth/requireAccess";

const ageAsOfDateSchema = z.object({
  ageAsOfDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
    .refine((value) => {
      const date = new Date(`${value}T00:00:00Z`);
      return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
    }, "Enter a valid date"),
}).strict();

export async function GET() {
  const accessError = await requireAccess("read");
  if (accessError) return accessError;
  try {
    const record = await prisma.admissionConfig.findUnique({ where: { key: "ageAsOfDate" } });
    return NextResponse.json({ data: { ageAsOfDate: record?.value ?? getDefaultAgeAsOfDate() } });
  } catch (error) {
    console.error("GET_ADMISSION_SETTINGS_ERROR", error);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const accessError = await requireAccess("admin");
  if (accessError) return accessError;
  try {
    const parsed = ageAsOfDateSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid age cutoff date", issues: parsed.error.flatten().fieldErrors }, { status: 400 });
    const record = await prisma.admissionConfig.upsert({
      where: { key: "ageAsOfDate" },
      update: { value: parsed.data.ageAsOfDate },
      create: { key: "ageAsOfDate", value: parsed.data.ageAsOfDate },
    });
    return NextResponse.json({ data: { ageAsOfDate: record.value } });
  } catch (error) {
    console.error("PUT_ADMISSION_SETTINGS_ERROR", error);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
