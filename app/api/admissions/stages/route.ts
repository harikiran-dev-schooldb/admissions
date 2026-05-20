import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request
) {
  try {
    const body = await req.json();

    const {
      id,
      field,
      value,
    } = body;

    const admission =
      await prisma.admission.findUnique({
        where: {
          id,
        },
      });

    if (!admission) {
      return NextResponse.json(
        {
          error:
            "Admission not found",
        },
        {
          status: 404,
        }
      );
    }

    /*
      BUSINESS RULES
    */

    const noEntrance = [
      "PRE KG",
      "LKG",
    ].includes(admission.admClass);

    /*
      APPLICATION
    */

    if (
      field === "application"
    ) {
      const updated =
        await prisma.admission.update({
          where: {
            id,
          },

          data: {
            application: value,
          },
        });

      return NextResponse.json(
        updated
      );
    }

    /*
      ENTRANCE
    */

    if (field === "entrance") {
      if (noEntrance) {
        return NextResponse.json(
          {
            error:
              "Entrance not required",
          },
          {
            status: 400,
          }
        );
      }

      if (
        admission.application !==
        "SUBMITTED"
      ) {
        return NextResponse.json(
          {
            error:
              "Application must be submitted first",
          },
          {
            status: 400,
          }
        );
      }

      const updated =
        await prisma.admission.update({
          where: {
            id,
          },

          data: {
            entrance: value,
          },
        });

      return NextResponse.json(
        updated
      );
    }

    /*
      INTERVIEW
    */

    if (field === "interview") {
      if (
        !noEntrance &&
        admission.entrance !==
          "PASS"
      ) {
        return NextResponse.json(
          {
            error:
              "Entrance must be PASS",
          },
          {
            status: 400,
          }
        );
      }

      const updated =
        await prisma.admission.update({
          where: {
            id,
          },

          data: {
            interview: value,
          },
        });

      return NextResponse.json(
        updated
      );
    }

    /*
      ADMISSION GIVEN
    */

    if (
      field ===
      "admissionGiven"
    ) {
      if (
        admission.interview !==
        "SELECTED"
      ) {
        return NextResponse.json(
          {
            error:
              "Interview must be SELECTED",
          },
          {
            status: 400,
          }
        );
      }

      const updated =
        await prisma.admission.update({
          where: {
            id,
          },

          data: {
            admissionGiven:
              value,
          },
        });

      return NextResponse.json(
        updated
      );
    }

    /*
      FINAL ADMISSION
    */

    if (
      field ===
      "finalAdmission"
    ) {
      if (
        admission.admissionGiven !==
        "GIVEN"
      ) {
        return NextResponse.json(
          {
            error:
              "Admission form not given",
          },
          {
            status: 400,
          }
        );
      }

      const updated =
        await prisma.admission.update({
          where: {
            id,
          },

          data: {
            finalAdmission:
              value,
          },
        });

      return NextResponse.json(
        updated
      );
    }

    return NextResponse.json(
      {
        error: "Invalid field",
      },
      {
        status: 400,
      }
    );
  } catch (error) {
    console.error(error);

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