import { prisma } from "@/lib/prisma";
import { AdmissionGivenStatus, ApplicationStatus, EntranceStatus, FinalAdmissionStatus, InterviewStatus } from "@/src/generated/prisma/browser";
import { NextResponse } from "next/server";




async function generateEnquiryNo() {
  const year = new Date().getFullYear();

  const lastAdmission = await prisma.admission.findFirst({
    orderBy: {
      enquiryNo: "desc",
    },
  });

  let nextNumber = 1;

  if (lastAdmission?.enquiryNo) {
    const parts = lastAdmission.enquiryNo.split("-");

    const lastNumber = Number(parts[2]);

    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  return `ENQ-${year}-${nextNumber}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      student,
      parent,
      mobile,
      dob,
      age,
      admClass,
      eligibleClass,
    } = body;

    if (
      !student ||
      !parent ||
      !mobile ||
      !dob
    ) {
      return NextResponse.json(
        {
          error: "Missing fields",
        },
        {
          status: 400,
        },
      );
    }

    const entranceRequired =
      admClass === "PRE KG" ||
      admClass === "LKG";

    const created =
      await prisma.admission.create({
        data: {
          enquiryNo: await generateEnquiryNo(),

          student,

          parent,

          mobile,

          dob,

          age,

          admClass,

          eligibleClass,

          application:
            ApplicationStatus.NO,

          entrance: entranceRequired
            ? EntranceStatus.NOT_REQUIRED
            : EntranceStatus.NOT_STARTED,

          interview:
            InterviewStatus.NOT_STARTED,

          admissionGiven:
            AdmissionGivenStatus.NOT_GIVEN,

          finalAdmission:
            FinalAdmissionStatus.PENDING,
        },
      });

    return NextResponse.json({
      success: true,

      admission: created,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Failed to create admission",
      },
      {
        status: 500,
      },
    );
  }
}