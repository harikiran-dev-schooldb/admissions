import { NextResponse } from "next/server";
import { Prisma } from "@/src/generated/prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { emailSet, isBootstrapAdmin, normalizeEmail } from "@/lib/auth/accessPolicy";
import { requireAdminIdentity } from "@/lib/auth/requireAccess";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  email: z.email().max(254),
  role: z.enum(["ADMIN", "STAFF"]),
}).strict();

const noStore = { "Cache-Control": "private, no-store, max-age=0" };

export async function GET(req: Request) {
  const actor = await requireAdminIdentity();
  if (actor.error) return actor.error;
  try {
    const url = new URL(req.url);
    const page = Math.max(1, Math.min(10000, Number.parseInt(url.searchParams.get("page") ?? "1", 10) || 1));
    const search = normalizeEmail(url.searchParams.get("q") ?? "").slice(0, 254);
    const where = search ? { email: { contains: search, mode: "insensitive" as const } } : {};

    const [users, total] = await Promise.all([
      prisma.workspaceMember.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * 25,
        take: 25,
      }),
      prisma.workspaceMember.count({ where }),
    ]);

    // Only administrators may see the configured bootstrap identities.
    return NextResponse.json({
      data: users,
      total,
      page,
      pageSize: 25,
      bootstrapAdmins: [...emailSet(process.env.ADMISSIONS_ADMIN_EMAILS)].sort(),
      legacyStaff: [...emailSet(process.env.ADMISSIONS_STAFF_EMAILS)].sort(),
      currentUserEmail: actor.email,
    }, { headers: noStore });
  } catch (error) {
    console.error("GET_WORKSPACE_USERS_ERROR", error);
    return NextResponse.json({ error: "Failed to load users. Check that database migrations are applied." }, { status: 503 });
  }
}

export async function POST(req: Request) {
  const actor = await requireAdminIdentity();
  if (actor.error) return actor.error;

  try {
    const parsed = createSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Enter a valid email address and role" }, { status: 400 });
    const email = normalizeEmail(parsed.data.email);
    if (isBootstrapAdmin(email, process.env.ADMISSIONS_ADMIN_EMAILS)) {
      return NextResponse.json({ error: "This email is already a protected administrator" }, { status: 409 });
    }
    if (email === actor.email) {
      return NextResponse.json({ error: "You cannot change your own access" }, { status: 409 });
    }

    const member = await prisma.$transaction(async (tx) => {
      const created = await tx.workspaceMember.create({
        data: {
          email,
          role: parsed.data.role,
          isActive: true,
          createdBy: actor.email,
          updatedBy: actor.email,
        },
      });
      await tx.workspaceMemberAudit.create({
        data: {
          memberEmail: email,
          actorEmail: actor.email,
          action: "CREATED",
          afterRole: created.role,
          afterActive: true,
        },
      });
      return created;
    });
    return NextResponse.json({ data: member }, { status: 201, headers: noStore });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "This email is already registered. Edit or reactivate its existing entry." }, { status: 409 });
    }
    if (error instanceof SyntaxError) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    console.error("CREATE_WORKSPACE_USER_ERROR", error);
    return NextResponse.json({ error: "Unable to add user. Check database migrations." }, { status: 500 });
  }
}
