import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import { normalizeName } from "@/utils/formatters";

import { getAgeString } from "@/utils/age";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const latest =
      await prisma.admission.findFirst({
        orderBy: {
          createdAt: "desc",
        },
      });

    const latestNo =
      latest?.enquiryNo
        ?.split("-")
        ?.pop() || "700";

    const enquiryNo = `ENQ-2026-${
      Number(latestNo) + 1
    }`;

    const admission =
      await prisma.admission.create({
        data: {
          enquiryNo,

          student: normalizeName(
            body.student
          ),

          parent: normalizeName(
            body.parent
          ),

          mobile: body.mobile,

          admClass: body.admClass,

          dob: body.dob,

          age: getAgeString(body.dob),

          eligible: body.eligibleClass,

          eligibleStatus: "ELIGIBLE",

          enquiryDate:
            new Date().toISOString(),

          applicationIssued: false,

          applicationSubmitted: false,

          entrance: "NOT_STARTED",

          interview: "PENDING",

          admissionFormIssued: false,

          finalAdmission: "PENDING",
        },
      });

    return NextResponse.json({
      success: true,
      data: admission,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
      },
      {
        status: 500,
      }
    );
  }
}