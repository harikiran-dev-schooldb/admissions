import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = (path) => readFileSync(path, "utf8");

test("only the root provider owns access resolution, not each page or sidebar", () => {
  const layout = source("app/layout.tsx");
  const hook = source("hooks/useAccess.ts");
  const provider = source("components/auth/AccessProvider.tsx");
  const sidebar = source("components/AppSidebar.tsx");
  const menu = source("components/AccountMenu.tsx");
  assert.match(layout, /<AccessProvider>\{children\}/);
  assert.match(hook, /useSharedAccess\(\)/);
  assert.doesNotMatch(hook, /fetch\(|useEffect|useState/);
  assert.match(provider, /fetch\("\/api\/access", \{ cache: "no-store"/);
  assert.match(provider, /if \(requestRef\.current\) return requestRef\.current/);
  assert.match(provider, /\[isLoginPage, clearAccess, refreshAccess\]/);
  assert.doesNotMatch(sidebar, /fetch\("\/api\/access"/);
  assert.doesNotMatch(menu, /fetch\("\/api\/access"/);
});

test("login waits for authorization after OTP verification; both signout surfaces clear role", () => {
  const login = source("app/login/page.tsx");
  const sidebar = source("components/AppSidebar.tsx");
  const menu = source("components/AccountMenu.tsx");
  const p = login.indexOf("await refreshAccess()");
  const next = login.indexOf("router.replace(next");
  assert.ok(p > login.indexOf("await authClient.signIn.emailOtp"));
  assert.ok(next > p);
  assert.match(login, /notifyAuthChange\("login"\)/);
  for (const sourceFile of [sidebar, menu]) {
    assert.match(sourceFile, /await authClient\.signOut\(\)/);
    assert.match(sourceFile, /clearAccess\(\)/);
    assert.match(sourceFile, /notifyAuthChange\("logout"\)/);
  }
});

test("shared profile invalidates on logout, refresh failure and background account changes", () => {
  const provider = source("components/auth/AccessProvider.tsx");
  assert.match(provider, /generationRef\.current \+= 1/);
  assert.match(provider, /abortRef\.current\?\.abort\(\)/);
  assert.match(provider, /profileRef\.current = null/);
  assert.match(provider, /window\.addEventListener\("storage", handleStorage\)/);
  assert.match(provider, /REVALIDATE_MS = 5 \* 60 \* 1000/);
  assert.doesNotMatch(provider, /localStorage\.setItem\([^\n]*(?:role|name|email)/);
  assert.match(provider, /if \(isLoginPage\)/);
});

test("API authorization remains live, while the UI uses a cached session profile", () => {
  const access = source("lib/auth/requireAccess.ts");
  assert.match(access, /auth\.getSession\(\)/);
  assert.match(access, /prisma\.workspaceMember\.findUnique/);
  assert.match(access, /canAccess\(role, level\)/);
  assert.match(source("app/api/access/route.ts"), /private, no-store/);
});
