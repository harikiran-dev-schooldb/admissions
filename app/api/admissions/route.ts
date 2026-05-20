import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const admissions =
      await prisma.admission.findMany({
        orderBy: {
          enquiryDate: "desc",
        },
      });

    return NextResponse.json(admissions);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Failed to fetch admissions",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(
  req: Request
) {
  try {
    const body = await req.json();

    const latest =
      await prisma.admission.findFirst({
        orderBy: {
          enquiryDate: "desc",
        },
      });

    const latestNo =
      latest?.enquiryNo
        ?.split("-")
        ?.pop() || "1000";

    const enquiryNo = `ENQ-${
      Number(latestNo) + 1
    }`;

    const noEntrance = [
      "PRE KG",
      "LKG",
    ].includes(body.admClass);

    const admission =
      await prisma.admission.create({
        data: {
          enquiryNo,

          student: body.student,

          parent: body.parent,

          mobile: body.mobile,

          dob: body.dob,

          age: body.age,

          admClass: body.admClass,

          eligibleClass:
            body.eligibleClass,

          eligibleStatus:
            "ELIGIBLE",

          application: "NO",

          entrance: noEntrance
            ? "NOT_REQUIRED"
            : "NOT_STARTED",

          interview: "NOT_STARTED",

          admissionGiven:
            "NOT_GIVEN",

          finalAdmission:
            "PENDING",
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
        error:
          "Failed to create admission",
      },
      {
        status: 500,
      }
    );
  }
}