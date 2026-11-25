import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { documentComplete, isSeatAvailable, conversionRate } from "../lib/admissions/casePolicy.ts";
import { parentMessage, whatsappContact } from "../lib/admissions/communication.ts";
const source=path=>readFileSync(path,"utf8");
test("document verification records status, not document images or numbers",()=>{
  assert.equal(documentComplete("RECEIVED"),false);assert.equal(documentComplete("VERIFIED"),true);assert.equal(documentComplete("NOT_REQUIRED"),true);
  const api=source("app/api/admissions/[id]/case/route.ts");assert.match(api,/requireAuditActor\("workflow"\)/);assert.match(api,/actor.role!=="admin"/);assert.match(api,/verifiedByEmail:data.status==="VERIFIED"\?actor.email:null/);assert.match(api,/recordActivity\(tx,actor/);
});
test("seat capacity is unknown unless configured and no availability is claimed when full",()=>{
  assert.equal(isSeatAvailable(undefined,0),false);assert.equal(isSeatAvailable(10,9),true);assert.equal(isSeatAvailable(10,10),false);assert.equal(conversionRate(3,1),33.3);assert.equal(conversionRate(0,0),0);
});
test("parent templates never imply admission or appointments that do not exist",()=>{
  const row={enquiryNo:"ENQ-1",admClass:"I",academicYear:"2027-28",finalAdmission:"PENDING"};
  assert.equal(parentMessage("CONFIRMATION",row,"School"),null);assert.equal(parentMessage("ENTRANCE",row,"School"),null);assert.match(parentMessage("ACKNOWLEDGEMENT",row,"School"),/ENQ-1/);assert.match(parentMessage("CONFIRMATION",{...row,finalAdmission:"ADMITTED"},"School"),/confirm/);assert.equal(whatsappContact("9876543210"),"919876543210");assert.equal(whatsappContact("123"),null);
});
test("archive is transactional and restores children before removing protected snapshot",()=>{
  const api=source("app/api/admissions/[id]/route.ts"),archive=source("lib/admissions/archive.ts"),recovery=source("app/api/admissions/recovery/route.ts");
  assert.match(api,/await archiveAdmission\(tx,id,actor\)/);
  assert.ok(archive.indexOf("admissionArchive.create")<archive.indexOf("admission.delete"));
  for(const name of ["admissionFollowUp.createMany","admissionDocument.createMany","admissionCase.create"])assert.ok(archive.indexOf(name)<archive.indexOf("admissionArchive.delete"));
  assert.match(recovery,/requireAuditActor\("admin"\)/);assert.match(recovery,/TransactionIsolationLevel.Serializable/);assert.match(archive,/assertUniqueEnquiry\(tx/);
});
test("V3 migrations are additive",()=>{
 const sql=source("prisma/migrations/20261125160000_admission_v3_workflow/migration.sql");assert.doesNotMatch(sql,/DROP TABLE|DELETE FROM|TRUNCATE TABLE/i);for(const table of ["AdmissionCase","AdmissionDocument","AdmissionArchive"])assert.ok(sql.includes('CREATE TABLE "'+table+'"'));
});
test("operations data and recovery metadata remain administrator-only",()=>{
  assert.match(source("app/api/admissions/operations/route.ts"),/requireAuditActor\("admin"\)/);
  assert.match(source("app/api/admissions/recovery/route.ts"),/select:\{id:true,enquiryNo:true,academicYear:true,archivedAt:true\}/);
});
