import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync("app/admissions/page.tsx", "utf8");

test("admission search waits one second after the latest keystroke", () => {
  assert.match(page, /window\.setTimeout\(\(\) => setDebouncedSearch\(search\.trim\(\)\), 1000\)/);
  assert.match(page, /return \(\) => window\.clearTimeout\(timeout\)/);
  assert.match(page, /\}, \[search\]\)/);
  assert.doesNotMatch(page, /setDebouncedSearch\(search\.trim\(\)\), 300\)/);
});

test("admission directory and admin KPI totals use the same settled search", () => {
  assert.match(page, /useAdmissionsDirectory\(\{[\s\S]*?search: debouncedSearch,/);
  assert.match(page, /const activeFilters = \{[\s\S]*?search: debouncedSearch,/);
  assert.match(page, /useAdmissionsSummary\(activeFilters, canManage\)/);
  assert.match(page, /function setSearchAndReset\(value: string\) \{\s*setSearch\(value\);\s*setPage\(1\);/);
  assert.match(page, /search=\{search\}/);
});
