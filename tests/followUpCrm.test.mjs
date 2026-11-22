import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = (path) => readFileSync(path, "utf8");

test("follow-up CRM schema retains legacy admissions and cascades tasks on deletion", () => {
  const schema = source("prisma/schema.prisma");
  const migration = source("prisma/migrations/20261122210000_admission_follow_ups/migration.sql");
  assert.match(schema, /model AdmissionFollowUp/);
  assert.match(schema, /followUps\s+AdmissionFollowUp\[\]/);
  assert.match(schema, /assignedToEmail\s+String/);
  assert.match(schema, /dueAt\s+DateTime/);
  assert.match(schema, /onDelete: Cascade/);
  assert.match(schema, /enum FollowUpOutcome/);
  assert.match(migration, /CREATE TABLE "AdmissionFollowUp"/);
  assert.match(migration, /FOREIGN KEY \("admissionId"\) REFERENCES "Admission"\("id"\)/);
  assert.doesNotMatch(migration, /DELETE FROM "Admission"|DROP TABLE "Admission"/);
});

test("follow-up creation is restricted to authenticated staff and active memberships", () => {
  const api = source("app/api/follow-ups/route.ts");
  const assignees = source("app/api/follow-ups/assignees/route.ts");
  assert.match(api, /requireAuditActor\("workflow"\)/);
  assert.match(api, /actor\.role !== "admin" && assignedToEmail !== actor\.email/);
  assert.match(api, /resolveAccessRole\(/);
  assert.match(api, /admission\.finalAdmission !== "PENDING"/);
  assert.match(api, /createdByEmail: actor\.email/);
  assert.match(assignees, /resolveAccessRole\(/);
});

test("staff can complete only their assigned open tasks and histories stay auditable", () => {
  const api = source("app/api/follow-ups/[id]/route.ts");
  assert.match(api, /requireAuditActor\("workflow"\)/);
  assert.match(api, /before\.assignedToEmail !== actor\.email/);
  assert.match(api, /before\.status !== "OPEN"/);
  assert.match(api, /status: "COMPLETED"/);
  assert.match(api, /updatedAt: before\.updatedAt/);
  const audit = source("lib/audit/activity.ts");
  assert.match(audit, /FOLLOW_UP: \["assignedToEmail","dueAt","status","outcome"\]/);
  assert.doesNotMatch(audit, /"completionNote"|"note"/);
});

test("follow-up request fields are validated and all queues use server-side pagination", () => {
  const validation = source("lib/validation/followUps.ts");
  const api = source("app/api/follow-ups/route.ts");
  assert.match(validation, /z\.union\(\[z\.cuid\(\), z\.uuid\(\)\]\)/);
  assert.match(validation, /Date\.parse\(dueAt\) > Date\.now\(\)/);
  assert.match(validation, /max\(2000\)/);
  assert.match(api, /skip: \(page - 1\) \* PAGE_SIZE/);
  assert.match(api, /take: PAGE_SIZE/);
  assert.match(api, /assignedToEmail: actor\.email/);
});

test("CRM is inside admissions and does not add forbidden staff sidebar tabs", () => {
  const page = source("app/admissions/page.tsx");
  const modal = source("components/admissions/AdmissionDetailModal.tsx");
  const queue = source("components/admissions/FollowUpQueue.tsx");
  const manager = source("components/admissions/AdmissionFollowUpManager.tsx");
  const sidebar = source("components/AppSidebar.tsx");
  assert.match(page, /<FollowUpQueue/);
  assert.match(modal, /<AdmissionFollowUpManager/);
  assert.match(queue, /Overdue/);
  assert.match(queue, /Today/);
  assert.match(queue, /Upcoming/);
  assert.match(queue, /Completed/);
  assert.match(manager, /\/api\/follow-ups\/assignees/);
  assert.doesNotMatch(sidebar, /label: "Follow-ups"/);
});
