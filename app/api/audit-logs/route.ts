import { NextResponse } from "next/server";
import type { Prisma } from "@/src/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAccess } from "@/lib/auth/requireAccess";
import { getAuditPagination, parseAuditPage, parseAuditPageSize } from "@/lib/audit/pagination";

export const dynamic = "force-dynamic";

const types = new Set(["ADMISSION", "FEE", "ACADEMIC_YEAR", "SETTINGS", "USER"]);
const actions = new Set(["CREATED", "UPDATED", "DELETED", "STAGE_CHANGED", "DEACTIVATED", "REACTIVATED", "ROLE_CHANGED"]);
const noStore = { "Cache-Control": "private, no-store, max-age=0" };

/** Server-authorized, read-only and paginated activity history. Never exposes a write endpoint. */
export async function GET(req: Request) {
  const error = await requireAccess("admin");
  if (error) return error;

  try {
    const url = new URL(req.url);
    const requestedPage = parseAuditPage(url.searchParams.get("page"));
    const pageSize = parseAuditPageSize(url.searchParams.get("pageSize"));
    const entity = url.searchParams.get("type") ?? "";
    const action = url.searchParams.get("action") ?? "";
    const query = url.searchParams.get("q")?.trim().slice(0, 120) ?? "";

    const where: Prisma.ActivityLogWhereInput = {
      ...(types.has(entity) ? { entityType: entity } : {}),
      ...(actions.has(action) ? { action } : {}),
      ...(query ? {
        OR: [
          { actorEmail: { contains: query, mode: "insensitive" } },
          { actorName: { contains: query, mode: "insensitive" } },
          { entityLabel: { contains: query, mode: "insensitive" } },
        ],
      } : {}),
    };

    const total = await prisma.activityLog.count({ where });
    const pagination = getAuditPagination(total, requestedPage, pageSize);
    const entries = await prisma.activityLog.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: pagination.skip,
      take: pagination.pageSize,
    });

    return NextResponse.json({
      data: entries,
      total,
      page: pagination.page,
      pages: pagination.pages,
      pageSize: pagination.pageSize,
    }, { headers: noStore });
  } catch (caught) {
    console.error("GET_ACTIVITY_LOGS_ERROR", caught);
    return NextResponse.json({ error: "Unable to load activity logs" }, { status: 500, headers: noStore });
  }
}
