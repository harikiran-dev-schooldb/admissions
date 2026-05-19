-- CreateEnum
CREATE TYPE "EntranceStatus" AS ENUM ('NOT_STARTED', 'PASS', 'FAIL');

-- CreateEnum
CREATE TYPE "InterviewStatus" AS ENUM ('NOT_STARTED', 'SELECTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "FinalAdmissionStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Admission" (
    "id" TEXT NOT NULL,
    "enquiryNo" TEXT NOT NULL,
    "student" TEXT NOT NULL,
    "parent" TEXT NOT NULL,
    "admClass" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "dob" TEXT NOT NULL,
    "age" TEXT,
    "eligible" TEXT,
    "eligibleStatus" TEXT,
    "enquiryDate" TEXT,
    "applicationIssued" BOOLEAN NOT NULL DEFAULT false,
    "applicationSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "entrance" "EntranceStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "interview" "InterviewStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "admissionFormIssued" BOOLEAN NOT NULL DEFAULT false,
    "finalAdmission" "FinalAdmissionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeRecord" (
    "id" TEXT NOT NULL,
    "enquiryNo" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "term" INTEGER NOT NULL,
    "annualFees" INTEGER NOT NULL,
    "age" TEXT,
    "className" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeeRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Eligibility" (
    "id" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "class" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Eligibility_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admission_enquiryNo_key" ON "Admission"("enquiryNo");

-- AddForeignKey
ALTER TABLE "FeeRecord" ADD CONSTRAINT "FeeRecord_enquiryNo_fkey" FOREIGN KEY ("enquiryNo") REFERENCES "Admission"("enquiryNo") ON DELETE CASCADE ON UPDATE CASCADE;
