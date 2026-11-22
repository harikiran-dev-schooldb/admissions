import { requireAccess } from "@/lib/auth/requireAccess";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withDatabaseRetry } from "@/lib/dbRetry";

/** Staff may see class names in the filter, without obtaining KPI aggregates. */
export async function GET(req: Request) {
  const accessError = await requireAccess("read");
  if (accessError) return accessError;
  try {
    const academicYear = new URL(req.url).searchParams.get("academicYear")?.trim();
    if (!academicYear) {
      return NextResponse.json({ data: [] }, { headers: { "Cache-Control": "private, no-store" } });
    }
    const classes = await withDatabaseRetry(() => prisma.admission.findMany({
      where: { academicYear },
      select: { admClass: true },
      distinct: ["admClass"],
      orderBy: { admClass: "asc" },
    }));
    return NextResponse.json(
      { data: classes.map(({ admClass }) => admClass).filter(Boolean) },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("ADMISSION_CLASSES_ERROR", error);
    return NextResponse.json({ error: "Failed to load class filters" }, { status: 500 });
  }
}
