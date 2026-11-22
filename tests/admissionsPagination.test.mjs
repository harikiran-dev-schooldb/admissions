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

test("defaults to the biggest active cohort instead of a newer one-record year", () => {
  const years = [
    {academicYear:"2027-28",isActive:true,admissionsCount:1},
    {academicYear:"2026-27",isActive:true,admissionsCount:910},
    {academicYear:"2025-26",isActive:true,admissionsCount:0},
  ];
  assert.equal(selectDefaultAdmissionYear(years, ""), "2026-27");
  assert.equal(selectDefaultAdmissionYear(years, "2027-28"), "2027-28");
  assert.equal(selectDefaultAdmissionYear(years.map(y=>({...y, admissionsCount:0})), ""), "2027-28");
  assert.equal(selectDefaultAdmissionYear([], ""), "");
});

test("tie on enrolled cohort size prefers the more recent academic year", () => {
  const years = [
    {academicYear:"2025-26",isActive:true,admissionsCount:10},
    {academicYear:"2026-27",isActive:true,admissionsCount:10},
  ];
  assert.equal(selectDefaultAdmissionYear(years, ""), "2026-27");
});
test("explicitly selected newest year stays selected even with only one enquiry", () => {
  const years = [
    {academicYear:"2027-28",isActive:true,admissionsCount:1},
    {academicYear:"2026-27",isActive:true,admissionsCount:910},
  ];
  assert.equal(selectDefaultAdmissionYear(years, "2027-28"), "2027-28");
});

test("staff receives no year counts but server-recommended year still selects the 910-record cohort", () => {
  const years = [
    { academicYear: "2027-28", isActive: true, isSuggested: false },
    { academicYear: "2026-27", isActive: true, isSuggested: true },
    { academicYear: "2025-26", isActive: true, isSuggested: false },
  ];
  assert.equal(selectDefaultAdmissionYear(years, ""), "2026-27");
  assert.equal(selectDefaultAdmissionYear(years, "2027-28"), "2027-28");
});
