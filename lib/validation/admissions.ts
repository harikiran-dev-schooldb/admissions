import { z } from "zod";

export const admissionCreateSchema = z.object({
  academicYear: z.string().trim().regex(/^\d{4}-\d{2}$/, "Use academic year format YYYY-YY"),
  student: z.string().trim().min(2).max(120),
  parent: z.string().trim().min(2).max(120),
  mobile: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  dob: z.string().trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter date of birth as YYYY-MM-DD")
    .refine((value) => {
      const dob = new Date(`${value}T00:00:00Z`);
      return !Number.isNaN(dob.getTime()) && dob.toISOString().slice(0, 10) === value &&
        dob.getTime() <= Date.now();
    }, "Enter a valid date of birth that is not in the future"),
  age: z.string().trim().optional().nullable(),
  admClass: z.string().trim().min(1).max(30),
  eligibleClass: z.string().trim().max(30).optional().nullable(),
});

const stageValues = {
  application: ["NO", "YES", "SUBMITTED"],
  entrance: ["NOT_STARTED", "PASS", "FAIL", "PENDING", "NOT_REQUIRED"],
  interview: ["NOT_STARTED", "SELECTED", "REJECTED", "PENDING"],
  admissionGiven: ["NOT_GIVEN", "GIVEN"],
  finalAdmission: ["PENDING", "ADMITTED", "CANCELLED"],
} as const;

export const admissionStageSchema = z
  .object({
    // Legacy imports use PostgreSQL UUIDs; freshly created enquiries use Prisma CUIDs.
    id: z.union([z.cuid(), z.uuid()]),
    field: z.enum(["application", "entrance", "interview", "admissionGiven", "finalAdmission"]),
    value: z.string(),
  })
  .superRefine(({ field, value }, ctx) => {
    if (!(stageValues[field] as readonly string[]).includes(value)) {
      ctx.addIssue({ code: "custom", path: ["value"], message: `Invalid value for ${field}` });
    }
  });

export const admissionUpdateSchema = admissionCreateSchema.partial();

export function validationError(error: z.ZodError) {
  return { error: "Validation failed", issues: error.flatten().fieldErrors };
}
