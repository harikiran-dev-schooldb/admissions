/*
  Warnings:

  - The values [CONFIRMED] on the enum `FinalAdmissionStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `admissionFormIssued` on the `Admission` table. All the data in the column will be lost.
  - You are about to drop the column `applicationIssued` on the `Admission` table. All the data in the column will be lost.
  - You are about to drop the column `applicationSubmitted` on the `Admission` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Admission` table. All the data in the column will be lost.
  - You are about to drop the column `eligible` on the `Admission` table. All the data in the column will be lost.
  - The `enquiryDate` column on the `Admission` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('NOT_STARTED', 'TAKEN', 'SUBMITTED');

-- CreateEnum
CREATE TYPE "AdmissionGivenStatus" AS ENUM ('NOT_GIVEN', 'GIVEN');

-- AlterEnum
ALTER TYPE "EntranceStatus" ADD VALUE 'NOT_REQUIRED';

-- AlterEnum
BEGIN;
CREATE TYPE "FinalAdmissionStatus_new" AS ENUM ('PENDING', 'ADMITTED', 'CANCELLED');
ALTER TABLE "public"."Admission" ALTER COLUMN "finalAdmission" DROP DEFAULT;
ALTER TABLE "Admission" ALTER COLUMN "finalAdmission" TYPE "FinalAdmissionStatus_new" USING ("finalAdmission"::text::"FinalAdmissionStatus_new");
ALTER TYPE "FinalAdmissionStatus" RENAME TO "FinalAdmissionStatus_old";
ALTER TYPE "FinalAdmissionStatus_new" RENAME TO "FinalAdmissionStatus";
DROP TYPE "public"."FinalAdmissionStatus_old";
ALTER TABLE "Admission" ALTER COLUMN "finalAdmission" SET DEFAULT 'PENDING';
COMMIT;

-- AlterTable
ALTER TABLE "Admission" DROP COLUMN "admissionFormIssued",
DROP COLUMN "applicationIssued",
DROP COLUMN "applicationSubmitted",
DROP COLUMN "createdAt",
DROP COLUMN "eligible",
ADD COLUMN     "admissionGiven" "AdmissionGivenStatus" NOT NULL DEFAULT 'NOT_GIVEN',
ADD COLUMN     "application" "ApplicationStatus" NOT NULL DEFAULT 'TAKEN',
ADD COLUMN     "eligibleClass" TEXT,
DROP COLUMN "enquiryDate",
ADD COLUMN     "enquiryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
