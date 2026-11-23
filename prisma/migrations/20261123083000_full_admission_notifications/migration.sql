-- Add real schedule dates only; no existing admission values are rewritten.
ALTER TABLE "Admission"
  ADD COLUMN "entranceScheduledAt" TIMESTAMP(3),
  ADD COLUMN "entranceAssignedEmail" TEXT,
  ADD COLUMN "interviewScheduledAt" TIMESTAMP(3),
  ADD COLUMN "interviewAssignedEmail" TEXT;

CREATE TABLE "NotificationEvent" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "eventKey" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "href" TEXT NOT NULL DEFAULT '/admissions',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "readAt" TIMESTAMP(3),
  "pushSentAt" TIMESTAMP(3),
  "pushClaimedAt" TIMESTAMP(3),
  CONSTRAINT "NotificationEvent_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "NotificationEvent_email_eventKey_key" ON "NotificationEvent"("email", "eventKey");
CREATE INDEX "NotificationEvent_email_createdAt_idx" ON "NotificationEvent"("email", "createdAt" DESC);
CREATE INDEX "NotificationEvent_pushSentAt_createdAt_idx" ON "NotificationEvent"("pushSentAt", "createdAt");

CREATE TABLE "NotificationPreference" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
  "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "NotificationPreference_email_type_key" ON "NotificationPreference"("email", "type");
