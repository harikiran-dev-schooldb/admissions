import test from "node:test";
import assert from "node:assert/strict";
import { validateStageTransition } from "../lib/admissionTransitionRules.ts";

const base = Object.freeze({
  application: "SUBMITTED",
  entrance: "PASS",
  interview: "SELECTED",
  admissionGiven: "GIVEN",
  finalAdmission: "PENDING",
});

test("valid complete admission can be admitted", () => {
  assert.equal(validateStageTransition(base, "finalAdmission", "ADMITTED"), null);
});

test("failed entrance prevents admission", () => {
  assert.match(validateStageTransition({ ...base, entrance: "FAIL" }, "finalAdmission", "ADMITTED"), /entrance/);
});

test("unsubmitted application prevents admission", () => {
  assert.match(validateStageTransition({ ...base, application: "YES" }, "finalAdmission", "ADMITTED"), /Application/);
});

test("not selected interview prevents admission", () => {
  assert.match(validateStageTransition({ ...base, interview: "REJECTED" }, "finalAdmission", "ADMITTED"), /interview/);
});

test("an entrance-exempt child may be admitted", () => {
  assert.equal(validateStageTransition({ ...base, entrance: "NOT_REQUIRED" }, "finalAdmission", "ADMITTED"), null);
});

test("entrance and interview prerequisites are checked", () => {
  assert.match(validateStageTransition({ ...base, application: "NO" }, "entrance", "PASS"), /application/);
  assert.match(validateStageTransition({ ...base, entrance: "NOT_STARTED" }, "interview", "SELECTED"), /entrance/);
});

test("admission cannot be granted before selection", () => {
  assert.match(validateStageTransition({ ...base, interview: "PENDING" }, "admissionGiven", "GIVEN"), /interview/);
});

test("reset actions remain possible", () => {
  assert.equal(validateStageTransition({ ...base, application: "NO" }, "entrance", "NOT_STARTED"), null);
  assert.equal(validateStageTransition({ ...base, entrance: "FAIL" }, "interview", "NOT_STARTED"), null);
});
