import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuditActor } from "@/lib/audit/activity";
import { emailSet, resolveAccessRole } from "@/lib/auth/accessPolicy";
import { displayMemberName } from "@/lib/users/displayMemberName";

const noStore = { "Cache-Control": "private, no-store, max-age=0" };

export async function GET() {
  const authz = await requireAuditActor("read");
  if (authz.error) return authz.error;
  const actor = authz.actor;
  if (actor.role !== "admin") {
    return NextResponse.json({ data: [{ email: actor.email, role: actor.role, name: displayMemberName(actor.email, actor.name) }] }, { headers: noStore });
  }

  try {
    const members = await prisma.workspaceMember.findMany({ select: { email: true, name: true, role: true, isActive: true } });
    const membershipByEmail = new Map(members.map((member) => [member.email, member]));
    const allEmails = new Set([
      ...emailSet(process.env.ADMISSIONS_ADMIN_EMAILS),
      ...emailSet(process.env.ADMISSIONS_STAFF_EMAILS),
      ...members.map((member) => member.email),
    ]);
    const data = [...allEmails].sort().flatMap((email) => {
      const role = resolveAccessRole(email, process.env.ADMISSIONS_ADMIN_EMAILS, process.env.ADMISSIONS_STAFF_EMAILS, membershipByEmail.get(email));
      return role ? [{ email, role, name: displayMemberName(email, membershipByEmail.get(email)?.name) }] : [];
    });
    return NextResponse.json({ data }, { headers: noStore });
  } catch (error) {
    console.error("FOLLOWUP_ASSIGNEES_ERROR", error);
    return NextResponse.json({ error: "Unable to load team members" }, { status: 500, headers: noStore });
  }
}
