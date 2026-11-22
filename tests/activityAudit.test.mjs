import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const src = (path) => readFileSync(path, "utf8");

const auditedRoutes = {
  "app/api/admissions/route.ts": ["POST"],
  "app/api/admissions/[id]/route.ts": ["PATCH","DELETE"],
  "app/api/admissions/stages/route.ts": ["PATCH"],
  "app/api/follow-ups/route.ts": ["POST"],
  "app/api/follow-ups/[id]/route.ts": ["PATCH"],
  "app/api/fees/route.ts": ["POST"],
  "app/api/fees/[id]/route.ts": ["PUT","PATCH","DELETE"],
  "app/api/academic-years/route.ts": ["POST"],
  "app/api/academic-years/[id]/route.ts": ["PUT","PATCH","DELETE"],
  "app/api/settings/route.ts": ["PUT"],
  "app/api/users/route.ts": ["POST"],
  "app/api/users/[id]/route.ts": ["PATCH"],
};

test("each mutation endpoint uses authenticated actor and transactional audit writes", () => {
  for (const [path, verbs] of Object.entries(auditedRoutes)) {
    const source = src(path);
    assert.match(source, /requireAuditActor\(/, path);
    assert.match(source, /prisma\.\$transaction\(/, path);
    assert.match(source, /recordActivity\(tx, actor,/, path);
    for (const method of verbs) assert.match(source, new RegExp("export async function " + method + "\\("), path);
  }
});

test("staff workflow edits remain permitted but settings, fees and users require admin actor", () => {
  assert.match(src("app/api/admissions/stages/route.ts"), /requireAuditActor\("workflow"\)/);
  assert.match(src("app/api/admissions/route.ts"), /requireAuditActor\("enquiry"\)/);
  for (const p of ["app/api/fees/route.ts","app/api/fees/[id]/route.ts","app/api/settings/route.ts","app/api/users/route.ts","app/api/users/[id]/route.ts"]) {
    assert.match(src(p), /requireAuditActor\("admin"\)/, p);
  }
});

test("audit API read access and audit screen both require admin role", () => {
  const api=src("app/api/audit-logs/route.ts");
  const page=src("app/audit-logs/page.tsx");
  const nav=src("components/AppSidebar.tsx");
  const proxy=src("proxy.ts");
  assert.match(api, /requireAccess\("admin"\)/);
  assert.doesNotMatch(api, /export async function (PUT|POST|PATCH|DELETE)/);
  assert.match(api, /take: pagination\.pageSize/);
  assert.match(api, /getAuditPagination\(total, requestedPage, pageSize\)/);
  assert.match(api, /"Cache-Control": "private, no-store, max-age=0"/);
  assert.match(page, /role !== "admin"/);
  assert.match(nav, /Audit Logs"[^\n]+adminOnly: true/);
  assert.match(proxy, /"\/api\/audit-logs\/:path\*"/);
});

test("audit migration is append-only and backfills historical user access audits", () => {
  const sql=src("prisma/migrations/20261122190000_activity_log/migration.sql");
  assert.match(sql, /CREATE TABLE "ActivityLog"/);
  assert.match(sql, /CREATE TRIGGER "ActivityLog_immutable"/);
  assert.match(sql, /BEFORE UPDATE OR DELETE ON "ActivityLog"/);
  assert.match(sql, /FROM "WorkspaceMemberAudit"/);
});

test("audit details exclude contact and date-of-birth fields", () => {
  const source=src("lib/audit/activity.ts");
  assert.match(source, /auditableFields/);
  assert.doesNotMatch(source, /"dob"|"mobile"|"parent"|"password"|"token"/);
  assert.match(source, /actorEmail: actor\.email/);
  assert.match(source, /actorRole: actor\.role/);
});
