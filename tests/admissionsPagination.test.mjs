import test from "node:test";
import assert from "node:assert/strict";
import { parsePage, parsePageSize, getPagination } from "../lib/admissions/pagination.ts";
import { selectDefaultAdmissionYear } from "../lib/admissions/selectAdmissionYear.ts";

test("enquiry pagination supports 10, 25, 50 and 100 per page", () => {
  for (const size of [10, 25, 50, 100]) assert.equal(parsePageSize(String(size)), size);
  assert.equal(parsePageSize("9999"), 25);
});

test("page input is validated and capped", () => {
  for (const input of [null, "", "0", "-3", "1.5", "page2", "NaN"]) assert.equal(parsePage(input), 1);
  assert.equal(parsePage("4"), 4);
  assert.equal(parsePage("999999999999999"), 1);
});

test("910 records at 25 per page yields 37 pages with correct boundaries", () => {
  assert.deepEqual(getPagination(910, 1, 25), {page:1,pageSize:25,total:910,totalPages:37,start:1,end:25,skip:0});
  assert.deepEqual(getPagination(910, 37, 25), {page:37,pageSize:25,total:910,totalPages:37,start:901,end:910,skip:900});
  assert.equal(getPagination(910, 99, 25).page, 37);
  assert.deepEqual(getPagination(0, 9, 25), {page:1,pageSize:25,total:0,totalPages:1,start:0,end:0,skip:0});
});

test("defaults to populated 2026-27 instead of empty 2027-28", () => {
  const years = [
    {academicYear:"2027-28",isActive:true,admissionsCount:0},
    {academicYear:"2026-27",isActive:true,admissionsCount:910},
    {academicYear:"2025-26",isActive:true,admissionsCount:0},
  ];
  assert.equal(selectDefaultAdmissionYear(years, ""), "2026-27");
  assert.equal(selectDefaultAdmissionYear(years, "2027-28"), "2027-28");
  assert.equal(selectDefaultAdmissionYear(years.map(y=>({...y, admissionsCount:0})), ""), "2027-28");
  assert.equal(selectDefaultAdmissionYear([], ""), "");
});
