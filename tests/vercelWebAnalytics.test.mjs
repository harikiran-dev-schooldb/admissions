import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Vercel Web Analytics script is included only in production", () => {
  const layout = readFileSync("app/layout.tsx", "utf8");
  assert.match(layout, /import Script from "next\/script"/);
  assert.match(layout, /process\.env\.VERCEL_ENV === "production"/);
  assert.match(layout, /src="\/_vercel\/insights\/script\.js"/);
  assert.match(layout, /strategy="afterInteractive"/);
});

test("tracking does not add npm dependencies or expose student data", () => {
  const layout = readFileSync("app/layout.tsx", "utf8");
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  assert.equal(pkg.dependencies["@vercel/analytics"], undefined);
  assert.doesNotMatch(layout, /admissionId|student\.mobile|student\.dob|enquiryNo/);
});
