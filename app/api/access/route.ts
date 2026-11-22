import { NextResponse } from "next/server";
import { getAuthorizedRole } from "@/lib/auth/requireAccess";

export async function GET() {
  const { role, email, error } = await getAuthorizedRole();
  if (error) return error;
  return NextResponse.json(
    { role, email, canManage: role === "admin" },
    { headers: { "Cache-Control": "private, no-store, max-age=0" } },
  );
}
