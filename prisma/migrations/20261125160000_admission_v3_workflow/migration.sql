CREATE TABLE "AdmissionCase" (
  "admissionId" TEXT NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'UNSPECIFIED',
  "cancellationReason" TEXT,
  "waitlistedAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AdmissionCase_pkey" PRIMARY KEY ("admissionId"),
  CONSTRAINT "AdmissionCase_admissionId_fkey" FOREIGN KEY ("admissionId") REFERENCES "Admission"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "AdmissionCase_waitlistedAt_idx" ON "AdmissionCase"("waitlistedAt");
CREATE INDEX "AdmissionCase_source_idx" ON "AdmissionCase"("source");
CREATE TABLE "AdmissionDocument" (
  "admissionId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "verifiedAt" TIMESTAMP(3),
  "verifiedByEmail" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AdmissionDocument_pkey" PRIMARY KEY ("admissionId", "kind"),
  CONSTRAINT "AdmissionDocument_admissionId_fkey" FOREIGN KEY ("admissionId") REFERENCES "Admission"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "AdmissionArchive" (
  "id" TEXT NOT NULL,
  "enquiryNo" TEXT NOT NULL,
  "academicYear" TEXT NOT NULL,
  "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "archivedByEmail" TEXT NOT NULL,
  "snapshot" JSONB NOT NULL,
  CONSTRAINT "AdmissionArchive_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AdmissionArchive_enquiryNo_key" ON "AdmissionArchive"("enquiryNo");
CREATE INDEX "AdmissionArchive_archivedAt_idx" ON "AdmissionArchive"("archivedAt" DESC);
