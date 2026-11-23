import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { displayMemberName, validMemberName } from "../lib/users/displayMemberName.ts";

const src = (path) => readFileSync(path, "utf8");

test("saved staff name takes precedence over email and legacy accounts use username", () => {
  assert.equal(displayMemberName("staff@school.com", "  R. Suresh  "), "R. Suresh");
  assert.equal(displayMemberName("teacher.one@school.com", null), "teacher.one");
  assert.equal(displayMemberName("admin@school.com", ""), "admin");
  assert.equal(displayMemberName(null, null), "Unknown user");
  assert.equal(validMemberName("  Ravi   Kumar  "), "Ravi Kumar");
  assert.equal(validMemberName("a"), null);
  assert.equal(validMemberName(" "), null);
  assert.equal(validMemberName("r".repeat(121)), null);
});

test("existing accounts survive nullable name migration without changing login identifiers", () => {
  const schema = src("prisma/schema.prisma");
  const migration = src("prisma/migrations/20261123110000_workspace_member_names/migration.sql");
  assert.match(schema, /model WorkspaceMember \{/);
  assert.match(schema, /name\s+String\?/);
  assert.match(migration, /ALTER TABLE "WorkspaceMember" ADD COLUMN "name" TEXT/);
  assert.doesNotMatch(migration, /DELETE FROM|DROP TABLE|TRUNCATE TABLE/);
  assert.match(schema, /email\s+String\s+@unique/);
});

test("creating staff requires name and API saves it with the authorized email", () => {
  const api = src("app/api/users/route.ts");
  const page = src("app/users/page.tsx");
  assert.ok(api.includes('role === "STAFF" && !name'));
  assert.ok(api.includes('name: z.string().trim().min(2).max(120).optional()'));
  assert.ok(api.includes('name,\n          role: parsed.data.role'));
  assert.ok(api.includes('createSchema.safeParse'));
  assert.ok(page.includes('newRole === "STAFF" ? "Staff name"'));
  assert.ok(page.includes('required={newRole === "STAFF"}'));
  assert.ok(page.includes('name: newName.trim()'));
  assert.ok(page.includes('setNewName("")'));
});

test("admin can edit an existing staff name and the change is audited", () => {
  const api = src("app/api/users/[id]/route.ts");
  const page = src("app/users/page.tsx");
  const audit = src("lib/audit/activity.ts");
  assert.ok(api.includes('requireAuditActor("admin")'));
  assert.ok(api.includes('validMemberName(parsed.data.name)'));
  assert.ok(api.includes('updatedBy: actor.email'));
  assert.ok(api.includes('"NAME_CHANGED"'));
  assert.ok(api.includes('recordActivity(tx, actor'));
  assert.ok(audit.includes('USER: ["email","name","role","isActive"]'));
  assert.ok(page.includes('aria-label={`Edit name for ${member.email}`}'));
  assert.ok(page.includes('body: JSON.stringify({ name })'));
});

test("staff names appear in user activity, audit history and authenticated profile", () => {
  const usersApi = src("app/api/users/route.ts");
  const history = src("app/api/users/audit/route.ts");
  const audit = src("app/api/audit-logs/route.ts");
  const auditPage = src("components/audit/ActivityLogPageClient.tsx");
  const auth = src("lib/auth/requireAccess.ts");
  const usersPage = src("app/users/page.tsx");
  assert.ok(usersApi.includes('createdByName: user.createdBy ? displayMemberName'));
  assert.ok(usersApi.includes('updatedByName: user.updatedBy ? displayMemberName'));
  assert.ok(history.includes('actorName: displayMemberName'));
  assert.ok(history.includes('memberName: displayMemberName'));
  assert.ok(audit.includes('actorName: displayMemberName'));
  assert.ok(audit.includes('memberNames.get(entry.entityId)'));
  assert.ok(auditPage.includes('entry.actorName || entry.actorEmail.split("@")[0]'));
  assert.ok(auth.includes('select: { role: true, isActive: true, name: true }'));
  assert.ok(auth.includes('displayMemberName(email, member?.name || name)'));
  assert.ok(usersPage.includes('Created by {member.createdByName'));
  assert.ok(usersPage.includes('Updated by {member.updatedByName'));
  assert.ok(usersPage.includes('entry.actorName'));
});

test("staff identity in follow-ups and appointments is a human name, email remains the key", () => {
  const lookup = src("app/api/follow-ups/assignees/route.ts");
  const queue = src("components/admissions/FollowUpQueue.tsx");
  const manager = src("components/admissions/AdmissionFollowUpManager.tsx");
  const schedule = src("components/admissions/AdmissionSchedulePanel.tsx");
  const api = src("app/api/follow-ups/route.ts");
  assert.ok(lookup.includes('name: displayMemberName(email'));
  assert.ok(api.includes('createdByName: displayMemberName'));
  assert.ok(api.includes('assignedToName: displayMemberName'));
  assert.ok(queue.includes('item.assignedToName'));
  assert.ok(manager.includes('person.name'));
  assert.ok(schedule.includes('person.name'));
  assert.ok(lookup.includes('return role ? [{ email, role, name:'));
});
