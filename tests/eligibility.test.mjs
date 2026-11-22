import test from "node:test";
import assert from "node:assert/strict";
import { calculateAge, getEligibleClass } from "../lib/eligibility.ts";

test("age calculation uses the configured cutoff date", () => {
  assert.deepEqual(calculateAge("2020-06-01", "2026-06-01"), {
    years: 6, months: 0, text: "6 Years 0 Months",
  });
});

test("age calculation handles month boundary", () => {
  assert.deepEqual(calculateAge("2020-06-15", "2026-06-01"), {
    years: 5, months: 11, text: "5 Years 11 Months",
  });
});

test("future birth dates and invalid dates are not assigned an age", () => {
  assert.equal(calculateAge("2026-06-02", "2026-06-01"), null);
  assert.equal(calculateAge("2023-02-29", "2026-06-01"), null);
});

test("age-to-class mapping includes elementary and out-of-range ages", () => {
  assert.equal(getEligibleClass(3), "PRE KG");
  assert.equal(getEligibleClass(6), "I");
  assert.equal(getEligibleClass(15), "X");
  assert.equal(getEligibleClass(2), "NOT ELIGIBLE");
});
