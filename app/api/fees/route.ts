import { prisma } from "@/lib/prisma";

import { NextResponse } from "next/server";

export async function GET() {
  try {
    const fees = await prisma.feeRecord.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(fees);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Failed to fetch fees",
      },
      {
        status: 500,
      }
    );
  }
}