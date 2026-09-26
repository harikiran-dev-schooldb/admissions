import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";

const handlers = auth.handler();

export const GET = handlers.GET;

type AuthRouteContext = {
  params: Promise<{ path: string[] }>;
};

export async function POST(request: Request, context: AuthRouteContext) {
  const { pathname } = new URL(request.url);

  if (pathname.startsWith("/api/auth/sign-up")) {
    return NextResponse.json(
      { error: "Account creation is disabled for this application." },
      { status: 403 },
    );
  }

  return handlers.POST(request, context);
}
