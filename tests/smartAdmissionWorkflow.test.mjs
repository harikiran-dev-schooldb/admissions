import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("workflow guidance uses existing verified stage engine without writing state", () => {
  const source = readFileSync("lib/admissions/nextAction.ts", "utf8");
  assert.match(source, /getAdmissionStageView\(admission\)/);
  assert.match(source, /view\.kind === "admitted"/);
  assert.match(source, /view\.kind === "cancelled"/);
  assert.match(source, /case 0:/);
  assert.match(source, /case 1:/);
  assert.match(source, /case 2:/);
  assert.match(source, /case 3:/);
  assert.doesNotMatch(source, /fetch\(|prisma\.|updateStage\(/);
});

test("stage and profile views show recommended next action and existing assignment workflow", () => {
  const stage = readFileSync("components/admissions/AdmissionStages.tsx", "utf8");
  const detail = readFileSync("components/admissions/AdmissionDetailModal.tsx", "utf8");
  assert.match(stage, /getNextAdmissionAction\(student\)/);
  assert.match(stage, /Recommended next action/);
  assert.match(detail, /getNextAdmissionAction\(student\)/);
  assert.match(detail, /AdmissionFollowUpManager/);
  assert.match(detail, /Assign an owner and due date/);
});
