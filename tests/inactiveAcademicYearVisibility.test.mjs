import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { selectDefaultAdmissionYear } from "../lib/admissions/selectAdmissionYear.ts";
import { getFeeYearOptions, selectDefaultFeeYear } from "../lib/fees/selectFeeYear.ts";

const source = (path) => readFileSync(path, "utf8");
const years = [
  { academicYear: "2028-29", isActive: false },
  { academicYear: "2027-28", isActive: true },
  { academicYear: "2026-27", isActive: true },
  { academicYear: "2025-26", isActive: false },
];

test("inactive years do not appear in Admissions, Analytics or Fees default selection", () => {
  assert.equal(selectDefaultAdmissionYear(years, ""), "2027-28");
  assert.equal(selectDefaultAdmissionYear(years, "2028-29"), "2027-28");
  assert.equal(selectDefaultFeeYear(years, [{ academicYear: "2025-26" }], "2025-26"), "2027-28");
  assert.deepEqual(getFeeYearOptions(years, [{ academicYear: "2025-26" }]), ["2027-28", "2026-27"]);
});

test("live academic-year dropdowns exclude inactive options without losing admin management", () => {
  const admissions = source("app/admissions/page.tsx");
  const analytics = source("components/admissions/AdmissionsAnalyticsPageClient.tsx");
  const fees = source("app/fees/page.tsx");
  const yearsPage = source("app/academic-years/page.tsx");
  assert.ok(admissions.includes("createdAcademicYears.filter((year) => year.isActive)"));
  assert.ok(admissions.includes("options={activeAcademicYears.map"));
  assert.ok(analytics.includes("createdAcademicYears.filter((year) => year.isActive)"));
  assert.ok(analytics.includes("options={activeAcademicYears.map"));
  assert.ok(fees.includes("getFeeYearOptions(managedAcademicYears, [])"));
  assert.ok(fees.includes("linkedClass && activeAcademicYears.includes(linkedClass.year)"));
  assert.ok(fees.includes("activeLinkedClass?.year ?? selectDefaultFeeYear"));
  assert.ok(!fees.includes("useFeeYears()"));
  assert.ok(yearsPage.includes('value: "INACTIVE"'));
});

test("fee API hides inactive-year records even for direct links, without deleting them", () => {
  const api = source("app/api/fees/route.ts");
  const detail = source("app/api/fees/[id]/route.ts");
  const modal = source("components/fees/NewFeeModal.tsx");
  assert.ok(api.includes('where: { isActive: true }'));
  assert.ok(api.includes('select: { isActive: true }'));
  assert.ok(api.includes('if (!matchingYear?.isActive)'));
  assert.ok(api.includes('data: [], total: 0'));
  assert.ok(api.includes('requireAccess("read")'));
  assert.ok(detail.includes('if (!academicYear?.isActive)'));
  assert.ok(modal.includes('[...new Set(academicYears)].filter(Boolean)'));
  assert.ok(!api.includes("deleteMany("));
});
