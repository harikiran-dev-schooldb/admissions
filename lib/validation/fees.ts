import { z } from "zod";

const academicYearCode = z.string().trim().regex(/^\d{4}-\d{2}$/, "Use academic year format YYYY-YY");

const feeFields = {
  academicYear: academicYearCode,
  termFee: z.coerce.number().int().nonnegative(),
  annualFees: z.coerce.number().int().nonnegative(),
  className: z.string().trim().min(1).max(40),
  age: z.string().trim().max(40).optional().nullable(),
};

const academicYearFields = {
  academicYear: academicYearCode,
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  isActive: z.boolean().optional(),
};

function datesAreOrdered(value: { startDate?: Date | null; endDate?: Date | null }) {
  return !value.startDate || !value.endDate || value.startDate <= value.endDate;
}

export const feeCreateSchema = z.object(feeFields).strict();
export const feeReplaceSchema = z.object(feeFields).strict();
export const feePatchSchema = z.object(feeFields).partial().strict().refine((value) => Object.keys(value).length > 0, {
  message: "Provide at least one field to update",
});

export const academicYearCreateSchema = z.object(academicYearFields).strict().refine(datesAreOrdered, {
  message: "End date must be on or after start date",
  path: ["endDate"],
});
export const academicYearReplaceSchema = z.object(academicYearFields).strict().refine(datesAreOrdered, {
  message: "End date must be on or after start date",
  path: ["endDate"],
});
export const academicYearPatchSchema = z.object(academicYearFields).partial().strict()
  .refine((value) => Object.keys(value).length > 0, { message: "Provide at least one field to update" })
  .refine(datesAreOrdered, { message: "End date must be on or after start date", path: ["endDate"] });

export function validationError(error: z.ZodError) {
  return { error: "Validation failed", issues: error.flatten() };
}
