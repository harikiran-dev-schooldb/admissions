import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";



export async function PATCH(req: Request) {
  try {
    const body = await req.json();

    const { id, field, value } = body;

    const existing =
      await prisma.admission.findUnique({
        where: { id },
      });

    if (!existing) {
      return NextResponse.json(
        {
          error: "Student not found",
        },
        {
          status: 404,
        },
      );
    }

    const updateData: any = {
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
      updateData.interview =
        "PENDING";
    }

    /*
      INTERVIEW SELECTED
    */

    if (
      field === "interview" &&
      value === "SELECTED"
    ) {
      updateData.admissionGiven =
        "GIVEN";
    }

    /*
      FINAL ADMISSION
    */

    if (
      field === "finalAdmission" &&
      value === "ADMITTED"
    ) {
      updateData.admissionGiven =
        "GIVEN";
    }

    const updated =
      await prisma.admission.update({
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
      },
    );
  }
}