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

test("all 52 historical fees have a selectable academic year", () => {
  assert.deepEqual(getFeeYearOptions(years, fees), ["2027-28", "2026-27", "2025-26", "2024-25", "2023-24"]);
});

test("selects latest active year with fees, not empty future 2027-28", () => {
  assert.equal(selectDefaultFeeYear(years, fees, ""), "2026-27");
});

test("honors explicit selection even for archived 2024-25", () => {
  assert.equal(selectDefaultFeeYear(years, fees, "2024-25"), "2024-25");
});

test("when there are no fee records, selects newest active year", () => {
  assert.equal(selectDefaultFeeYear(years, [], ""), "2027-28");
});

test("when no active years exist, historical records remain viewable", () => {
  assert.equal(selectDefaultFeeYear([], fees, ""), "2026-27");
});

test("an unknown selected year falls back to a year with records", () => {
  assert.equal(selectDefaultFeeYear(years, fees, "2040-41"), "2026-27");
});
