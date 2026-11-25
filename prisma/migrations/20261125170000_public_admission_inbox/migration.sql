CREATE TABLE "PublicAdmissionEnquiry" (
  "id" TEXT NOT NULL,
  "academicYear" TEXT NOT NULL,
  "student" TEXT NOT NULL,
  "parent" TEXT NOT NULL,
  "mobile" TEXT NOT NULL,
  "dob" TEXT NOT NULL,
  "admClass" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "consentAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt" TIMESTAMP(3),
  "convertedAdmissionId" TEXT,
  CONSTRAINT "PublicAdmissionEnquiry_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PublicAdmissionEnquiry_status_createdAt_idx" ON "PublicAdmissionEnquiry"("status","createdAt");
CREATE INDEX "PublicAdmissionEnquiry_mobile_createdAt_idx" ON "PublicAdmissionEnquiry"("mobile","createdAt");
