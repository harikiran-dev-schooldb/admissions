-- Append-only activity history for authenticated Admissions, Fees, Years, Settings and Users operations.
CREATE TABLE "ActivityLog" (
  "id" TEXT NOT NULL,
  "actorEmail" TEXT NOT NULL,
  "actorName" TEXT,
  "actorRole" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "entityLabel" TEXT NOT NULL,
  "changes" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ActivityLog_createdAt_id_idx" ON "ActivityLog"("createdAt" DESC, "id" DESC);
CREATE INDEX "ActivityLog_actorEmail_createdAt_idx" ON "ActivityLog"("actorEmail", "createdAt" DESC);
CREATE INDEX "ActivityLog_entityType_createdAt_idx" ON "ActivityLog"("entityType", "createdAt" DESC);

-- Historical User Management access log was already stored in its own table.
-- Copy existing entries so the new Activity Logs screen has that history too.
INSERT INTO "ActivityLog"
  ("id","actorEmail","actorName","actorRole","action","entityType","entityId","entityLabel","changes","createdAt")
SELECT
  'legacy-workspace-' || "id",
  "actorEmail", NULL, 'admin',
  "action", 'USER',
  "memberEmail", "memberEmail",
  jsonb_build_object(
    'role', jsonb_build_object('from', "beforeRole"::text, 'to', "afterRole"::text),
    'active', jsonb_build_object('from', "beforeActive", 'to', "afterActive")
  ),
  "createdAt"
FROM "WorkspaceMemberAudit";

CREATE FUNCTION forbid_activity_log_mutation() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'ActivityLog is append-only: existing entries cannot be updated or deleted';
END;
$$;
CREATE TRIGGER "ActivityLog_immutable"
BEFORE UPDATE OR DELETE ON "ActivityLog"
FOR EACH ROW EXECUTE FUNCTION forbid_activity_log_mutation();
