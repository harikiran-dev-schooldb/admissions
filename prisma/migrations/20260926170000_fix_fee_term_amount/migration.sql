-- The existing database column "term" stores the term fee amount.
-- Prisma exposes it as termFee via @map("term"), so no physical rename is required.

CREATE UNIQUE INDEX IF NOT EXISTS "FeeRecord_academicYear_className_key"
ON "FeeRecord"("academicYear", "className");
