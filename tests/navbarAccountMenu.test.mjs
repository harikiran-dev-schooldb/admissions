import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const pages = [
  "app/admissions/page.tsx",
  "components/admissions/AdmissionsAnalyticsPageClient.tsx",
  "app/fees/page.tsx",
  "app/academic-years/page.tsx",
  "app/settings/page.tsx",
  "app/users/page.tsx",
];

test("each desktop navbar contains the shared account menu", () => {
  for (const page of pages) {
    const source = readFileSync(resolve(process.cwd(), page), "utf8");
    assert.match(source, /import AccountMenu from "@\/components\/AccountMenu"/, page);
    const header = source.split('<header className="premium-topbar')[1]?.split("</header>")[0] ?? "";
    assert.match(header, /<AccountMenu \/>/, page);
  }
});

test("mobile navbar exposes the same dropdown", () => {
  const source = readFileSync(resolve(process.cwd(), "components/AppSidebar.tsx"), "utf8");
  assert.match(source, /<AccountMenu compact \/>/);
});

test("dropdown shows server-derived name, role and email without hardcoded identity", () => {
  const source = readFileSync(resolve(process.cwd(), "components/AccountMenu.tsx"), "utf8");
  assert.match(source, /const \{ name, email, role, loading, error \} = useAccess\(\)/);
  assert.match(source, /Administrator/);
  assert.match(source, /Staff/);
  assert.match(source, /displayName/);
  assert.match(source, /\{email\}/);
  assert.doesNotMatch(source, /harikiran\.dev\.schooldb@gmail\.com/);
});

test("account dropdown opens accessibly and supports closing by outside click or Escape", () => {
  const source = readFileSync(resolve(process.cwd(), "components/AccountMenu.tsx"), "utf8");
  assert.match(source, /aria-expanded=\{isOpen\}/);
  assert.match(source, /pointerdown/);
  assert.match(source, /event\.key === "Escape"/);
});

test("logout revokes Neon Auth session before navigation", () => {
  const source = readFileSync(resolve(process.cwd(), "components/AccountMenu.tsx"), "utf8");
  assert.match(source, /await authClient\.signOut\(\)/);
  assert.match(source, /router\.replace\("\/login"\)/);
  assert.match(source, /role === "admin" &&/);
});
