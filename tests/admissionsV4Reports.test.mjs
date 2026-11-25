import test from "node:test";
import assert from "node:assert/strict";
import { indiaDate,reportPeriod,previousWeek } from "../lib/admissions/reportPeriod.ts";
import { readFileSync } from "node:fs";
const src=p=>readFileSync(p,"utf8");
test("inclusive report dates use IST boundaries, with range limits",()=>{
 const p=reportPeriod("2026-11-25","2026-11-25");assert.equal(p.start.toISOString(),"2026-11-24T18:30:00.000Z");assert.equal(p.end.toISOString(),"2026-11-25T18:30:00.000Z");assert.equal(p.days,1);assert.equal(reportPeriod("2026-02-30","2026-03-01"),null);assert.equal(reportPeriod("2025-01-01","2026-12-31"),null);assert.equal(indiaDate(new Date("2026-11-24T20:00:00Z")),"2026-11-25");
 const week=previousWeek(new Date("2026-11-25T12:00:00Z"));assert.equal(week.from,"2026-11-16");assert.equal(week.to,"2026-11-22");
});
test("report distinguishes live enquiry cohorts and audit decisions, only administrators can access targets",()=>{
 const report=src("lib/admissions/managementReport.ts"),api=src("app/api/admissions/reports/route.ts");
 assert.match(report,/enquiryDate:\{gte:start,lt:end\}/);assert.match(report,/STAGE_CHANGED/);assert.match(report,/cohortAdmitted/);assert.match(api,/requireAuditActor\("admin"\)/);assert.match(api,/recordActivity/);
});
test("digital application is additive and keeps personal draft details out of audit logs",()=>{
 const migration=src("prisma/migrations/20261125210000_application_details/migration.sql");
 assert.doesNotMatch(migration,/DROP|TRUNCATE|DELETE/);assert.match(migration,/ADD COLUMN "applicationSavedAt"/);
 const api=src("app/api/admissions/[id]/application-form/route.ts"),audit=src("lib/audit/activity.ts");
 assert.match(api,/requireAuditActor\("admin"\)/);assert.match(api,/TransactionIsolationLevel.Serializable/);assert.match(api,/applicationSavedAt:new Date/);assert.doesNotMatch(audit,/correspondenceAddress|previousSchool/);
 assert.doesNotMatch(api,/tx\.admission\.update/);
});
