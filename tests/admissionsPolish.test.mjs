import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { indiaTodayBounds } from "../lib/followUps/indiaDayBounds.ts";

const source = (path) => readFileSync(path, "utf8");

test("follow-up Today uses IST midnight even when the user is abroad", () => {
  const beforeMidnight = indiaTodayBounds(new Date("2026-11-23T18:29:59.000Z"));
  assert.equal(beforeMidnight.start.toISOString(), "2026-11-22T18:30:00.000Z");
  assert.equal(beforeMidnight.tomorrow.toISOString(), "2026-11-23T18:30:00.000Z");
  const afterMidnight = indiaTodayBounds(new Date("2026-11-23T18:30:00.000Z"));
  assert.equal(afterMidnight.start.toISOString(), "2026-11-23T18:30:00.000Z");
  assert.equal(afterMidnight.tomorrow.toISOString(), "2026-11-24T18:30:00.000Z");
});

test("follow-up results are isolated to year, role, tab, page and refresh", () => {
  const queue = source("components/admissions/FollowUpQueue.tsx");
  const admissions = source("app/admissions/page.tsx");
  assert.match(queue, /const requestKey = `\$\{academicYear\}\|\$\{role\}/);
  assert.match(queue, /result\.key === requestKey/);
  assert.match(queue, /controller\.abort\(\)/);
  assert.match(queue, /indiaTodayBounds\(\)/);
  assert.match(queue, /aria-label="Follow-up status filter"/);
  assert.match(queue, /onClick=\{reload\}/);
  assert.match(admissions, /<FollowUpQueue key=\{academicYear\}/);
});

test("mobile directory keeps search visible while advanced filters collapse", () => {
  const table = source("components/admissions/AdmissionsTable.tsx");
  assert.match(table, /type="search" aria-label="Search admissions"/);
  assert.match(table, /aria-controls="admission-advanced-filters"/);
  assert.match(table, /aria-expanded=\{showMobileFilters\}/);
  assert.match(table, /xl:grid xl:w-\[620px\]/);
  assert.match(table, /activeAdvancedFilters > 0/);
});

test("academic-year reload cancels an earlier request before applying results", () => {
  const hook = source("hooks/useAcademicYears.ts");
  assert.match(hook, /currentRequest\.current\?\.abort\(\)/);
  assert.match(hook, /if \(!controller\.signal\.aborted\) setAcademicYears\(data\)/);
  assert.match(hook, /return \(\) => currentRequest\.current\?\.abort\(\)/);
});
