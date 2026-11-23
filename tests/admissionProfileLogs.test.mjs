import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describeAdmissionLog, sanitizeAdmissionChanges } from "../lib/admissions/admissionActivity.ts";

const source = (path) => readFileSync(path, "utf8");

function item(field, from, to, action = "STAGE_CHANGED") {
  return { action, changes: [{ field, from, to }], historical: false };
}

test("student logs describe real admission milestones from saved stage transitions", () => {
  const cases = [
    ["application", "NO", "YES", "Application taken"],
    ["application", "YES", "SUBMITTED", "Application submitted"],
    ["entrance", "PENDING", "PASS", "Entrance passed"],
    ["entrance", "PENDING", "FAIL", "Entrance failed"],
    ["interview", "PENDING", "SELECTED", "Interview selected"],
    ["interview", "PENDING", "REJECTED", "Interview rejected"],
    ["admissionGiven", "NOT_GIVEN", "GIVEN", "Admission given"],
    ["finalAdmission", "PENDING", "ADMITTED", "Admission confirmed"],
    ["finalAdmission", "PENDING", "CANCELLED", "Admission cancelled"],
  ];
  for (const [field, from, to, expected] of cases) {
    const result = describeAdmissionLog(item(field, from, to));
    assert.equal(result.title, expected);
    assert.match(result.details.join(" "), / → /);
  }
});

test("creation events do not fabricate all default workflow statuses", () => {
  const result = describeAdmissionLog({
    action: "CREATED", historical: false,
    changes: [{ field: "application", from: null, to: "NO" }],
  });
  assert.equal(result.title, "Enquiry created");
  assert.equal(result.details.length, 1);
  assert.doesNotMatch(result.details[0], /Application taken|submitted/);
});

test("historical fallback never invents event times or actors", () => {
  const result = describeAdmissionLog({ action: "HISTORICAL_DATE", historical: true, changes: [] });
  assert.equal(result.title, "Enquiry date on record");
  assert.match(result.details.join(" "), /cannot be verified/);
});

test("multiple changes from one transaction remain together", () => {
  const result = describeAdmissionLog({
    action: "STAGE_CHANGED", historical: false,
    changes: [
      { field: "entrance", from: "PASS", to: "PENDING" },
      { field: "interview", from: "SELECTED", to: "NOT_STARTED" },
    ],
  });
  assert.equal(result.title, "Admission stages updated");
  assert.equal(result.details.length, 2);
});

test("returned audit changes have a strict safe whitelist and never contain personal details", () => {
  const fields = sanitizeAdmissionChanges({
    application: { from: "NO", to: "YES" },
    entranceScheduledAt: { from: null, to: "2026-11-25T10:00:00.000Z" },
    parent: { from: null, to: "Private parent" },
    mobile: { from: null, to: "9876543210" },
    dob: { from: null, to: "2019-01-01" },
    entranceAssignedEmail: { from: "hidden@school.com", to: "other@school.com" },
    token: { from: "secret", to: "new-secret" },
  });
  assert.deepEqual(fields.map((change) => change.field), ["application", "entranceScheduledAt"]);
  assert.doesNotMatch(JSON.stringify(fields), /9876543210|hidden@school.com|Private parent|secret/);
});

test("student log endpoint is exact-id filtered, read protected and independently paginated", () => {
  const api = source("app/api/admissions/[id]/logs/route.ts");
  const proxy = source("proxy.ts");
  const audit = source("app/api/audit-logs/route.ts");
  assert.match(api, /requireAccess\("read"\)/);
  assert.match(api, /prisma\.admission\.findUnique/);
  assert.match(api, /entityType: "ADMISSION", entityId: admission\.id/);
  assert.match(api, /prisma\.activityLog\.findMany/);
  assert.match(api, /take: PAGE_SIZE/);
  assert.match(api, /skip,/);
  assert.match(api, /action: "CREATED"/);
  assert.match(api, /sanitizeAdmissionChanges\(entry\.changes\)/);
  assert.match(api, /displayMemberName/);
  assert.match(api, /"Cache-Control": "private, no-store, max-age=0"/);
  assert.doesNotMatch(api, /export async function (POST|PUT|PATCH|DELETE)/);
  assert.match(proxy, /"\/api\/admissions\/:path\*"/);
  assert.match(audit, /requireAccess\("admin"\)/);
});

test("student profile has a lazy Logs tab without removing any existing tabs", () => {
  const profile = source("components/admissions/AdmissionDetailModal.tsx");
  const ui = source("components/admissions/AdmissionActivityLogs.tsx");
  for (const id of ["overview", "journey", "appointments", "followups", "fees", "timeline", "logs"]) {
    assert.match(profile, new RegExp('id: "' + id + '"'));
  }
  assert.match(profile, /activeTab === "logs"/);
  assert.match(profile, /<AdmissionActivityLogs key=\{student\.id\} admissionId=\{student\.id\}/);
  assert.match(ui, /\/api\/admissions\//);
  assert.match(ui, /new AbortController/);
  assert.match(ui, /role="status" aria-label="Loading student logs"/);
  assert.match(ui, /timeZone: "Asia\/Kolkata"/);
  assert.match(ui, /"Refresh admission logs"/);
});
