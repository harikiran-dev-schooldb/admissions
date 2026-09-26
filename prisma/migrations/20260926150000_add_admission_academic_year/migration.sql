-- Tag legacy admissions as the 2025-26 cycle, then require callers to provide a year for new records.
ALTER TABLE "Admission"
ADD COLUMN "academicYear" TEXT NOT NULL DEFAULT '2025-26';

ALTER TABLE "Admission"
ALTER COLUMN "academicYear" DROP DEFAULT;

CREATE INDEX "Admission_academicYear_idx"
ON "Admission"("academicYear");
