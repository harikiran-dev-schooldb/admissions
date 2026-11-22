import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildAdmissionCsv } from "../services/export.service.ts";

const source = (path) => readFileSync(path, "utf8");

const admission = {
  id: "clx3kjm0k0000op58710tk4no",
  enquiryNo: "ENQ-2026-0915",
  academicYear: "2026-27",
  student: "A HARI KIRAN",
  parent: "PARENT",
  mobile: "9876543210",
  dob: "2018-08-05",
  age: "8 years",
  admClass: "CLASS 3",
  eligibleClass: "CLASS 3",
  eligibleStatus: "ELIGIBLE",
  application: "SUBMITTED",
  entrance: "PASS",
  interview: "SELECTED",
  admissionGiven: "GIVEN",
  finalAdmission: "ADMITTED",
  enquiryDate: "2026-11-22T10:00:00.000Z",
  updatedAt: "2026-11-22T11:00:00.000Z",
};

test("export produces a usable UTF-8 Excel CSV of the entire selected enquiry", () => {
  const csv = buildAdmissionCsv(admission);
  assert.ok(csv.startsWith("\uFEFF"));
  for (const field of ["Enquiry Number", "Academic Year", "Student Name", "Parent Name", "Mobile", "Date of Birth", "Application Stage", "Entrance Stage", "Interview Stage", "Admission Given", "Final Admission"]) {
    assert.ok(csv.includes('"' + field + '"'), field);
  }
  assert.match(csv, /ENQ-2026-0915/);
  assert.match(csv, /2026-11-22T10:00:00\.000Z/);
  assert.equal(csv.trim().split("\r\n").length, 18);
});

test("export quotes commas and double quotes, and prevents spreadsheet formulas", () => {
  const csv = buildAdmissionCsv({ ...admission, student: '=HYPERLINK("https://example.com","test")', parent: 'Parent, "Name"' });
  assert.ok(csv.includes('"\'=HYPERLINK(""https://example.com"",""test"")"'));
  assert.ok(csv.includes('"Parent, ""Name"""'));
});

test("admission profile implements both formerly empty quick actions", () => {
  const modal = source("components/admissions/AdmissionDetailModal.tsx");
  assert.match(modal, /downloadAdmissionCsv\(student\)/);
  assert.match(modal, /onClick=\{exportDetails\}/);
  assert.match(modal, /onClick=\{toggleFees\}/);
  assert.match(modal, /<AdmissionFeePreview/);
  assert.match(modal, /<AdmissionFollowUpManager/);
  assert.match(modal, /role="dialog" aria-modal="true"/);
  assert.match(modal, /event\.key === "Escape"/);
  assert.match(modal, /onClick=\{onClose\}/);
});

test("fee preview uses exact year and class, without confusing fees with payments", () => {
  const preview = source("components/admissions/AdmissionFeePreview.tsx");
  assert.match(preview, /fee\.academicYear === student\.academicYear && sameClass\(fee\.className, student\.admClass\)/);
  assert.match(preview, /fetch\("\/api\/fees\?academicYear=" \+ encodeURIComponent\(student\.academicYear\)/);
  assert.match(preview, /new URLSearchParams\(\{ year: student\.academicYear, class: student\.admClass \}\)/);
  assert.match(preview, /not the student.s payment history/);
  assert.match(preview, /No fee structure is configured/);
  assert.match(preview, /if \(!response\.ok\)/);
});

test("fee page deep-links back to the exact filtered class and year", () => {
  const fees = source("app/fees/page.tsx");
  assert.match(fees, /useSearchParams\(\)/);
  assert.match(fees, /params\.get\("year"\)/);
  assert.match(fees, /params\.get\("class"\)/);
  assert.match(fees, /linkedClass\?\.year \?\? selectDefaultFeeYear/);
  assert.match(fees, /fee\.className\.trim\(\)\.toLowerCase\(\) === effectiveClassFilter\.trim\(\)\.toLowerCase\(\)/);
  assert.match(fees, /Linked from an admission/);
  assert.match(fees, /Show all fees/);
});

test("fee UX has responsive cards and a keyboard accessible detail dialog", () => {
  const table = source("components/fees/FeesTable.tsx");
  const detail = source("components/fees/FeeDetailModal.tsx");
  const globals = source("app/globals.css");
  assert.match(table, /Mobile fee structure cards/);
  assert.match(table, /className="hidden overflow-x-auto md:block"/);
  assert.match(table, /canManage &&/);
  assert.match(detail, /role="dialog" aria-modal="true"/);
  assert.match(detail, /event\.key === "Escape"/);
  assert.match(globals, /textarea:focus-visible/);
});
