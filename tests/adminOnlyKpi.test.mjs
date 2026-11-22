import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { canAccess } from "../lib/auth/accessPolicy.ts";

const source = (path) => readFileSync(resolve(process.cwd(), path), "utf8");

test("staff cannot read KPI API but can still read directory and class filters", () => {
  assert.equal(canAccess("staff", "admin"), false);
  assert.equal(canAccess("staff", "read"), true);
  assert.equal(canAccess("staff", "enquiry"), true);
  assert.equal(canAccess("staff", "workflow"), true);
  assert.equal(canAccess("admin", "admin"), true);
  assert.match(source("app/api/admissions/stats/route.ts"), /requireAccess\("admin"\)/);
  assert.match(source("app/api/admissions/classes/route.ts"), /requireAccess\("read"\)/);
  assert.match(source("app/api/admissions/route.ts"), /requireAuditActor\("enquiry"\)/);
  assert.match(source("app/api/admissions/stages/route.ts"), /requireAuditActor\("workflow"\)/);
});

test("staff never requests admin KPI statistics from the admissions page", () => {
  const hook = source("hooks/useAdmissionsDirectory.ts");
  const page = source("app/admissions/page.tsx");
  assert.match(page, /useAdmissionsSummary\(activeFilters, canManage\)/);
  assert.match(hook, /if \(!academicYear \|\| !enabled\) return/);
  assert.match(page, /\{canManage && \(\s*<div className="space-y-2">/);
  assert.match(page, /<KPISection stats=\{summary\}/);
  assert.match(page, /\{canManage && <div className="grid grid-cols-2 gap-3 sm:min-w-80"/);
  assert.match(page, /yearTotal=\{canManage \? summary\.yearTotal : undefined\}/);
  assert.match(page, /useAdmissionClassOptions\(academicYear, role === "staff" \|\| role === "admin"\)/);
});

test("fees aggregate cards and annual-total widget are administrator only", () => {
  const page = source("app/fees/page.tsx");
  assert.match(page, /\{canManage && <FeesKPISection fees=\{yearFees\} \/>\}/);
  assert.match(page, /\{canManage && <div className="hero-stat/);
});

test("analytics dashboard is blocked server-side for staff and hidden from staff navigation", () => {
  const server = source("app/admissions/analytics/page.tsx");
  const sidebar = source("components/AppSidebar.tsx");
  assert.match(server, /await getAuthorizedRole\(\)/);
  assert.match(server, /role !== "admin"/);
  assert.match(server, /<AdmissionsAnalyticsPageClient \/>/);
  assert.match(sidebar, /label: "Analytics"[^\n]*adminOnly: true/);
});

test("staff academic-year API payload does not include admissionsCount", () => {
  const api = source("app/api/academic-years/route.ts");
  assert.match(api, /role === "admin"/);
  assert.match(api, /\{ admissionsCount: _count\.admissions \}/);
  assert.match(api, /\{ isSuggested: year\.academicYear === populated\?\.academicYear \}/);
});


test("staff navigation exposes only Admissions and Fee Structure on desktop and mobile", () => {
  const sidebar = source("components/AppSidebar.tsx");
  const accountMenu = source("components/AccountMenu.tsx");
  assert.match(sidebar, /label: "Admissions"[^\n]*group: "Workspace" \}/);
  assert.match(sidebar, /label: "Fee Structure"[^\n]*group: "Workspace" \}/);
  for (const label of ["Analytics", "Academic Years", "Settings", "Users & Roles", "Audit Logs"]) {
    assert.match(sidebar, new RegExp(`label: "${label}"[^\\n]*adminOnly: true`));
  }
  assert.match(sidebar, /const visibleNav = nav\.filter\(\(item\) => !item\.adminOnly \|\| role === "admin"\)/);
  assert.match(sidebar, /visibleGroups\.map\(\(group\)/);
  assert.match(sidebar, /mobilePrimary\.length === 2 \? "grid-cols-2"/);
  assert.match(accountMenu, /role === "admin" && \(\s*<Link href="\/settings"/);
  assert.match(source("app/api/fees/route.ts"), /requireAccess\("read"\)/);
  assert.match(source("app/api/fees/route.ts"), /requireAuditActor\("admin"\)/);
});
