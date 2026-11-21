import "dotenv/config";

import fs from "fs";

import csv from "csv-parser";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/src/generated/prisma/client";

type CsvRow = Record<string, string>;

const rows: Prisma.FeeRecordCreateManyInput[] = [];

const csvPath = "/Users/harikiran/Downloads/feetable_rows.csv";

fs.createReadStream(csvPath)
  .pipe(csv())

  .on("data", (row: CsvRow) => {
    rows.push({
      academicYear: row.academic_year,

      termFee: Number(row.term),

      annualFees: Number(row.annualFees),

      age: String(row.age),

      className: row.class,
    });
  })

  .on("end", async () => {
    try {
      await prisma.feeRecord.createMany({
        data: rows,

        skipDuplicates: true,
      });

      console.log("✅ Fees Imported");
      console.log(rows.length);
    } catch (error) {
      console.error(error);
    } finally {
      await prisma.$disconnect();
    }
  });
