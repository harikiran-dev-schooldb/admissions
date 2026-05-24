import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const allowedFields = [
  "application",
  "entrance",
  "interview",
  "admissionGiven",
  "finalAdmission",
];

export async function PATCH(req: Request) {
  try {
    const body = await req.json();

    const { id, field, value } = body;

    if (!allowedFields.includes(field)) {
      return NextResponse.json(
        {
          error: "Invalid field",
        },
        {
          status: 400,
        }
      );
    }

    const existing = await prisma.admission.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        {
          error: "Student not found",
        },
        {
          status: 404,
        }
      );
    }

    const updateData: Record<string, string> = {
      [field]: value,
    };

    /*
      APPLICATION SUBMITTED
    */

    if (
      field === "application" &&
      value === "SUBMITTED"
    ) {
      const skipEntrance =
        existing.admClass === "PRE KG" ||
        existing.admClass === "LKG";

      updateData.entrance = skipEntrance
        ? "NOT_REQUIRED"
        : "PENDING";
    }

    /*
      ENTRANCE PASS
    */

    if (
      field === "entrance" &&
      value === "PASS"
    ) {
      updateData.interview = "PENDING";
    }

    /*
      ENTRANCE FAIL
    */

    if (
      field === "entrance" &&
      value === "FAIL"
    ) {
      updateData.interview = "NOT_STARTED";
      updateData.admissionGiven = "NOT_GIVEN";
      updateData.finalAdmission = "PENDING";
    }

    /*
      INTERVIEW SELECTED
    */

    if (
      field === "interview" &&
      value === "SELECTED"
    ) {
      updateData.admissionGiven = "GIVEN";
    }

    /*
      INTERVIEW REJECTED
    */

    if (
      field === "interview" &&
      value === "REJECTED"
    ) {
      updateData.admissionGiven = "NOT_GIVEN";
      updateData.finalAdmission = "CANCELLED";
    }

    /*
      FINAL ADMISSION
    */

    if (
      field === "finalAdmission" &&
      value === "ADMITTED"
    ) {
      updateData.admissionGiven = "GIVEN";
      updateData.interview = "SELECTED";
    }

    const updated = await prisma.admission.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Update failed",
      },
      {
        status: 500,
      }
    );
  }
}