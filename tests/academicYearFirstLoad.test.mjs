import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = (path) => readFileSync(path, "utf8");

test("fee page resolves configured academic year before requesting or displaying records", () => {
  const page = source("app/fees/page.tsx");
  assert.match(page, /const yearReady = !yearsLoading/);
  assert.match(page, /const academicYear = !yearReady \? ""/);
  assert.match(page, /useFees\(academicYear\)/);
  assert.match(page, /getFeeYearOptions\(managedAcademicYears, \[\]\)/);
  assert.match(page, /loading = !yearReady \|\| feesLoading/);
  assert.match(page, /canManage && selectedYearIsActive && !loading && <FeesKPISection/);
});

test("fee API returns only selected year's records and supports metadata-only years", () => {
  const api = source("app/api/fees/route.ts");
  const hook = source("hooks/useFees.ts");
  assert.match(api, /searchParams\.get\("academicYear"\)/);
  assert.match(api, /!yearsOnly && \(!academicYear/);
  assert.match(api, /where: \{ academicYear \}/);
  assert.match(api, /prisma\.academicYear\.findMany\(\{/);
  assert.match(api, /where: \{ isActive: true \}/);
  assert.match(api, /if \(!matchingYear\?\.isActive\)/);
  assert.match(hook, /if \(!academicYear\) return/);
  assert.match(hook, /"\/api\/fees\?academicYear=" \+ encodeURIComponent\(academicYear\)/);
  assert.match(hook, /result\.key === key/);
  assert.match(hook, /current \? result\.data : \[\]/);
  assert.match(hook, /"\/api\/fees\?yearsOnly=true"/);
});

test("full admission API requires year and analytics aborts stale requests", () => {
  const api = source("app/api/admissions/route.ts");
  const hook = source("hooks/useAdmissions.ts");
  const analytics = source("components/admissions/AdmissionsAnalyticsPageClient.tsx");
  assert.match(api, /if \(!academicYear \|\| !/);
  assert.match(hook, /if \(!academicYear\) return/);
  assert.match(hook, /new AbortController\(\)/);
  assert.match(hook, /result\.key === key/);
  assert.match(hook, /current \? result\.students : \[\]/);
  assert.match(analytics, /const academicYear = yearsLoading \? "" : selectDefaultAdmissionYear/);
  assert.match(analytics, /const loading = yearsLoading \|\| analyticsLoading/);
  assert.match(analytics, /!failure && loading && <AnalyticsLoadingSkeleton/);
});

test("admission and fee KPIs do not flash as zero before academic-year selection", () => {
  const admissions = source("app/admissions/page.tsx");
  const fees = source("app/fees/page.tsx");
  assert.match(admissions, /summaryLoading \|\| yearsLoading/);
  assert.match(fees, /\{loading \? "…" :/);
  assert.match(fees, /academicYear && !loading && <p/);
});
