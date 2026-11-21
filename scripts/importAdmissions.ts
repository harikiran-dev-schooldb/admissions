// scripts/importAdmissions.ts

import "dotenv/config";

import fs from "fs";
import csv from "csv-parser";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/src/generated/prisma/client";

type CsvRow = Record<string, string>;

const results: Prisma.AdmissionCreateManyInput[] = [];

function mapApplication(row: CsvRow): Prisma.AdmissionCreateManyInput["application"] {
  if (row.applicationSubmitted === "YES") {
    return "SUBMITTED";
  }

  if (row.application === "YES") {
    return "YES";
  }

  return "NO";
}

function mapEntrance(value: string): Prisma.AdmissionCreateManyInput["entrance"] {
  if (!value) return "NOT_STARTED";

  const normalized = value.replaceAll(" ", "_").toUpperCase();
  if (["NOT_STARTED", "PASS", "FAIL", "PENDING", "NOT_REQUIRED"].includes(normalized)) {
    return normalized as NonNullable<Prisma.AdmissionCreateManyInput["entrance"]>;
  }
  return "NOT_STARTED";
}

function mapInterview(value: string): Prisma.AdmissionCreateManyInput["interview"] {
  if (!value) return "NOT_STARTED";

  const normalized = value.replaceAll(" ", "_").toUpperCase();
  if (["NOT_STARTED", "SELECTED", "REJECTED", "PENDING"].includes(normalized)) {
    return normalized as NonNullable<Prisma.AdmissionCreateManyInput["interview"]>;
  }
  return "NOT_STARTED";
}

function mapFinal(value: string): Prisma.AdmissionCreateManyInput["finalAdmission"] {
  if (!value || value === "NO") {
    return "PENDING";
  }

  if (value === "YES") {
    return "ADMITTED";
  }

  return value.toUpperCase() === "CANCELLED" ? "CANCELLED" : "PENDING";
}

function parseDate(dateStr: string) {
  if (!dateStr) {
    return new Date();
  }

  const parts = dateStr.split("/");

  if (parts.length !== 3) {
    return new Date();
  }

  const [day, month, year] = parts;

  return new Date(`${year}-${month}-${day}`);
}

fs.createReadStream(
  "/Users/harikiran/Downloads/admissions_rows.csv"
)
  .pipe(csv())
  .on("data", (row: CsvRow) => {
    results.push({
      enquiryNo: row.enquiryNo,

      student: row.student,

      parent: row.parent,

      mobile: row.mobile,

      dob: row.dob,

      age: row.age,

      admClass: row.admClass,

      eligibleClass: row.eligible,

      eligibleStatus: row.eligiblestatus,

      application: mapApplication(row),

      entrance: mapEntrance(row.entrance),

      interview: mapInterview(row.interview),

      finalAdmission: mapFinal(row.finalAdmission),

      admissionGiven:
        row.finalAdmission === "YES"
          ? "GIVEN"
          : "NOT_GIVEN",

      enquiryDate: parseDate(row.date),
    });
  })
  .on("end", async () => {
    try {
      await prisma.admission.createMany({
        data: results,
        skipDuplicates: true,
      });

      console.log("Imported:", results.length);
    } catch (err) {
      console.error(err);
    } finally {
      await prisma.$disconnect();
    }
  });
