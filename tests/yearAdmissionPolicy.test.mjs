import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { eligibleForPolicy, policyKey, capacityKey, seatBalance } from "../lib/admissions/yearPolicy.ts";

test("year-specific keys prevent configuration mixing",()=>{
  assert.notEqual(policyKey("2026-27"),policyKey("2027-28"));
  assert.notEqual(capacityKey("2026-27"),capacityKey("2027-28"));
});
test("existing eligibility mapping is preserved without administrator-supplied limits",()=>{
  assert.equal(eligibleForPolicy({years:6,months:0},"I","II",{}),"I");
});
test("configured limits are inclusive, applied class can qualify, and over-age is rejected",()=>{
  const rules={I:{minMonths:72,maxMonths:76},II:{minMonths:77,maxMonths:89}};
  assert.equal(eligibleForPolicy({years:6,months:4},"I","I",rules),"I");
  assert.equal(eligibleForPolicy({years:6,months:5},"I","II",rules),"II");
  assert.equal(eligibleForPolicy({years:6,months:5},"I","I",{I:rules.I}),"NOT ELIGIBLE");
  assert.equal(eligibleForPolicy(null,"I","I",rules),"NOT ELIGIBLE");
});
test("seat balance distinguishes unknown capacity from full and over-capacity",()=>{
  assert.equal(seatBalance(undefined,10),null);
  assert.equal(seatBalance(10,10),0);
  assert.equal(seatBalance(10,12),-2);
});
test("configuration is admin writable, counts are admin-only and eligibility uses the same policy on server and client",()=>{
  const api=readFileSync("app/api/admissions/year-policy/route.ts","utf8");
  assert.match(api,/requireAuditActor\("admin"\)/);
  assert.match(api,/actor.role !== "admin"/);
  assert.match(api,/recordActivity\(tx/);
  for (const path of ["app/api/admissions/route.ts","app/api/admissions/[id]/route.ts","components/admissions/NewAdmissionModal.tsx"]) assert.match(readFileSync(path,"utf8"),/eligibleForPolicy\(/);
});
