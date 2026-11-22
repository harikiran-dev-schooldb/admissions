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

test("stage view omits recommendation card while profile retains follow-up assignment", () => {
  const stage = readFileSync("components/admissions/AdmissionStages.tsx", "utf8");
  const detail = readFileSync("components/admissions/AdmissionDetailModal.tsx", "utf8");
  assert.doesNotMatch(stage, /Recommended next action/);
  assert.match(detail, /getNextAdmissionAction\(student\)/);
  assert.match(detail, /AdmissionFollowUpManager/);
  assert.match(detail, /Assign an owner and due date/);
});

test("automatic tasks are assigned, audited, deduplicated, and have deadlines", () => {
  const create = readFileSync("app/api/admissions/route.ts", "utf8");
  const stage = readFileSync("app/api/admissions/stages/route.ts", "utf8");
  const queue = readFileSync("components/admissions/FollowUpQueue.tsx", "utf8");
  assert.match(create, /tx\.admissionFollowUp\.create/);
  assert.match(create, /assignedToEmail: actor\.email/);
  assert.match(stage, /tx\.admissionFollowUp\.findFirst/);
  assert.match(stage, /tx\.admissionFollowUp\.findMany/);
  assert.match(stage, /task\.note\?\.startsWith/);
  assert.match(stage, /recordActivity\(tx, actor/);
  assert.match(stage, /48 \* 60 \* 60 \* 1000/);
  assert.match(queue, /useState<Tab>\("overdue"\)/);
  assert.match(queue, /overdue follow-up/);
});
