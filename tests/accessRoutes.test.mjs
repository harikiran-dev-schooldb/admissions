import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const protectedRoutes = [
  "app/api/admissions/route.ts",
  "app/api/admissions/[id]/route.ts",
  "app/api/admissions/stages/route.ts",
  "app/api/admissions/stats/route.ts",
  "app/api/academic-years/route.ts",
  "app/api/academic-years/[id]/route.ts",
  "app/api/fees/route.ts",
  "app/api/fees/[id]/route.ts",
  "app/api/settings/route.ts",
];

test("all data API handlers check access before reading or writing", () => {
  for (const path of protectedRoutes) {
    const source = readFileSync(resolve(process.cwd(), path), "utf8");
    const methods = [...source.matchAll(/export async function (GET|POST|PUT|PATCH|DELETE)\([^\n]*\) \{\s*const accessError = await requireAccess\("(read|admin)"\)/g)];
    assert.ok(methods.length, `No access-guarded handlers found in ${path}`);
    for (const match of methods) {
      const [, method, level] = match;
      assert.equal(level, method === "GET" ? "read" : "admin", `Wrong access level for ${path} ${method}`);
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
