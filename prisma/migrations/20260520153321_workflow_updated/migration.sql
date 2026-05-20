/*
  Warnings:

  - The values [NOT_STARTED,TAKEN] on the enum `ApplicationStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ApplicationStatus_new" AS ENUM ('NO', 'YES', 'SUBMITTED');
ALTER TABLE "public"."Admission" ALTER COLUMN "application" DROP DEFAULT;
ALTER TABLE "Admission" ALTER COLUMN "application" TYPE "ApplicationStatus_new" USING ("application"::text::"ApplicationStatus_new");
ALTER TYPE "ApplicationStatus" RENAME TO "ApplicationStatus_old";
ALTER TYPE "ApplicationStatus_new" RENAME TO "ApplicationStatus";
DROP TYPE "public"."ApplicationStatus_old";
ALTER TABLE "Admission" ALTER COLUMN "application" SET DEFAULT 'NO';
COMMIT;

-- AlterTable
ALTER TABLE "Admission" ALTER COLUMN "application" SET DEFAULT 'NO';
