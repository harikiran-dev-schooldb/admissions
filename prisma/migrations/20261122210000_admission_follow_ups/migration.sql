-- Add a staff-owned admission follow-up ledger. Existing admissions are untouched.
CREATE TYPE "FollowUpStatus" AS ENUM ('OPEN', 'COMPLETED');
CREATE TYPE "FollowUpOutcome" AS ENUM ('INTERESTED', 'CALL_BACK', 'NO_RESPONSE', 'NOT_INTERESTED', 'OTHER');

CREATE TABLE "AdmissionFollowUp" (
  "id" TEXT NOT NULL,
  "admissionId" TEXT NOT NULL,
  "assignedToEmail" TEXT NOT NULL,
  "dueAt" TIMESTAMP(3) NOT NULL,
  "note" TEXT,
  "status" "FollowUpStatus" NOT NULL DEFAULT 'OPEN',
  "outcome" "FollowUpOutcome",
  "completionNote" TEXT,
  "completedAt" TIMESTAMP(3),
  "completedByEmail" TEXT,
  "createdByEmail" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AdmissionFollowUp_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AdmissionFollowUp_admissionId_createdAt_idx" ON "AdmissionFollowUp"("admissionId", "createdAt" DESC);
CREATE INDEX "AdmissionFollowUp_assignedToEmail_status_dueAt_idx" ON "AdmissionFollowUp"("assignedToEmail", "status", "dueAt");
CREATE INDEX "AdmissionFollowUp_status_dueAt_idx" ON "AdmissionFollowUp"("status", "dueAt");
ALTER TABLE "AdmissionFollowUp" ADD CONSTRAINT "AdmissionFollowUp_admissionId_fkey"
  FOREIGN KEY ("admissionId") REFERENCES "Admission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
