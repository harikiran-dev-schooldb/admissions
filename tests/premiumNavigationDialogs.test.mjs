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
  assert.match(menu, /const \{ name, email, role, loading, error \} = useAccess\(\)/);
  assert.match(menu, /await authClient\.signOut\(\)/);
});
