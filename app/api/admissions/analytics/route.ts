import { requireAccess } from "@/lib/auth/requireAccess";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withDatabaseRetry } from "@/lib/dbRetry";

/**
 * Aggregate in PostgreSQL: the analytics page never transfers student records
 * or private data such as parent names, DOBs, phone numbers and enquiry IDs.
 */
export async function GET(req: Request) {
  const accessError = await requireAccess("admin");
  if (accessError) return accessError;
  const academicYear = new URL(req.url).searchParams.get("academicYear")?.trim();
  if (!academicYear || !/^\d{4}-\d{2}$/.test(academicYear)) {
    return NextResponse.json({ error: "Choose a valid academic year" }, { status: 400 });
  }

  try {
    const groups = await withDatabaseRetry(() => prisma.admission.groupBy({
      by: ["admClass", "application", "entrance", "interview", "finalAdmission"],
      where: { academicYear },
      _count: { _all: true },
    }));
    return NextResponse.json(
      { data: groups, academicYear },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("ADMISSIONS_ANALYTICS_ERROR", error);
    return NextResponse.json({ error: "Failed to load admission analytics" }, { status: 500 });
  }
}
