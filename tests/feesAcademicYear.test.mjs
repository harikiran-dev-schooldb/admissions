import test from "node:test";
import assert from "node:assert/strict";
import { getFeeYearOptions, selectDefaultFeeYear } from "../lib/fees/selectFeeYear.ts";

const years = [
  { academicYear: "2027-28", isActive: true },
  { academicYear: "2026-27", isActive: true },
  { academicYear: "2025-26", isActive: true },
  { academicYear: "2023-24", isActive: false },
];
const fees = [
  ...Array.from({ length: 13 }, () => ({ academicYear: "2023-24" })),
  ...Array.from({ length: 13 }, () => ({ academicYear: "2024-25" })),
  ...Array.from({ length: 13 }, () => ({ academicYear: "2025-26" })),
  ...Array.from({ length: 13 }, () => ({ academicYear: "2026-27" })),
];

test("fees dropdown contains only active configured academic years", () => {
  assert.deepEqual(getFeeYearOptions(years, fees), ["2027-28", "2026-27", "2025-26"]);
});

test("defaults to newest active academic year even if no fees are configured", () => {
  assert.equal(selectDefaultFeeYear(years, [], ""), "2027-28");
});

test("inactive and legacy fee-year selections revert to the latest active year", () => {
  for (const year of ["2024-25", "2023-24", "2040-41"]) {
    assert.equal(selectDefaultFeeYear(years, fees, year), "2027-28");
  }
  assert.equal(selectDefaultFeeYear(years, fees, "2025-26"), "2025-26");
});

test("when no active years exist, historical fee structures remain stored but are hidden", () => {
  assert.deepEqual(getFeeYearOptions([], fees), []);
  assert.equal(selectDefaultFeeYear([], fees, ""), "");
  assert.equal(selectDefaultFeeYear([{ academicYear: "2023-24", isActive: false }], fees, "2023-24"), "");
});

test("latest configured archived year never displaces an active year", () => {
  const archived = [...years, { academicYear: "2028-29", isActive: false }];
  assert.equal(selectDefaultFeeYear(archived, fees, ""), "2027-28");
  assert.equal(selectDefaultFeeYear(archived, fees, "2026-27"), "2026-27");
  assert.equal(selectDefaultFeeYear(archived, fees, "2028-29"), "2027-28");
});

test("legacy fee years do not add unconfigured options", () => {
  assert.equal(selectDefaultFeeYear(years, [...fees, { academicYear: "2030-31" }], ""), "2027-28");
  assert.equal(selectDefaultFeeYear(years, [...fees, { academicYear: "2030-31" }], "2030-31"), "2027-28");
});
