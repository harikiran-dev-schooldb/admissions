import test from "node:test";
import assert from "node:assert/strict";
import { getAdmissionWhere, toAdmissionSearchParams } from "../lib/admissions/filterQuery.ts";

const filters = {
  academicYear: "2026-27",
  search: "  kiran  ",
  classFilter: "LKG",
  finalStatusFilter: "ADMITTED",
  applicationFilter: "SUBMITTED",
};

test("shared filters round-trip from dashboard and directory to identical Prisma where", () => {
  const params = toAdmissionSearchParams(filters);
  assert.equal(params.get("academicYear"), "2026-27");
  assert.equal(params.get("q"), "kiran");
  assert.equal(params.get("class"), "LKG");
  assert.equal(params.get("status"), "ADMITTED");
  assert.equal(params.get("application"), "SUBMITTED");
  const where = getAdmissionWhere(params);
  assert.equal(where.academicYear, "2026-27");
  assert.equal(where.admClass, "LKG");
  assert.equal(where.finalAdmission, "ADMITTED");
  assert.equal(where.application, "SUBMITTED");
  assert.equal(where.OR?.length, 5);
  assert.deepEqual(where.OR?.[0], { student: { contains: "kiran", mode: "insensitive" } });
});

test("no filters uses only academic year and explicit ALL does not constrain results", () => {
  const params = toAdmissionSearchParams({academicYear:"2026-27",search:"",classFilter:"ALL",finalStatusFilter:"ALL",applicationFilter:"ALL"});
  assert.deepEqual(getAdmissionWhere(params), { academicYear: "2026-27" });
});

test("invalid status filters are ignored, safely preserving previous behavior", () => {
  const params = new URLSearchParams({ academicYear: "2026-27", status: "BAD", application: "DROP" });
  assert.deepEqual(getAdmissionWhere(params), { academicYear: "2026-27" });
});

test("search is truncated before constructing database predicates", () => {
  const params = new URLSearchParams({ q: "a".repeat(180) });
  assert.equal(getAdmissionWhere(params).OR?.[0]?.student?.contains?.length, 120);
});

test("both stats and directory endpoints use the exact same filter parser", async () => {
  const { readFileSync } = await import("node:fs");
  const directory = readFileSync("app/api/admissions/route.ts", "utf8");
  const stats = readFileSync("app/api/admissions/stats/route.ts", "utf8");
  assert.match(directory, /getAdmissionWhere\(searchParams\)/);
  assert.match(stats, /getAdmissionWhere\(searchParams\)/);
  assert.match(stats, /yearTotal/);
  assert.match(stats, /requireAccess\("admin"\)/);
});

test("stage KPI queries intersect with the current filters instead of overwriting them", async () => {
  const { readFileSync } = await import("node:fs");
  const stats = readFileSync("app/api/admissions/stats/route.ts", "utf8");
  for (const name of ["finalAdmission", "application", "entrance", "interview"]) {
    assert.match(stats, new RegExp("AND: \\[where, \\{ " + name + ":"));
  }
  assert.doesNotMatch(stats, /\.\.\.where, finalAdmission:/);
  assert.doesNotMatch(stats, /\.\.\.where, application:/);
});
