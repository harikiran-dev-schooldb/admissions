-- Keep existing workspace accounts and their role/audit history intact.
ALTER TABLE "WorkspaceMember" ADD COLUMN "name" TEXT;
