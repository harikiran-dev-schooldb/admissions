import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = (path) => readFileSync(path, "utf8");

test("admission profile uses accessible, keyboard-navigable sections instead of a repeated long form", () => {
  const profile = source("components/admissions/AdmissionDetailModal.tsx");
  for (const id of ["overview", "journey", "appointments", "followups", "fees", "timeline"]) {
    assert.match(profile, new RegExp('id: "' + id + '"'), id);
    assert.match(profile, new RegExp('activeTab === "' + id + '"'), id);
  }
  assert.match(profile, /role="tablist" aria-label="Admission profile sections"/);
  assert.match(profile, /role="tab"/);
  assert.match(profile, /aria-selected=\{activeTab === id\}/);
  assert.match(profile, /aria-controls="admission-profile-panel"/);
  assert.match(profile, /tabIndex=\{activeTab === id \? 0 : -1\}/);
  assert.match(profile, /event\.key === "ArrowRight"/);
  assert.match(profile, /event\.key === "ArrowLeft"/);
  assert.match(profile, /event\.key === "Home"/);
  assert.match(profile, /event\.key === "End"/);
  assert.match(profile, /role="tabpanel"/);
  assert.match(profile, /ref=\{dialogRef\} role="dialog" aria-modal="true"/);
  assert.match(profile, /event\.key === "Escape"/);
  assert.match(profile, /document\.body\.style\.overflow = "hidden"/);
  assert.match(profile, /h-\[100dvh\]/);
  assert.match(profile, /safe-area-inset-bottom/);
});

test("all existing actions remain available under their new profile tabs", () => {
  const profile = source("components/admissions/AdmissionDetailModal.tsx");
  const page = source("app/admissions/page.tsx");
  for (const key of [
    "downloadAdmissionCsv(student)", "onClick={exportDetails}", "onClick={toggleFees}",
    "<AdmissionFeePreview", "<AdmissionFollowUpManager", "<AdmissionSchedulePanel",
    "copyEnquiryNo()", "getNextAdmissionAction(student)", "student.eligibleClass",
    "student.application", "student.entrance", "student.interview", "student.admissionGiven",
    'timeZone: "Asia/Kolkata"',
  ]) {
    assert.ok(profile.includes(key), key);
  }
  assert.equal((profile.match(/<AdmissionSchedulePanel\b/g) ?? []).length, 1);
  assert.equal((profile.match(/<AdmissionFollowUpManager\b/g) ?? []).length, 1);
  assert.match(page, /<AdmissionDetailModal key=\{selectedStudent\?\.id \?\? "no-selection"\}/);
});

test("responsive directory retains workflow updates and provides compact row expansion", () => {
  const directory = source("components/admissions/AdmissionsTable.tsx");
  assert.match(directory, /aria-busy=\{loading\}/);
  assert.match(directory, /aria-expanded=\{expanded\}/);
  assert.match(directory, /aria-controls=\{"admission-journey-" \+ student\.id\}/);
  assert.match(directory, /hidden=\{!expanded\}/);
  assert.equal((directory.match(/<AdmissionStages\b/g) ?? []).length, 1);
  assert.match(directory, /<AdmissionStages student=\{student\} reload=\{reload\} canManage=\{canManageAdmissions\}/);
  assert.match(directory, /canManageAdmissions \? "Update stage" : "View stages"/);
  assert.match(directory, /onClick=\{\(\) => onView\(student\)\}/);
  assert.match(directory, /aria-label="Search admissions"/);
  assert.match(directory, /aria-controls="admission-advanced-filters"/);
  assert.match(directory, /onClick=\{clearFilters\}/);
  assert.match(directory, /ariaLabel="Admissions rows per page"/);
  assert.match(directory, /aria-label="Previous admissions page"/);
  assert.match(directory, /aria-label="Next admissions page"/);
  assert.match(directory, /aria-current=\{number === page \? "page"/);
});
