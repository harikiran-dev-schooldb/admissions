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

    /*
      VALIDATE FIELD
    */

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

    /*
      FIND STUDENT
    */

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

    /*
      UPDATE PAYLOAD
    */

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
      /*
        NO
      */

      if (value === "NO") {
        updateData.entrance =
          "NOT_STARTED";

        updateData.interview =
          "NOT_STARTED";

        updateData.admissionGiven =
          "NOT_GIVEN";

        updateData.finalAdmission =
          "PENDING";
      }

      /*
        YES
      */

      if (value === "YES") {
        updateData.entrance =
          "NOT_STARTED";

        updateData.interview =
          "NOT_STARTED";

        updateData.admissionGiven =
          "NOT_GIVEN";

        updateData.finalAdmission =
          "PENDING";
      }

      /*
        SUBMITTED
      */

      if (
        value === "SUBMITTED"
      ) {
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
    }

    /*
      ENTRANCE
    */

    if (field === "entrance") {
      /*
        PASS
      */

      if (value === "PASS") {
        updateData.interview =
          "PENDING";
      }

      /*
        FAIL
      */

      if (value === "FAIL") {
        updateData.interview =
          "NOT_STARTED";

        updateData.admissionGiven =
          "NOT_GIVEN";

        updateData.finalAdmission =
          "PENDING";
      }

      /*
        NOT REQUIRED
      */

      if (
        value === "NOT_REQUIRED"
      ) {
        updateData.interview =
          "PENDING";
      }

      /*
        NOT STARTED
      */

      if (
        value === "NOT_STARTED"
      ) {
        updateData.interview =
          "NOT_STARTED";

        updateData.admissionGiven =
          "NOT_GIVEN";

        updateData.finalAdmission =
          "PENDING";
      }
    }

    /*
      INTERVIEW
    */

    if (field === "interview") {
      /*
        SELECTED
      */

      if (
        value === "SELECTED"
      ) {
        updateData.admissionGiven =
          "GIVEN";
      }

      /*
        REJECTED
      */

      if (
        value === "REJECTED"
      ) {
        updateData.admissionGiven =
          "NOT_GIVEN";

        updateData.finalAdmission =
          "CANCELLED";
      }

      /*
        NOT STARTED
      */

      if (
        value === "NOT_STARTED"
      ) {
        updateData.admissionGiven =
          "NOT_GIVEN";

        updateData.finalAdmission =
          "PENDING";
      }
    }

    /*
      ADMISSION GIVEN
    */

    if (
      field ===
      "admissionGiven"
    ) {
      /*
        GIVEN
      */

      if (value === "GIVEN") {
        updateData.finalAdmission =
          "PENDING";
      }

      /*
        NOT GIVEN
      */

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
      /*
        ADMITTED
      */

      if (
        value === "ADMITTED"
      ) {
        updateData.admissionGiven =
          "GIVEN";

        updateData.interview =
          "SELECTED";

        if (
          existing.entrance ===
          "NOT_STARTED"
        ) {
          updateData.entrance =
            "PASS";
        }

        if (
          existing.application ===
          "NO"
        ) {
          updateData.application =
            "SUBMITTED";
        }
      }

      /*
        CANCELLED
      */

      if (
        value === "CANCELLED"
      ) {
        updateData.admissionGiven =
          "NOT_GIVEN";
      }
    }

    /*
      UPDATE DATABASE
    */

    const updated =
      await prisma.admission.update({
        where: {
          id,
        },

        data: updateData,
      });

    /*
      REVALIDATE
    */

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