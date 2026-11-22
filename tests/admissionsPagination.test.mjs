import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_ADMISSION_PAGE_SIZE, parsePage, parsePageSize, getPagination } from "../lib/admissions/pagination.ts";
import { selectDefaultAdmissionYear } from "../lib/admissions/selectAdmissionYear.ts";

test("enquiry pagination supports 10, 25, 50 and 100 per page", () => {
  for (const size of [10, 25, 50, 100]) assert.equal(parsePageSize(String(size)), size);
  assert.equal(DEFAULT_ADMISSION_PAGE_SIZE, 10);
  assert.equal(parsePageSize("9999"), 10);
  assert.equal(parsePageSize(null), 10);
  assert.equal(parsePageSize(""), 10);
});

test("page input is validated and capped", () => {
  for (const input of [null, "", "0", "-3", "1.5", "page2", "NaN"]) assert.equal(parsePage(input), 1);
  assert.equal(parsePage("4"), 4);
  assert.equal(parsePage("999999999999999999"), 1);
});

test("910 records at default 10 per page yields 91 pages with correct boundaries", () => {
  assert.deepEqual(getPagination(910, 1, DEFAULT_ADMISSION_PAGE_SIZE), {page:1,pageSize:10,total:910,totalPages:91,start:1,end:10,skip:0});
  assert.deepEqual(getPagination(910, 91, DEFAULT_ADMISSION_PAGE_SIZE), {page:91,pageSize:10,total:910,totalPages:91,start:901,end:910,skip:900});
  assert.equal(getPagination(910, 99, DEFAULT_ADMISSION_PAGE_SIZE).page, 91);
});

test("optional 25-per-page selection remains supported", () => {
  assert.deepEqual(getPagination(910, 1, 25), {page:1,pageSize:25,total:910,totalPages:37,start:1,end:25,skip:0});
  assert.deepEqual(getPagination(910, 37, 25), {page:37,pageSize:25,total:910,totalPages:37,start:901,end:910,skip:900});
  assert.equal(getPagination(910, 99, 25).page, 37);
  assert.deepEqual(getPagination(0, 9, 25), {page:1,pageSize:25,total:0,totalPages:1,start:0,end:0,skip:0});
});

test("defaults to the latest academic year even if the older year has more admissions", () => {
  const years = [
    { academicYear: "2025-26", isActive: true, admissionsCount: 0 },
    { academicYear: "2027-28", isActive: true, admissionsCount: 1 },
    { academicYear: "2026-27", isActive: true, admissionsCount: 910 },
  ];
  assert.equal(selectDefaultAdmissionYear(years, ""), "2027-28");
  assert.equal(selectDefaultAdmissionYear(years, "2026-27"), "2026-27");
  assert.equal(selectDefaultAdmissionYear([], ""), "");
});

test("latest year wins despite old server recommendation and missing enrolments", () => {
  const years = [
    { academicYear: "2027-28", isActive: true, isSuggested: false },
    { academicYear: "2026-27", isActive: true, isSuggested: true },
  ];
  assert.equal(selectDefaultAdmissionYear(years, ""), "2027-28");
});

test("explicit archived selection remains viewable and invalid year falls back to newest", () => {
  const years = [
    { academicYear: "2028-29", isActive: false, admissionsCount: 0 },
    { academicYear: "2027-28", isActive: true, admissionsCount: 50 },
  ];
  assert.equal(selectDefaultAdmissionYear(years, ""), "2028-29");
  assert.equal(selectDefaultAdmissionYear(years, "2027-28"), "2027-28");
  assert.equal(selectDefaultAdmissionYear(years, "2040-41"), "2028-29");
});
