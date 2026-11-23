import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const src = (path) => readFileSync(path, "utf8");

test("protected admins can set display names without changing authentication or role", () => {
  const route = src("app/api/users/bootstrap-names/route.ts");
  assert.match(route, /requireAuditActor\("admin"\)/);
  assert.match(route, /isBootstrapAdmin\(email, process\.env\.ADMISSIONS_ADMIN_EMAILS\)/);
  assert.match(route, /validMemberName\(parsed\.data\.name\)/);
  assert.match(route, /prisma\.\$transaction\(/);
  assert.match(route, /workspaceMember\.create\(/);
  assert.match(route, /workspaceMember\.update\(/);
  assert.match(route, /recordActivity\(tx, actor,/);
  assert.match(route, /action: "NAME_CHANGED"/);
  assert.match(route, /data: \{ name, updatedBy: actor\.email \}/);
  assert.doesNotMatch(route, /auth\.signUp|auth\.updateUser|password/i);
});

test("protected names can be edited from Users & Roles, including accounts absent from members table", () => {
  const page = src("app/users/page.tsx");
  const users = src("app/api/users/route.ts");
  assert.match(page, /bootstrapAdminProfiles\.map/);
  assert.match(page, /Add display name/);
  assert.match(page, /Edit display name/);
  assert.match(page, /saveProtectedName\(profile\.email\)/);
  assert.match(page, /fetch\("\/api\/users\/bootstrap-names"/);
  assert.match(page, /void refreshAccess\(\)/);
  assert.match(users, /bootstrapEmails = \[\.\.\.emailSet\(process\.env\.ADMISSIONS_ADMIN_EMAILS\)\]/);
  assert.match(users, /bootstrapAdminProfiles = bootstrapEmails\.map/);
  assert.match(users, /bootstrapAdminProfiles,/);
});

test("authenticated protected admin name resolves safely even during database outage", () => {
  const auth = src("lib/auth/requireAccess.ts");
  assert.match(auth, /if \(bootstrapRole === "admin"\)/);
  assert.match(auth, /const profile = await prisma\.workspaceMember\.findUnique/);
  assert.match(auth, /savedName \|\| name/);
  assert.match(auth, /catch \{ \/\* Do not make bootstrap access depend on the database/);
});

test("names appear in saved parent follow-ups and assignment dropdown without changing email keys", () => {
  const assignees = src("app/api/follow-ups/assignees/route.ts");
  const followups = src("app/api/follow-ups/route.ts");
  const modal = src("components/admissions/AdmissionFollowUpManager.tsx");
  const schedule = src("components/admissions/AdmissionSchedulePanel.tsx");
  assert.match(assignees, /membershipByEmail\.get\(email\)\?\.name/);
  assert.match(followups, /assignedToName: displayMemberName/);
  assert.match(modal, /\{person\.name\}/);
  assert.match(modal, /\{item\.assignedToName \|\| item\.assignedToEmail\.split/);
  assert.match(schedule, /\{person\.name\}/);
  assert.match(src("proxy.ts"), /"\/api\/users\/:path\*"/);
});
