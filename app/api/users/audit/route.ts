import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAccess } from "@/lib/auth/requireAccess";
import { displayMemberName } from "@/lib/users/displayMemberName";

export async function GET() {
  const error = await requireAccess("admin");
  if (error) return error;
  try {
    const entries = await prisma.workspaceMemberAudit.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
    });
    const emails = [...new Set(entries.flatMap((entry) => [entry.actorEmail, entry.memberEmail]))];
    const members = await prisma.workspaceMember.findMany({
      where: { email: { in: emails } },
      select: { email: true, name: true },
    });
    const displayNames = new Map(members.map((member) => [member.email, member.name]));
    const data = entries.map((entry) => ({
      ...entry,
      actorName: displayMemberName(entry.actorEmail, displayNames.get(entry.actorEmail)),
      memberName: displayMemberName(entry.memberEmail, displayNames.get(entry.memberEmail)),
    }));
    return NextResponse.json({ data }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("GET_WORKSPACE_USER_AUDIT_ERROR", error);
    return NextResponse.json({ error: "Unable to load access history" }, { status: 500 });
  }
}
