import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

const allowedFields = [
  "application",
  "entrance",
  "interview",
  "admissionGiven",
  "finalAdmission",
] as const;

type AllowedField =
  (typeof allowedFields)[number];

export async function PATCH(req: Request) {
  try {
    const body = await req.json();

    const {
      id,
      field,
      value,
    }: {
      id: string;
      field: AllowedField;
      value: string;
    } = body;

    // VALIDATE FIELD
    if (
      !allowedFields.includes(field)
    ) {
      return NextResponse.json(
        {
          error: "Invalid field",
        },
        {
          status: 400,
        }
      );
    }

    // FIND STUDENT
    const existing =
      await prisma.admission.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
          admClass: true,

          application: true,
          entrance: true,
          interview: true,
          admissionGiven: true,
          finalAdmission: true,
        },
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

    // UPDATE PAYLOAD
    const updateData: Record<
      string,
      string
    > = {
      [field]: value,
    };

    /*
      APPLICATION
    */

    if (
      field === "application"
    ) {
      if (value === "SUBMITTED") {
        const skipEntrance =
          existing.admClass ===
            "PRE KG" ||
          existing.admClass ===
            "LKG";

        updateData.entrance =
          skipEntrance
            ? "NOT_REQUIRED"
            : "PENDING";
      }

      if (value === "YES") {
        updateData.entrance =
          "NOT_STARTED";
      }
    }

    /*
      ENTRANCE
    */

    if (field === "entrance") {
      if (value === "PASS") {
        updateData.interview =
          "PENDING";
      }

      if (value === "FAIL") {
        updateData.interview =
          "NOT_STARTED";

        updateData.admissionGiven =
          "NOT_GIVEN";

        updateData.finalAdmission =
          "PENDING";
      }

      if (
        value === "NOT_REQUIRED"
      ) {
        updateData.interview =
          "PENDING";
      }
    }

    /*
      INTERVIEW
    */

    if (field === "interview") {
      if (
        value === "SELECTED"
      ) {
        updateData.admissionGiven =
          "GIVEN";
      }

      if (
        value === "REJECTED"
      ) {
        updateData.admissionGiven =
          "NOT_GIVEN";

        updateData.finalAdmission =
          "CANCELLED";
      }
    }

    /*
      ADMISSION GIVEN
    */

    if (
      field ===
      "admissionGiven"
    ) {
      if (value === "GIVEN") {
        updateData.finalAdmission =
          "PENDING";
      }

      if (
        value === "NOT_GIVEN"
      ) {
        updateData.finalAdmission =
          "CANCELLED";
      }
    }

    /*
      FINAL ADMISSION
    */

    if (
      field ===
      "finalAdmission"
    ) {
      if (
        value === "ADMITTED"
      ) {
        updateData.admissionGiven =
          "GIVEN";

        updateData.interview =
          "SELECTED";
      }

      if (
        value === "CANCELLED"
      ) {
        updateData.admissionGiven =
          "NOT_GIVEN";
      }
    }

    // UPDATE DB
    const updated =
      await prisma.admission.update({
        where: {
          id,
        },

        data: updateData,
      });

    // OPTIONAL
    revalidatePath("/admissions");

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error(
      "PATCH_STAGE_ERROR",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to update stage",
      },
      {
        status: 500,
      }
    );
  }
}