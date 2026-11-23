import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = (path) => readFileSync(path, "utf8");

test("the admission profile mounts exactly one exam/interview form", () => {
  const profile = source("components/admissions/AdmissionDetailModal.tsx");
  const page = source("app/admissions/page.tsx");
  assert.equal((profile.match(/<AdmissionSchedulePanel\b/g) ?? []).length, 1);
  assert.equal((page.match(/<AdmissionDetailModal\b/g) ?? []).length, 1);
});

test("mobile bottom navigation is portaled outside scrolling page containers", () => {
  const sidebar = source("components/AppSidebar.tsx");
  assert.match(sidebar, /import \{ createPortal \} from "react-dom"/);
  assert.match(sidebar, /useSyncExternalStore\(subscribeToClient, getClientSnapshot, getServerSnapshot\)/);
  assert.match(sidebar, /mobileNavReady && createPortal\(/);
  assert.equal((sidebar.match(/aria-label="Mobile navigation"/g) ?? []).length, 1);
  assert.match(sidebar, /fixed inset-x-3 bottom-3/);
  assert.match(sidebar, /env\(safe-area-inset-bottom, 0px\)/);
  assert.match(sidebar, /document\.body,\s*\)/);
});

test("standalone PWA uses viewport-fit and leaves room for bottom navigation", () => {
  const layout = source("app/layout.tsx");
  const css = source("app/globals.css");
  assert.match(layout, /viewportFit: "cover"/);
  assert.match(css, /padding-bottom: calc\(6rem \+ env\(safe-area-inset-bottom, 0px\)\)/);
});
