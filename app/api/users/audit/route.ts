import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAccess } from "@/lib/auth/requireAccess";

export async function GET() {
  const error = await requireAccess("admin");
  if (error) return error;
  try {
    const entries = await prisma.workspaceMemberAudit.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
    });
    return NextResponse.json({ data: entries }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("GET_WORKSPACE_USER_AUDIT_ERROR", error);
    return NextResponse.json({ error: "Unable to load access history" }, { status: 500 });
  }
}
