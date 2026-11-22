import test from "node:test";
import assert from "node:assert/strict";
import { formatAdmissionDob } from "../lib/admissions/formatAdmissionDob.ts";

test("imported DD-MM-YY and DD-MM-YYYY dates display consistently", () => {
  assert.equal(formatAdmissionDob("19-06-18"), "19 Jun 2018");
  assert.equal(formatAdmissionDob("19-06-2018"), "19 Jun 2018");
  assert.equal(formatAdmissionDob("2018-06-19"), "19 Jun 2018");
});
test("missing dates and invalid inputs are safe", () => {
  assert.equal(formatAdmissionDob(null), "—");
  assert.equal(formatAdmissionDob("31-02-2019"), "31-02-2019");
});
