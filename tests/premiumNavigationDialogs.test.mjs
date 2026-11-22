import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { admissionStageSchema, validationError } from "../lib/validation/admissions.ts";
import { getApiErrorMessage } from "../lib/ui/getApiErrorMessage.ts";

const source = (file) => readFileSync(file, "utf8");
const example = {field:"application",value:"YES"};

test("workflow accepts imported Neon UUID IDs and new Prisma CUID IDs", () => {
  const uuid = "7797f578-0c08-4c48-9697-8c265c011dbb";
  const cuid = "clx3kjm0k0000op58710tk4no";
  assert.equal(admissionStageSchema.safeParse({...example,id:uuid}).success,true);
  assert.equal(admissionStageSchema.safeParse({...example,id:cuid}).success,true);
});

test("invalid identifiers and stage values are still rejected", () => {
  assert.equal(admissionStageSchema.safeParse({...example,id:"bad/id?!"}).success,false);
  assert.equal(admissionStageSchema.safeParse({...example,id:"7797f578-0c08-4c48-9697-8c265c011dbb",value:"WRONG"}).success,false);
});

test("API validation issues are surfaced as specific UI messages", () => {
  const result = admissionStageSchema.safeParse({...example,id:"bad/id?!"});
  assert.equal(result.success,false);
  if (!result.success) {
    const text = getApiErrorMessage(validationError(result.error), "Failed to update");
    assert.ok(text.length > 10);
    assert.notEqual(text,"Validation failed");
  }
});

test("native browser alerts and confirm popups are replaced by app components", () => {
  const files=[
    "components/admissions/AdmissionStages.tsx",
    "components/admissions/NewAdmissionModal.tsx",
    "app/users/page.tsx",
    "app/fees/page.tsx",
    "app/academic-years/page.tsx",
  ];
  for(const file of files) assert.doesNotMatch(source(file), /\b(?:window\.)?(?:alert|confirm|prompt)\s*\(/,file);
  assert.match(source("app/layout.tsx"), /<AppToaster \/>/);
  assert.match(source("components/admissions/AdmissionStages.tsx"), /toast\.error/);
  assert.match(source("app/users/page.tsx"), /<ConfirmDialog/);
  assert.match(source("components/ui/ConfirmDialog.tsx"), /role="alertdialog"/);
});

test("premium navigation groups admin-only destinations and keeps mobile menus usable", () => {
  const side=source("components/AppSidebar.tsx");
  const menu=source("components/AccountMenu.tsx");
  assert.match(side, /group: "Administration"/);
  assert.match(side, /adminOnly: true/);
  assert.match(side, /mobilePrimary = visibleNav\.slice\(0, 4\)/);
  assert.match(side, /aria-label="More navigation"/);
  assert.match(side, /<AccountMenu compact \/>/);
  assert.match(menu, /const \{ name, email, role, loading, error, clearAccess, notifyAuthChange \} = useAccess\(\)/);
  assert.match(menu, /await authClient\.signOut\(\)/);
});

test("mobile notifications are viewport-bound and not duplicated in the admissions toolbar", () => {
  const bell = source("components/notifications/NotificationBell.tsx");
  const page = source("app/admissions/page.tsx");
  assert.match(bell, /fixed inset-x-3 top-\[calc\(4\.5rem\+10px\)\]/);
  assert.match(bell, /lg:absolute lg:inset-x-auto lg:right-0/);
  assert.match(bell, /popoverRef\.current\?\.contains/);
  assert.doesNotMatch(page, /<NotificationBell\s*\/>/);
  assert.match(page, /md:flex-row md:items-center md:justify-between/);
});

test("account menu stays compact and does not duplicate sidebar administration navigation", () => {
  const account = source("components/AccountMenu.tsx");
  const sidebar = source("components/AppSidebar.tsx");
  assert.match(account, /w-\\[min\\(272px,calc\\(100vw-24px\\)\\)\\]/);
  assert.match(account, /Signed in securely/);
  assert.match(account, /onClick=\\{\\(\\) => void signOut\\(\\)\\}/);
  assert.doesNotMatch(account, /href="\\/(?:settings|users|audit-logs)"/);
  assert.match(sidebar, /href: "\\/settings"/);
  assert.match(sidebar, /href: "\\/users"/);
  assert.match(sidebar, /href: "\\/audit-logs"/);
});

test("admissions hero prioritizes summary totals without exposing staff-only metrics", () => {
  const page = source("app/admissions/page.tsx");
  const metrics = source("components/admissions/KPISection.tsx");
  assert.match(page, /\\{canManage && <div className="grid min-w-0 grid-cols-2 gap-3"/);
  assert.match(page, /xl:grid-cols-\\[minmax\\(0,1fr\\)_minmax\\(0,360px\\)\\]/);
  assert.match(metrics, /xl:grid-cols-6/);
  assert.match(metrics, /aria-label="Admissions funnel"/);
  assert.match(metrics, /loading \\? "0%" :/);
});
