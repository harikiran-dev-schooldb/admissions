ALTER TABLE "AdmissionCase"
  ADD COLUMN "previousSchool" TEXT,
  ADD COLUMN "previousClass" TEXT,
  ADD COLUMN "correspondenceAddress" TEXT,
  ADD COLUMN "preferredLanguage" TEXT,
  ADD COLUMN "applicationSavedAt" TIMESTAMP(3);
