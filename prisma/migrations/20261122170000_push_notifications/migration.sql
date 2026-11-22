CREATE TABLE "PushSubscription" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "endpoint" TEXT NOT NULL,
  "p256dh" TEXT NOT NULL,
  "auth" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");
CREATE INDEX "PushSubscription_email_idx" ON "PushSubscription"("email");
CREATE TABLE "PushDelivery" (
  "id" TEXT NOT NULL,
  "subscriptionId" TEXT NOT NULL,
  "followUpId" TEXT NOT NULL,
  "reminderKind" TEXT NOT NULL,
  "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PushDelivery_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PushDelivery_subscriptionId_followUpId_reminderKind_key" ON "PushDelivery"("subscriptionId","followUpId","reminderKind");
CREATE INDEX "PushDelivery_sentAt_idx" ON "PushDelivery"("sentAt");
