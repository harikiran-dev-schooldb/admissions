import { z } from "zod";
import { SCHOOL_CLASSES } from "./yearPolicy";
const schoolClass = z.enum(SCHOOL_CLASSES);
const cutoff = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const parsed = new Date(value + "T00:00:00Z");
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0,10) === value;
}, "Enter a valid date");
const ageRule = z.object({ minMonths: z.number().int().min(0).max(240), maxMonths: z.number().int().min(0).max(240) }).strict()
  .refine(rule => rule.minMonths <= rule.maxMonths, "Maximum age must not be below minimum age");
export const yearPolicySchema = z.object({
  ageAsOfDate: cutoff, rules: z.partialRecord(schoolClass, ageRule),
}).strict();
export const seatCapacitySchema = z.partialRecord(schoolClass, z.number().int().min(0).max(100000));
export const planningSchema = z.object({
  academicYear: z.string().regex(/^\d{4}-\d{2}$/), policy: yearPolicySchema, capacity: seatCapacitySchema,
}).strict();
