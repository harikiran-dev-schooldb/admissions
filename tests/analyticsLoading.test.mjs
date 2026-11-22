import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { analyticsClassOptions, summarizeAdmissionGroups } from "../lib/admissions/analyticsSummary.ts";

const groups = [
  { admClass: "Class 10", application: "NO", entrance: "NOT_STARTED", interview: "NOT_STARTED", finalAdmission: "PENDING", _count: { _all: 10 } },
  { admClass: "Class 10", application: "SUBMITTED", entrance: "PASS", interview: "SELECTED", finalAdmission: "ADMITTED", _count: { _all: 3 } },
  { admClass: "Class 2", application: "YES", entrance: "PASS", interview: "SELECTED", finalAdmission: "ADMITTED", _count: { _all: 2 } },
  { admClass: "Class 2", application: "YES", entrance: "FAIL", interview: "REJECTED", finalAdmission: "CANCELLED", _count: { _all: 1 } },
];

const source = (path) => readFileSync(path, "utf8");

test("grouped analytics yields the same year totals and admission funnel as student-level counting", () => {
  const summary = summarizeAdmissionGroups(groups);
  assert.equal(summary.total, 16);
  assert.equal(summary.admitted, 5);
  assert.equal(summary.conversionRate, 31.3);
  assert.deepEqual(summary.funnelData.map(({ value }) => value), [16, 6, 5, 5, 5]);
  assert.deepEqual(summary.classData, [
    { name: "Class 2", value: 3 },
    { name: "Class 10", value: 13 },
  ]);
  assert.deepEqual(analyticsClassOptions(groups), ["Class 2", "Class 10"]);
});

test("class and final-status filters update counts without another API request", () => {
  const classSummary = summarizeAdmissionGroups(groups, "Class 2");
  assert.equal(classSummary.total, 3);
  assert.equal(classSummary.admitted, 2);
  assert.equal(classSummary.conversionRate, 66.7);
  assert.deepEqual(classSummary.classData, [{ name: "Class 2", value: 3 }]);

  const statusSummary = summarizeAdmissionGroups(groups, "ALL", "ADMITTED");
  assert.equal(statusSummary.total, 5);
  assert.equal(statusSummary.admitted, 5);
  assert.equal(statusSummary.conversionRate, 100);
  assert.deepEqual(statusSummary.funnelData.map(({ value }) => value), [5, 5, 5, 5, 5]);

  assert.equal(summarizeAdmissionGroups(groups, "Class 10", "CANCELLED").total, 0);
});

test("empty selected academic year shows no phantom data and zero conversion", () => {
  const empty = summarizeAdmissionGroups([]);
  assert.equal(empty.total, 0);
  assert.equal(empty.admitted, 0);
  assert.equal(empty.conversionRate, 0);
  assert.deepEqual(empty.classData, []);
  assert.deepEqual(empty.funnelData.map(({ value }) => value), [0, 0, 0, 0, 0]);
  assert.deepEqual(analyticsClassOptions([]), []);
});

test("analytics endpoint is year-scoped, admin-only and transfers only aggregated columns", () => {
  const api = source("app/api/admissions/analytics/route.ts");
  const hook = source("hooks/useAdmissionAnalytics.ts");
  assert.match(api, /requireAccess\("admin"\)/);
  assert.match(api, /prisma\.admission\.groupBy\(\{/);
  assert.match(api, /where: \{ academicYear \}/);
  assert.match(api, /_count: \{ _all: true \}/);
  assert.match(api, /"Cache-Control": "private, no-store, max-age=0"/);
  assert.doesNotMatch(api, /prisma\.admission\.findMany/);
  assert.doesNotMatch(api, /student|parent|mobile|dob|enquiryNo/);
  assert.match(hook, /"\/api\/admissions\/analytics\?academicYear=" \+ encodeURIComponent\(academicYear\)/);
  assert.match(hook, /new AbortController\(\)/);
  assert.match(hook, /result\.key === key/);
  assert.match(hook, /current \? result\.groups : \[\]/);
});

test("page renders KPI cards without waiting for heavy charts, and supports retry", () => {
  const page = source("components/admissions/AdmissionsAnalyticsPageClient.tsx");
  const skeleton = source("components/admissions/AnalyticsLoadingSkeleton.tsx");
  assert.match(page, /<AnalyticsMetricCards summary=\{summary\} \/>/);
  assert.match(page, /dynamic\(/);
  assert.match(page, /loading: \(\) => <AnalyticsLoadingSkeleton chartOnly \/>/);
  assert.match(page, /!failure && loading && <AnalyticsLoadingSkeleton \/>/);
  assert.match(page, /No enquiries for \{academicYear\}/);
  assert.match(page, /Clear filters/);
  assert.match(page, /Try again/);
  assert.match(skeleton, /animate-pulse/);
});
