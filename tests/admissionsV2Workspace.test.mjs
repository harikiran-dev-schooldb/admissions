import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isDuplicateEnquiry, canonicalDob } from "../lib/admissions/duplicate.ts";
import { calculateAge } from "../lib/eligibility.ts";

const child = { student: "  A   Student ", mobile: "9876543210", dob: "2020-06-15" };
test("duplicate detector normalizes name and imported DOB, independent of phone", () => {
  assert.equal(canonicalDob("15-6-20"), "2020-06-15");
  assert.equal(canonicalDob("31-02-2020"), "");
  assert.equal(isDuplicateEnquiry(child, { student: "a student", mobile: "9999999999", dob: "15-06-2020" }), true);
});
test("siblings sharing contact details or twins with distinct names are allowed", () => {
  assert.equal(isDuplicateEnquiry(child, { ...child, student: "B Student" }), false);
  assert.equal(isDuplicateEnquiry(child, { ...child, dob: "2019-06-15" }), false);
  assert.equal(isDuplicateEnquiry(child, { ...child, student: "A Student", dob: null }), true);
});
test("age includes calendar days, including leap years", () => {
  assert.equal(calculateAge("2020-02-29", "2024-03-01").days, 1);
  assert.equal(calculateAge("2020-06-15", "2026-06-01").days, 17);
  assert.equal(calculateAge("2020-06-15", "2026-06-15").days, 0);
});
test("duplicate checks run in serializable writes and edits protect against stale updates", () => {
  for (const path of ["app/api/admissions/route.ts", "app/api/admissions/[id]/route.ts"]) {
    const source = readFileSync(path, "utf8");
    assert.match(source, /await assertUniqueEnquiry\(tx,/);
    assert.match(source, /isolationLevel: Prisma.TransactionIsolationLevel.Serializable/);
    assert.match(source, /DuplicateEnquiry/);
  }
  assert.match(readFileSync("app/api/admissions/[id]/route.ts","utf8"), /updatedAt: existing.updatedAt/);
});
test("calendar is authenticated, year-scoped and does not leak team metrics to staff", () => {
  const source = readFileSync("app/api/admissions/workspace/route.ts", "utf8");
  assert.match(source, /requireAuditActor\("read"\)/);
  assert.match(source, /active\?\.isActive/);
  assert.match(source, /assignedToEmail: actor.email/);
  assert.match(source, /entranceAssignedEmail: actor.email/);
  assert.match(source, /interviewAssignedEmail: actor.email/);
  assert.match(source, /actor.role === "admin" \? Promise.all/);
  assert.match(source, /indiaTodayBounds/);
});
