import { requireAccess } from "@/lib/auth/requireAccess";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { admissionStageSchema, validationError } from "@/lib/validation/admissions";

const allowedFields = [
  "application",
  "entrance",
  "interview",
  "admissionGiven",
  "finalAdmission",
] as const;

export async function PATCH(req: Request) {
  const accessError = await requireAccess("staff");
  if (accessError) return accessError;
  try {
    const parsed = admissionStageSchema.safeParse(await req.json());

    if (!parsed.success) {
      return NextResponse.json(validationError(parsed.error), { status: 400 });
    }

    const { id, field, value } = parsed.data;

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

    // The API must reject attempts to bypass the admission pipeline.
    // Reject invalid steps before preparing any write.
    if (field === "entrance" && existing.application !== "SUBMITTED" && value !== "NOT_STARTED") {
      return NextResponse.json({ error: "Submit the application before updating the entrance result" }, { status: 409 });
    }
    if (field === "interview" && !["PASS", "NOT_REQUIRED"].includes(existing.entrance) && value !== "NOT_STARTED") {
      return NextResponse.json({ error: "Complete the entrance requirement before the interview" }, { status: 409 });
    }
    if (field === "admissionGiven" && value === "GIVEN" && existing.interview !== "SELECTED") {
      return NextResponse.json({ error: "Select the student in the interview before granting admission" }, { status: 409 });
    }
    if (field === "finalAdmission" && value === "ADMITTED" &&
        (existing.application !== "SUBMITTED" ||
         !["PASS", "NOT_REQUIRED"].includes(existing.entrance) ||
         existing.interview !== "SELECTED")) {
      return NextResponse.json({ error: "Application, entrance and interview must be completed before final admission" }, { status: 409 });
    }
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