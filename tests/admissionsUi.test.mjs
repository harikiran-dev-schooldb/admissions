import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

test("directory API counts and returns a bounded database page, filters before paginating", () => {
  const source = readFileSync(resolve(process.cwd(), "app/api/admissions/route.ts"), "utf8");
  assert.match(source, /searchParams\.has\("page"\)/);
  assert.match(source, /prisma\.admission\.count\(\{ where \}\)/);
  assert.match(source, /skip: pagination\.skip/);
  assert.match(source, /take: pageSize/);
  assert.match(source, /getAdmissionWhere\(searchParams\)/);
  const sharedFilter = readFileSync(resolve(process.cwd(), "lib/admissions/filterQuery.ts"), "utf8");
  assert.match(sharedFilter, /classFilter/);
  assert.match(sharedFilter, /const application =/);
});

test("KPI summaries use active directory filters but not page or page size", () => {
  const page = readFileSync(resolve(process.cwd(), "app/admissions/page.tsx"), "utf8");
  assert.match(page, /useAdmissionsDirectory\(/);
  assert.match(page, /useAdmissionsSummary\(activeFilters, canManage\)/);
  assert.match(page, /search: debouncedSearch/);
  assert.match(page, /classFilter,/);
  assert.match(page, /finalStatusFilter,/);
  assert.match(page, /applicationFilter,/);
  assert.match(page, /<KPISection stats=\{summary\}/);
});

test("analytics fetches complete year-scoped aggregates rather than full student rows", () => {
  const source = readFileSync(resolve(process.cwd(), "components/admissions/AdmissionsAnalyticsPageClient.tsx"), "utf8");
  assert.match(source, /useAdmissionAnalytics\(academicYear\)/);
  assert.match(source, /selectDefaultAdmissionYear/);
  assert.doesNotMatch(source, /useAdmissions\(academicYear\)/);
  assert.match(source, /summarizeAdmissionGroups\(groups, classFilter, finalStatusFilter\)/);
});

test("responsive directory provides size selector and accessible previous/next buttons", () => {
  const source = readFileSync(resolve(process.cwd(), "components/admissions/AdmissionsTable.tsx"), "utf8");
  assert.match(source, /ADMISSION_PAGE_SIZES/);
  assert.match(source, /ariaLabel="Admissions rows per page"/);
  assert.match(source, /aria-label="Previous admissions page"/);
  assert.match(source, /aria-label="Next admissions page"/);
  assert.match(source, /aria-current=\{number === page \? "page"/);
});

test("directory and API default to ten rows with shared pagination constants", () => {
  const ui = readFileSync(resolve(process.cwd(), "app/admissions/page.tsx"), "utf8");
  const hook = readFileSync(resolve(process.cwd(), "hooks/useAdmissionsDirectory.ts"), "utf8");
  const api = readFileSync(resolve(process.cwd(), "app/api/admissions/route.ts"), "utf8");
  assert.match(ui, /useState<AdmissionPageSize>\(DEFAULT_ADMISSION_PAGE_SIZE\)/);
  assert.match(hook, /pageSize: DEFAULT_ADMISSION_PAGE_SIZE/);
  assert.match(api, /parsePageSize\(searchParams\.get\("pageSize"\)\)/);
  assert.match(api, /skip: pagination\.skip/);
  assert.match(api, /take: pageSize/);
});

test("academic year dropdowns show years only, without admission or fee totals", () => {
  const admissions = readFileSync(resolve(process.cwd(), "app/admissions/page.tsx"), "utf8");
  const analytics = readFileSync(resolve(process.cwd(), "components/admissions/AdmissionsAnalyticsPageClient.tsx"), "utf8");
  const fees = readFileSync(resolve(process.cwd(), "app/fees/page.tsx"), "utf8");
  assert.doesNotMatch(admissions, /year\.academicYear\} \(\$\{year\.admissionsCount/);
  assert.doesNotMatch(analytics, /year\.academicYear\} \(\$\{year\.admissionsCount/);
  assert.doesNotMatch(fees, /feeYearsCount/);
  assert.match(admissions, /label: `\$\{year\.academicYear\}/);
  assert.match(analytics, /label: year\.academicYear/);
  assert.match(fees, /label: `\$\{year\}/);
});

test("academic year staff response suggests the latest configured year without showing KPI count values", () => {
  const source = readFileSync(resolve(process.cwd(), "app/api/academic-years/route.ts"), "utf8");
  assert.match(source, /role === "admin"/);
  assert.match(source, /\{ admissionsCount: _count\.admissions \}/);
  assert.match(source, /isSuggested: year\.academicYear === latestYear/);
});
