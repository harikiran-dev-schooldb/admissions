import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = (path) => readFileSync(path, "utf8");

test("Analytics has a route-specific loading boundary with its own dashboard skeleton", () => {
  const loading = source("app/admissions/analytics/loading.tsx");
  assert.match(loading, /function AnalyticsRouteLoading/);
  assert.match(loading, /<AppSidebar \/>/);
  assert.match(loading, /<AnalyticsLoadingSkeleton \/>/);
  assert.match(loading, />Analytics<\/h1>/);
  assert.match(loading, /aria-busy="true"/);
  assert.match(loading, /Preparing analytics/);
  assert.doesNotMatch(loading, /Loading admissions\.\.\./);
});

test("Admissions no longer blanks the whole UI with the generic route fallback", () => {
  const loading = source("app/admissions/loading.tsx");
  assert.match(loading, /<AppSidebar \/>/);
  assert.match(loading, /Admission pipeline/);
  assert.match(loading, /Preparing admissions for the selected academic year/);
  assert.match(loading, /animate-pulse/);
  assert.doesNotMatch(loading, /Loading admissions\.\.\./);
});

test("Analytics still checks the admin role on the server before showing confidential totals", () => {
  const page = source("app/admissions/analytics/page.tsx");
  assert.match(page, /await getAuthorizedRole\(\)/);
  assert.match(page, /role !== "admin"/);
  assert.match(page, /<AdmissionsAnalyticsPageClient \/>/);
});
