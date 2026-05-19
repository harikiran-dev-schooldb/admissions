-- AlterEnum
ALTER TYPE "EntranceStatus" ADD VALUE 'PENDING';

-- AlterEnum
ALTER TYPE "InterviewStatus" ADD VALUE 'PENDING';

-- CreateTable
CREATE TABLE "EligibilityCheck" (
    "id" TEXT NOT NULL,
    "student" TEXT,
    "parent" TEXT,
    "mobile" TEXT,
    "dob" TEXT NOT NULL,
    "calculatedAge" TEXT NOT NULL,
    "eligibleClass" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "converted" BOOLEAN NOT NULL DEFAULT false,
    "admissionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EligibilityCheck_pkey" PRIMARY KEY ("id")
);
