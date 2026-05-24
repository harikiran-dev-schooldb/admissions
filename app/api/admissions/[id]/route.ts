import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const body = await req.json();

    const { id } = await context.params;

    return NextResponse.json({
      success: true,
      id,
      body,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Failed to update",
      },
      {
        status: 500,
      }
    );
  }
}

export async function GET(
  req: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  const { id } = await context.params;

  return NextResponse.json({
    id,
  });
}