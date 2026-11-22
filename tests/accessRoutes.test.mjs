import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const protectedRoutes = [
  "app/api/admissions/route.ts",
  "app/api/admissions/[id]/route.ts",
  "app/api/admissions/stages/route.ts",
  "app/api/follow-ups/route.ts",
  "app/api/follow-ups/[id]/route.ts",
  "app/api/follow-ups/assignees/route.ts",
  "app/api/admissions/stats/route.ts",
  "app/api/admissions/classes/route.ts",
  "app/api/academic-years/route.ts",
  "app/api/academic-years/[id]/route.ts",
  "app/api/fees/route.ts",
  "app/api/fees/[id]/route.ts",
  "app/api/settings/route.ts",
];

const adminOnlyReads = new Set(["app/api/admissions/stats/route.ts"]);

const staffActions = {
  "app/api/admissions/route.ts": { POST: "enquiry" },
  "app/api/admissions/stages/route.ts": { PATCH: "workflow" },
  "app/api/follow-ups/route.ts": { POST: "workflow" },
  "app/api/follow-ups/[id]/route.ts": { PATCH: "workflow" },
};

test("all data API handlers check the required read, staff workflow, or admin permissions", () => {
  for (const path of protectedRoutes) {
    const source = readFileSync(resolve(process.cwd(), path), "utf8");
    const methods = [...source.matchAll(/export async function (GET|POST|PUT|PATCH|DELETE)\([^\n]*\) \{\s*const (?:accessError = await requireAccess|authz = await requireAuditActor|authorization = await requireAuditActor)\("(read|enquiry|workflow|admin)"\)/g)];
    assert.ok(methods.length, `No access-guarded handlers found in ${path}`);
    for (const match of methods) {
      const [, method, level] = match;
      const expected = method === "GET" ? (adminOnlyReads.has(path) ? "admin" : "read") : staffActions[path]?.[method] ?? "admin";
      assert.equal(level, expected, `Wrong access level for ${path} ${method}`);
    }

    const exports = [...source.matchAll(/export async function (GET|POST|PUT|PATCH|DELETE)\(/g)];
    assert.equal(methods.length, exports.length, `Unprotected handler in ${path}`);
  }
});

test("the role lookup API does not return email allowlists", () => {
  const source = readFileSync(resolve(process.cwd(), "app/api/access/route.ts"), "utf8");
  assert.match(source, /getAuthorizedRole\(\)/);
  assert.match(source, /Cache-Control/);
  assert.doesNotMatch(source, /process\.env/);
});

test("proxy requires login on the role endpoint", () => {
  const proxy = readFileSync(resolve(process.cwd(), "proxy.ts"), "utf8");
  assert.match(proxy, /"\/api\/access\/:path\*"/);
});


test("user access management endpoints are admin-only", () => {
  for (const path of ["app/api/users/route.ts", "app/api/users/[id]/route.ts", "app/api/users/audit/route.ts"]) {
    const source = readFileSync(resolve(process.cwd(), path), "utf8");
    assert.match(source, /requireAdminIdentity\(\)|requireAccess\("admin"\)|requireAuditActor\("admin"\)/, path);
    assert.doesNotMatch(source, /requireAccess\("read"\)/, path);
  }
});

test("user management routes require login at proxy", () => {
  const proxy = readFileSync(resolve(process.cwd(), "proxy.ts"), "utf8");
  assert.match(proxy, /"\/users\/:path\*"/);
  assert.match(proxy, /"\/api\/users\/:path\*"/);
});

test("access endpoint exposes session-derived name, email and role without exposing allowlists", () => {
  const endpoint = readFileSync(resolve(process.cwd(), "app/api/access/route.ts"), "utf8");
  const serverAuth = readFileSync(resolve(process.cwd(), "lib/auth/requireAccess.ts"), "utf8");
  const hook = readFileSync(resolve(process.cwd(), "hooks/useAccess.ts"), "utf8");
  assert.match(endpoint, /\{ role, email, name, canManage:/);
  assert.match(serverAuth, /data\.user\.name/);
  assert.match(hook, /setName\(/);
  assert.match(hook, /setEmail\(/);
  assert.doesNotMatch(endpoint, /process\.env/);
});

test("sidebar shows signed-in identity and role and provides a real sign-out action", () => {
  const sidebar = readFileSync(resolve(process.cwd(), "components/AppSidebar.tsx"), "utf8");
  assert.match(sidebar, /authClient\.signOut\(\)/);
  assert.match(sidebar, /router\.replace\("\/login"\)/);
  assert.match(sidebar, /roleLabel/);
  assert.match(sidebar, /displayName/);
  assert.match(sidebar, /aria-label="Logout"/);
  assert.match(sidebar, /"Signing out…" : "Logout"/);
});


test("follow-up API also requires the authenticated workspace proxy", () => {
  const proxy = readFileSync(resolve(process.cwd(), "proxy.ts"), "utf8");
  assert.ok(proxy.includes('"/api/follow-ups/:path*"'));
});
