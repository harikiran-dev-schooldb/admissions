-- Workspace roles are managed in the Admissions app.
-- Environment-defined administrators remain protected bootstrap accounts.
CREATE TYPE "WorkspaceRole" AS ENUM ('ADMIN', 'STAFF');

CREATE TABLE "WorkspaceMember" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "WorkspaceRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WorkspaceMember_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "WorkspaceMember_email_key" ON "WorkspaceMember"("email");
CREATE INDEX "WorkspaceMember_role_isActive_idx" ON "WorkspaceMember"("role", "isActive");

CREATE TABLE "WorkspaceMemberAudit" (
    "id" TEXT NOT NULL,
    "memberEmail" TEXT NOT NULL,
    "actorEmail" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "beforeRole" "WorkspaceRole",
    "afterRole" "WorkspaceRole",
    "beforeActive" BOOLEAN,
    "afterActive" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkspaceMemberAudit_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "WorkspaceMemberAudit_createdAt_idx" ON "WorkspaceMemberAudit"("createdAt");
CREATE INDEX "WorkspaceMemberAudit_memberEmail_createdAt_idx" ON "WorkspaceMemberAudit"("memberEmail", "createdAt");
