-- Preserve all existing academic-year cohorts before enabling referential integrity.
-- Existing admission/fee years are kept intact, including legacy 2025-26.
INSERT INTO "AcademicYear" ("id", "academicYear", "isActive", "createdAt", "updatedAt")
SELECT 'backfill-' || md5(years."academicYear"), years."academicYear", true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (
  SELECT DISTINCT "academicYear" FROM "Admission"
  UNION
  SELECT DISTINCT "academicYear" FROM "FeeRecord"
  UNION
  SELECT '2026-27' AS "academicYear"
) AS years
WHERE years."academicYear" IS NOT NULL
ON CONFLICT ("academicYear") DO NOTHING;

ALTER TABLE "Admission"
ADD CONSTRAINT "Admission_academicYear_fkey"
FOREIGN KEY ("academicYear") REFERENCES "AcademicYear"("academicYear")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "FeeRecord"
ADD CONSTRAINT "FeeRecord_academicYear_fkey"
FOREIGN KEY ("academicYear") REFERENCES "AcademicYear"("academicYear")
ON DELETE RESTRICT ON UPDATE CASCADE;
