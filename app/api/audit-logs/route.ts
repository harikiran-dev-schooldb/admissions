import { NextResponse } from "next/server";
import type { Prisma } from "@/src/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAccess } from "@/lib/auth/requireAccess";
import { getAuditPagination, parseAuditPage, parseAuditPageSize } from "@/lib/audit/pagination";
import { displayMemberName } from "@/lib/users/displayMemberName";

export const dynamic = "force-dynamic";

const types = new Set(["ADMISSION", "FEE", "ACADEMIC_YEAR", "SETTINGS", "USER", "ADMISSION_CASE", "DOCUMENT"]);
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

    const memberMatches = query ? await prisma.workspaceMember.findMany({
      where: { name: { contains: query, mode: "insensitive" } },
      select: { email: true },
      take: 100,
    }) : [];
    const matchingEmails = memberMatches.map((member) => member.email);

    const where: Prisma.ActivityLogWhereInput = {
      ...(types.has(entity) ? { entityType: entity } : {}),
      ...(actions.has(action) ? { action } : {}),
      ...(query ? {
        OR: [
          { actorEmail: { contains: query, mode: "insensitive" } },
          { actorName: { contains: query, mode: "insensitive" } },
          { actorEmail: { in: matchingEmails } },
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

    const actorEmails = [...new Set(entries.map((entry) => entry.actorEmail))];
    const userRecordIds = entries.filter((entry) => entry.entityType === "USER").map((entry) => entry.entityId);
    const knownMembers = await prisma.workspaceMember.findMany({
      where: { OR: [{ email: { in: actorEmails } }, { id: { in: userRecordIds } }] },
      select: { id: true, email: true, name: true },
    });
    const actorNames = new Map(knownMembers.map((member) => [member.email, member.name]));
    const memberNames = new Map(knownMembers.map((member) => [member.id, member.name]));
    const data = entries.map((entry) => ({
      ...entry,
      actorName: displayMemberName(entry.actorEmail, actorNames.get(entry.actorEmail) || entry.actorName),
      entityLabel: entry.entityType === "USER"
        ? displayMemberName(entry.entityLabel, memberNames.get(entry.entityId)) : entry.entityLabel,
    }));

    return NextResponse.json({
      data,
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
