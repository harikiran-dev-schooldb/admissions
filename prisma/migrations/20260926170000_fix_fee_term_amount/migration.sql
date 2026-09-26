DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'FeeRecord'
      AND column_name = 'term'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'FeeRecord'
      AND column_name = 'termFee'
  ) THEN
    ALTER TABLE "FeeRecord" RENAME COLUMN "term" TO "termFee";
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "FeeRecord_academicYear_className_key"
ON "FeeRecord"("academicYear", "className");
