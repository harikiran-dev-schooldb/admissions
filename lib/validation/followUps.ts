import { z } from "zod";

export const admissionFollowUpId = z.union([z.cuid(), z.uuid()]);
export const followUpCreateSchema = z.object({
  admissionId: admissionFollowUpId,
  assignedToEmail: z.email().max(254).optional(),
  dueAt: z.iso.datetime({ offset: true }),
  note: z.string().trim().max(2000).optional(),
}).strict().refine(
  ({ dueAt }) => Date.parse(dueAt) > Date.now(),
  { path: ["dueAt"], message: "Choose a follow-up time in the future" },
);

export const followUpCompleteSchema = z.object({
  outcome: z.enum(["INTERESTED","CALL_BACK","NO_RESPONSE","NOT_INTERESTED","OTHER"]),
  completionNote: z.string().trim().max(2000).optional(),
}).strict();
