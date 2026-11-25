import type { Prisma } from "@/src/generated/prisma/client";
import { canonicalName, isDuplicateEnquiry } from "./duplicate";

export class DuplicateEnquiry extends Error {}
export async function assertUniqueEnquiry(tx: Prisma.TransactionClient, input: {
  academicYear: string; student: string; mobile: string; dob?: string | null;
}, excludeId?: string) {
  const candidates = await tx.admission.findMany({
    where: { academicYear: input.academicYear, ...(excludeId ? { id: { not: excludeId } } : {}),
      OR: [{ student: { equals: canonicalName(input.student), mode: "insensitive" } },
        { mobile: { in: [input.mobile, "91" + input.mobile, "+91" + input.mobile] } }] },
    select: { student: true, mobile: true, dob: true, enquiryNo: true },
  });
  const duplicate = candidates.find((candidate) => isDuplicateEnquiry(input, candidate));
  if (duplicate) throw new DuplicateEnquiry("An enquiry already exists for this student in the selected academic year (" + duplicate.enquiryNo + "). Search for that enquiry instead.");
}
