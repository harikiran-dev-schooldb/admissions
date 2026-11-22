import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildStageUpdate,
  getAdmissionStageView,
  validateStageTransition,
} from "../lib/admissionTransitionRules.ts";

const base = {
  admClass: "III",
  application: "NO",
  entrance: "NOT_STARTED",
  interview: "NOT_STARTED",
  admissionGiven: "NOT_GIVEN",
  finalAdmission: "PENDING",
};

test("legacy admitted records show final decision even with pending interview or entrance", () => {
  const imported = {
    ...base,
    application: "SUBMITTED", entrance: "NOT_STARTED",
    interview: "PENDING", admissionGiven: "GIVEN", finalAdmission: "ADMITTED",
  };
  assert.deepEqual(getAdmissionStageView(imported), { kind: "admitted", index: 5 });
  assert.deepEqual(getAdmissionStageView({...imported, finalAdmission:"CANCELLED"}), { kind: "cancelled", index: 5 });
});

test("new admissions advance through all five explicit stages", () => {
  const stage = (overrides) => getAdmissionStageView({...base,...overrides});
  assert.equal(stage({}).index, 0);
  assert.equal(stage({application:"YES"}).index, 0);
  assert.equal(stage({application:"SUBMITTED"}).index, 1);
  assert.equal(stage({application:"SUBMITTED",entrance:"PASS"}).index, 2);
  assert.equal(stage({application:"SUBMITTED",entrance:"PASS",interview:"SELECTED"}).index, 3);
  assert.equal(stage({application:"SUBMITTED",entrance:"PASS",interview:"SELECTED",admissionGiven:"GIVEN"}).index, 4);
});

test("submitting an application sets the correct entrance requirement and resets later steps", () => {
  const update = buildStageUpdate(base,"application","SUBMITTED");
  assert.deepEqual(update, {
    application:"SUBMITTED", entrance:"PENDING", interview:"NOT_STARTED",
    admissionGiven:"NOT_GIVEN", finalAdmission:"PENDING",
  });
  for(const className of ["PRE KG","LKG"," lkg "]) {
    assert.equal(buildStageUpdate({...base,admClass:className},"application","SUBMITTED").entrance,"NOT_REQUIRED");
  }
});

test("submitting an application resets invalid legacy stage combinations", () => {
  const legacy = {...base,entrance:"PASS",interview:"SELECTED",admissionGiven:"GIVEN"};
  const update = buildStageUpdate(legacy,"application","SUBMITTED");
  assert.equal(update.interview,"NOT_STARTED");
  assert.equal(update.admissionGiven,"NOT_GIVEN");
  assert.equal(update.finalAdmission,"PENDING");
});

test("entrance result changes reset downstream milestones consistently", () => {
  for(const entrance of ["PASS","NOT_REQUIRED","PENDING","FAIL","NOT_STARTED"]) {
    const update = buildStageUpdate({...base,application:"SUBMITTED"},"entrance",entrance);
    assert.equal(update.interview,["PASS","NOT_REQUIRED"].includes(entrance) ? "PENDING" : "NOT_STARTED");
    assert.equal(update.admissionGiven,"NOT_GIVEN");
    assert.equal(update.finalAdmission,"PENDING");
  }
});

test("interview selection requires an explicit admission-given decision", () => {
  const selected = buildStageUpdate({...base,application:"SUBMITTED",entrance:"PASS"},"interview","SELECTED");
  assert.deepEqual(selected,{interview:"SELECTED",admissionGiven:"NOT_GIVEN",finalAdmission:"PENDING"});
  assert.deepEqual(buildStageUpdate(base,"interview","REJECTED"),{interview:"REJECTED",admissionGiven:"NOT_GIVEN",finalAdmission:"CANCELLED"});
  assert.equal(buildStageUpdate(base,"admissionGiven","NOT_GIVEN").finalAdmission,"PENDING");
});

test("final admission requires application, entrance, interview and admission given", () => {
  const applied = {...base,application:"SUBMITTED",entrance:"PASS",interview:"SELECTED",admissionGiven:"GIVEN"};
  assert.equal(validateStageTransition(applied,"finalAdmission","ADMITTED"),null);
  assert.match(validateStageTransition({...applied,admissionGiven:"NOT_GIVEN"},"finalAdmission","ADMITTED"),/GIVEN/);
  assert.match(validateStageTransition({...applied,interview:"PENDING"},"finalAdmission","ADMITTED"),/interview/);
  assert.match(validateStageTransition({...applied,entrance:"FAIL"},"finalAdmission","ADMITTED"),/entrance/);
  assert.match(validateStageTransition({...applied,application:"YES"},"finalAdmission","ADMITTED"),/Application/);
  assert.equal(validateStageTransition({...applied,entrance:"NOT_REQUIRED"},"finalAdmission","ADMITTED"),null);
  assert.deepEqual(buildStageUpdate(applied,"finalAdmission","ADMITTED"),{finalAdmission:"ADMITTED"});
});

test("terminal decisions require an explicit reopen before any other stage changes", () => {
  for(const status of ["ADMITTED","CANCELLED"]) {
    const record = {...base,finalAdmission:status};
    assert.match(validateStageTransition(record,"application","SUBMITTED"),/Reopen/);
    assert.match(validateStageTransition(record,"finalAdmission","CANCELLED"),/Reopen/);
    assert.equal(validateStageTransition(record,"finalAdmission","PENDING"),null);
    assert.deepEqual(buildStageUpdate(record,"finalAdmission","PENDING"),
      {finalAdmission:"PENDING",admissionGiven:"NOT_GIVEN"});
  }
});

test("staff retains workflow authorization and API validates latest record within audited transaction", () => {
  const route = readFileSync("app/api/admissions/stages/route.ts","utf8");
  assert.match(route,/requireAuditActor\("workflow"\)/);
  assert.match(route,/prisma\.\$transaction\(async \(tx\)/);
  assert.match(route,/validateStageTransition\(current, field, value\)/);
  assert.match(route,/where: \{ id, updatedAt: current\.updatedAt \}/);
  assert.match(route,/recordActivity\(tx, actor,/);
  assert.match(route,/error\.code === "P2025"/);
});

test("UI shows terminal state and reopen button for existing admissions", () => {
  const ui = readFileSync("components/admissions/AdmissionStages.tsx","utf8");
  assert.match(ui,/getAdmissionStageView\(student\)/);
  assert.match(ui,/Admission confirmed/);
  assert.match(ui,/Admission cancelled/);
  assert.match(ui,/updateStage\("finalAdmission", "PENDING"\)/);
  assert.match(ui,/toast\.error/);
  assert.doesNotMatch(ui,/\balert\(/);
});

test("legacy inconsistent interview or admission approval cannot bypass earlier milestones", () => {
  const invalid = {...base, application:"NO", entrance:"PASS", interview:"SELECTED"};
  assert.match(validateStageTransition(invalid,"interview","PENDING"),/application/);
  assert.match(validateStageTransition(invalid,"admissionGiven","GIVEN"),/application/);
  const missingEntrance = {...invalid,application:"SUBMITTED",entrance:"NOT_STARTED"};
  assert.match(validateStageTransition(missingEntrance,"interview","SELECTED"),/entrance/);
  assert.match(validateStageTransition(missingEntrance,"admissionGiven","GIVEN"),/entrance/);
});
